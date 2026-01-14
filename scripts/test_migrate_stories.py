#!/usr/bin/env python3
"""
Tests for migrate_stories.py script.
"""

import json
import pytest
from pathlib import Path
from migrate_stories import (
    count_words,
    estimate_reading_time,
    map_difficulty_to_level,
    get_level_folder
)


def test_count_words():
    """Test word counting in dialogue."""
    dialogue = [
        {'spanish': 'Hola buenos días', 'finnish': 'Hei, hyvää huomenta'},
        {'spanish': 'Cómo estás', 'finnish': 'Miten voit?'},
        {'spanish': 'Muy bien gracias', 'finnish': 'Erittäin hyvin, kiitos'}
    ]
    word_count = count_words(dialogue)
    assert word_count == 8  # 3 + 2 + 3


def test_count_words_empty():
    """Test word counting with empty dialogue."""
    assert count_words([]) == 0


def test_estimate_reading_time():
    """Test reading time estimation."""
    assert estimate_reading_time(40) == 1
    assert estimate_reading_time(80) == 2
    assert estimate_reading_time(120) == 3
    assert estimate_reading_time(10) == 1  # Minimum 1 minute


def test_map_difficulty_to_level():
    """Test difficulty to CEFR level mapping."""
    assert map_difficulty_to_level('beginner') == 'A2'
    assert map_difficulty_to_level('intermediate') == 'B1'
    assert map_difficulty_to_level('advanced') == 'B2'
    assert map_difficulty_to_level('unknown') == 'A2'  # Default


def test_get_level_folder():
    """Test level folder name generation."""
    assert get_level_folder('A1') == 'a1'
    assert get_level_folder('A2') == 'a2'
    assert get_level_folder('B1') == 'b1'
    assert get_level_folder('B2') == 'b2'


def test_migrated_files_exist():
    """Test that migrated story files exist."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    stories_dir = project_root / 'svelte' / 'static' / 'stories'
    
    # Check manifest exists
    manifest_file = stories_dir / 'manifest.json'
    assert manifest_file.exists(), "manifest.json should exist"
    
    # Load manifest
    with open(manifest_file, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    # Check manifest structure
    assert 'version' in manifest
    assert 'stories' in manifest
    assert len(manifest['stories']) > 0
    
    # Check each story file exists
    for story_meta in manifest['stories']:
        level = story_meta['level']
        story_id = story_meta['id']
        level_folder = get_level_folder(level)
        story_file = stories_dir / level_folder / f"{story_id}.json"
        assert story_file.exists(), f"Story file {story_file} should exist"
        
        # Verify story file is valid JSON
        with open(story_file, 'r', encoding='utf-8') as f:
            story_data = json.load(f)
        
        # Check required fields
        assert story_data['id'] == story_id
        assert 'dialogue' in story_data
        assert 'vocabulary' in story_data
        assert 'questions' in story_data


def test_manifest_metadata():
    """Test that manifest has accurate metadata."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    manifest_file = project_root / 'svelte' / 'static' / 'stories' / 'manifest.json'
    
    with open(manifest_file, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    for story_meta in manifest['stories']:
        # Check required fields
        assert 'id' in story_meta
        assert 'title' in story_meta
        assert 'titleSpanish' in story_meta
        assert 'level' in story_meta
        assert 'wordCount' in story_meta
        assert 'estimatedMinutes' in story_meta
        assert 'vocabularyCount' in story_meta
        assert 'questionCount' in story_meta
        
        # Check value types
        assert isinstance(story_meta['wordCount'], int)
        assert isinstance(story_meta['estimatedMinutes'], int)
        assert isinstance(story_meta['vocabularyCount'], int)
        assert isinstance(story_meta['questionCount'], int)
        
        # Check reasonable values
        assert story_meta['wordCount'] > 0
        assert story_meta['estimatedMinutes'] > 0
        assert story_meta['vocabularyCount'] > 0
        assert story_meta['questionCount'] > 0


def test_backup_created():
    """Test that backup file was created."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    backup_file = project_root / 'svelte' / 'static' / 'stories' / 'stories.json.backup'
    
    assert backup_file.exists(), "Backup file should exist"
    
    # Verify backup is valid JSON
    with open(backup_file, 'r', encoding='utf-8') as f:
        backup_data = json.load(f)
    
    assert 'stories' in backup_data
    assert len(backup_data['stories']) > 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
