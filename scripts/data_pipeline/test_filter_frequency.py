#!/usr/bin/env python3
"""
Unit tests for filter_frequency.py
"""

import json
import tempfile
from pathlib import Path

import pytest

from filter_frequency import filter_words, create_tiered_file


class TestFilterWords:
    """Tests for filter_words function."""

    def test_filters_to_max_rank(self):
        words = {
            "word1": {"rank": 1, "cefr": "A1"},
            "word2": {"rank": 2, "cefr": "A1"},
            "word3": {"rank": 3, "cefr": "A1"},
        }
        result = filter_words(words, 2)
        assert len(result) == 2
        assert "word1" in result
        assert "word2" in result
        assert "word3" not in result

    def test_includes_word_at_max_rank(self):
        words = {
            "word1": {"rank": 1, "cefr": "A1"},
            "word2": {"rank": 1000, "cefr": "A2"},
        }
        result = filter_words(words, 1000)
        assert len(result) == 2
        assert "word2" in result

    def test_empty_input_returns_empty(self):
        result = filter_words({}, 1000)
        assert result == {}

    def test_preserves_word_data(self):
        words = {
            "hola": {"rank": 5, "cefr": "A1", "count": 500000, "isTop100": True},
        }
        result = filter_words(words, 10)
        assert result["hola"]["cefr"] == "A1"
        assert result["hola"]["count"] == 500000
        assert result["hola"]["isTop100"] is True


class TestCreateTieredFile:
    """Tests for create_tiered_file function."""

    def test_creates_file_with_filtered_words(self):
        input_data = {
            "version": "1.0.0",
            "source": "Test",
            "sourceUrl": "http://test",
            "license": "Test",
            "attribution": "Test",
            "language": "spanish",
            "words": {
                "word1": {"rank": 1, "cefr": "A1"},
                "word2": {"rank": 2, "cefr": "A1"},
                "word3": {"rank": 1001, "cefr": "A2"},
            }
        }
        
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "test-output.json"
            create_tiered_file(input_data, 1000, output_path)
            
            assert output_path.exists()
            
            with open(output_path) as f:
                result = json.load(f)
            
            assert result["wordCount"] == 2
            assert result["range"] == "1-1000"
            assert "word1" in result["words"]
            assert "word2" in result["words"]
            assert "word3" not in result["words"]

    def test_output_has_required_fields(self):
        input_data = {
            "version": "1.0.0",
            "source": "OpenSubtitles",
            "sourceUrl": "http://example.com",
            "license": "CC-BY-SA-4.0",
            "attribution": "Test attribution",
            "language": "spanish",
            "words": {"hola": {"rank": 1, "cefr": "A1"}}
        }
        
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "test-output.json"
            create_tiered_file(input_data, 5000, output_path)
            
            with open(output_path) as f:
                result = json.load(f)
            
            assert "version" in result
            assert "source" in result
            assert "license" in result
            assert "language" in result
            assert "range" in result
            assert "wordCount" in result
            assert "generatedAt" in result
            assert "words" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
