#!/usr/bin/env python3
"""
Generate lesson definition files for "Valitut sanat" game mode.

Lessons combine vocabulary words with example sentences from Tatoeba.
Each lesson focuses on a vocabulary category and includes 2-3 example
sentences per word where available.

Output structure:
- svelte/static/lessons/index.json (manifest of all lessons)
- svelte/static/lessons/{category}-{tier}.json (individual lesson files)
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Set, TypedDict


class Sentence(TypedDict):
    """Sentence from Tatoeba corpus."""
    id: str
    spanish: str
    finnish: str
    english: str
    wordCount: int
    themes: List[str]


class Lesson(TypedDict):
    """Lesson definition combining words and example sentences."""
    id: str
    category: str
    categoryName: str
    tier: int
    words: List[str]  # word IDs
    phrases: List[str]  # sentence IDs from Tatoeba


class LessonManifest(TypedDict):
    """Manifest of all available lessons."""
    lessons: List[Dict[str, any]]


# Project root directory
PROJECT_ROOT = Path(__file__).parent.parent.parent
SENTENCES_DIR = PROJECT_ROOT / "svelte" / "static" / "sentences"
LESSONS_DIR = PROJECT_ROOT / "svelte" / "static" / "lessons"
WORDS_TS_PATH = PROJECT_ROOT / "svelte" / "src" / "lib" / "data" / "words.ts"


def load_sentences() -> List[Sentence]:
    """Load all Tatoeba sentences from JSON files."""
    sentences = []
    
    # Load index to get all theme files
    index_path = SENTENCES_DIR / "index.json"
    if not index_path.exists():
        print(f"Warning: Sentence index not found at {index_path}")
        return sentences
    
    with open(index_path, 'r', encoding='utf-8') as f:
        index = json.load(f)
    
    # Load sentences from each theme file
    for theme_info in index['themes']:
        filename = theme_info['filename']
        theme_path = SENTENCES_DIR / filename
        
        if not theme_path.exists():
            print(f"Warning: Theme file not found: {theme_path}")
            continue
        
        with open(theme_path, 'r', encoding='utf-8') as f:
            theme_sentences = json.load(f)
            sentences.extend(theme_sentences)
    
    print(f"Loaded {len(sentences)} sentences from Tatoeba")
    return sentences


def extract_vocabulary_categories() -> Dict[str, Dict]:
    """
    Extract vocabulary categories and words from words.ts.
    
    Returns:
        Dict mapping category key to {name, words} where words is list of word objects
    """
    if not WORDS_TS_PATH.exists():
        raise FileNotFoundError(f"words.ts not found at {WORDS_TS_PATH}")
    
    with open(WORDS_TS_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    
    categories = {}
    
    # Find WORD_CATEGORIES object
    match = re.search(r'export const WORD_CATEGORIES.*?=\s*\{(.*?)\n\};', content, re.DOTALL)
    if not match:
        raise ValueError("Could not find WORD_CATEGORIES in words.ts")
    
    categories_content = match.group(1)
    
    # Parse each category
    # Pattern: categoryKey: { name: 'Name', words: [...] }
    category_pattern = r"(\w+):\s*\{\s*name:\s*'([^']+)',\s*words:\s*\[(.*?)\]\s*\}"
    
    for cat_match in re.finditer(category_pattern, categories_content, re.DOTALL):
        category_key = cat_match.group(1)
        category_name = cat_match.group(2)
        words_content = cat_match.group(3)
        
        # Parse words array
        words = []
        # Pattern: { spanish: 'word', ... }
        word_pattern = r"\{\s*spanish:\s*'([^']+)'[^}]*\}"
        
        for word_match in re.finditer(word_pattern, words_content):
            spanish = word_match.group(1)
            word_obj_str = word_match.group(0)
            
            # Extract id if present
            word_id = None
            id_match = re.search(r"id:\s*'([^']+)'", word_obj_str)
            if id_match:
                word_id = id_match.group(1)
            else:
                word_id = spanish
            
            # Extract CEFR level if present (from frequency.cefrLevel)
            cefr_level = None
            cefr_match = re.search(r"cefrLevel:\s*'([^']+)'", word_obj_str)
            if cefr_match:
                cefr_level = cefr_match.group(1)
            
            word_data = {
                'spanish': spanish,
                'id': word_id
            }
            
            # Add CEFR level if available
            if cefr_level:
                word_data['cefrLevel'] = cefr_level
            
            words.append(word_data)
        
        if words:
            categories[category_key] = {
                'name': category_name,
                'words': words
            }
    
    print(f"Extracted {len(categories)} vocabulary categories")
    return categories


def normalize_word(word: str) -> str:
    """Normalize a word for matching (lowercase, remove accents for comparison)."""
    # Keep accents but lowercase for matching
    return word.lower().strip()


def get_max_word_count_for_cefr(cefr_level: Optional[str]) -> int:
    """
    Get maximum word count for sentences based on CEFR level.
    
    Args:
        cefr_level: CEFR level (A1, A2, B1, B2, C1, C2) or None
    
    Returns:
        Maximum word count for appropriate sentences
    """
    if not cefr_level:
        return 15  # Default: moderate complexity
    
    # Map CEFR levels to maximum word counts
    level_map = {
        'A1': 6,   # Very simple sentences
        'A2': 8,   # Simple sentences
        'B1': 10,  # Moderate sentences
        'B2': 12,  # More complex sentences
        'C1': 15,  # Complex sentences
        'C2': 20   # Advanced sentences
    }
    
    return level_map.get(cefr_level, 15)


def find_sentences_for_word(
    word_spanish: str, 
    sentences: List[Sentence], 
    max_sentences: int = 3,
    cefr_level: Optional[str] = None
) -> List[str]:
    """
    Find Tatoeba sentences containing the given Spanish word.
    Filters sentences by CEFR level appropriateness based on word count.
    
    Args:
        word_spanish: Spanish word to search for
        sentences: List of all available sentences
        max_sentences: Maximum number of sentences to return (default 2-3)
        cefr_level: CEFR level for filtering sentence complexity (optional)
    
    Returns:
        List of sentence IDs
    """
    normalized_word = normalize_word(word_spanish)
    matching_sentences = []
    max_word_count = get_max_word_count_for_cefr(cefr_level)
    
    for sentence in sentences:
        spanish_text = normalize_word(sentence['spanish'])
        
        # Check if word appears in sentence (as whole word)
        # Use word boundary regex to avoid partial matches
        pattern = r'\b' + re.escape(normalized_word) + r'\b'
        if re.search(pattern, spanish_text):
            # Filter by CEFR-appropriate word count
            if sentence['wordCount'] <= max_word_count:
                matching_sentences.append(sentence)
            
            # Stop early if we have enough candidates
            if len(matching_sentences) >= max_sentences * 3:
                break
    
    # Sort by word count (prefer shorter, simpler sentences)
    matching_sentences.sort(key=lambda s: s['wordCount'])
    
    # Return sentence IDs (limit to max_sentences)
    return [s['id'] for s in matching_sentences[:max_sentences]]


def split_category_into_tiers(category_key: str, words: List[Dict], tier_size: int = 15) -> List[int]:
    """
    Determine how many tiers a category should be split into.
    
    Args:
        category_key: Category identifier
        words: List of word objects
        tier_size: Maximum words per tier
    
    Returns:
        List of tier numbers (e.g., [1, 2] for 2 tiers)
    """
    word_count = len(words)
    
    if word_count <= tier_size:
        return [1]
    
    # Calculate number of tiers needed
    num_tiers = (word_count + tier_size - 1) // tier_size
    return list(range(1, num_tiers + 1))


def generate_lesson(
    category_key: str,
    category_name: str,
    words: List[Dict],
    tier: int,
    tier_size: int,
    sentences: List[Sentence]
) -> Lesson:
    """
    Generate a single lesson for a category tier.
    
    Args:
        category_key: Category identifier (e.g., 'animals')
        category_name: Display name (e.g., 'Eläimet')
        words: All words in the category
        tier: Tier number (1-indexed)
        tier_size: Number of words per tier
        sentences: All available Tatoeba sentences
    
    Returns:
        Lesson object
    """
    # Select words for this tier
    start_idx = (tier - 1) * tier_size
    end_idx = start_idx + tier_size
    tier_words = words[start_idx:end_idx]
    
    # Generate lesson ID
    if len(words) <= tier_size:
        lesson_id = category_key
    else:
        lesson_id = f"{category_key}-{tier}"
    
    # Collect word IDs and find matching sentences
    word_ids = []
    phrase_ids = []
    
    for word in tier_words:
        word_ids.append(word['id'])
        
        # Extract CEFR level if available
        cefr_level = word.get('cefrLevel')
        
        # Find example sentences for this word (2-3 per word)
        matching_phrases = find_sentences_for_word(
            word['spanish'], 
            sentences, 
            max_sentences=3,
            cefr_level=cefr_level
        )
        phrase_ids.extend(matching_phrases)
    
    # Remove duplicate phrase IDs while preserving order
    seen = set()
    unique_phrase_ids = []
    for phrase_id in phrase_ids:
        if phrase_id not in seen:
            seen.add(phrase_id)
            unique_phrase_ids.append(phrase_id)
    
    lesson: Lesson = {
        'id': lesson_id,
        'category': category_key,
        'categoryName': category_name,
        'tier': tier,
        'words': word_ids,
        'phrases': unique_phrase_ids
    }
    
    return lesson


def generate_all_lessons(categories: Dict[str, Dict], sentences: List[Sentence], tier_size: int = 15) -> List[Lesson]:
    """
    Generate lessons for all vocabulary categories.
    
    Args:
        categories: Dictionary of category data
        sentences: All Tatoeba sentences
        tier_size: Maximum words per tier
    
    Returns:
        List of all generated lessons
    """
    lessons = []
    
    for category_key, category_data in sorted(categories.items()):
        category_name = category_data['name']
        words = category_data['words']
        
        # Determine tiers for this category
        tiers = split_category_into_tiers(category_key, words, tier_size)
        
        # Generate lesson for each tier
        for tier in tiers:
            lesson = generate_lesson(
                category_key,
                category_name,
                words,
                tier,
                tier_size,
                sentences
            )
            lessons.append(lesson)
            
            print(f"Generated lesson: {lesson['id']} ({len(lesson['words'])} words, {len(lesson['phrases'])} phrases)")
    
    return lessons


def write_lesson_files(lessons: List[Lesson]):
    """
    Write lesson files to disk.
    
    Creates:
    - svelte/static/lessons/index.json
    - svelte/static/lessons/{lesson_id}.json for each lesson
    """
    # Create lessons directory if it doesn't exist
    LESSONS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Write individual lesson files
    for lesson in lessons:
        lesson_path = LESSONS_DIR / f"{lesson['id']}.json"
        with open(lesson_path, 'w', encoding='utf-8') as f:
            json.dump(lesson, f, ensure_ascii=False, indent=2)
        print(f"Wrote lesson file: {lesson_path}")
    
    # Create manifest
    manifest_lessons = []
    for lesson in lessons:
        manifest_lessons.append({
            'id': lesson['id'],
            'category': lesson['category'],
            'categoryName': lesson['categoryName'],
            'tier': lesson['tier'],
            'wordCount': len(lesson['words']),
            'phraseCount': len(lesson['phrases']),
            'filename': f"{lesson['id']}.json"
        })
    
    manifest: LessonManifest = {
        'lessons': manifest_lessons
    }
    
    manifest_path = LESSONS_DIR / "index.json"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    
    print(f"\nWrote manifest: {manifest_path}")
    print(f"Total lessons generated: {len(lessons)}")


def main():
    """Main entry point for lesson generation."""
    print("=== Lesson Generation Pipeline ===\n")
    
    # Load data
    print("Loading Tatoeba sentences...")
    sentences = load_sentences()
    
    print("\nExtracting vocabulary categories...")
    categories = extract_vocabulary_categories()
    
    # Generate lessons
    print("\nGenerating lessons...")
    lessons = generate_all_lessons(categories, sentences, tier_size=15)
    
    # Write output files
    print("\nWriting lesson files...")
    write_lesson_files(lessons)
    
    # Print summary statistics
    print("\n=== Summary ===")
    print(f"Categories processed: {len(categories)}")
    print(f"Lessons generated: {len(lessons)}")
    
    total_words = sum(len(lesson['words']) for lesson in lessons)
    total_phrases = sum(len(lesson['phrases']) for lesson in lessons)
    lessons_with_phrases = sum(1 for lesson in lessons if len(lesson['phrases']) > 0)
    
    print(f"Total words in lessons: {total_words}")
    print(f"Total phrases matched: {total_phrases}")
    print(f"Lessons with phrases: {lessons_with_phrases}/{len(lessons)}")
    
    if lessons_with_phrases < len(lessons):
        print(f"\nWarning: {len(lessons) - lessons_with_phrases} lessons have no matching phrases")


if __name__ == '__main__':
    main()
