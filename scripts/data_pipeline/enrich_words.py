#!/usr/bin/env python3
"""
Enrich words.ts vocabulary with frequency data and metadata.

Reads the existing words.ts file, matches words against Spanish frequency data,
and generates enriched data with:
- Unique IDs for each word
- Frequency ranks from OpenSubtitles corpus
- CEFR level based on frequency

Usage:
    python enrich_words.py              # Show statistics
    python enrich_words.py --output     # Generate enriched-words.json

Input:
    ../../svelte/src/lib/data/words.ts
    ../../svelte/static/data/frequency-spanish-top5000.json
    
Output:
    ../data/enriched-words.json (for manual review)
"""

import json
import re
import unicodedata
from pathlib import Path
from dataclasses import dataclass
from datetime import date


SCRIPT_DIR = Path(__file__).parent
WORDS_TS_PATH = SCRIPT_DIR.parent.parent / "svelte" / "src" / "lib" / "data" / "words.ts"
FREQUENCY_PATH = SCRIPT_DIR.parent.parent / "svelte" / "static" / "data" / "frequency-spanish-top5000.json"
OUTPUT_DIR = SCRIPT_DIR.parent / "data"


@dataclass
class Word:
    """Represents a word entry from words.ts."""
    spanish: str
    english: str
    finnish: str
    category: str
    learning_tips: list[str] | None = None


@dataclass 
class EnrichedWord:
    """Word with added frequency and metadata."""
    id: str
    spanish: str
    english: str
    finnish: str
    category: str
    frequency_rank: int | None = None
    cefr_level: str | None = None
    part_of_speech: str | None = None
    gender: str | None = None
    learning_tips: list[str] | None = None


# Category to part of speech mapping
CATEGORY_POS_MAP = {
    'animals': 'noun',
    'colors': 'adjective',
    'numbers': 'numeral',
    'family': 'noun',
    'food': 'noun',
    'body': 'noun',
    'nature': 'noun',
    'home': 'noun',
    'school': 'noun',
    'verbs': 'verb',
    'time': 'noun',  # Most are nouns like "día", "hora"
    'adjectives': 'adjective',
    'pronouns': 'pronoun',
    'prepositions': 'preposition',  # Mix of prepositions and conjunctions
    'questions': 'pronoun',  # Interrogative pronouns/adverbs
    'places': 'noun',
    'transportation': 'noun',
    'clothing': 'noun',
    'emotions': 'adjective',  # Mix of adjectives and nouns
    'professions': 'noun',
    'money': 'noun',  # Mix of nouns and verbs
}


def spanish_to_id(word: str, pos: str | None = None) -> str:
    """
    Convert Spanish word to stable, URL-safe ID.
    
    Args:
        word: Spanish word (may include accents, spaces, punctuation)
        pos: Optional part of speech for disambiguation
        
    Returns:
        Normalized ASCII slug suitable for IDs
        
    Examples:
        >>> spanish_to_id("perro")
        'perro'
        >>> spanish_to_id("niño")
        'nino'
        >>> spanish_to_id("por favor")
        'por_favor'
        >>> spanish_to_id("¿Cómo estás?")
        'como_estas'
    """
    # Normalize unicode: á→a, ñ→n, ü→u
    normalized = unicodedata.normalize('NFKD', word.lower())
    ascii_text = normalized.encode('ascii', 'ignore').decode('ascii')
    
    # Replace non-alphanumeric with underscore
    slug = re.sub(r'[^a-z0-9]+', '_', ascii_text).strip('_')
    
    # For homonyms, append part-of-speech suffix
    if pos:
        suffix_map = {
            'noun': 'n', 
            'verb': 'v', 
            'adjective': 'adj', 
            'adverb': 'adv', 
            'preposition': 'prep',
            'pronoun': 'pron',
            'conjunction': 'conj',
            'interjection': 'int',
            'article': 'art',
            'numeral': 'num',
            'phrase': 'phr'
        }
        slug = f"{slug}_{suffix_map.get(pos, pos[:3])}"
    
    return slug


class IdGenerator:
    """Generate unique IDs, handling collisions with numeric suffixes."""
    
    def __init__(self):
        self.seen_ids: dict[str, int] = {}
        
    def generate(self, word: str, pos: str | None = None) -> str:
        """
        Generate a unique ID for a word.
        
        First occurrence gets the base ID.
        Subsequent occurrences get numeric suffix.
        """
        base_id = spanish_to_id(word, pos)
        
        if base_id not in self.seen_ids:
            self.seen_ids[base_id] = 1
            return base_id
        
        # Collision - add numeric suffix
        self.seen_ids[base_id] += 1
        return f"{base_id}_{self.seen_ids[base_id]}"


def parse_words_ts(content: str) -> list[Word]:
    """
    Parse words.ts content and extract all Word entries.
    
    Uses regex to find word objects in the TypeScript file.
    This is fragile but works for the known format.
    """
    words = []
    
    # Find category starts - need bracket counting for nested arrays
    category_pattern = r"(\w+):\s*\{\s*name:\s*['\"]([^'\"]+)['\"],\s*words:\s*\["
    
    for match in re.finditer(category_pattern, content):
        cat_key = match.group(1)
        start = match.end()
        
        # Find matching closing bracket using depth counting
        depth = 1
        pos = start
        while depth > 0 and pos < len(content):
            if content[pos] == '[':
                depth += 1
            elif content[pos] == ']':
                depth -= 1
            pos += 1
        
        words_block = content[start:pos-1]
        
        # Find word objects - handle both with and without learningTips
        word_pattern = r"\{\s*spanish:\s*['\"]([^'\"]+)['\"],\s*english:\s*['\"]([^'\"]+)['\"],\s*finnish:\s*['\"]([^'\"]+)['\"](?:,\s*learningTips:\s*(\[[^\]]*\]))?\s*\}"
        word_matches = re.findall(word_pattern, words_block)
        
        for spanish, english, finnish, tips_str in word_matches:
            tips = None
            if tips_str and tips_str.strip():
                # Parse learning tips array - extract strings from array syntax
                tips = re.findall(r'["\']([^"\']+)["\']', tips_str)
            
            words.append(Word(
                spanish=spanish,
                english=english,
                finnish=finnish,
                category=cat_key,
                learning_tips=tips
            ))
    
    return words


def load_frequency_data(path: Path) -> dict[str, dict]:
    """Load frequency data from JSON file."""
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('words', {})


def infer_part_of_speech(category: str, english: str) -> str | None:
    """
    Infer part of speech from category and English translation.
    
    Uses category mapping as primary source, with fallbacks.
    """
    # Direct category mapping
    if category in CATEGORY_POS_MAP:
        return CATEGORY_POS_MAP[category]
    
    # Common category might need per-word analysis
    if category == 'common':
        # Check if it starts with 'to ' (verb infinitive in English)
        if english.startswith('to '):
            return 'verb'
        # Common adverbs
        if english in ['now', 'later', 'always', 'never', 'also', 'very', 'well', 'more', 'less', 'of course']:
            return 'adverb'
    
    return None


def infer_gender(spanish: str, category: str, pos: str | None) -> str | None:
    """
    Infer gender for Spanish nouns based on word endings.
    
    Common patterns:
    - Words ending in -o are usually masculine
    - Words ending in -a are usually feminine
    - Words ending in -ción, -sión, -dad, -tad are feminine
    - Words ending in -ma (from Greek) are often masculine
    """
    if pos != 'noun':
        return None
    
    word = spanish.lower()
    
    # Feminine endings
    if word.endswith(('a', 'ción', 'sión', 'dad', 'tad', 'tud', 'umbre')):
        # Exception: words ending in -ma from Greek are masculine
        if word.endswith('ma') and word in ['problema', 'tema', 'sistema', 'programa', 'clima', 'idioma']:
            return 'masculine'
        if word.endswith('a'):
            # Exception: día is masculine
            if word == 'día':
                return 'masculine'
            return 'feminine'
        return 'feminine'
    
    # Masculine endings
    if word.endswith(('o', 'or', 'aje')):
        # Exception: mano is feminine
        if word == 'mano':
            return 'feminine'
        return 'masculine'
    
    # Default: can't determine
    return None


def enrich_words(words: list[Word], frequency_data: dict[str, dict]) -> list[EnrichedWord]:
    """
    Match words against frequency data and create enriched entries.
    
    Returns list of EnrichedWord with frequency ranks, CEFR levels, and linguistic data.
    """
    id_gen = IdGenerator()
    enriched = []
    
    for word in words:
        # Look up frequency data by Spanish word
        freq_entry = frequency_data.get(word.spanish.lower())
        
        freq_rank = None
        cefr = None
        if freq_entry:
            freq_rank = freq_entry.get('rank')
            cefr = freq_entry.get('cefr')
        
        # Infer linguistic properties
        pos = infer_part_of_speech(word.category, word.english)
        gender = infer_gender(word.spanish, word.category, pos)
        
        enriched.append(EnrichedWord(
            id=id_gen.generate(word.spanish),
            spanish=word.spanish,
            english=word.english,
            finnish=word.finnish,
            category=word.category,
            frequency_rank=freq_rank,
            cefr_level=cefr,
            part_of_speech=pos,
            gender=gender,
            learning_tips=word.learning_tips
        ))
    
    return enriched


def get_statistics(enriched: list[EnrichedWord]) -> dict:
    """Calculate statistics about the enriched words."""
    total = len(enriched)
    with_frequency = sum(1 for w in enriched if w.frequency_rank is not None)
    
    # Count by CEFR level
    cefr_counts = {}
    for w in enriched:
        level = w.cefr_level or 'unknown'
        cefr_counts[level] = cefr_counts.get(level, 0) + 1
    
    # Count by category
    category_counts = {}
    for w in enriched:
        category_counts[w.category] = category_counts.get(w.category, 0) + 1
    
    # Count by part of speech
    pos_counts = {}
    for w in enriched:
        pos = w.part_of_speech or 'unknown'
        pos_counts[pos] = pos_counts.get(pos, 0) + 1
    
    # Count by gender (nouns only)
    gender_counts = {}
    nouns_total = sum(1 for w in enriched if w.part_of_speech == 'noun')
    for w in enriched:
        if w.part_of_speech == 'noun':
            gender = w.gender or 'unknown'
            gender_counts[gender] = gender_counts.get(gender, 0) + 1
    
    # Top 100/500/1000/5000 coverage
    top_100 = sum(1 for w in enriched if w.frequency_rank and w.frequency_rank <= 100)
    top_500 = sum(1 for w in enriched if w.frequency_rank and w.frequency_rank <= 500)
    top_1000 = sum(1 for w in enriched if w.frequency_rank and w.frequency_rank <= 1000)
    top_5000 = sum(1 for w in enriched if w.frequency_rank and w.frequency_rank <= 5000)
    
    return {
        'total_words': total,
        'with_frequency': with_frequency,
        'without_frequency': total - with_frequency,
        'match_rate': f"{with_frequency/total*100:.1f}%" if total > 0 else "0%",
        'cefr_distribution': cefr_counts,
        'category_counts': category_counts,
        'pos_counts': pos_counts,
        'gender_counts': gender_counts,
        'nouns_total': nouns_total,
        'coverage': {
            'top_100': top_100,
            'top_500': top_500,
            'top_1000': top_1000,
            'top_5000': top_5000
        }
    }


def print_statistics(stats: dict):
    """Print statistics in a readable format."""
    print("\n" + "=" * 60)
    print("WORD ENRICHMENT STATISTICS")
    print("=" * 60)
    
    print(f"\nTotal words:      {stats['total_words']}")
    print(f"With frequency:   {stats['with_frequency']} ({stats['match_rate']})")
    print(f"Without frequency: {stats['without_frequency']}")
    
    print("\nCEFR Distribution:")
    for level in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'unknown']:
        count = stats['cefr_distribution'].get(level, 0)
        if count > 0:
            bar = '█' * min(count // 5, 20)
            print(f"  {level:>8}: {count:>4} {bar}")
    
    print("\nPart of Speech Distribution:")
    pos_order = ['noun', 'verb', 'adjective', 'adverb', 'pronoun', 'preposition', 'numeral', 'unknown']
    for pos in pos_order:
        count = stats['pos_counts'].get(pos, 0)
        if count > 0:
            bar = '█' * min(count // 5, 20)
            print(f"  {pos:>12}: {count:>4} {bar}")
    
    print(f"\nNoun Gender Distribution ({stats['nouns_total']} nouns):")
    for gender in ['masculine', 'feminine', 'unknown']:
        count = stats['gender_counts'].get(gender, 0)
        if count > 0:
            pct = count / stats['nouns_total'] * 100 if stats['nouns_total'] > 0 else 0
            print(f"  {gender:>12}: {count:>4} ({pct:.0f}%)")
    
    print("\nFrequency Coverage:")
    cov = stats['coverage']
    print(f"  Top 100:   {cov['top_100']:>4} words")
    print(f"  Top 500:   {cov['top_500']:>4} words")
    print(f"  Top 1000:  {cov['top_1000']:>4} words")
    print(f"  Top 5000:  {cov['top_5000']:>4} words")
    
    print("\nWords by Category:")
    sorted_cats = sorted(stats['category_counts'].items(), key=lambda x: -x[1])
    for cat, count in sorted_cats[:10]:  # Top 10 categories
        print(f"  {cat:>15}: {count:>3}")
    if len(sorted_cats) > 10:
        print(f"  ... and {len(sorted_cats) - 10} more categories")
    
    print("=" * 60)


def export_enriched_json(enriched: list[EnrichedWord], output_path: Path):
    """Export enriched words to JSON for review."""
    output_data = {
        "version": "1.0.0",
        "generatedAt": str(date.today()),
        "wordCount": len(enriched),
        "words": []
    }
    
    for w in enriched:
        word_obj = {
            "id": w.id,
            "spanish": w.spanish,
            "english": w.english,
            "finnish": w.finnish,
            "category": w.category
        }
        if w.frequency_rank is not None:
            word_obj["frequencyRank"] = w.frequency_rank
        if w.cefr_level:
            word_obj["cefrLevel"] = w.cefr_level
        if w.part_of_speech:
            word_obj["partOfSpeech"] = w.part_of_speech
        if w.gender:
            word_obj["gender"] = w.gender
        if w.learning_tips:
            word_obj["learningTips"] = w.learning_tips
            
        output_data["words"].append(word_obj)
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    size_kb = output_path.stat().st_size / 1024
    print(f"\n✓ Exported to {output_path.name} ({size_kb:.1f} KB)")


def main():
    """Main entry point."""
    import sys
    
    output_mode = '--output' in sys.argv
    
    print("Loading words.ts...")
    if not WORDS_TS_PATH.exists():
        print(f"Error: {WORDS_TS_PATH} not found")
        return 1
    
    content = WORDS_TS_PATH.read_text(encoding='utf-8')
    words = parse_words_ts(content)
    print(f"  Parsed {len(words)} words from words.ts")
    
    print("Loading frequency data...")
    if not FREQUENCY_PATH.exists():
        print(f"Error: {FREQUENCY_PATH} not found")
        return 1
    
    frequency_data = load_frequency_data(FREQUENCY_PATH)
    print(f"  Loaded {len(frequency_data)} frequency entries")
    
    print("Enriching words...")
    enriched = enrich_words(words, frequency_data)
    
    stats = get_statistics(enriched)
    print_statistics(stats)
    
    if output_mode:
        output_path = OUTPUT_DIR / "enriched-words.json"
        export_enriched_json(enriched, output_path)
    else:
        print("\nUse --output to generate enriched-words.json")
    
    return 0


if __name__ == "__main__":
    exit(main())
