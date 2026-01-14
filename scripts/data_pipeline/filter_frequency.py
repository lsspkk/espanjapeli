#!/usr/bin/env python3
"""
Filter frequency data to create tiered files for the Svelte frontend.

Takes the raw 50k frequency data and creates:
- frequency-spanish-top1000.json (~200KB) - For lightweight lookups
- frequency-spanish-top5000.json (~1MB) - Full vocabulary for A1-B2

Usage:
    python filter_frequency.py

Input:
    ../data/frequency-spanish.json (50k words)
    
Output:
    ../../svelte/static/data/frequency-spanish-top1000.json
    ../../svelte/static/data/frequency-spanish-top5000.json
"""

import json
from pathlib import Path
from datetime import date


SCRIPT_DIR = Path(__file__).parent
INPUT_DIR = SCRIPT_DIR.parent / "data"
OUTPUT_DIR = SCRIPT_DIR.parent.parent / "svelte" / "static" / "data"


def filter_words(words: dict, max_rank: int) -> dict:
    """Filter words to only include those with rank <= max_rank."""
    return {
        word: data 
        for word, data in words.items() 
        if data["rank"] <= max_rank
    }


def create_tiered_file(input_data: dict, max_rank: int, output_path: Path):
    """Create a tiered frequency file with words up to max_rank."""
    filtered_words = filter_words(input_data["words"], max_rank)
    
    output_data = {
        "version": "1.0.0",
        "source": input_data["source"],
        "sourceUrl": input_data["sourceUrl"],
        "license": input_data["license"],
        "attribution": input_data["attribution"],
        "language": input_data["language"],
        "range": f"1-{max_rank}",
        "wordCount": len(filtered_words),
        "generatedAt": str(date.today()),
        "words": filtered_words
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    file_size_kb = output_path.stat().st_size / 1024
    print(f"  ✓ {output_path.name}: {len(filtered_words)} words, {file_size_kb:.1f} KB")
    return output_path


def process_language(language: str, tiers: list[int]):
    """Process a single language, creating tiered files for given ranks."""
    input_file = INPUT_DIR / f"frequency-{language}.json"
    if not input_file.exists():
        print(f"Warning: {input_file} not found. Skipping {language}.")
        return False
    
    print(f"Loading {language} frequency data...")
    with open(input_file, 'r', encoding='utf-8') as f:
        input_data = json.load(f)
    
    print(f"  Source has {len(input_data['words'])} words")
    
    for tier in tiers:
        create_tiered_file(
            input_data, 
            tier, 
            OUTPUT_DIR / f"frequency-{language}-top{tier}.json"
        )
    
    return True


def main():
    """Generate tiered frequency files for Spanish and Finnish."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print("Generating tiered frequency files...\n")
    
    # Spanish: top 1000 and top 5000
    process_language("spanish", [1000, 5000])
    
    print()
    
    # Finnish: top 5000 only (for reference)
    process_language("finnish", [5000])
    
    print("\n✓ Done! Tiered frequency files ready.")
    return 0


if __name__ == "__main__":
    exit(main())
