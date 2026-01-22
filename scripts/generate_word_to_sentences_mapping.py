#!/usr/bin/env python3
"""
Generate word-to-sentences mapping for Valitut sanat game.

This script:
1. Loads all words from the vocabulary database
2. Scans all Tatoeba sentence files
3. For each word, finds matching sentences from Tatoeba
4. Generates a JSON file mapping word IDs to sentence IDs
5. Saves this as word-sentences.json for use in the game

The mapping file helps the game quickly find example sentences for each word
without having to search all 18,000+ sentences at runtime.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple
from datetime import datetime

# Get project root
PROJECT_ROOT = Path(__file__).parent.parent
SVELTE_ROOT = PROJECT_ROOT / "svelte"
STATIC_SENTENCES_DIR = SVELTE_ROOT / "static" / "sentences"
OUTPUT_FILE = STATIC_SENTENCES_DIR / "word-sentences.json"

# Load words.ts and extract words
def load_words_from_typescript() -> Dict[str, Dict]:
    """Load word data from the TypeScript words file."""
    words_file = SVELTE_ROOT / "src" / "lib" / "data" / "words.ts"
    words_map = {}

    print(f"Loading words from {words_file}...")

    if not words_file.exists():
        print(f"ERROR: {words_file} not found!")
        return words_map

    with open(words_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Parse the TypeScript to extract word objects
    # Looking for pattern: { spanish: 'word', english: '...', finnish: '...' }
    word_pattern = r'\{\s*spanish:\s*[\'"]([^\'"]+)[\'"]\s*,\s*english:\s*[\'"]([^\'"]+)[\'"]\s*,\s*finnish:\s*[\'"]([^\'"]+)[\'"]'

    matches = re.finditer(word_pattern, content)
    for match in matches:
        spanish, english, finnish = match.groups()
        word_id = spanish  # Use spanish as ID
        words_map[word_id] = {
            'spanish': spanish,
            'english': english,
            'finnish': finnish
        }

    print(f"✓ Loaded {len(words_map)} words")
    return words_map


def load_sentences() -> Dict[str, Dict]:
    """Load all sentences from Tatoeba JSON files."""
    sentences_map = {}

    print(f"\nLoading sentences from {STATIC_SENTENCES_DIR}...")

    # Get all JSON files except index.json
    json_files = sorted([f for f in STATIC_SENTENCES_DIR.glob('*.json')
                         if f.name != 'index.json' and f.name != 'word-sentences.json'])

    total_loaded = 0

    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                sentences = json.load(f)

            if isinstance(sentences, list):
                for sentence in sentences:
                    if 'id' in sentence and 'spanish' in sentence:
                        sentences_map[sentence['id']] = {
                            'spanish': sentence.get('spanish', ''),
                            'finnish': sentence.get('finnish', ''),
                            'english': sentence.get('english', ''),
                            'wordCount': sentence.get('wordCount', 0),
                            'categories': sentence.get('categories', [])
                        }
                total_loaded += len(sentences)
                print(f"  ✓ {json_file.name}: {len(sentences)} sentences")
        except Exception as e:
            print(f"  ✗ Error reading {json_file.name}: {e}")

    print(f"✓ Loaded {total_loaded} total sentences")
    return sentences_map


def find_word_in_sentence(word_lower: str, sentence_spanish: str) -> bool:
    """
    Check if a word appears in a sentence (whole word match).

    Handles Spanish punctuation and inflections.
    """
    sentence_lower = sentence_spanish.lower()

    # Create regex pattern for whole word matching
    # Match: word at start/end, word followed by punctuation, word surrounded by spaces
    pattern = rf'\b{re.escape(word_lower)}\b'

    return bool(re.search(pattern, sentence_lower))


def generate_mapping(words_map: Dict[str, Dict], sentences_map: Dict[str, Dict]) -> Dict[str, List[str]]:
    """
    Generate word-to-sentences mapping.
    For each word, find up to 5 example sentences.
    """
    mapping = {}

    print(f"\nMatching words to sentences...")
    words_with_sentences = 0
    total_matches = 0

    for word_id, word_data in sorted(words_map.items()):
        word_lower = word_data['spanish'].lower()
        matching_sentence_ids = []

        # Search all sentences
        for sentence_id, sentence_data in sentences_map.items():
            if find_word_in_sentence(word_lower, sentence_data['spanish']):
                matching_sentence_ids.append(sentence_id)

        # Limit to 5 sentences per word (prefer shorter sentences)
        if matching_sentence_ids:
            # Sort by word count (prefer shorter sentences for examples)
            sorted_ids = sorted(
                matching_sentence_ids,
                key=lambda sid: sentences_map[sid]['wordCount']
            )
            limited_ids = sorted_ids[:5]
            mapping[word_id] = limited_ids
            words_with_sentences += 1
            total_matches += len(limited_ids)

            if words_with_sentences <= 10:  # Show first 10 as examples
                print(f"  {word_data['spanish']}: {len(limited_ids)} sentences")

    print(f"✓ Matched {words_with_sentences}/{len(words_map)} words to sentences")
    print(f"✓ Total sentence mappings: {total_matches}")

    return mapping


def save_mapping(mapping: Dict[str, List[str]], words_map: Dict[str, Dict], sentences_map: Dict[str, Dict]):
    """Save the mapping to word-sentences.json."""

    # Build enriched mapping with metadata
    output_data = {
        'metadata': {
            'generatedAt': datetime.now().isoformat(),
            'totalWords': len(words_map),
            'totalSentences': len(sentences_map),
            'wordsWithSentences': len(mapping),
            'totalMappings': sum(len(ids) for ids in mapping.values()),
            'description': 'Word-to-sentences mapping for Valitut sanat game. Maps Spanish words to Tatoeba sentence IDs.'
        },
        'wordToSentences': mapping
    }

    # Write to file
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Saved mapping to {OUTPUT_FILE}")
    print(f"  File size: {OUTPUT_FILE.stat().st_size:,} bytes")


def main():
    print("=" * 60)
    print("Generate Word-to-Sentences Mapping")
    print("=" * 60)

    # Load data
    words_map = load_words_from_typescript()
    if not words_map:
        print("ERROR: No words loaded!")
        return

    sentences_map = load_sentences()
    if not sentences_map:
        print("ERROR: No sentences loaded!")
        return

    # Generate mapping
    mapping = generate_mapping(words_map, sentences_map)

    # Save to file
    save_mapping(mapping, words_map, sentences_map)

    print("\n" + "=" * 60)
    print("✓ Done!")
    print("=" * 60)


if __name__ == '__main__':
    main()
