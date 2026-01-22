#!/usr/bin/env python3
"""
Categorize Tatoeba sentences and generate JSON output files.

This script loads deduplicated sentences from tatoeba_download.py,
assigns categories based on keyword configuration, and generates JSON
output files organized by category.

Data source: https://tatoeba.org
License: CC-BY 2.0 FR
"""

import json
import yaml
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Set
from collections import defaultdict

# Configuration
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
PROJECT_ROOT = SCRIPT_DIR.parent.parent
SVELTE_OUTPUT_DIR = PROJECT_ROOT / "svelte" / "static" / "sentences"
REPORTS_DIR = PROJECT_ROOT / "reports"

INPUT_JSON = DATA_DIR / "tatoeba_deduplicated.json"
CATEGORIES_YAML = SCRIPT_DIR / "tatoeba_categories.yaml"
OUTPUT_REPORT = REPORTS_DIR / "tatoeba-categorization-report.txt"

# Maximum file size in bytes (500KB)
MAX_FILE_SIZE = 500 * 1024


@dataclass
class Sentence:
    """Represents a categorized sentence."""
    id: str
    spanish: str
    finnish: str
    english: str
    wordCount: int
    categories: List[str]


@dataclass
class Category:
    """Represents a category configuration."""
    id: str
    priority: int
    keywords: List[str]
    patterns: List[str] = None

    def __post_init__(self):
        if self.patterns is None:
            self.patterns = []


def load_categories() -> List[Category]:
    """Load category configuration from YAML file."""
    print("Loading category configuration...")
    if not CATEGORIES_YAML.exists():
        raise FileNotFoundError(f"Category configuration not found: {CATEGORIES_YAML}")

    with open(CATEGORIES_YAML, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    categories = []
    for cat_data in config.get("categories", []):
        category = Category(
            id=cat_data["id"],
            priority=cat_data["priority"],
            keywords=cat_data.get("keywords", []),
            patterns=cat_data.get("patterns", [])
        )
        categories.append(category)

    # Sort by priority
    categories.sort(key=lambda c: c.priority)
    print(f"  Loaded {len(categories)} categories")
    return categories


def load_deduplicated_sentences() -> List[Dict]:
    """Load deduplicated sentences from download script output."""
    print("Loading deduplicated sentences...")
    if not INPUT_JSON.exists():
        raise FileNotFoundError(f"Deduplicated sentences not found. Run tatoeba_download.py first: {INPUT_JSON}")

    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        sentences = json.load(f)

    print(f"  Loaded {len(sentences)} sentences")
    return sentences


def assign_categories(sentence_text: str, categories: List[Category]) -> List[str]:
    """Assign categories to a sentence based on keyword and regex pattern matching.

    Args:
        sentence_text: Spanish text to categorize
        categories: List of category configurations

    Returns:
        List of category IDs the sentence matches
    """
    spanish_lower = sentence_text.lower()
    matched_categories = []

    for category in categories:
        # Check keywords first
        keyword_match = False
        for keyword in category.keywords:
            if keyword in spanish_lower:
                keyword_match = True
                break

        if keyword_match:
            matched_categories.append(category.id)
            continue

        # Check regex patterns if no keyword matched
        for pattern in category.patterns:
            try:
                if re.search(pattern, sentence_text, re.IGNORECASE):
                    matched_categories.append(category.id)
                    break
            except re.error:
                # Skip invalid regex patterns
                continue

    return matched_categories


def convert_to_sentence_objects(raw_sentences: List[Dict], categories: List[Category]) -> List[Sentence]:
    """Convert raw sentence dictionaries to Sentence objects with categories.

    Args:
        raw_sentences: List of raw sentence dictionaries
        categories: List of category configurations

    Returns:
        List of Sentence objects
    """
    print("Converting and categorizing sentences...")
    sentences = []

    for raw in raw_sentences:
        # Calculate word count
        word_count = len(raw["spa"].split())

        # Assign categories
        assigned_categories = assign_categories(raw["spa"], categories)
        if not assigned_categories:
            assigned_categories = ["general"]

        sentence = Sentence(
            id=raw["spa_id"],
            spanish=raw["spa"],
            finnish=raw["fin"],
            english=raw["eng"],
            wordCount=word_count,
            categories=assigned_categories
        )
        sentences.append(sentence)

    print(f"  Converted {len(sentences)} sentences to Sentence objects")
    return sentences


def group_by_category(sentences: List[Sentence], categories: List[Category]) -> Dict[str, List[Sentence]]:
    """Group sentences by their categories.

    Args:
        sentences: List of Sentence objects
        categories: List of category configurations (for ordering)

    Returns:
        Dictionary mapping category IDs to lists of sentences
    """
    groups = defaultdict(list)

    for sentence in sentences:
        for category_id in sentence.categories:
            groups[category_id].append(sentence)

    print(f"  Grouped into {len(groups)} categories")

    # Ensure 'general' exists even if empty
    if 'general' not in groups:
        groups['general'] = []

    return dict(groups)


def write_output_files(groups: Dict[str, List[Sentence]], categories: List[Category]) -> List[str]:
    """Write sentence groups to static JSON files.

    Creates:
    - svelte/static/sentences/index.json (manifest)
    - svelte/static/sentences/{category}.json (or {category}-1.json, {category}-2.json if split)

    Args:
        groups: Dictionary mapping category IDs to lists of sentences
        categories: List of category configurations (for ordering)

    Returns:
        List of generated filenames
    """
    SVELTE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"  Writing output files to: {SVELTE_OUTPUT_DIR}")

    manifest = {
        "categories": [],
        "generatedAt": datetime.now().isoformat()
    }

    generated_files = []

    # Create category lookup for ordering
    category_by_id = {cat.id: cat for cat in categories}

    # Process each category, ordered by priority
    sorted_categories = sorted(
        groups.items(),
        key=lambda item: category_by_id.get(item[0], Category(item[0], 999, [])).priority
    )

    for category_id, sentences in sorted_categories:
        # Convert Sentence objects to dictionaries
        sentence_dicts = [
            {
                "id": s.id,
                "spanish": s.spanish,
                "finnish": s.finnish,
                "english": s.english,
                "wordCount": s.wordCount,
                "categories": s.categories
            }
            for s in sentences
        ]

        # Serialize to JSON to check size
        json_str = json.dumps(sentence_dicts, ensure_ascii=False, indent=2)
        json_bytes = json_str.encode('utf-8')

        # Check if we need to split the file
        if len(json_bytes) > MAX_FILE_SIZE:
            # Calculate how many parts we need
            num_parts = (len(json_bytes) // MAX_FILE_SIZE) + 1
            sentences_per_part = len(sentence_dicts) // num_parts + 1

            # Split into multiple files
            for part_num in range(num_parts):
                start_idx = part_num * sentences_per_part
                end_idx = min((part_num + 1) * sentences_per_part, len(sentence_dicts))
                part_sentences = sentence_dicts[start_idx:end_idx]

                # Write part file
                part_filename = f"{category_id}-{part_num + 1}.json"
                part_path = SVELTE_OUTPUT_DIR / part_filename
                with open(part_path, 'w', encoding='utf-8') as f:
                    json.dump(part_sentences, f, ensure_ascii=False, indent=2)

                # Add to manifest
                manifest["categories"].append({
                    "id": f"{category_id}-{part_num + 1}",
                    "name": category_id,
                    "part": part_num + 1,
                    "count": len(part_sentences),
                    "filename": part_filename
                })

                generated_files.append(part_filename)
                print(f"    Written: {part_filename} ({len(part_sentences)} sentences)")
        else:
            # Write single file
            filename = f"{category_id}.json"
            file_path = SVELTE_OUTPUT_DIR / filename
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(sentence_dicts, f, ensure_ascii=False, indent=2)

            # Add to manifest
            manifest["categories"].append({
                "id": category_id,
                "name": category_id,
                "count": len(sentence_dicts),
                "filename": filename
            })

            generated_files.append(filename)
            print(f"    Written: {filename} ({len(sentence_dicts)} sentences)")

    # Write manifest file
    manifest_path = SVELTE_OUTPUT_DIR / "index.json"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    generated_files.append("index.json")
    print(f"  Written manifest: {manifest_path}")
    print(f"  Total files written: {len(generated_files)}")

    return generated_files


def calculate_statistics(sentences: List[Sentence], groups: Dict[str, List[Sentence]]) -> Dict:
    """Calculate statistics for reporting.

    Args:
        sentences: List of all sentences
        groups: Grouped sentences by category

    Returns:
        Dictionary with calculated statistics
    """
    # Category distribution
    category_distribution = {}
    for category, category_sentences in groups.items():
        category_distribution[category] = len(category_sentences)

    # Word count distribution
    word_count_distribution = {
        "1-4": 0,
        "5-8": 0,
        "9+": 0
    }

    for sentence in sentences:
        if sentence.wordCount <= 4:
            word_count_distribution["1-4"] += 1
        elif sentence.wordCount <= 8:
            word_count_distribution["5-8"] += 1
        else:
            word_count_distribution["9+"] += 1

    # Calculate general percentage
    general_count = len(groups.get("general", []))
    total_sentences = len(sentences)
    general_percentage = (general_count / total_sentences * 100) if total_sentences > 0 else 0

    return {
        "total_sentences": total_sentences,
        "category_distribution": category_distribution,
        "word_count_distribution": word_count_distribution,
        "general_percentage": general_percentage
    }


def generate_report(stats: Dict, generated_files: List[str]):
    """Generate human-readable categorization report.

    Args:
        stats: Statistics dictionary
        generated_files: List of generated files
    """
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    report_lines = []
    report_lines.append("TATOEBA CATEGORIZATION REPORT")
    report_lines.append("=" * 70)
    report_lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("")

    # Summary
    report_lines.append("SUMMARY")
    report_lines.append("-" * 70)
    report_lines.append(f"Total sentences: {stats['total_sentences']:,}")
    report_lines.append("")

    # Category distribution
    report_lines.append("CATEGORY DISTRIBUTION")
    report_lines.append("-" * 70)
    report_lines.append(f"{'Category':<20} {'Count':>10} {'Percentage':>10}")
    report_lines.append("-" * 70)

    total = stats['total_sentences']
    sorted_categories = sorted(
        stats['category_distribution'].items(),
        key=lambda x: x[1],
        reverse=True
    )

    for category, count in sorted_categories:
        percentage = (count / total * 100) if total > 0 else 0
        report_lines.append(f"{category:<20} {count:>10,} {percentage:>9.1f}%")

    report_lines.append("")

    # Word count distribution
    report_lines.append("WORD COUNT DISTRIBUTION")
    report_lines.append("-" * 70)
    report_lines.append(f"{'Range':<20} {'Count':>10} {'Percentage':>10}")
    report_lines.append("-" * 70)

    word_dist = stats['word_count_distribution']
    for range_name, count in [("1-4 words", word_dist["1-4"]), ("5-8 words", word_dist["5-8"]), ("9+ words", word_dist["9+"])]:
        percentage = (count / total * 100) if total > 0 else 0
        report_lines.append(f"{range_name:<20} {count:>10,} {percentage:>9.1f}%")

    report_lines.append("")

    # General analysis
    report_lines.append("GENERAL ANALYSIS")
    report_lines.append("-" * 70)
    report_lines.append(f"Unassigned percentage: {stats['general_percentage']:.1f}%")
    if stats['general_percentage'] > 50:
        report_lines.append("Status: HIGH - Consider expanding category keywords")
    elif stats['general_percentage'] > 30:
        report_lines.append("Status: MODERATE - Keywords cover basic categories")
    else:
        report_lines.append("Status: GOOD - Most sentences assigned to specific categories")
    report_lines.append("")

    # Files generated
    report_lines.append("FILES GENERATED")
    report_lines.append("-" * 70)
    for filename in sorted(generated_files):
        report_lines.append(f"svelte/static/sentences/{filename}")
    report_lines.append("")

    # Write report
    with open(OUTPUT_REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"Report saved: {OUTPUT_REPORT}")
    print("")
    print("\n".join(report_lines))


def main():
    """Main entry point - runs the complete categorization pipeline."""
    print("=" * 70)
    print("Tatoeba Categorization Pipeline")
    print("=" * 70)
    print()

    # Pipeline step 1: Load configuration and data
    categories = load_categories()
    raw_sentences = load_deduplicated_sentences()

    # Pipeline step 2: Convert and categorize sentences
    sentences = convert_to_sentence_objects(raw_sentences, categories)

    # Pipeline step 3: Group by category
    groups = group_by_category(sentences, categories)

    # Pipeline step 4: Write output files
    generated_files = write_output_files(groups, categories)

    # Pipeline step 5: Calculate statistics and generate report
    stats = calculate_statistics(sentences, groups)
    generate_report(stats, generated_files)

    print()
    print("=" * 70)
    print(f"Done! Categorized {len(sentences)} sentences into {len(groups)} categories.")
    print("=" * 70)


if __name__ == "__main__":
    main()
