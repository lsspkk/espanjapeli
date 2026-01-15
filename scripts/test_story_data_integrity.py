#!/usr/bin/env python3
"""
Test script to verify all story JSON files have proper level field and are properly formatted.

This validates:
1. All story files have the required 'level' field with valid CEFR level
2. Manifest is in sync with story files
3. Story files match the latest V4 data model
4. V3 legacy fields detection
5. Vocabulary, dialogue, and question structure validation

Usage:
    python scripts/test_story_data_integrity.py
    
Output:
    - Test results to console
    - Detailed report to reports/story-validation-results.txt
"""

import json
import pytest
from pathlib import Path
from typing import List, Dict, Any, Set
from datetime import datetime


VALID_LEVELS = {'A1', 'A2', 'B1', 'B2'}
VALID_CATEGORIES = {'cafe', 'culture', 'education', 'environment', 'everyday', 'family', 'food', 'health', 'home', 'housing', 'nature', 'shopping', 'social', 'technology', 'travel', 'work'}
LEGACY_DIFFICULTY_VALUES = {'beginner', 'intermediate', 'advanced', 'absolute-beginner'}


def get_stories_dir() -> Path:
    """Get the stories directory path."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    return project_root / 'svelte' / 'static' / 'stories'


def load_manifest() -> Dict[str, Any]:
    """Load the manifest.json file."""
    stories_dir = get_stories_dir()
    manifest_file = stories_dir / 'manifest.json'
    
    with open(manifest_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_story_file(level: str, story_id: str) -> Dict[str, Any]:
    """Load a story JSON file."""
    stories_dir = get_stories_dir()
    level_folder = level.lower()
    story_file = stories_dir / level_folder / f"{story_id}.json"
    
    with open(story_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def test_all_stories_have_level_field():
    """Test that all story files have a valid level field."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level')
        
        if not level:
            errors.append(f"Story {story_id} in manifest is missing 'level' field")
            continue
            
        if level not in VALID_LEVELS:
            errors.append(f"Story {story_id} has invalid level '{level}' in manifest. Must be one of: {VALID_LEVELS}")
            continue
        
        # Load the actual story file
        try:
            story_data = load_story_file(level, story_id)
        except FileNotFoundError:
            errors.append(f"Story file not found for {story_id} at level {level}")
            continue
        except json.JSONDecodeError as e:
            errors.append(f"Story {story_id} has invalid JSON: {e}")
            continue
        
        # Check level field in story file
        if 'level' not in story_data:
            errors.append(f"Story {story_id} file is missing 'level' field")
        elif story_data['level'] != level:
            errors.append(f"Story {story_id} level mismatch: manifest={level}, file={story_data['level']}")
        elif story_data['level'] not in VALID_LEVELS:
            errors.append(f"Story {story_id} file has invalid level '{story_data['level']}'")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_all_stories_have_required_fields():
    """Test that all story files have required V4 fields."""
    manifest = load_manifest()
    errors = []
    
    required_fields = [
        'id', 'title', 'titleSpanish', 'description', 
        'level', 'category', 'icon', 
        'dialogue', 'vocabulary', 'questions'
    ]
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception as e:
            errors.append(f"Cannot load story {story_id}: {e}")
            continue
        
        # Check required fields
        for field in required_fields:
            if field not in story_data:
                errors.append(f"Story {story_id} is missing required field '{field}'")
        
        # Check field types
        if 'dialogue' in story_data and not isinstance(story_data['dialogue'], list):
            errors.append(f"Story {story_id} 'dialogue' must be a list")
        
        if 'vocabulary' in story_data and not isinstance(story_data['vocabulary'], list):
            errors.append(f"Story {story_id} 'vocabulary' must be a list")
        
        if 'questions' in story_data and not isinstance(story_data['questions'], list):
            errors.append(f"Story {story_id} 'questions' must be a list")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_manifest_matches_story_files():
    """Test that manifest metadata matches actual story files."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception as e:
            errors.append(f"Cannot load story {story_id}: {e}")
            continue
        
        # Check ID matches
        if story_data.get('id') != story_id:
            errors.append(f"Story ID mismatch: manifest={story_id}, file={story_data.get('id')}")
        
        # Check title matches
        if story_data.get('title') != story_meta.get('title'):
            errors.append(f"Story {story_id} title mismatch: manifest={story_meta.get('title')}, file={story_data.get('title')}")
        
        # Check titleSpanish matches
        if story_data.get('titleSpanish') != story_meta.get('titleSpanish'):
            errors.append(f"Story {story_id} titleSpanish mismatch: manifest={story_meta.get('titleSpanish')}, file={story_data.get('titleSpanish')}")
        
        # Check level matches
        if story_data.get('level') != level:
            errors.append(f"Story {story_id} level mismatch: manifest={level}, file={story_data.get('level')}")
        
        # Check category matches
        if story_data.get('category') != story_meta.get('category'):
            errors.append(f"Story {story_id} category mismatch: manifest={story_meta.get('category')}, file={story_data.get('category')}")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_all_stories_have_valid_categories():
    """Test that all stories use valid category values."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        category = story_meta.get('category')
        
        if not category:
            errors.append(f"Story {story_id} is missing 'category' field")
        elif category not in VALID_CATEGORIES:
            errors.append(f"Story {story_id} has invalid category '{category}'. Valid: {VALID_CATEGORIES}")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_manifest_has_required_metadata():
    """Test that manifest entries have all required metadata."""
    manifest = load_manifest()
    errors = []
    
    required_fields = [
        'id', 'title', 'titleSpanish', 'level', 'category', 'icon',
        'wordCount', 'estimatedMinutes'
    ]
    
    for story_meta in manifest['stories']:
        story_id = story_meta.get('id', 'UNKNOWN')
        
        for field in required_fields:
            if field not in story_meta:
                errors.append(f"Manifest entry for {story_id} is missing '{field}' field")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_v3_legacy_difficulty_field():
    """Test for presence of V3 legacy 'difficulty' field."""
    manifest = load_manifest()
    stories_with_legacy = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception:
            continue
        
        # Check if story has legacy 'difficulty' field
        if 'difficulty' in story_data:
            difficulty_value = story_data['difficulty']
            stories_with_legacy.append({
                'id': story_id,
                'level': level,
                'difficulty': difficulty_value
            })
    
    if stories_with_legacy:
        error_msg = f"Found {len(stories_with_legacy)} stories with legacy 'difficulty' field:\n"
        for story in stories_with_legacy[:10]:  # Show first 10
            error_msg += f"  - {story['id']}: level={story['level']}, difficulty={story['difficulty']}\n"
        if len(stories_with_legacy) > 10:
            error_msg += f"  ... and {len(stories_with_legacy) - 10} more\n"
        error_msg += "\nRecommendation: Remove 'difficulty' field from all stories"
        pytest.fail(error_msg)


def test_word_count_accuracy():
    """Test that wordCount metadata matches actual dialogue word count."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        manifest_word_count = story_meta.get('wordCount', 0)
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception as e:
            errors.append(f"Cannot load story {story_id}: {e}")
            continue
        
        # Count words in dialogue
        actual_word_count = 0
        if 'dialogue' in story_data:
            for line in story_data['dialogue']:
                spanish_text = line.get('spanish', '')
                actual_word_count += len(spanish_text.split())
        
        # Allow 10% tolerance for word count
        tolerance = max(5, int(manifest_word_count * 0.1))
        if abs(actual_word_count - manifest_word_count) > tolerance:
            errors.append(
                f"Story {story_id} word count mismatch: "
                f"manifest={manifest_word_count}, actual={actual_word_count}"
            )
    
    if errors:
        pytest.fail("\n".join(errors))


def test_estimated_minutes_reasonable():
    """Test that estimatedMinutes is reasonable (1-10 minutes)."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        estimated_minutes = story_meta.get('estimatedMinutes', 0)
        
        if estimated_minutes < 1 or estimated_minutes > 10:
            errors.append(
                f"Story {story_id} has unreasonable estimatedMinutes: {estimated_minutes} "
                f"(should be 1-10)"
            )
    
    if errors:
        pytest.fail("\n".join(errors))


def test_vocabulary_count_accuracy():
    """Test that vocabularyCount matches vocabulary array length."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        manifest_vocab_count = story_meta.get('vocabularyCount', 0)
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception as e:
            errors.append(f"Cannot load story {story_id}: {e}")
            continue
        
        actual_vocab_count = len(story_data.get('vocabulary', []))
        
        if actual_vocab_count != manifest_vocab_count:
            errors.append(
                f"Story {story_id} vocabulary count mismatch: "
                f"manifest={manifest_vocab_count}, actual={actual_vocab_count}"
            )
    
    if errors:
        pytest.fail("\n".join(errors))


def test_question_count_accuracy():
    """Test that questionCount matches questions array length."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        manifest_question_count = story_meta.get('questionCount', 0)
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception as e:
            errors.append(f"Cannot load story {story_id}: {e}")
            continue
        
        actual_question_count = len(story_data.get('questions', []))
        
        if actual_question_count != manifest_question_count:
            errors.append(
                f"Story {story_id} question count mismatch: "
                f"manifest={manifest_question_count}, actual={actual_question_count}"
            )
    
    if errors:
        pytest.fail("\n".join(errors))


def test_vocabulary_required_fields():
    """Test that all vocabulary entries have required fields."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception:
            continue
        
        vocabulary = story_data.get('vocabulary', [])
        for idx, vocab_item in enumerate(vocabulary):
            # Check required fields
            if 'spanish' not in vocab_item or not vocab_item['spanish'].strip():
                errors.append(f"Story {story_id} vocabulary[{idx}] missing or empty 'spanish' field")
            
            if 'finnish' not in vocab_item or not vocab_item['finnish'].strip():
                errors.append(f"Story {story_id} vocabulary[{idx}] missing or empty 'finnish' field")
    
    if errors:
        pytest.fail("\n".join(errors[:50]))  # Show first 50 errors


def test_vocabulary_no_duplicates():
    """Test that vocabulary has no duplicate words within a story."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception:
            continue
        
        vocabulary = story_data.get('vocabulary', [])
        spanish_words = [v.get('spanish', '').lower().strip() for v in vocabulary]
        
        # Find duplicates
        seen: Set[str] = set()
        duplicates = []
        for word in spanish_words:
            if word in seen:
                duplicates.append(word)
            seen.add(word)
        
        if duplicates:
            errors.append(f"Story {story_id} has duplicate vocabulary: {', '.join(duplicates)}")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_dialogue_required_fields():
    """Test that all dialogue lines have required fields."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception:
            continue
        
        dialogue = story_data.get('dialogue', [])
        
        if not dialogue:
            errors.append(f"Story {story_id} has empty dialogue")
            continue
        
        for idx, line in enumerate(dialogue):
            if 'speaker' not in line or not line['speaker'].strip():
                errors.append(f"Story {story_id} dialogue[{idx}] missing or empty 'speaker' field")
            
            if 'spanish' not in line or not line['spanish'].strip():
                errors.append(f"Story {story_id} dialogue[{idx}] missing or empty 'spanish' field")
            
            if 'finnish' not in line or not line['finnish'].strip():
                errors.append(f"Story {story_id} dialogue[{idx}] missing or empty 'finnish' field")
    
    if errors:
        pytest.fail("\n".join(errors[:50]))  # Show first 50 errors


def test_questions_structure():
    """Test that all questions have proper structure."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception:
            continue
        
        questions = story_data.get('questions', [])
        
        for idx, question in enumerate(questions):
            # Check required fields
            if 'question' not in question or not question['question'].strip():
                errors.append(f"Story {story_id} question[{idx}] missing or empty 'question' field")
            
            if 'options' not in question:
                errors.append(f"Story {story_id} question[{idx}] missing 'options' field")
                continue
            
            options = question['options']
            if not isinstance(options, list):
                errors.append(f"Story {story_id} question[{idx}] 'options' must be a list")
                continue
            
            if len(options) != 4:
                errors.append(
                    f"Story {story_id} question[{idx}] has {len(options)} options, expected 4"
                )
            
            # Check for empty options
            for opt_idx, option in enumerate(options):
                if not option or not str(option).strip():
                    errors.append(
                        f"Story {story_id} question[{idx}] option[{opt_idx}] is empty"
                    )
            
            # Check correctIndex
            if 'correctIndex' not in question:
                errors.append(f"Story {story_id} question[{idx}] missing 'correctIndex' field")
                continue
            
            correct_index = question['correctIndex']
            if not isinstance(correct_index, int) or correct_index < 0 or correct_index >= len(options):
                errors.append(
                    f"Story {story_id} question[{idx}] has invalid correctIndex: {correct_index}"
                )
    
    if errors:
        pytest.fail("\n".join(errors[:50]))  # Show first 50 errors


def test_questions_no_duplicate_options():
    """Test that questions don't have duplicate options."""
    manifest = load_manifest()
    errors = []
    
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        
        try:
            story_data = load_story_file(level, story_id)
        except Exception:
            continue
        
        questions = story_data.get('questions', [])
        
        for idx, question in enumerate(questions):
            options = question.get('options', [])
            
            # Normalize options for comparison
            normalized = [str(opt).lower().strip() for opt in options]
            
            if len(normalized) != len(set(normalized)):
                # Find duplicates
                seen: Set[str] = set()
                duplicates = []
                for opt in normalized:
                    if opt in seen:
                        duplicates.append(opt)
                    seen.add(opt)
                
                errors.append(
                    f"Story {story_id} question[{idx}] has duplicate options: {', '.join(duplicates)}"
                )
    
    if errors:
        pytest.fail("\n".join(errors))


def generate_validation_report():
    """Generate a detailed validation report."""
    manifest = load_manifest()
    
    report_lines = []
    report_lines.append("=" * 80)
    report_lines.append("STORY DATA VALIDATION REPORT")
    report_lines.append("=" * 80)
    report_lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append(f"Total stories: {len(manifest['stories'])}")
    report_lines.append("")
    
    # Count stories by level
    level_counts = {}
    for story in manifest['stories']:
        level = story.get('level', 'UNKNOWN')
        level_counts[level] = level_counts.get(level, 0) + 1
    
    report_lines.append("Stories by Level:")
    for level in sorted(level_counts.keys()):
        report_lines.append(f"  {level}: {level_counts[level]}")
    report_lines.append("")
    
    # Count stories by category
    category_counts = {}
    for story in manifest['stories']:
        category = story.get('category', 'UNKNOWN')
        category_counts[category] = category_counts.get(category, 0) + 1
    
    report_lines.append("Stories by Category:")
    for category in sorted(category_counts.keys()):
        report_lines.append(f"  {category}: {category_counts[category]}")
    report_lines.append("")
    
    # Check for legacy fields
    stories_with_legacy = []
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        try:
            story_data = load_story_file(level, story_id)
            if 'difficulty' in story_data:
                stories_with_legacy.append((story_id, story_data['difficulty']))
        except Exception:
            pass
    
    report_lines.append("=" * 80)
    report_lines.append("V3 LEGACY FIELDS")
    report_lines.append("=" * 80)
    report_lines.append(f"Stories with legacy 'difficulty' field: {len(stories_with_legacy)}")
    if stories_with_legacy:
        report_lines.append("")
        for story_id, difficulty in stories_with_legacy[:20]:
            report_lines.append(f"  - {story_id}: difficulty='{difficulty}'")
        if len(stories_with_legacy) > 20:
            report_lines.append(f"  ... and {len(stories_with_legacy) - 20} more")
    report_lines.append("")
    report_lines.append("RECOMMENDATION: Remove 'difficulty' field from all story files")
    report_lines.append("")
    
    # Check for title mismatches
    title_mismatches = []
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        try:
            story_data = load_story_file(level, story_id)
            if story_data.get('title') != story_meta.get('title'):
                title_mismatches.append({
                    'id': story_id,
                    'manifest': story_meta.get('title'),
                    'file': story_data.get('title')
                })
        except Exception:
            pass
    
    report_lines.append("=" * 80)
    report_lines.append("TITLE MISMATCHES (Manifest vs Story File)")
    report_lines.append("=" * 80)
    report_lines.append(f"Stories with title mismatches: {len(title_mismatches)}")
    if title_mismatches:
        report_lines.append("")
        report_lines.append("NOTE: Manifest has Finnish titles, story files have English titles")
        report_lines.append("")
        for item in title_mismatches[:10]:
            report_lines.append(f"  - {item['id']}:")
            report_lines.append(f"      Manifest: {item['manifest']}")
            report_lines.append(f"      File:     {item['file']}")
        if len(title_mismatches) > 10:
            report_lines.append(f"  ... and {len(title_mismatches) - 10} more")
    report_lines.append("")
    report_lines.append("RECOMMENDATION: Update story files to use Finnish titles from manifest")
    report_lines.append("")
    
    # Check for invalid categories
    invalid_categories = []
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        category = story_meta.get('category')
        if category and category not in VALID_CATEGORIES:
            invalid_categories.append((story_id, category))
    
    report_lines.append("=" * 80)
    report_lines.append("INVALID CATEGORIES")
    report_lines.append("=" * 80)
    report_lines.append(f"Stories with invalid categories: {len(invalid_categories)}")
    if invalid_categories:
        report_lines.append("")
        for story_id, category in invalid_categories:
            report_lines.append(f"  - {story_id}: '{category}'")
        report_lines.append("")
        report_lines.append(f"Valid categories: {', '.join(sorted(VALID_CATEGORIES))}")
    report_lines.append("")
    report_lines.append("RECOMMENDATION: Update VALID_CATEGORIES or fix story categories")
    report_lines.append("")
    
    # Check for metadata mismatches
    vocab_mismatches = []
    question_mismatches = []
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        try:
            story_data = load_story_file(level, story_id)
            
            # Check vocabulary count
            manifest_vocab = story_meta.get('vocabularyCount', 0)
            actual_vocab = len(story_data.get('vocabulary', []))
            if manifest_vocab != actual_vocab:
                vocab_mismatches.append((story_id, manifest_vocab, actual_vocab))
            
            # Check question count
            manifest_questions = story_meta.get('questionCount', 0)
            actual_questions = len(story_data.get('questions', []))
            if manifest_questions != actual_questions:
                question_mismatches.append((story_id, manifest_questions, actual_questions))
        except Exception:
            pass
    
    report_lines.append("=" * 80)
    report_lines.append("METADATA MISMATCHES")
    report_lines.append("=" * 80)
    report_lines.append(f"Vocabulary count mismatches: {len(vocab_mismatches)}")
    if vocab_mismatches:
        report_lines.append("")
        for story_id, manifest_count, actual_count in vocab_mismatches[:10]:
            report_lines.append(f"  - {story_id}: manifest={manifest_count}, actual={actual_count}")
        if len(vocab_mismatches) > 10:
            report_lines.append(f"  ... and {len(vocab_mismatches) - 10} more")
    report_lines.append("")
    
    report_lines.append(f"Question count mismatches: {len(question_mismatches)}")
    if question_mismatches:
        report_lines.append("")
        for story_id, manifest_count, actual_count in question_mismatches[:10]:
            report_lines.append(f"  - {story_id}: manifest={manifest_count}, actual={actual_count}")
        if len(question_mismatches) > 10:
            report_lines.append(f"  ... and {len(question_mismatches) - 10} more")
    report_lines.append("")
    report_lines.append("RECOMMENDATION: Regenerate manifest with correct counts")
    report_lines.append("")
    
    # Check for question structure issues
    question_issues = []
    for story_meta in manifest['stories']:
        story_id = story_meta['id']
        level = story_meta.get('level', 'A1')
        try:
            story_data = load_story_file(level, story_id)
            questions = story_data.get('questions', [])
            for idx, question in enumerate(questions):
                options = question.get('options', [])
                if len(options) != 4:
                    question_issues.append((story_id, idx, len(options)))
        except Exception:
            pass
    
    report_lines.append("=" * 80)
    report_lines.append("QUESTION STRUCTURE ISSUES")
    report_lines.append("=" * 80)
    report_lines.append(f"Questions with non-standard option count: {len(question_issues)}")
    if question_issues:
        report_lines.append("")
        for story_id, q_idx, option_count in question_issues:
            report_lines.append(f"  - {story_id} question[{q_idx}]: {option_count} options (expected 4)")
    report_lines.append("")
    report_lines.append("RECOMMENDATION: Fix questions to have exactly 4 options")
    report_lines.append("")
    
    # Summary
    report_lines.append("=" * 80)
    report_lines.append("SUMMARY")
    report_lines.append("=" * 80)
    total_issues = (len(stories_with_legacy) + len(title_mismatches) + 
                   len(invalid_categories) + len(vocab_mismatches) + 
                   len(question_mismatches) + len(question_issues))
    report_lines.append(f"Total issues found: {total_issues}")
    report_lines.append("")
    report_lines.append("Priority fixes:")
    report_lines.append(f"  1. Remove legacy 'difficulty' field ({len(stories_with_legacy)} stories)")
    report_lines.append(f"  2. Fix invalid categories ({len(invalid_categories)} stories)")
    report_lines.append(f"  3. Update manifest metadata ({len(vocab_mismatches) + len(question_mismatches)} mismatches)")
    report_lines.append(f"  4. Fix question structure ({len(question_issues)} questions)")
    report_lines.append(f"  5. Update titles to Finnish ({len(title_mismatches)} stories)")
    report_lines.append("")
    
    # Save report
    reports_dir = Path(__file__).parent.parent / 'reports'
    reports_dir.mkdir(exist_ok=True)
    report_file = reports_dir / 'story-validation-results.txt'
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(report_lines))
    
    print(f"Validation report saved to: {report_file}")


if __name__ == '__main__':
    # Run tests
    exit_code = pytest.main([__file__, '-v'])
    
    # Generate report
    generate_validation_report()
    
    exit(exit_code)
