#!/usr/bin/env python3
"""
Test script to verify all story JSON files have proper level field and are properly formatted.

This validates:
1. All story files have the required 'level' field with valid CEFR level
2. Manifest is in sync with story files
3. Story files match the latest V4 data model

Usage:
    python scripts/test_story_data_integrity.py
"""

import json
import pytest
from pathlib import Path
from typing import List, Dict, Any


VALID_LEVELS = {'A1', 'A2', 'B1', 'B2'}
VALID_CATEGORIES = {'cafe', 'culture', 'education', 'environment', 'everyday', 'family', 'food', 'health', 'home', 'housing', 'nature', 'shopping', 'social', 'technology', 'travel', 'work'}


def get_stories_dir() -> Path:
    """Get the stories directory path."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    return project_root / 'svelte' / 'static' / 'stories'


def load_manifest() -> Dict[str, Any]:
    """Load the manifest.json file."""
    stories_dir = get_stories_dir()
    manifest_file = stories_dir / 'manifest.json'
    
    with open(manifest_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_story_file(level: str, story_id: str) -> Dict[str, Any]:
    """Load a story JSON file."""
    stories_dir = get_stories_dir()
    level_folder = level.lower()
    story_file = stories_dir / level_folder / f"{story_id}.json"
    
    with open(story_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def test_all_stories_have_level_field():
    """Test that all story files have a valid level field."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level')
        
        if not level:
            errors.append(f"Story {story_id} in manifest is missing 'level' field")
            continue
            
        if level not in VALID_LEVELS:
            errors.append(f"Story {story_id} has invalid level '{level}' in manifest. Must be one of: {VALID_LEVELS}")
            continue
        
        # Load the actual story file
        try:
            story_data = load_story_file(level, story_id)
        except FileNotFoundError:
            errors.append(f"Story file not found for {story_id} at level {level}")
            continue
        except json.JSONDecodeError as e:
            errors.append(f"Story {story_id} has invalid JSON: {e}")
            continue
        
        # Check level field in story file
        if 'level' not in story_data:
            errors.append(f"Story {story_id} file is missing 'level' field")
        elif story_data['level'] != level:
            errors.append(f"Story {story_id} level mismatch: manifest={level}, file={story_data['level']}")
        elif story_data['level'] not in VALID_LEVELS:
            errors.append(f"Story {story_id} file has invalid level '{story_data['level']}'")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_all_stories_have_required_fields():
    """Test that all story files have required V4 fields."""
    manifest = load_manifest()
    errors = []
    
    required_fields = [
        'id', 'title', 'titleSpanish', 'description', 
        'level', 'category', 'icon', 
        'dialogue', 'vocabulary', 'questions'
    ]
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception as e:
            errors.append(f"Cannot load story {story_id}: {e}")
            continue
        
        # Check required fields
        for field in required_fields:
            if field not in story_data:
                errors.append(f"Story {story_id} is missing required field '{field}'")
        
        # Check field types
        if 'dialogue' in story_data and not isinstance(story_data['dialogue'], list):
            errors.append(f"Story {story_id} 'dialogue' must be a list")
        
        if 'vocabulary' in story_data and not isinstance(story_data['vocabulary'], list):
            errors.append(f"Story {story_id} 'vocabulary' must be a list")
        
        if 'questions' in story_data and not isinstance(story_data['questions'], list):
            errors.append(f"Story {story_id} 'questions' must be a list")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_manifest_matches_story_files():
    """Test that manifest metadata matches actual story files."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception as e:
            errors.append(f"Cannot load story {story_id}: {e}")
            continue
        
        # Check ID matches
        if story_data.get('id') != story_id:
            errors.append(f"Story ID mismatch: manifest={story_id}, file={story_data.get('id')}")
        
        # Check title matches
        if story_data.get('title') != story_meta.get('title'):
            errors.append(f"Story {story_id} title mismatch: manifest={story_meta.get('title')}, file={story_data.get('title')}")
        
        # Check titleSpanish matches
        if story_data.get('titleSpanish') != story_meta.get('titleSpanish'):
            errors.append(f"Story {story_id} titleSpanish mismatch: manifest={story_meta.get('titleSpanish')}, file={story_data.get('titleSpanish')}")
        
        # Check level matches
        if story_data.get('level') != level:
            errors.append(f"Story {story_id} level mismatch: manifest={level}, file={story_data.get('level')}")
        
        # Check category matches
        if story_data.get('category') != story_meta.get('category'):
            errors.append(f"Story {story_id} category mismatch: manifest={story_meta.get('category')}, file={story_data.get('category')}")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_all_stories_have_valid_categories():
    """Test that all stories use valid category values."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        category = story_meta.get('category')
        
        if not category:
            errors.append(f"Story {story_id} is missing 'category' field")
        elif category not in VALID_CATEGORIES:
            errors.append(f"Story {story_id} has invalid category '{category}'. Valid: {VALID_CATEGORIES}")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_manifest_has_required_metadata():
    """Test that manifest entries have all required metadata."""
    manifest = load_manifest()
    errors = []
    
    required_fields = [
        'id', 'title', 'titleSpanish', 'level', 'category', 'icon',
        'wordCount', 'estimatedMinutes'
    ]
    
    for story_meta in manifest['stories']:
        story_id = story_meta.get('id', 'UNKNOWN')
        
        for field in required_fields:
            if field not in story_meta:
                errors.append(f"Manifest entry for {story_id} is missing '{field}' field")
    
    if errors:
        pytest.fail("\n".join(errors))


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
