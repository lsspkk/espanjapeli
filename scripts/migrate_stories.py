#!/usr/bin/env python3
"""
Migration script to split stories.json into individual story files.

This script:
1. Reads the existing stories.json file
2. Creates individual JSON files for each story in level-specific folders
3. Updates the manifest.json with accurate metadata
4. Preserves the original stories.json as backup

Usage:
    python scripts/migrate_stories.py
"""

import json
import os
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


def map_difficulty_to_level(difficulty: str) -> str:
    """Map old difficulty to CEFR level."""
    mapping = {
        'beginner': 'A2',
        'intermediate': 'B1',
        'advanced': 'B2'
    }
    return mapping.get(difficulty, 'A2')


def get_level_folder(level: str) -> str:
    """Get folder name for CEFR level."""
    return level.lower()


def migrate_stories():
    """Main migration function."""
    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    stories_dir = project_root / 'svelte' / 'static' / 'stories'
    stories_file = stories_dir / 'stories.json'
    manifest_file = stories_dir / 'manifest.json'
    backup_file = stories_dir / 'stories.json.backup'

    # Check if stories.json exists
    if not stories_file.exists():
        print(f"Error: {stories_file} not found")
        return False

    # Load existing stories
    print(f"Loading stories from {stories_file}")
    with open(stories_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    stories = data.get('stories', [])
    print(f"Found {len(stories)} stories to migrate")

    # Create backup
    print(f"Creating backup at {backup_file}")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent='\t')

    # Process each story
    manifest_entries = []
    
    for story in stories:
        story_id = story['id']
        difficulty = story['difficulty']
        level = map_difficulty_to_level(difficulty)
        level_folder = get_level_folder(level)
        
        # Calculate metadata
        word_count = count_words(story['dialogue'])
        estimated_minutes = estimate_reading_time(word_count)
        vocabulary_count = len(story.get('vocabulary', []))
        question_count = len(story.get('questions', []))
        
        # Create level folder if it doesn't exist
        level_dir = stories_dir / level_folder
        level_dir.mkdir(exist_ok=True)
        
        # Write individual story file
        story_file = level_dir / f"{story_id}.json"
        print(f"Writing {story_file}")
        with open(story_file, 'w', encoding='utf-8') as f:
            json.dump(story, f, ensure_ascii=False, indent='\t')
        
        # Create manifest entry
        manifest_entry = {
            'id': story_id,
            'title': story['title'],
            'titleSpanish': story['titleSpanish'],
            'description': story.get('description', ''),
            'difficulty': difficulty,
            'level': level,
            'category': story['category'],
            'icon': story['icon'],
            'wordCount': word_count,
            'estimatedMinutes': estimated_minutes,
            'vocabularyCount': vocabulary_count,
            'questionCount': question_count
        }
        manifest_entries.append(manifest_entry)

    # Update manifest.json
    manifest_data = {
        'version': '4.0.0',
        'lastUpdated': '2026-01-14',
        'stories': manifest_entries
    }
    
    print(f"Writing manifest to {manifest_file}")
    with open(manifest_file, 'w', encoding='utf-8') as f:
        json.dump(manifest_data, f, ensure_ascii=False, indent='\t')

    print("\n✅ Migration complete!")
    print(f"   - {len(stories)} stories migrated")
    print(f"   - Individual files created in a2/ and b1/ folders")
    print(f"   - Manifest updated with accurate metadata")
    print(f"   - Original file backed up to {backup_file}")
    
    return True


if __name__ == '__main__':
    success = migrate_stories()
    exit(0 if success else 1)
