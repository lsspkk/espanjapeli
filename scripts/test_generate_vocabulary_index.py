#!/usr/bin/env python3
"""
Tests for generate_vocabulary_index.py
"""

import pytest
from generate_vocabulary_index import normalize_word, build_vocabulary_index
from pathlib import Path
import json
import tempfile
import shutil


def test_normalize_word():
    """Test word normalization."""
    assert normalize_word("el perro") == "perro"
    assert normalize_word("la casa") == "casa"
    assert normalize_word("los libros") == "libros"
    assert normalize_word("una manzana") == "manzana"
    assert normalize_word("Hola") == "hola"
    assert normalize_word("  palabra  ") == "palabra"


def test_normalize_word_no_article():
    """Test normalization without articles."""
    assert normalize_word("hablar") == "hablar"
    assert normalize_word("bonito") == "bonito"


def test_build_vocabulary_index():
    """Test building vocabulary index from stories."""
    # Create temporary directory with test stories
    with tempfile.TemporaryDirectory() as tmpdir:
        stories_dir = Path(tmpdir)
        a1_dir = stories_dir / 'a1'
        a1_dir.mkdir()
        
        # Create test story
        test_story = {
            'id': 'test-story',
            'level': 'A1',
            'title': 'Test Story',
            'titleSpanish': 'Historia de Prueba',
            'vocabulary': [
                {'spanish': 'hola', 'finnish': 'hei'},
                {'spanish': 'el perro', 'finnish': 'koira'},
                {'spanish': 'la casa', 'finnish': 'talo'}
            ]
        }
        
        with open(a1_dir / 'test-story.json', 'w', encoding='utf-8') as f:
            json.dump(test_story, f)
        
        # Build index
        index = build_vocabulary_index(stories_dir)
        
        # Verify index
        assert 'hola' in index
        assert 'perro' in index
        assert 'casa' in index
        
        # Check story reference
        assert len(index['hola']['stories']) == 1
        assert index['hola']['stories'][0]['id'] == 'test-story'
        assert index['hola']['stories'][0]['level'] == 'A1'
        
        # Check translations
        assert 'hei' in index['hola']['translations']
        assert 'koira' in index['perro']['translations']
        
        # Check original forms
        assert 'hola' in index['hola']['original_forms']
        assert 'el perro' in index['perro']['original_forms']


def test_build_vocabulary_index_multiple_stories():
    """Test index with word appearing in multiple stories."""
    with tempfile.TemporaryDirectory() as tmpdir:
        stories_dir = Path(tmpdir)
        a1_dir = stories_dir / 'a1'
        a1_dir.mkdir()
        
        # Create two stories with overlapping vocabulary
        story1 = {
            'id': 'story-1',
            'level': 'A1',
            'title': 'Story 1',
            'titleSpanish': 'Historia 1',
            'vocabulary': [
                {'spanish': 'hola', 'finnish': 'hei'}
            ]
        }
        
        story2 = {
            'id': 'story-2',
            'level': 'A1',
            'title': 'Story 2',
            'titleSpanish': 'Historia 2',
            'vocabulary': [
                {'spanish': 'hola', 'finnish': 'terve'}
            ]
        }
        
        with open(a1_dir / 'story-1.json', 'w', encoding='utf-8') as f:
            json.dump(story1, f)
        
        with open(a1_dir / 'story-2.json', 'w', encoding='utf-8') as f:
            json.dump(story2, f)
        
        # Build index
        index = build_vocabulary_index(stories_dir)
        
        # Verify word appears in both stories
        assert len(index['hola']['stories']) == 2
        assert index['hola']['count'] == 2
        
        # Verify both translations are captured
        assert 'hei' in index['hola']['translations']
        assert 'terve' in index['hola']['translations']


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
