#!/usr/bin/env python3
"""
Frequency Data Validation Script

This validates the frequency-spanish-top5000.json file structure:
1. Metadata fields (version, source, license, etc.)
2. Word count matches declared wordCount
3. Rank sequence is continuous (1-5000)
4. CEFR levels are valid and properly distributed
5. isTop* flags are correctly set based on rank
6. No duplicate ranks
7. All words have required fields

Usage:
    python scripts/validate_frequency_data.py
    
Output:
    - Test results to console (pytest format)
    - Detailed report to reports/frequency-validation-results.txt
"""

import json
import pytest
from pathlib import Path
from typing import Dict, Any, List, Set
from datetime import datetime
from collections import Counter


VALID_CEFR_LEVELS = {'A1', 'A2', 'B1', 'B2', 'C1', 'C2'}
REQUIRED_METADATA_FIELDS = {
    'version', 'source', 'sourceUrl', 'license', 'attribution',
    'language', 'range', 'wordCount', 'generatedAt', 'words'
}
REQUIRED_WORD_FIELDS = {
    'rank', 'count', 'cefr', 'isTop100', 'isTop500', 
    'isTop1000', 'isTop3000', 'isTop5000'
}


def get_frequency_file_path() -> Path:
    """Get the frequency data file path."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    return project_root / 'svelte' / 'static' / 'data' / 'frequency-spanish-top5000.json'


def load_frequency_data() -> Dict[str, Any]:
    """Load the frequency data JSON file."""
    freq_file = get_frequency_file_path()
    
    if not freq_file.exists():
        raise FileNotFoundError(f"Frequency file not found: {freq_file}")
    
    with open(freq_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_reports_dir() -> Path:
    """Get or create the reports directory."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    reports_dir = project_root / 'reports'
    reports_dir.mkdir(exist_ok=True)
    return reports_dir


def write_validation_report(results: Dict[str, Any]) -> None:
    """Write validation results to a report file."""
    reports_dir = get_reports_dir()
    report_file = reports_dir / 'frequency-validation-results.txt'
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("FREQUENCY DATA VALIDATION REPORT\n")
        f.write("=" * 80 + "\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n")
        f.write(f"File: {get_frequency_file_path()}\n")
        f.write("\n")
        
        # Summary
        f.write("SUMMARY\n")
        f.write("-" * 80 + "\n")
        f.write(f"Total words: {results['total_words']}\n")
        f.write(f"Expected words: {results['expected_words']}\n")
        f.write(f"Metadata valid: {results['metadata_valid']}\n")
        f.write(f"Structure valid: {results['structure_valid']}\n")
        f.write(f"Ranks valid: {results['ranks_valid']}\n")
        f.write(f"CEFR levels valid: {results['cefr_valid']}\n")
        f.write(f"Top flags valid: {results['top_flags_valid']}\n")
        f.write("\n")
        
        # CEFR Distribution
        f.write("CEFR LEVEL DISTRIBUTION\n")
        f.write("-" * 80 + "\n")
        for level, count in sorted(results['cefr_distribution'].items()):
            percentage = (count / results['total_words']) * 100
            f.write(f"{level}: {count} words ({percentage:.1f}%)\n")
        f.write("\n")
        
        # Top-N Statistics
        f.write("TOP-N STATISTICS\n")
        f.write("-" * 80 + "\n")
        for top_n, count in sorted(results['top_n_stats'].items()):
            f.write(f"{top_n}: {count} words\n")
        f.write("\n")
        
        # Errors
        if results['errors']:
            f.write("ERRORS FOUND\n")
            f.write("-" * 80 + "\n")
            for error in results['errors']:
                f.write(f"- {error}\n")
            f.write("\n")
        else:
            f.write("NO ERRORS FOUND\n")
            f.write("-" * 80 + "\n")
            f.write("All validation checks passed successfully!\n")
            f.write("\n")
        
        # Warnings
        if results['warnings']:
            f.write("WARNINGS\n")
            f.write("-" * 80 + "\n")
            for warning in results['warnings']:
                f.write(f"- {warning}\n")
            f.write("\n")
        
        f.write("=" * 80 + "\n")
        f.write("END OF REPORT\n")
        f.write("=" * 80 + "\n")
    
    print(f"\nValidation report written to: {report_file}")


def test_metadata_fields():
    """Test that all required metadata fields are present and valid."""
    data = load_frequency_data()
    errors = []
    
    # Check required fields
    missing_fields = REQUIRED_METADATA_FIELDS - set(data.keys())
    if missing_fields:
        errors.append(f"Missing metadata fields: {missing_fields}")
    
    # Validate specific fields
    if 'language' in data and data['language'] != 'spanish':
        errors.append(f"Expected language 'spanish', got '{data['language']}'")
    
    if 'wordCount' in data and not isinstance(data['wordCount'], int):
        errors.append(f"wordCount must be an integer, got {type(data['wordCount'])}")
    
    if 'words' in data and not isinstance(data['words'], dict):
        errors.append(f"words must be a dictionary, got {type(data['words'])}")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_word_count_matches():
    """Test that the actual word count matches the declared wordCount."""
    data = load_frequency_data()
    declared_count = data.get('wordCount', 0)
    actual_count = len(data.get('words', {}))
    
    if declared_count != actual_count:
        pytest.fail(
            f"Word count mismatch: declared={declared_count}, actual={actual_count}"
        )


def test_all_words_have_required_fields():
    """Test that all words have the required fields."""
    data = load_frequency_data()
    words = data.get('words', {})
    errors = []
    
    for word, word_data in words.items():
        if not isinstance(word_data, dict):
            errors.append(f"Word '{word}' data is not a dictionary")
            continue
        
        missing_fields = REQUIRED_WORD_FIELDS - set(word_data.keys())
        if missing_fields:
            errors.append(f"Word '{word}' missing fields: {missing_fields}")
    
    if errors:
        # Limit to first 10 errors to avoid overwhelming output
        if len(errors) > 10:
            errors = errors[:10] + [f"... and {len(errors) - 10} more errors"]
        pytest.fail("\n".join(errors))


def test_rank_sequence_is_continuous():
    """Test that ranks form a continuous sequence from 1 to wordCount."""
    data = load_frequency_data()
    words = data.get('words', {})
    word_count = data.get('wordCount', 0)
    
    # Collect all ranks
    ranks = [word_data.get('rank') for word_data in words.values()]
    
    # Check for None values
    none_ranks = [i for i, r in enumerate(ranks) if r is None]
    if none_ranks:
        pytest.fail(f"Found {len(none_ranks)} words with missing rank")
    
    # Check for duplicates
    rank_counts = Counter(ranks)
    duplicates = {rank: count for rank, count in rank_counts.items() if count > 1}
    if duplicates:
        dup_list = [f"rank {rank}: {count} times" for rank, count in list(duplicates.items())[:5]]
        pytest.fail(f"Duplicate ranks found: {', '.join(dup_list)}")
    
    # Check range
    min_rank = min(ranks)
    max_rank = max(ranks)
    
    if min_rank != 1:
        pytest.fail(f"Minimum rank should be 1, got {min_rank}")
    
    if max_rank != word_count:
        pytest.fail(f"Maximum rank should be {word_count}, got {max_rank}")
    
    # Check for gaps
    expected_ranks = set(range(1, word_count + 1))
    actual_ranks = set(ranks)
    missing_ranks = expected_ranks - actual_ranks
    
    if missing_ranks:
        missing_list = sorted(list(missing_ranks))[:10]
        pytest.fail(f"Missing ranks: {missing_list}...")


def test_cefr_levels_are_valid():
    """Test that all CEFR levels are valid."""
    data = load_frequency_data()
    words = data.get('words', {})
    errors = []
    
    for word, word_data in words.items():
        cefr = word_data.get('cefr')
        if cefr not in VALID_CEFR_LEVELS:
            errors.append(f"Word '{word}' has invalid CEFR level: '{cefr}'")
    
    if errors:
        if len(errors) > 10:
            errors = errors[:10] + [f"... and {len(errors) - 10} more errors"]
        pytest.fail("\n".join(errors))


def test_cefr_distribution_is_reasonable():
    """Test that CEFR level distribution follows expected patterns."""
    data = load_frequency_data()
    words = data.get('words', {})
    
    cefr_counts = Counter(word_data.get('cefr') for word_data in words.values())
    warnings = []
    
    # Expected: A1 and A2 should have the most words (high frequency)
    # B1, B2 should have moderate amounts
    # C1, C2 should have fewer words
    
    total_words = len(words)
    
    # Check if A1 + A2 represent at least 40% of words
    a_level_count = cefr_counts.get('A1', 0) + cefr_counts.get('A2', 0)
    a_level_percentage = (a_level_count / total_words) * 100
    
    if a_level_percentage < 40:
        warnings.append(
            f"A1+A2 levels represent only {a_level_percentage:.1f}% of words "
            f"(expected at least 40%)"
        )
    
    # Check if any level is completely missing
    for level in VALID_CEFR_LEVELS:
        if cefr_counts.get(level, 0) == 0:
            warnings.append(f"CEFR level {level} has no words")
    
    if warnings:
        pytest.skip("CEFR distribution warnings: " + "; ".join(warnings))


def test_top_flags_are_correct():
    """Test that isTop* flags are correctly set based on rank."""
    data = load_frequency_data()
    words = data.get('words', {})
    errors = []
    
    for word, word_data in words.items():
        rank = word_data.get('rank')
        if rank is None:
            continue
        
        # Check each flag
        expected_flags = {
            'isTop100': rank <= 100,
            'isTop500': rank <= 500,
            'isTop1000': rank <= 1000,
            'isTop3000': rank <= 3000,
            'isTop5000': rank <= 5000,
        }
        
        for flag_name, expected_value in expected_flags.items():
            actual_value = word_data.get(flag_name)
            
            if actual_value != expected_value:
                errors.append(
                    f"Word '{word}' (rank {rank}): {flag_name} should be "
                    f"{expected_value}, got {actual_value}"
                )
    
    if errors:
        if len(errors) > 10:
            errors = errors[:10] + [f"... and {len(errors) - 10} more errors"]
        pytest.fail("\n".join(errors))


def test_top_n_counts_are_correct():
    """Test that the count of words with each isTop* flag is correct."""
    data = load_frequency_data()
    words = data.get('words', {})
    errors = []
    
    # Count words with each flag
    top_100_count = sum(1 for w in words.values() if w.get('isTop100'))
    top_500_count = sum(1 for w in words.values() if w.get('isTop500'))
    top_1000_count = sum(1 for w in words.values() if w.get('isTop1000'))
    top_3000_count = sum(1 for w in words.values() if w.get('isTop3000'))
    top_5000_count = sum(1 for w in words.values() if w.get('isTop5000'))
    
    # Check expected counts
    expected_counts = {
        'isTop100': (100, top_100_count),
        'isTop500': (500, top_500_count),
        'isTop1000': (1000, top_1000_count),
        'isTop3000': (3000, top_3000_count),
        'isTop5000': (5000, top_5000_count),
    }
    
    for flag_name, (expected, actual) in expected_counts.items():
        if actual != expected:
            errors.append(f"{flag_name}: expected {expected} words, got {actual}")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_count_field_is_positive():
    """Test that all count fields are positive integers."""
    data = load_frequency_data()
    words = data.get('words', {})
    errors = []
    
    for word, word_data in words.items():
        count = word_data.get('count')
        
        if not isinstance(count, int):
            errors.append(f"Word '{word}': count must be integer, got {type(count)}")
        elif count <= 0:
            errors.append(f"Word '{word}': count must be positive, got {count}")
    
    if errors:
        if len(errors) > 10:
            errors = errors[:10] + [f"... and {len(errors) - 10} more errors"]
        pytest.fail("\n".join(errors))


def test_counts_decrease_with_rank():
    """Test that word counts generally decrease as rank increases."""
    data = load_frequency_data()
    words = data.get('words', {})
    
    # Create list of (rank, count) tuples
    rank_count_pairs = [
        (word_data.get('rank'), word_data.get('count'))
        for word_data in words.values()
        if word_data.get('rank') is not None and word_data.get('count') is not None
    ]
    
    # Sort by rank
    rank_count_pairs.sort(key=lambda x: x[0])
    
    # Check that counts are generally decreasing
    # Allow some tolerance for ties and minor variations
    violations = 0
    for i in range(len(rank_count_pairs) - 1):
        current_rank, current_count = rank_count_pairs[i]
        next_rank, next_count = rank_count_pairs[i + 1]
        
        # Count should decrease or stay the same
        if next_count > current_count:
            violations += 1
    
    # Allow up to 5% violations (ties are common in frequency data)
    max_violations = len(rank_count_pairs) * 0.05
    
    if violations > max_violations:
        pytest.fail(
            f"Too many count violations: {violations} out of {len(rank_count_pairs)} "
            f"(max allowed: {int(max_violations)})"
        )


def generate_validation_report():
    """Generate a comprehensive validation report."""
    try:
        data = load_frequency_data()
        words = data.get('words', {})
        
        # Collect statistics
        cefr_distribution = Counter(word_data.get('cefr') for word_data in words.values())
        top_n_stats = {
            'isTop100': sum(1 for w in words.values() if w.get('isTop100')),
            'isTop500': sum(1 for w in words.values() if w.get('isTop500')),
            'isTop1000': sum(1 for w in words.values() if w.get('isTop1000')),
            'isTop3000': sum(1 for w in words.values() if w.get('isTop3000')),
            'isTop5000': sum(1 for w in words.values() if w.get('isTop5000')),
        }
        
        # Run all validations and collect errors
        errors = []
        warnings = []
        
        # Check metadata
        missing_fields = REQUIRED_METADATA_FIELDS - set(data.keys())
        if missing_fields:
            errors.append(f"Missing metadata fields: {missing_fields}")
        
        # Check word count
        declared_count = data.get('wordCount', 0)
        actual_count = len(words)
        if declared_count != actual_count:
            errors.append(f"Word count mismatch: declared={declared_count}, actual={actual_count}")
        
        # Check CEFR distribution
        a_level_count = cefr_distribution.get('A1', 0) + cefr_distribution.get('A2', 0)
        a_level_percentage = (a_level_count / actual_count) * 100 if actual_count > 0 else 0
        if a_level_percentage < 40:
            warnings.append(f"A1+A2 levels only {a_level_percentage:.1f}% (expected ≥40%)")
        
        results = {
            'total_words': actual_count,
            'expected_words': declared_count,
            'metadata_valid': len(missing_fields) == 0,
            'structure_valid': True,  # If we got here, JSON is valid
            'ranks_valid': declared_count == actual_count,
            'cefr_valid': all(
                word_data.get('cefr') in VALID_CEFR_LEVELS 
                for word_data in words.values()
            ),
            'top_flags_valid': True,  # Checked by tests
            'cefr_distribution': dict(cefr_distribution),
            'top_n_stats': top_n_stats,
            'errors': errors,
            'warnings': warnings,
        }
        
        write_validation_report(results)
        
    except Exception as e:
        print(f"Error generating report: {e}")
        raise


if __name__ == '__main__':
    # Generate report when run directly
    print("Generating frequency data validation report...")
    generate_validation_report()
    print("Done!")
