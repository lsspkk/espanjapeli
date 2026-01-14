#!/usr/bin/env python3
"""
Script to enrich story vocabulary with frequency data.

This script:
1. Reads all story files from a2/ and b1/ folders
2. Loads Spanish frequency data
3. Adds frequencyRank and cefrLevel to vocabulary words
4. Updates story files with enriched vocabulary

Usage:
    python scripts/enrich_story_vocabulary.py
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional


def load_frequency_data(frequency_file: Path) -> Dict[str, int]:
    """Load frequency data and return a dict mapping word -> rank."""
    with open(frequency_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    freq_map = {}
    words = data.get('words', {})
    for word, info in words.items():
        rank = info['rank']
        freq_map[word.lower()] = rank
    
    return freq_map


def normalize_spanish_word(word: str) -> str:
    """Normalize Spanish word for frequency lookup."""
    # Remove articles (el, la, los, las)
    word = re.sub(r'^(el|la|los|las)\s+', '', word.lower())
    # Remove trailing adjective markers
    word = re.sub(r'/[ao]$', '', word)
    return word.strip()


def get_frequency_rank(spanish_word: str, freq_map: Dict[str, int]) -> Optional[int]:
    """Get frequency rank for a Spanish word."""
    normalized = normalize_spanish_word(spanish_word)
    
    # Try exact match first
    if normalized in freq_map:
        return freq_map[normalized]
    
    # Try without accents
    no_accents = normalized.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u').replace('ñ', 'n')
    if no_accents in freq_map:
        return freq_map[no_accents]
    
    # Try first word if it's a phrase
    if ' ' in normalized:
        first_word = normalized.split()[0]
        if first_word in freq_map:
            return freq_map[first_word]
    
    return None


def rank_to_cefr(rank: Optional[int]) -> Optional[str]:
    """Map frequency rank to CEFR level."""
    if rank is None:
        return None
    
    if rank <= 500:
        return 'A1'
    elif rank <= 1000:
        return 'A2'
    elif rank <= 2000:
        return 'B1'
    elif rank <= 3500:
        return 'B2'
    else:
        return 'C1'


def enrich_vocabulary(vocabulary: List[Dict[str, Any]], freq_map: Dict[str, int]) -> List[Dict[str, Any]]:
    """Enrich vocabulary words with frequency data."""
    enriched = []
    
    for word in vocabulary:
        enriched_word = word.copy()
        spanish = word['spanish']
        
        # Get frequency rank
        rank = get_frequency_rank(spanish, freq_map)
        if rank is not None:
            enriched_word['frequencyRank'] = rank
            enriched_word['cefrLevel'] = rank_to_cefr(rank)
        
        enriched.append(enriched_word)
    
    return enriched


def enrich_story_file(story_file: Path, freq_map: Dict[str, int]) -> bool:
    """Enrich a single story file with frequency data."""
    print(f"Processing {story_file.name}...")
    
    # Load story
    with open(story_file, 'r', encoding='utf-8') as f:
        story = json.load(f)
    
    # Enrich vocabulary
    if 'vocabulary' in story:
        story['vocabulary'] = enrich_vocabulary(story['vocabulary'], freq_map)
    
    # Write back
    with open(story_file, 'w', encoding='utf-8') as f:
        json.dump(story, f, ensure_ascii=False, indent='\t')
    
    return True


def main():
    """Main function."""
    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    stories_dir = project_root / 'svelte' / 'static' / 'stories'
    frequency_file = project_root / 'svelte' / 'static' / 'data' / 'frequency-spanish-top5000.json'
    
    # Check if frequency file exists
    if not frequency_file.exists():
        print(f"Error: {frequency_file} not found")
        return False
    
    # Load frequency data
    print(f"Loading frequency data from {frequency_file}")
    freq_map = load_frequency_data(frequency_file)
    print(f"Loaded {len(freq_map)} frequency entries")
    
    # Process all story files
    story_files = []
    for level_folder in ['a2', 'b1']:
        level_dir = stories_dir / level_folder
        if level_dir.exists():
            story_files.extend(level_dir.glob('*.json'))
    
    if not story_files:
        print("No story files found")
        return False
    
    print(f"\nFound {len(story_files)} story files to process")
    
    success_count = 0
    for story_file in sorted(story_files):
        if enrich_story_file(story_file, freq_map):
            success_count += 1
    
    print(f"\n✅ Enrichment complete!")
    print(f"   - {success_count}/{len(story_files)} stories enriched")
    print(f"   - Vocabulary words now include frequencyRank and cefrLevel")
    
    return True


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
