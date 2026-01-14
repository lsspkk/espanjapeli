#!/usr/bin/env python3
"""
Unit tests for measure_data_size.py
"""

import json
import tempfile
from pathlib import Path

import pytest

from measure_data_size import measure_json_size, format_bytes


class TestMeasureJsonSize:
    """Tests for measure_json_size function."""

    def test_returns_required_fields(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            filepath = Path(tmpdir) / "test.json"
            data = {"wordCount": 10, "words": {"a": {}, "b": {}}}
            with open(filepath, 'w') as f:
                json.dump(data, f)
            
            result = measure_json_size(filepath)
            
            assert "file" in result
            assert "raw_bytes" in result
            assert "gzip_bytes" in result
            assert "compression_pct" in result
            assert "word_count" in result

    def test_gzip_is_smaller_than_raw(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            filepath = Path(tmpdir) / "test.json"
            # Create a reasonably sized file that compresses well
            data = {"wordCount": 100, "words": {f"word{i}": {"rank": i} for i in range(100)}}
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2)
            
            result = measure_json_size(filepath)
            
            assert result["gzip_bytes"] < result["raw_bytes"]
            assert result["compression_pct"] > 0

    def test_word_count_from_wordCount_field(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            filepath = Path(tmpdir) / "test.json"
            data = {"wordCount": 500, "words": {}}
            with open(filepath, 'w') as f:
                json.dump(data, f)
            
            result = measure_json_size(filepath)
            
            assert result["word_count"] == 500


class TestFormatBytes:
    """Tests for format_bytes function."""

    def test_bytes(self):
        assert format_bytes(100) == "100 B"
        assert format_bytes(1023) == "1023 B"

    def test_kilobytes(self):
        assert format_bytes(1024) == "1.0 KB"
        assert format_bytes(10240) == "10.0 KB"
        assert format_bytes(204800) == "200.0 KB"

    def test_megabytes(self):
        assert format_bytes(1048576) == "1.00 MB"
        assert format_bytes(10485760) == "10.00 MB"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
