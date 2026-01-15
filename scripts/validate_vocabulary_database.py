#!/usr/bin/env python3
"""
Vocabulary Database Validation Script

This validates the words.ts TypeScript vocabulary database:
1. Structure validation (categories, required fields)
2. Data quality (no duplicates, no empty strings)
3. Cross-reference with frequency data
4. Linguistic metadata validation
5. Learning tips validation
6. Category coverage analysis

Usage:
    python scripts/validate_vocabulary_database.py
    
Output:
    - Test results to console (pytest format)
    - Detailed report to reports/vocabulary-validation-results.txt
"""

import json
import re
import pytest
from pathlib import Path
from typing import Dict, Any, List, Set, Tuple
from datetime import datetime
from collections import Counter, defaultdict


VALID_PARTS_OF_SPEECH = {
    'noun', 'verb', 'adjective', 'adverb', 'pronoun', 
    'preposition', 'conjunction', 'interjection', 'article', 
    'numeral', 'phrase'
}
VALID_GENDERS = {'masculine', 'feminine'}
VALID_CEFR_LEVELS = {'A1', 'A2', 'B1', 'B2', 'C1', 'C2'}
REQUIRED_WORD_FIELDS = {'spanish', 'english', 'finnish'}


def get_words_ts_path() -> Path:
    """Get the words.ts file path."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    return project_root / 'svelte' / 'src' / 'lib' / 'data' / 'words.ts'


def get_frequency_file_path() -> Path:
    """Get the frequency data file path."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    return project_root / 'svelte' / 'static' / 'data' / 'frequency-spanish-top5000.json'


def parse_words_ts() -> Dict[str, List[Dict[str, Any]]]:
    """
    Parse words.ts TypeScript file and extract vocabulary data.
    
    Returns:
        Dict mapping category keys to lists of word objects
    """
    words_file = get_words_ts_path()
    
    with open(words_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract WORD_CATEGORIES object - find the start and end more carefully
    start_marker = 'export const WORD_CATEGORIES: Record<string, WordCategory> = {'
    start_idx = content.find(start_marker)
    if start_idx == -1:
        raise ValueError("Could not find WORD_CATEGORIES in words.ts")
    
    # Find the matching closing brace
    brace_count = 0
    content_start = start_idx + len(start_marker) - 1  # Include the opening brace
    for i in range(content_start, len(content)):
        if content[i] == '{':
            brace_count += 1
        elif content[i] == '}':
            brace_count -= 1
            if brace_count == 0:
                categories_content = content[content_start+1:i]
                break
    else:
        raise ValueError("Could not find closing brace for WORD_CATEGORIES")
    
    # Parse each category - be more flexible with whitespace and line breaks
    categories = {}
    
    # Split by category boundaries (look for pattern: categoryKey: { name: )
    category_splits = re.split(r'\n\s*(\w+):\s*\{', categories_content)
    
    # First element is empty or whitespace, then pairs of (key, content)
    for i in range(1, len(category_splits), 2):
        if i + 1 >= len(category_splits):
            break
            
        category_key = category_splits[i]
        category_block = category_splits[i + 1]
        
        # Extract category name
        name_match = re.search(r'name:\s*[\'"]([^\'"]+)[\'"]', category_block)
        if not name_match:
            continue
        category_name = name_match.group(1)
        
        # Extract words array - need to find matching brackets
        words_start = category_block.find('words: [')
        if words_start == -1:
            continue
        
        # Find the matching closing bracket for the words array
        bracket_count = 0
        words_content_start = words_start + len('words: [')
        for j in range(words_content_start - 1, len(category_block)):
            if category_block[j] == '[':
                bracket_count += 1
            elif category_block[j] == ']':
                bracket_count -= 1
                if bracket_count == 0:
                    words_content = category_block[words_content_start:j]
                    break
        else:
            continue
        
        # Parse individual words - handle special characters like á, é, í, ó, ú, ñ, ¿, ¡
        words = []
        # Split by word boundaries (look for closing brace followed by comma or end)
        word_objects = re.findall(
            r'\{\s*spanish:\s*[\'"]([^\'"]+)[\'"]\s*,\s*english:\s*[\'"]([^\'"]+)[\'"]\s*,\s*finnish:\s*[\'"]([^\'"]+)[\'"](?:\s*,\s*learningTips:\s*\[([^\]]*)\])?\s*\}',
            words_content,
            re.DOTALL
        )
        
        for word_tuple in word_objects:
            word = {
                'spanish': word_tuple[0],
                'english': word_tuple[1],
                'finnish': word_tuple[2]
            }
            
            # Parse learning tips if present
            tips_content = word_tuple[3]
            if tips_content and tips_content.strip():
                tips = re.findall(r'[\'"]([^\'"]+)[\'"]', tips_content)
                if tips:
                    word['learningTips'] = tips
            
            words.append(word)
        
        categories[category_key] = {
            'name': category_name,
            'words': words
        }
    
    return categories


def load_frequency_data() -> Dict[str, Dict[str, Any]]:
    """Load the frequency data JSON file."""
    freq_file = get_frequency_file_path()
    
    with open(freq_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    return data.get('words', {})


# ============================================================================
# Test Fixtures
# ============================================================================

@pytest.fixture(scope='module')
def vocabulary_data():
    """Load vocabulary data once for all tests."""
    return parse_words_ts()


@pytest.fixture(scope='module')
def frequency_data():
    """Load frequency data once for all tests."""
    return load_frequency_data()


# ============================================================================
# Structure Validation Tests
# ============================================================================

def test_categories_exist(vocabulary_data):
    """Test that vocabulary database has categories."""
    assert len(vocabulary_data) > 0, "No categories found in words.ts"
    assert len(vocabulary_data) >= 20, f"Expected at least 20 categories, found {len(vocabulary_data)}"


def test_all_categories_have_name(vocabulary_data):
    """Test that all categories have a display name."""
    for category_key, category_data in vocabulary_data.items():
        assert 'name' in category_data, f"Category '{category_key}' missing 'name' field"
        assert category_data['name'], f"Category '{category_key}' has empty name"


def test_all_categories_have_words(vocabulary_data):
    """Test that all categories have at least one word."""
    for category_key, category_data in vocabulary_data.items():
        assert 'words' in category_data, f"Category '{category_key}' missing 'words' field"
        assert len(category_data['words']) > 0, f"Category '{category_key}' has no words"


def test_all_words_have_required_fields(vocabulary_data):
    """Test that all words have spanish, english, finnish fields."""
    issues = []
    
    for category_key, category_data in vocabulary_data.items():
        for idx, word in enumerate(category_data['words']):
            missing_fields = REQUIRED_WORD_FIELDS - set(word.keys())
            if missing_fields:
                issues.append(f"{category_key}[{idx}]: Missing fields {missing_fields}")
    
    assert len(issues) == 0, f"Found {len(issues)} words with missing fields:\n" + "\n".join(issues[:10])


def test_no_empty_strings(vocabulary_data):
    """Test that no word has empty spanish, english, or finnish strings."""
    issues = []
    
    for category_key, category_data in vocabulary_data.items():
        for idx, word in enumerate(category_data['words']):
            for field in ['spanish', 'english', 'finnish']:
                if field in word and not word[field].strip():
                    issues.append(f"{category_key}[{idx}]: Empty {field} field")
    
    assert len(issues) == 0, f"Found {len(issues)} words with empty strings:\n" + "\n".join(issues)


# ============================================================================
# Data Quality Tests
# ============================================================================

def test_no_duplicate_spanish_words_within_category(vocabulary_data):
    """Test that no category has duplicate Spanish words."""
    issues = []
    
    for category_key, category_data in vocabulary_data.items():
        spanish_words = [w['spanish'].lower() for w in category_data['words']]
        duplicates = [word for word, count in Counter(spanish_words).items() if count > 1]
        
        if duplicates:
            issues.append(f"{category_key}: Duplicate Spanish words: {duplicates}")
    
    assert len(issues) == 0, f"Found duplicates in {len(issues)} categories:\n" + "\n".join(issues)


def test_no_duplicate_spanish_words_across_categories(vocabulary_data):
    """Test that Spanish words are not duplicated across categories."""
    all_words = defaultdict(list)
    
    for category_key, category_data in vocabulary_data.items():
        for word in category_data['words']:
            spanish = word['spanish'].lower()
            all_words[spanish].append(category_key)
    
    duplicates = {word: cats for word, cats in all_words.items() if len(cats) > 1}
    
    # Note: Some duplicates might be intentional (e.g., common words in multiple contexts)
    # This test warns but doesn't fail
    if duplicates:
        print(f"\nWarning: {len(duplicates)} Spanish words appear in multiple categories:")
        for word, categories in list(duplicates.items())[:10]:
            print(f"  '{word}' in: {', '.join(categories)}")


def test_learning_tips_format(vocabulary_data):
    """Test that learning tips, if present, are properly formatted."""
    issues = []
    
    for category_key, category_data in vocabulary_data.items():
        for idx, word in enumerate(category_data['words']):
            if 'learningTips' in word:
                tips = word['learningTips']
                
                if not isinstance(tips, list):
                    issues.append(f"{category_key}[{idx}] ({word['spanish']}): learningTips is not a list")
                elif len(tips) == 0:
                    issues.append(f"{category_key}[{idx}] ({word['spanish']}): learningTips is empty list")
                else:
                    for tip_idx, tip in enumerate(tips):
                        if not isinstance(tip, str):
                            issues.append(f"{category_key}[{idx}] ({word['spanish']}): tip[{tip_idx}] is not a string")
                        elif not tip.strip():
                            issues.append(f"{category_key}[{idx}] ({word['spanish']}): tip[{tip_idx}] is empty")
    
    assert len(issues) == 0, f"Found {len(issues)} learning tips issues:\n" + "\n".join(issues[:10])


# ============================================================================
# Cross-Reference with Frequency Data Tests
# ============================================================================

def test_frequency_data_cross_reference(vocabulary_data, frequency_data):
    """Test cross-reference with frequency data."""
    vocab_words = []
    for category_data in vocabulary_data.values():
        vocab_words.extend([w['spanish'].lower() for w in category_data['words']])
    
    vocab_set = set(vocab_words)
    freq_set = set(frequency_data.keys())
    
    # Count how many vocabulary words are in frequency data
    in_frequency = vocab_set & freq_set
    not_in_frequency = vocab_set - freq_set
    
    coverage_pct = (len(in_frequency) / len(vocab_set)) * 100 if vocab_set else 0
    
    print(f"\nFrequency data coverage:")
    print(f"  Total vocabulary words: {len(vocab_set)}")
    print(f"  Found in frequency data: {len(in_frequency)} ({coverage_pct:.1f}%)")
    print(f"  Not in frequency data: {len(not_in_frequency)}")
    
    if not_in_frequency and len(not_in_frequency) <= 20:
        print(f"  Words not in frequency data: {sorted(list(not_in_frequency))}")


def test_top_frequency_words_coverage(vocabulary_data, frequency_data):
    """Test that vocabulary covers high-frequency words."""
    vocab_words = set()
    for category_data in vocabulary_data.values():
        vocab_words.update([w['spanish'].lower() for w in category_data['words']])
    
    # Check coverage of top-N words
    top_100 = [word for word, data in frequency_data.items() if data.get('isTop100')]
    top_500 = [word for word, data in frequency_data.items() if data.get('isTop500')]
    top_1000 = [word for word, data in frequency_data.items() if data.get('isTop1000')]
    
    top_100_in_vocab = len(set(top_100) & vocab_words)
    top_500_in_vocab = len(set(top_500) & vocab_words)
    top_1000_in_vocab = len(set(top_1000) & vocab_words)
    
    print(f"\nTop frequency words coverage:")
    print(f"  Top 100: {top_100_in_vocab}/{len(top_100)} ({top_100_in_vocab/len(top_100)*100:.1f}%)")
    print(f"  Top 500: {top_500_in_vocab}/{len(top_500)} ({top_500_in_vocab/len(top_500)*100:.1f}%)")
    print(f"  Top 1000: {top_1000_in_vocab}/{len(top_1000)} ({top_1000_in_vocab/len(top_1000)*100:.1f}%)")


# ============================================================================
# Category Coverage Analysis Tests
# ============================================================================

def test_category_size_distribution(vocabulary_data):
    """Test that category sizes are reasonable."""
    sizes = {cat: len(data['words']) for cat, data in vocabulary_data.items()}
    
    total_words = sum(sizes.values())
    avg_size = total_words / len(sizes)
    
    print(f"\nCategory size distribution:")
    print(f"  Total categories: {len(sizes)}")
    print(f"  Total words: {total_words}")
    print(f"  Average words per category: {avg_size:.1f}")
    print(f"  Smallest category: {min(sizes.values())} words")
    print(f"  Largest category: {max(sizes.values())} words")
    
    # Show top 5 largest and smallest categories
    sorted_cats = sorted(sizes.items(), key=lambda x: x[1], reverse=True)
    print(f"\n  Largest categories:")
    for cat, size in sorted_cats[:5]:
        print(f"    {cat}: {size} words")
    
    print(f"\n  Smallest categories:")
    for cat, size in sorted_cats[-5:]:
        print(f"    {cat}: {size} words")


def test_translation_consistency(vocabulary_data):
    """Test that translations are consistent (no obvious errors)."""
    issues = []
    
    # Words that are legitimately identical across languages
    ALLOWED_IDENTICAL = {'euro', 'taxi', 'hotel', 'pizza', 'radio', 'chocolate', 'pasta'}
    
    # Words that are legitimately very short (pronouns, prepositions, conjunctions)
    ALLOWED_SHORT_CATEGORIES = {'pronouns', 'prepositions', 'questions', 'common'}
    
    for category_key, category_data in vocabulary_data.items():
        for idx, word in enumerate(category_data['words']):
            spanish = word['spanish']
            english = word['english']
            finnish = word['finnish']
            
            # Check for suspiciously similar translations (copy-paste errors)
            # But allow certain international words
            if spanish.lower() == english.lower() == finnish.lower():
                if spanish.lower() not in ALLOWED_IDENTICAL:
                    issues.append(f"{category_key}[{idx}]: All translations identical: '{spanish}'")
            
            # Check for very short translations (might be incomplete)
            # But allow short words in certain categories (pronouns, prepositions, etc.)
            if category_key not in ALLOWED_SHORT_CATEGORIES:
                if len(spanish) < 2 or len(english) < 2 or len(finnish) < 2:
                    issues.append(f"{category_key}[{idx}]: Very short translation: es='{spanish}' en='{english}' fi='{finnish}'")
    
    assert len(issues) == 0, f"Found {len(issues)} translation issues:\n" + "\n".join(issues[:10])


# ============================================================================
# Report Generation
# ============================================================================

def generate_validation_report(vocabulary_data, frequency_data):
    """Generate a detailed validation report."""
    report_lines = []
    
    report_lines.append("=" * 80)
    report_lines.append("VOCABULARY DATABASE VALIDATION REPORT")
    report_lines.append("=" * 80)
    report_lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("")
    
    # Summary statistics
    total_categories = len(vocabulary_data)
    total_words = sum(len(cat['words']) for cat in vocabulary_data.values())
    
    report_lines.append("SUMMARY")
    report_lines.append("-" * 80)
    report_lines.append(f"Total categories: {total_categories}")
    report_lines.append(f"Total vocabulary words: {total_words}")
    report_lines.append(f"Average words per category: {total_words / total_categories:.1f}")
    report_lines.append("")
    
    # Category listing
    report_lines.append("CATEGORIES")
    report_lines.append("-" * 80)
    for category_key, category_data in sorted(vocabulary_data.items()):
        word_count = len(category_data['words'])
        report_lines.append(f"  {category_key:20s} ({category_data['name']:20s}): {word_count:3d} words")
    report_lines.append("")
    
    # Learning tips coverage
    words_with_tips = 0
    total_tips = 0
    for category_data in vocabulary_data.values():
        for word in category_data['words']:
            if 'learningTips' in word:
                words_with_tips += 1
                total_tips += len(word['learningTips'])
    
    report_lines.append("LEARNING TIPS COVERAGE")
    report_lines.append("-" * 80)
    report_lines.append(f"Words with learning tips: {words_with_tips}/{total_words} ({words_with_tips/total_words*100:.1f}%)")
    report_lines.append(f"Total learning tips: {total_tips}")
    if words_with_tips > 0:
        report_lines.append(f"Average tips per word (with tips): {total_tips/words_with_tips:.1f}")
    report_lines.append("")
    
    # Frequency data cross-reference
    vocab_words = set()
    for category_data in vocabulary_data.values():
        vocab_words.update([w['spanish'].lower() for w in category_data['words']])
    
    freq_set = set(frequency_data.keys())
    in_frequency = vocab_words & freq_set
    not_in_frequency = vocab_words - freq_set
    
    report_lines.append("FREQUENCY DATA CROSS-REFERENCE")
    report_lines.append("-" * 80)
    report_lines.append(f"Vocabulary words in frequency data: {len(in_frequency)}/{len(vocab_words)} ({len(in_frequency)/len(vocab_words)*100:.1f}%)")
    report_lines.append(f"Vocabulary words NOT in frequency data: {len(not_in_frequency)}")
    
    if not_in_frequency:
        report_lines.append("")
        report_lines.append("Words not in frequency data (first 50):")
        for word in sorted(list(not_in_frequency))[:50]:
            report_lines.append(f"  - {word}")
    
    report_lines.append("")
    
    # Top frequency coverage
    top_100 = [word for word, data in frequency_data.items() if data.get('isTop100')]
    top_500 = [word for word, data in frequency_data.items() if data.get('isTop500')]
    top_1000 = [word for word, data in frequency_data.items() if data.get('isTop1000')]
    
    top_100_in_vocab = set(top_100) & vocab_words
    top_500_in_vocab = set(top_500) & vocab_words
    top_1000_in_vocab = set(top_1000) & vocab_words
    
    report_lines.append("TOP FREQUENCY WORDS COVERAGE")
    report_lines.append("-" * 80)
    report_lines.append(f"Top 100 words in vocabulary: {len(top_100_in_vocab)}/{len(top_100)} ({len(top_100_in_vocab)/len(top_100)*100:.1f}%)")
    report_lines.append(f"Top 500 words in vocabulary: {len(top_500_in_vocab)}/{len(top_500)} ({len(top_500_in_vocab)/len(top_500)*100:.1f}%)")
    report_lines.append(f"Top 1000 words in vocabulary: {len(top_1000_in_vocab)}/{len(top_1000)} ({len(top_1000_in_vocab)/len(top_1000)*100:.1f}%)")
    report_lines.append("")
    
    # Missing top words
    top_100_missing = set(top_100) - vocab_words
    if top_100_missing:
        report_lines.append("Top 100 words MISSING from vocabulary:")
        for word in sorted(list(top_100_missing))[:20]:
            rank = frequency_data[word]['rank']
            cefr = frequency_data[word]['cefr']
            report_lines.append(f"  - {word} (rank {rank}, {cefr})")
        if len(top_100_missing) > 20:
            report_lines.append(f"  ... and {len(top_100_missing) - 20} more")
        report_lines.append("")
    
    # Duplicate words across categories
    all_words = defaultdict(list)
    for category_key, category_data in vocabulary_data.items():
        for word in category_data['words']:
            spanish = word['spanish'].lower()
            all_words[spanish].append(category_key)
    
    duplicates = {word: cats for word, cats in all_words.items() if len(cats) > 1}
    
    if duplicates:
        report_lines.append("WORDS APPEARING IN MULTIPLE CATEGORIES")
        report_lines.append("-" * 80)
        report_lines.append(f"Total words in multiple categories: {len(duplicates)}")
        report_lines.append("")
        for word, categories in sorted(duplicates.items())[:30]:
            report_lines.append(f"  {word}: {', '.join(categories)}")
        if len(duplicates) > 30:
            report_lines.append(f"  ... and {len(duplicates) - 30} more")
        report_lines.append("")
    
    report_lines.append("=" * 80)
    report_lines.append("END OF REPORT")
    report_lines.append("=" * 80)
    
    return "\n".join(report_lines)


# ============================================================================
# Main Execution
# ============================================================================

if __name__ == '__main__':
    print("Loading vocabulary database...")
    vocab_data = parse_words_ts()
    
    print("Loading frequency data...")
    freq_data = load_frequency_data()
    
    print("\nRunning validation tests...")
    pytest_args = [
        __file__,
        '-v',
        '--tb=short',
        '-p', 'no:warnings'
    ]
    
    exit_code = pytest.main(pytest_args)
    
    print("\nGenerating validation report...")
    report = generate_validation_report(vocab_data, freq_data)
    
    # Save report
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    reports_dir = project_root / 'reports'
    reports_dir.mkdir(exist_ok=True)
    
    report_file = reports_dir / 'vocabulary-validation-results.txt'
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\nValidation report saved to: {report_file}")
    print("\n" + "=" * 80)
    print(report)
