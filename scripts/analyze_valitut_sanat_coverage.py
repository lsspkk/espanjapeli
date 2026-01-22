#!/usr/bin/env python3
"""
Analyze valitut-sanat game mode coverage.

This script analyzes the words used in the valitut-sanat game mode
and identifies which words have no sentence coverage from Tatoeba.

Outputs:
  - data/analysis/valitut_sanat_coverage_report.json (detailed JSON report)
  - data/analysis/valitut_sanat_gaps.csv (words needing sentences)
  - data/analysis/valitut_sanat_covered.csv (words with sentences)
"""

import csv
import json
import sys
from pathlib import Path
from typing import TypedDict


class CoverageWord(TypedDict):
    """Information about a word's coverage"""
    spanish: str
    finnish: str
    hasSentences: bool
    sentenceCount: int
    sentenceIds: list[str]


class CoverageReport(TypedDict):
    """Overall coverage report"""
    totalWords: int
    wordsWithSentences: int
    wordsWithoutSentences: int
    coverage: float
    wordsWithoutCoverage: list[CoverageWord]
    allWords: list[CoverageWord]


def load_lessons_index(lessons_dir: Path) -> dict:
    """Load the lessons index to get all lessons"""
    index_file = lessons_dir / "index.json"
    if not index_file.exists():
        print(f"Error: Lessons index not found at {index_file}")
        sys.exit(1)

    with open(index_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_lesson(lessons_dir: Path, filename: str) -> dict:
    """Load a single lesson file"""
    lesson_file = lessons_dir / filename
    if not lesson_file.exists():
        print(f"Warning: Lesson file not found at {lesson_file}")
        return {"words": [], "phrases": []}

    with open(lesson_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_all_lesson_words(lessons_dir: Path) -> list[str]:
    """Get all word IDs from all lessons"""
    manifest = load_lessons_index(lessons_dir)
    all_words = []

    for lesson_meta in manifest["lessons"]:
        lesson = load_lesson(lessons_dir, lesson_meta["filename"])
        all_words.extend(lesson.get("words", []))

    return list(dict.fromkeys(all_words))  # Remove duplicates, preserve order


def load_word_mapping(words_data_file: Path) -> dict:
    """Load the words.ts TypeScript file and parse it as JSON-like data"""
    # For now, we'll assume we need to load from a simpler format
    # The actual words.ts is TypeScript, so we'll need to parse it differently
    # This will try to load a JSON version if it exists
    return {}


def get_words_from_words_ts(data_dir: Path) -> dict:
    """
    Parse WORD_CATEGORIES from words.ts file and extract Spanish-Finnish mapping.

    Uses regex to extract word objects from TypeScript.
    """
    import re

    words_ts = data_dir / "words.ts"

    if not words_ts.exists():
        print(f"Warning: words.ts not found at {words_ts}")
        return {}

    # Read the file
    with open(words_ts, 'r', encoding='utf-8') as f:
        content = f.read()

    spanish_to_finnish = {}

    # Match word objects: { spanish: '...', ..., finnish: '...', ... }
    # This regex looks for objects with at least spanish and finnish fields
    pattern = r"\{\s*spanish:\s*'([^']+)'[^}]*finnish:\s*'([^']+)'[^}]*\}"

    matches = re.finditer(pattern, content)
    for match in matches:
        spanish = match.group(1)
        finnish = match.group(2)
        spanish_to_finnish[spanish] = finnish

    return spanish_to_finnish


def load_word_sentences_mapping(sentences_dir: Path) -> dict:
    """Load the word-to-sentences mapping"""
    mapping_file = sentences_dir / "word-sentences.json"

    if not mapping_file.exists():
        print(f"Error: Word-sentences mapping not found at {mapping_file}")
        sys.exit(1)

    with open(mapping_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    return data.get("wordToSentences", {})


def analyze_coverage(
    lesson_words: list[str],
    word_sentences_mapping: dict,
    spanish_to_finnish: dict
) -> CoverageReport:
    """
    Analyze coverage of lesson words.

    Args:
        lesson_words: List of Spanish words used in valitut-sanat lessons
        word_sentences_mapping: Mapping of Spanish words to sentence IDs
        spanish_to_finnish: Mapping of Spanish words to Finnish translations

    Returns:
        CoverageReport with analysis results
    """
    words_without_coverage = []
    words_with_coverage = []

    for word in lesson_words:
        # Normalize word (remove disambiguation markers like #adjective)
        normalized_word = word.split('#')[0] if '#' in word else word

        # Get Finnish translation
        finnish = spanish_to_finnish.get(normalized_word, "?")

        # Check if word has sentences
        sentences = word_sentences_mapping.get(normalized_word, [])
        has_sentences = len(sentences) > 0

        word_info: CoverageWord = {
            "spanish": normalized_word,
            "finnish": finnish,
            "hasSentences": has_sentences,
            "sentenceCount": len(sentences),
            "sentenceIds": sentences
        }

        if has_sentences:
            words_with_coverage.append(word_info)
        else:
            words_without_coverage.append(word_info)

    total = len(lesson_words)
    with_coverage = len(words_with_coverage)
    without_coverage = len(words_without_coverage)
    coverage_percent = (with_coverage / total * 100) if total > 0 else 0

    report: CoverageReport = {
        "totalWords": total,
        "wordsWithSentences": with_coverage,
        "wordsWithoutSentences": without_coverage,
        "coverage": round(coverage_percent, 2),
        "wordsWithoutCoverage": words_without_coverage,
        "allWords": words_with_coverage + words_without_coverage
    }

    return report


def export_csv(filepath: Path, words: list[CoverageWord], include_sentences: bool = False):
    """Export words to CSV format"""
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        if include_sentences:
            fieldnames = ['spanish', 'finnish', 'sentence_count', 'sentence_ids']
        else:
            fieldnames = ['spanish', 'finnish']

        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for word in words:
            if include_sentences:
                writer.writerow({
                    'spanish': word['spanish'],
                    'finnish': word['finnish'],
                    'sentence_count': word['sentenceCount'],
                    'sentence_ids': '|'.join(word['sentenceIds']) if word['sentenceIds'] else ''
                })
            else:
                writer.writerow({
                    'spanish': word['spanish'],
                    'finnish': word['finnish']
                })


def main():
    """Main analysis function"""
    # Set up paths
    project_root = Path(__file__).parent.parent
    lessons_dir = project_root / "svelte" / "static" / "lessons"
    sentences_dir = project_root / "svelte" / "static" / "sentences"
    data_dir = project_root / "svelte" / "src" / "lib" / "data"
    output_dir = project_root / "data" / "analysis"

    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)

    print("📊 Analyzing valitut-sanat coverage...")
    print(f"  Lessons: {lessons_dir}")
    print(f"  Sentences: {sentences_dir}")
    print()

    # Load data
    print("Loading lesson data...")
    lesson_words = get_all_lesson_words(lessons_dir)
    print(f"  Found {len(lesson_words)} words in lessons")

    print("Loading word-sentences mapping...")
    word_sentences = load_word_sentences_mapping(sentences_dir)
    print(f"  Mapping contains {len(word_sentences)} words")

    print("Loading word translations...")
    spanish_to_finnish = get_words_from_words_ts(data_dir)
    print(f"  Found {len(spanish_to_finnish)} word translations")

    print()
    print("Analyzing coverage...")
    report = analyze_coverage(lesson_words, word_sentences, spanish_to_finnish)

    # Save report
    output_file = output_dir / "valitut_sanat_coverage_report.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"✓ Report saved to {output_file}")

    # Export CSV files
    gaps_file = output_dir / "valitut_sanat_gaps.csv"
    export_csv(gaps_file, report['wordsWithoutCoverage'], include_sentences=False)
    print(f"✓ Gaps saved to {gaps_file}")

    covered_file = output_dir / "valitut_sanat_covered.csv"
    export_csv(covered_file, [w for w in report['allWords'] if w['hasSentences']], include_sentences=True)
    print(f"✓ Covered words saved to {covered_file}")
    print()

    # Print summary
    print("📈 Coverage Summary:")
    print(f"  Total words: {report['totalWords']}")
    print(f"  Words with sentences: {report['wordsWithSentences']}")
    print(f"  Words without sentences: {report['wordsWithoutSentences']}")
    print(f"  Coverage: {report['coverage']}%")
    print()

    if report["wordsWithoutSentences"] > 0:
        print(f"⚠️  Words needing sentence coverage ({report['wordsWithoutSentences']}):")
        for word in report["wordsWithoutCoverage"][:20]:  # Show first 20
            print(f"    • {word['spanish']} ({word['finnish']})")

        if report["wordsWithoutSentences"] > 20:
            print(f"    ... and {report['wordsWithoutSentences'] - 20} more")
    else:
        print("✓ All words have sentence coverage!")


if __name__ == "__main__":
    main()
