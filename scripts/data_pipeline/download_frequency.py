#!/usr/bin/env python3
"""
Download and process Spanish/Finnish frequency data for Espanjapeli V4.

This script downloads word frequency lists from OpenSubtitles (CC-BY-SA-4.0)
and converts them to JSON format suitable for the Svelte frontend.

No external API calls - just download, parse, and estimate CEFR levels.

Usage:
    python download_frequency.py

Output:
    ../../scripts/data/frequency-spanish.json
    ../../scripts/data/frequency-finnish.json
"""

import json
import re
from pathlib import Path
from typing import Dict, Any

import requests

# Frequency data sources (CC-BY-SA-4.0)
FREQUENCY_URLS = {
    "spanish": "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/es/es_50k.txt",
    "finnish": "https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/fi/fi_50k.txt"
}

# Output directory
SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR.parent / "data"

# How many words to process
MAX_WORDS = 50000

# CEFR level estimation based on frequency rank
def estimate_cefr(rank: int) -> str:
    """Estimate CEFR level based on word frequency rank."""
    if rank <= 500:
        return "A1"
    elif rank <= 1500:
        return "A2"
    elif rank <= 3000:
        return "B1"
    elif rank <= 5000:
        return "B2"
    elif rank <= 8000:
        return "C1"
    else:
        return "C2"


def download_frequency_list(language: str, url: str) -> Dict[str, Any]:
    """Download and parse frequency list from URL."""
    print(f"Downloading {language} frequency data from OpenSubtitles...")
    
    response = requests.get(url, timeout=60)
    response.raise_for_status()
    
    words = {}
    word_pattern = re.compile(r"^([^\s]+)\s+(\d+)\s*$")
    
    for rank, line in enumerate(response.text.strip().split('\n'), 1):
        if rank > MAX_WORDS:
            break
            
        match = word_pattern.match(line)
        if not match:
            continue
            
        word = match.group(1).lower().strip()
        count = int(match.group(2))
        cefr = estimate_cefr(rank)
        
        words[word] = {
            "rank": rank,
            "count": count,
            "cefr": cefr,
            "isTop100": rank <= 100,
            "isTop500": rank <= 500,
            "isTop1000": rank <= 1000,
            "isTop3000": rank <= 3000,
            "isTop5000": rank <= 5000
        }
    
    print(f"  Processed {len(words)} words")
    return words


def main():
    """Download and process frequency data for Spanish and Finnish."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    for lang, url in FREQUENCY_URLS.items():
        try:
            words = download_frequency_list(lang, url)
            
            output_data = {
                "version": "1.0.0",
                "source": "OpenSubtitles 2018 via FrequencyWords",
                "sourceUrl": "https://github.com/hermitdave/FrequencyWords",
                "license": "CC-BY-SA-4.0",
                "attribution": "Frequency data from OpenSubtitles corpus",
                "language": lang,
                "wordCount": len(words),
                "generatedAt": "2026-01-12",
                "words": words
            }
            
            output_file = OUTPUT_DIR / f"frequency-{lang}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)
            
            print(f"  ✓ Saved to {output_file}")
            print(f"  File size: {output_file.stat().st_size / 1024:.1f} KB")
            
        except Exception as e:
            print(f"  ✗ Error processing {lang}: {e}")
            continue
    
    print("\n✓ Done! Frequency data ready for V4.")
    print(f"\nNext steps:")
    print(f"  1. Check the generated files in {OUTPUT_DIR}")
    print(f"  2. Run Task 2: enrich existing words.ts with frequency data")


if __name__ == "__main__":
    main()
