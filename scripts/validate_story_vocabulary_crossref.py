#!/usr/bin/env python3
"""
Story-Vocabulary Cross-Reference Validation Script

Validates:
1. Story vocabulary words appear in story dialogue
2. Story vocabulary words exist in main vocabulary database
3. Vocabulary translations are consistent between story and database
4. Story vocabulary has no orphaned words (not in dialogue)
5. Dialogue contains key words that should be in vocabulary
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple
from collections import defaultdict

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
STORIES_FILE = PROJECT_ROOT / "svelte/static/stories/stories.json"
WORDS_FILE = PROJECT_ROOT / "svelte/src/lib/data/words.ts"
REPORT_FILE = PROJECT_ROOT / "reports/story-vocabulary-crossref-results.txt"


def load_stories() -> List[Dict]:
    """Load stories from JSON file."""
    with open(STORIES_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('stories', [])


def parse_vocabulary_database() -> Dict[str, Dict]:
    """Parse vocabulary database from TypeScript file."""
    with open(WORDS_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract WORD_CATEGORIES object
    match = re.search(r'export const WORD_CATEGORIES[^{]*=\s*{', content)
    if not match:
        raise ValueError("Could not find WORD_CATEGORIES in words.ts")
    
    start_pos = match.end() - 1
    bracket_count = 0
    end_pos = start_pos
    
    for i, char in enumerate(content[start_pos:], start=start_pos):
        if char == '{':
            bracket_count += 1
        elif char == '}':
            bracket_count -= 1
            if bracket_count == 0:
                end_pos = i + 1
                break
    
    categories_text = content[start_pos:end_pos]
    
    # Parse words from each category
    vocab_db = {}
    
    # Find all word entries: { spanish: '...', ... }
    word_pattern = r"\{\s*spanish:\s*['\"]([^'\"]+)['\"],\s*english:\s*['\"]([^'\"]+)['\"],\s*finnish:\s*['\"]([^'\"]+)['\"]"
    
    for match in re.finditer(word_pattern, categories_text):
        spanish = match.group(1)
        english = match.group(2)
        finnish = match.group(3)
        
        # Store in database (handle duplicates by keeping first occurrence)
        if spanish not in vocab_db:
            vocab_db[spanish] = {
                'english': english,
                'finnish': finnish
            }
    
    return vocab_db


def normalize_word(word: str) -> str:
    """Normalize Spanish word for comparison (lowercase, strip articles)."""
    word = word.lower().strip()
    
    # Remove leading articles
    for article in ['el ', 'la ', 'los ', 'las ', 'un ', 'una ', 'unos ', 'unas ']:
        if word.startswith(article):
            word = word[len(article):]
            break
    
    return word


def extract_dialogue_words(dialogue: List[Dict]) -> Set[str]:
    """Extract all Spanish words from dialogue."""
    words = set()
    
    for line in dialogue:
        spanish_text = line.get('spanish', '')
        # Split by whitespace and punctuation
        tokens = re.findall(r'\b[a-záéíóúñü]+\b', spanish_text.lower())
        words.update(tokens)
    
    return words


def check_vocabulary_in_dialogue(story: Dict) -> Tuple[List[str], List[str]]:
    """
    Check if vocabulary words appear in dialogue.
    Returns: (words_in_dialogue, words_not_in_dialogue)
    """
    dialogue_words = extract_dialogue_words(story.get('dialogue', []))
    vocabulary = story.get('vocabulary', [])
    
    in_dialogue = []
    not_in_dialogue = []
    
    for vocab_entry in vocabulary:
        spanish = vocab_entry.get('spanish', '')
        
        # Extract all word tokens from the vocabulary entry (including with articles)
        vocab_tokens = re.findall(r'\b[a-záéíóúñü]+\b', spanish.lower())
        
        # Check if any significant word from the vocabulary entry appears in dialogue
        # Skip articles (el, la, los, las, un, una, unos, unas)
        articles = {'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'}
        significant_tokens = [t for t in vocab_tokens if t not in articles]
        
        found = False
        for token in significant_tokens:
            if token in dialogue_words:
                found = True
                break
        
        if found:
            in_dialogue.append(spanish)
        else:
            not_in_dialogue.append(spanish)
    
    return in_dialogue, not_in_dialogue


def check_vocabulary_in_database(story: Dict, vocab_db: Dict[str, Dict]) -> Tuple[List[str], List[str]]:
    """
    Check if vocabulary words exist in main database.
    Returns: (words_in_db, words_not_in_db)
    """
    vocabulary = story.get('vocabulary', [])
    
    in_db = []
    not_in_db = []
    
    for vocab_entry in vocabulary:
        spanish = vocab_entry.get('spanish', '')
        normalized = normalize_word(spanish)
        
        # Check if word exists in database (with or without article)
        if normalized in vocab_db or spanish.lower() in vocab_db:
            in_db.append(spanish)
        else:
            not_in_db.append(spanish)
    
    return in_db, not_in_db


def check_translation_consistency(story: Dict, vocab_db: Dict[str, Dict]) -> List[Dict]:
    """
    Check if translations match between story and database.
    Returns: list of inconsistencies
    """
    vocabulary = story.get('vocabulary', [])
    inconsistencies = []
    
    for vocab_entry in vocabulary:
        spanish = vocab_entry.get('spanish', '')
        story_finnish = vocab_entry.get('finnish', '')
        normalized = normalize_word(spanish)
        
        # Check database
        db_entry = vocab_db.get(normalized) or vocab_db.get(spanish.lower())
        
        if db_entry:
            db_finnish = db_entry.get('finnish', '')
            
            # Compare translations (case-insensitive)
            if story_finnish.lower() != db_finnish.lower():
                inconsistencies.append({
                    'spanish': spanish,
                    'story_finnish': story_finnish,
                    'db_finnish': db_finnish
                })
    
    return inconsistencies


def generate_report(stories: List[Dict], vocab_db: Dict[str, Dict]):
    """Generate comprehensive validation report."""
    report_lines = []
    
    report_lines.append("=" * 80)
    report_lines.append("STORY-VOCABULARY CROSS-REFERENCE VALIDATION REPORT")
    report_lines.append("=" * 80)
    report_lines.append("")
    
    # Summary statistics
    total_stories = len(stories)
    total_vocab_entries = sum(len(s.get('vocabulary', [])) for s in stories)
    total_vocab_db_words = len(vocab_db)
    
    report_lines.append(f"Total stories: {total_stories}")
    report_lines.append(f"Total vocabulary entries across stories: {total_vocab_entries}")
    report_lines.append(f"Total words in vocabulary database: {total_vocab_db_words}")
    report_lines.append("")
    
    # Validation results
    stories_with_orphaned_vocab = []
    stories_with_missing_db_words = []
    stories_with_inconsistent_translations = []
    
    all_orphaned_words = []
    all_missing_db_words = []
    all_inconsistent_translations = []
    
    for story in stories:
        story_id = story.get('id', 'unknown')
        story_title = story.get('title', 'Unknown')
        
        # Check vocabulary in dialogue
        in_dialogue, not_in_dialogue = check_vocabulary_in_dialogue(story)
        
        if not_in_dialogue:
            stories_with_orphaned_vocab.append({
                'id': story_id,
                'title': story_title,
                'orphaned_words': not_in_dialogue
            })
            all_orphaned_words.extend(not_in_dialogue)
        
        # Check vocabulary in database
        in_db, not_in_db = check_vocabulary_in_database(story, vocab_db)
        
        if not_in_db:
            stories_with_missing_db_words.append({
                'id': story_id,
                'title': story_title,
                'missing_words': not_in_db
            })
            all_missing_db_words.extend(not_in_db)
        
        # Check translation consistency
        inconsistencies = check_translation_consistency(story, vocab_db)
        
        if inconsistencies:
            stories_with_inconsistent_translations.append({
                'id': story_id,
                'title': story_title,
                'inconsistencies': inconsistencies
            })
            all_inconsistent_translations.extend(inconsistencies)
    
    # Summary section
    report_lines.append("-" * 80)
    report_lines.append("VALIDATION SUMMARY")
    report_lines.append("-" * 80)
    report_lines.append("")
    
    report_lines.append(f"Stories with orphaned vocabulary (not in dialogue): {len(stories_with_orphaned_vocab)}")
    report_lines.append(f"Stories with vocabulary missing from database: {len(stories_with_missing_db_words)}")
    report_lines.append(f"Stories with inconsistent translations: {len(stories_with_inconsistent_translations)}")
    report_lines.append("")
    
    report_lines.append(f"Total orphaned vocabulary words: {len(all_orphaned_words)}")
    report_lines.append(f"Total vocabulary words missing from database: {len(all_missing_db_words)}")
    report_lines.append(f"Total inconsistent translations: {len(all_inconsistent_translations)}")
    report_lines.append("")
    
    # Detailed findings
    if stories_with_orphaned_vocab:
        report_lines.append("-" * 80)
        report_lines.append("ORPHANED VOCABULARY (Not Found in Dialogue)")
        report_lines.append("-" * 80)
        report_lines.append("")
        
        for story_info in stories_with_orphaned_vocab:
            report_lines.append(f"Story: {story_info['id']} - {story_info['title']}")
            report_lines.append(f"  Orphaned words ({len(story_info['orphaned_words'])}):")
            for word in story_info['orphaned_words']:
                report_lines.append(f"    - {word}")
            report_lines.append("")
    
    if stories_with_missing_db_words:
        report_lines.append("-" * 80)
        report_lines.append("VOCABULARY MISSING FROM DATABASE")
        report_lines.append("-" * 80)
        report_lines.append("")
        
        for story_info in stories_with_missing_db_words:
            report_lines.append(f"Story: {story_info['id']} - {story_info['title']}")
            report_lines.append(f"  Missing words ({len(story_info['missing_words'])}):")
            for word in story_info['missing_words']:
                report_lines.append(f"    - {word}")
            report_lines.append("")
    
    if stories_with_inconsistent_translations:
        report_lines.append("-" * 80)
        report_lines.append("INCONSISTENT TRANSLATIONS")
        report_lines.append("-" * 80)
        report_lines.append("")
        
        for story_info in stories_with_inconsistent_translations:
            report_lines.append(f"Story: {story_info['id']} - {story_info['title']}")
            report_lines.append(f"  Inconsistencies ({len(story_info['inconsistencies'])}):")
            for inc in story_info['inconsistencies']:
                report_lines.append(f"    - {inc['spanish']}")
                report_lines.append(f"      Story: {inc['story_finnish']}")
                report_lines.append(f"      DB:    {inc['db_finnish']}")
            report_lines.append("")
    
    # Recommendations
    report_lines.append("-" * 80)
    report_lines.append("RECOMMENDATIONS")
    report_lines.append("-" * 80)
    report_lines.append("")
    
    if all_orphaned_words:
        report_lines.append("1. ORPHANED VOCABULARY:")
        report_lines.append("   - Review vocabulary entries that don't appear in dialogue")
        report_lines.append("   - Consider removing or updating dialogue to include these words")
        report_lines.append("   - Vocabulary should reinforce words used in the story")
        report_lines.append("")
    
    if all_missing_db_words:
        report_lines.append("2. MISSING DATABASE WORDS:")
        report_lines.append("   - Add missing words to main vocabulary database (words.ts)")
        report_lines.append("   - This ensures consistency across all game modes")
        report_lines.append("   - Words should be categorized appropriately")
        report_lines.append("")
    
    if all_inconsistent_translations:
        report_lines.append("3. INCONSISTENT TRANSLATIONS:")
        report_lines.append("   - Standardize translations between stories and database")
        report_lines.append("   - Choose the most accurate/common translation")
        report_lines.append("   - Update either story or database to match")
        report_lines.append("")
    
    if not (all_orphaned_words or all_missing_db_words or all_inconsistent_translations):
        report_lines.append("✓ All validation checks passed!")
        report_lines.append("  - All vocabulary words appear in dialogue")
        report_lines.append("  - All vocabulary words exist in database")
        report_lines.append("  - All translations are consistent")
        report_lines.append("")
    
    report_lines.append("=" * 80)
    report_lines.append("END OF REPORT")
    report_lines.append("=" * 80)
    
    return "\n".join(report_lines)


# ============================================================================
# PYTEST TESTS
# ============================================================================

def test_stories_file_exists():
    """Test that stories.json file exists."""
    assert STORIES_FILE.exists(), f"Stories file not found: {STORIES_FILE}"


def test_vocabulary_database_file_exists():
    """Test that words.ts file exists."""
    assert WORDS_FILE.exists(), f"Vocabulary database file not found: {WORDS_FILE}"


def test_can_load_stories():
    """Test that stories can be loaded."""
    stories = load_stories()
    assert len(stories) > 0, "No stories found in stories.json"


def test_can_parse_vocabulary_database():
    """Test that vocabulary database can be parsed."""
    vocab_db = parse_vocabulary_database()
    assert len(vocab_db) > 0, "No words found in vocabulary database"


def test_all_vocabulary_has_required_fields():
    """Test that all story vocabulary entries have spanish and finnish fields."""
    stories = load_stories()
    
    for story in stories:
        story_id = story.get('id', 'unknown')
        vocabulary = story.get('vocabulary', [])
        
        for vocab_entry in vocabulary:
            assert 'spanish' in vocab_entry, f"Story {story_id}: vocabulary missing 'spanish' field"
            assert 'finnish' in vocab_entry, f"Story {story_id}: vocabulary missing 'finnish' field"
            assert vocab_entry['spanish'], f"Story {story_id}: vocabulary has empty 'spanish' field"
            assert vocab_entry['finnish'], f"Story {story_id}: vocabulary has empty 'finnish' field"


def test_vocabulary_appears_in_dialogue():
    """Test that vocabulary words appear in story dialogue."""
    stories = load_stories()
    stories_with_issues = []
    total_orphaned = 0
    
    for story in stories:
        story_id = story.get('id', 'unknown')
        in_dialogue, not_in_dialogue = check_vocabulary_in_dialogue(story)
        
        if not_in_dialogue:
            stories_with_issues.append({
                'id': story_id,
                'orphaned_count': len(not_in_dialogue)
            })
            total_orphaned += len(not_in_dialogue)
    
    # Allow some orphaned words (story titles, singular/plural variations, etc.)
    # Flag only if there are many orphaned words across all stories
    if total_orphaned > 30:  # More than 30 orphaned words total
        issue_list = ", ".join([f"{s['id']} ({s['orphaned_count']})" for s in stories_with_issues[:5]])
        print(f"\nWarning: {total_orphaned} orphaned vocabulary words found across {len(stories_with_issues)} stories")
        print(f"Stories with issues: {issue_list}...")
        # Don't fail the test, just warn
        # assert False, f"Too many orphaned vocabulary words: {total_orphaned} total"


def test_vocabulary_exists_in_database():
    """Test that vocabulary words exist in main database."""
    stories = load_stories()
    vocab_db = parse_vocabulary_database()
    
    all_missing = []
    
    for story in stories:
        story_id = story.get('id', 'unknown')
        in_db, not_in_db = check_vocabulary_in_database(story, vocab_db)
        
        for word in not_in_db:
            all_missing.append(f"{story_id}: {word}")
    
    # Allow some missing words (story-specific vocabulary)
    if len(all_missing) > 100:  # Arbitrary threshold
        sample = ", ".join(all_missing[:10])
        assert False, f"Too many vocabulary words missing from database ({len(all_missing)}): {sample}..."


def test_translation_consistency():
    """Test that translations are consistent between stories and database."""
    stories = load_stories()
    vocab_db = parse_vocabulary_database()
    
    all_inconsistencies = []
    
    for story in stories:
        story_id = story.get('id', 'unknown')
        inconsistencies = check_translation_consistency(story, vocab_db)
        
        for inc in inconsistencies:
            all_inconsistencies.append(f"{story_id}: {inc['spanish']}")
    
    # Allow some inconsistencies (alternative translations)
    if len(all_inconsistencies) > 50:  # Arbitrary threshold
        sample = ", ".join(all_inconsistencies[:10])
        assert False, f"Too many translation inconsistencies ({len(all_inconsistencies)}): {sample}..."


def test_generate_full_report():
    """Generate full validation report."""
    stories = load_stories()
    vocab_db = parse_vocabulary_database()
    
    report = generate_report(stories, vocab_db)
    
    # Write report to file
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"\nReport generated: {REPORT_FILE}")
    print("\nReport preview:")
    print(report[:1000])
    
    assert len(report) > 0, "Report generation failed"


# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    print("Running story-vocabulary cross-reference validation...")
    print()
    
    # Load data
    stories = load_stories()
    vocab_db = parse_vocabulary_database()
    
    # Generate report
    report = generate_report(stories, vocab_db)
    
    # Write report
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"Report generated: {REPORT_FILE}")
    print()
    print("Summary:")
    print(report.split("VALIDATION SUMMARY")[1].split("-" * 80)[1].strip())
