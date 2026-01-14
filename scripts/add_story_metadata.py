#!/usr/bin/env python3
"""
Script to add wordCount and estimatedMinutes to story files.

This script:
1. Reads all story files from a2/ and b1/ folders
2. Calculates wordCount from dialogue
3. Estimates reading time (40 words per minute for learners)
4. Adds these fields to the story JSON

Usage:
    python scripts/add_story_metadata.py
"""

import json
from pathlib import Path
from typing import Dict, List, Any


def count_words(dialogue: List[Dict[str, str]]) -> int:
    """Count total words in Spanish dialogue."""
    total_words = 0
    for line in dialogue:
        spanish_text = line.get('spanish', '')
        words = spanish_text.split()
        total_words += len(words)
    return total_words


def estimate_reading_time(word_count: int) -> int:
    """Estimate reading time in minutes (assuming 40 words per minute for learners)."""
    minutes = max(1, round(word_count / 40))
    return minutes


def add_metadata_to_story(story_file: Path) -> bool:
    """Add wordCount and estimatedMinutes to a story file."""
    print(f"Processing {story_file.name}...")
    
    # Load story
    with open(story_file, 'r', encoding='utf-8') as f:
        story = json.load(f)
    
    # Calculate metadata
    word_count = count_words(story.get('dialogue', []))
    estimated_minutes = estimate_reading_time(word_count)
    
    # Add fields
    story['wordCount'] = word_count
    story['estimatedMinutes'] = estimated_minutes
    
    # Write back
    with open(story_file, 'w', encoding='utf-8') as f:
        json.dump(story, f, ensure_ascii=False, indent='\t')
    
    print(f"  - Word count: {word_count}")
    print(f"  - Estimated minutes: {estimated_minutes}")
    
    return True


def main():
    """Main function."""
    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    stories_dir = project_root / 'svelte' / 'static' / 'stories'
    
    # Process all story files
    story_files = []
    for level_folder in ['a2', 'b1']:
        level_dir = stories_dir / level_folder
        if level_dir.exists():
            story_files.extend(level_dir.glob('*.json'))
    
    if not story_files:
        print("No story files found")
        return False
    
    print(f"Found {len(story_files)} story files to process\n")
    
    success_count = 0
    for story_file in sorted(story_files):
        if add_metadata_to_story(story_file):
            success_count += 1
        print()
    
    print(f"✅ Metadata addition complete!")
    print(f"   - {success_count}/{len(story_files)} stories updated")
    print(f"   - Added wordCount and estimatedMinutes fields")
    
    return True


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
