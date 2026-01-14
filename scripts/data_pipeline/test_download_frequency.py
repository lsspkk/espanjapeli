#!/usr/bin/env python3
"""
Unit tests for download_frequency.py

Tests CEFR estimation logic and parsing of frequency data.
Uses mocked HTTP responses to avoid network dependency.
"""

import json
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

from download_frequency import (
    estimate_cefr,
    download_frequency_list,
    FREQUENCY_URLS,
)


class TestEstimateCefr:
    """Tests for CEFR level estimation based on frequency rank."""

    def test_top_500_returns_a1(self):
        assert estimate_cefr(1) == "A1"
        assert estimate_cefr(100) == "A1"
        assert estimate_cefr(500) == "A1"

    def test_501_to_1500_returns_a2(self):
        assert estimate_cefr(501) == "A2"
        assert estimate_cefr(1000) == "A2"
        assert estimate_cefr(1500) == "A2"

    def test_1501_to_3000_returns_b1(self):
        assert estimate_cefr(1501) == "B1"
        assert estimate_cefr(2000) == "B1"
        assert estimate_cefr(3000) == "B1"

    def test_3001_to_5000_returns_b2(self):
        assert estimate_cefr(3001) == "B2"
        assert estimate_cefr(4000) == "B2"
        assert estimate_cefr(5000) == "B2"

    def test_5001_to_8000_returns_c1(self):
        assert estimate_cefr(5001) == "C1"
        assert estimate_cefr(7000) == "C1"
        assert estimate_cefr(8000) == "C1"

    def test_above_8000_returns_c2(self):
        assert estimate_cefr(8001) == "C2"
        assert estimate_cefr(10000) == "C2"
        assert estimate_cefr(50000) == "C2"


class TestDownloadFrequencyList:
    """Tests for downloading and parsing frequency data."""

    @patch('download_frequency.requests.get')
    def test_parses_frequency_data_correctly(self, mock_get):
        """Test that frequency list is parsed with correct structure."""
        mock_response = MagicMock()
        mock_response.text = "de 14459520\nque 14421005\nno 12379505"
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        result = download_frequency_list("spanish", "http://fake.url")

        assert len(result) == 3
        assert "de" in result
        assert "que" in result
        assert "no" in result

    @patch('download_frequency.requests.get')
    def test_word_data_has_required_fields(self, mock_get):
        """Test that each word entry has all required fields."""
        mock_response = MagicMock()
        mock_response.text = "hola 500000"
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        result = download_frequency_list("spanish", "http://fake.url")

        word_data = result["hola"]
        assert "rank" in word_data
        assert "count" in word_data
        assert "cefr" in word_data
        assert "isTop100" in word_data
        assert "isTop500" in word_data
        assert "isTop1000" in word_data
        assert "isTop3000" in word_data
        assert "isTop5000" in word_data

    @patch('download_frequency.requests.get')
    def test_rank_is_sequential(self, mock_get):
        """Test that ranks are assigned sequentially starting at 1."""
        mock_response = MagicMock()
        mock_response.text = "primero 1000\nsegundo 900\ntercero 800"
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        result = download_frequency_list("spanish", "http://fake.url")

        assert result["primero"]["rank"] == 1
        assert result["segundo"]["rank"] == 2
        assert result["tercero"]["rank"] == 3

    @patch('download_frequency.requests.get')
    def test_count_is_parsed_correctly(self, mock_get):
        """Test that occurrence counts are parsed as integers."""
        mock_response = MagicMock()
        mock_response.text = "palabra 12345678"
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        result = download_frequency_list("spanish", "http://fake.url")

        assert result["palabra"]["count"] == 12345678

    @patch('download_frequency.requests.get')
    def test_words_are_lowercased(self, mock_get):
        """Test that words are normalized to lowercase."""
        mock_response = MagicMock()
        mock_response.text = "HOLA 1000\nAdios 900"
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        result = download_frequency_list("spanish", "http://fake.url")

        assert "hola" in result
        assert "adios" in result
        assert "HOLA" not in result
        assert "Adios" not in result

    @patch('download_frequency.requests.get')
    def test_top_n_flags_are_set_correctly(self, mock_get):
        """Test that isTopN flags are set based on rank."""
        # Create mock data with enough lines to test different thresholds
        lines = [f"word{i} {1000-i}" for i in range(1, 102)]
        mock_response = MagicMock()
        mock_response.text = "\n".join(lines)
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        result = download_frequency_list("spanish", "http://fake.url")

        # First word should be in top 100
        assert result["word1"]["isTop100"] is True
        assert result["word1"]["isTop500"] is True
        assert result["word1"]["isTop1000"] is True

        # Word 101 should NOT be in top 100
        assert result["word101"]["isTop100"] is False
        assert result["word101"]["isTop500"] is True

    @patch('download_frequency.requests.get')
    def test_handles_malformed_lines(self, mock_get):
        """Test that malformed lines are skipped."""
        mock_response = MagicMock()
        mock_response.text = "valid 1000\ninvalid_no_count\nalso_valid 500"
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        result = download_frequency_list("spanish", "http://fake.url")

        # Should only have valid entries
        assert "valid" in result
        assert "also_valid" in result
        assert "invalid_no_count" not in result


class TestFrequencyUrls:
    """Tests for URL configuration."""

    def test_spanish_url_is_configured(self):
        assert "spanish" in FREQUENCY_URLS
        assert "es_50k.txt" in FREQUENCY_URLS["spanish"]

    def test_finnish_url_is_configured(self):
        assert "finnish" in FREQUENCY_URLS
        assert "fi_50k.txt" in FREQUENCY_URLS["finnish"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
