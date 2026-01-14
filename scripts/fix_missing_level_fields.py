#!/usr/bin/env python3
"""
Fix missing level fields in story JSON files.
Reads manifest to get the correct level for each story and updates the story files.
"""

import json
from pathlib import Path


def get_stories_dir() -> Path:
    """Get the stories directory path."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    return project_root / 'svelte' / 'static' / 'stories'


def load_manifest():
    """Load the manifest.json file."""
    stories_dir = get_stories_dir()
    manifest_file = stories_dir / 'manifest.json'
    
    with open(manifest_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def fix_story_level_fields():
    """Add missing level fields to story files based on manifest."""
    stories_dir = get_stories_dir()
    manifest = load_manifest()
    
    fixed_count = 0
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta['level']
        level_folder = level.lower()
        
        story_file = stories_dir / level_folder / f"{story_id}.json"
        
        if not story_file.exists():
            print(f"⚠️  Story file not found: {story_file}")
            continue
        
        # Load story
        with open(story_file, 'r', encoding='utf-8') as f:
            story_data = json.load(f)
        
        # Check if level field is missing or None
        if 'level' not in story_data or story_data['level'] is None:
            print(f"✅ Fixing {story_id}: adding level={level}")
            story_data['level'] = level
            
            # Write back
            with open(story_file, 'w', encoding='utf-8') as f:
                json.dump(story_data, f, ensure_ascii=False, indent=2)
            
            fixed_count += 1
    
    print(f"\n✨ Fixed {fixed_count} story files")


def update_valid_categories():
    """Update VALID_CATEGORIES in test file to include all used categories."""
    stories_dir = get_stories_dir()
    manifest = load_manifest()
    
    categories = set()
    for story_meta in manifest['stories']:
        if 'category' in story_meta:
            categories.add(story_meta['category'])
    
    print(f"\n📋 All categories used: {sorted(categories)}")
    print(f"\nAdd these to VALID_CATEGORIES in test_story_data_integrity.py:")
    print(f"VALID_CATEGORIES = {{{', '.join(repr(c) for c in sorted(categories))}}}")


if __name__ == '__main__':
    print("🔧 Fixing missing level fields in story files...\n")
    fix_story_level_fields()
    update_valid_categories()
