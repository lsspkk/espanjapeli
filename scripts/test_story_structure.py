#!/usr/bin/env python3
"""
Test script to verify story structure is compatible with TTS and story reader.

This script:
1. Loads all migrated story files
2. Verifies required fields exist
3. Checks dialogue structure for TTS compatibility
4. Validates vocabulary and questions

Usage:
    python scripts/test_story_structure.py
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Set


def validate_dialogue_line(line: Dict[str, Any], story_id: str, line_num: int) -> List[str]:
    """Validate a single dialogue line."""
    errors = []
    
    required_fields = ['speaker', 'spanish', 'finnish']
    for field in required_fields:
        if field not in line:
            errors.append(f"Story {story_id}, line {line_num}: Missing '{field}' field")
        elif not isinstance(line[field], str):
            errors.append(f"Story {story_id}, line {line_num}: '{field}' must be a string")
        elif not line[field].strip():
            errors.append(f"Story {story_id}, line {line_num}: '{field}' is empty")
    
    return errors


def validate_vocabulary_word(word: Dict[str, Any], story_id: str, word_num: int) -> List[str]:
    """Validate a vocabulary word."""
    errors = []
    
    required_fields = ['spanish', 'finnish']
    for field in required_fields:
        if field not in word:
            errors.append(f"Story {story_id}, vocab {word_num}: Missing '{field}' field")
        elif not isinstance(word[field], str):
            errors.append(f"Story {story_id}, vocab {word_num}: '{field}' must be a string")
    
    return errors


def validate_question(question: Dict[str, Any], story_id: str, q_num: int) -> List[str]:
    """Validate a question."""
    errors = []
    
    # Official field name per TypeScript types: correctIndex
    required_fields = ['question', 'options']
    for field in required_fields:
        if field not in question:
            errors.append(f"Story {story_id}, question {q_num}: Missing '{field}' field")
    
    # Check for correctIndex (official field name)
    if 'correctIndex' not in question:
        errors.append(f"Story {story_id}, question {q_num}: Missing 'correctIndex' field")
    
    if 'options' in question:
        if not isinstance(question['options'], list):
            errors.append(f"Story {story_id}, question {q_num}: 'options' must be a list")
        elif len(question['options']) != 4:
            errors.append(f"Story {story_id}, question {q_num}: Must have exactly 4 options")
    
    if 'correctIndex' in question:
        if not isinstance(question['correctIndex'], int):
            errors.append(f"Story {story_id}, question {q_num}: 'correctIndex' must be an integer")
        elif question['correctIndex'] < 0 or question['correctIndex'] > 3:
            errors.append(f"Story {story_id}, question {q_num}: 'correctIndex' must be 0-3")
    
    return errors


def validate_story(story: Dict[str, Any], story_id: str) -> List[str]:
    """Validate a complete story structure."""
    errors = []
    
    # Check required top-level fields
    required_fields = ['id', 'title', 'titleSpanish', 'description', 'category', 'icon', 'dialogue', 'vocabulary', 'questions']
    for field in required_fields:
        if field not in story:
            errors.append(f"Story {story_id}: Missing '{field}' field")
    
    # Check V4 fields
    if 'wordCount' not in story:
        errors.append(f"Story {story_id}: Missing 'wordCount' field")
    if 'estimatedMinutes' not in story:
        errors.append(f"Story {story_id}: Missing 'estimatedMinutes' field")
    
    # Validate dialogue (critical for TTS)
    if 'dialogue' in story:
        if not isinstance(story['dialogue'], list):
            errors.append(f"Story {story_id}: 'dialogue' must be a list")
        elif len(story['dialogue']) == 0:
            errors.append(f"Story {story_id}: 'dialogue' is empty")
        else:
            for i, line in enumerate(story['dialogue'], 1):
                errors.extend(validate_dialogue_line(line, story_id, i))
    
    # Validate vocabulary
    if 'vocabulary' in story:
        if not isinstance(story['vocabulary'], list):
            errors.append(f"Story {story_id}: 'vocabulary' must be a list")
        else:
            for i, word in enumerate(story['vocabulary'], 1):
                errors.extend(validate_vocabulary_word(word, story_id, i))
    
    # Validate questions
    if 'questions' in story:
        if not isinstance(story['questions'], list):
            errors.append(f"Story {story_id}: 'questions' must be a list")
        elif len(story['questions']) == 0:
            errors.append(f"Story {story_id}: 'questions' is empty")
        else:
            for i, question in enumerate(story['questions'], 1):
                errors.extend(validate_question(question, story_id, i))
    
    return errors


def test_story_file(story_file: Path) -> tuple[bool, List[str]]:
    """Test a single story file."""
    try:
        with open(story_file, 'r', encoding='utf-8') as f:
            story = json.load(f)
        
        story_id = story.get('id', story_file.stem)
        errors = validate_story(story, story_id)
        
        return len(errors) == 0, errors
    
    except json.JSONDecodeError as e:
        return False, [f"JSON decode error in {story_file.name}: {e}"]
    except Exception as e:
        return False, [f"Error reading {story_file.name}: {e}"]


def main():
    """Main function."""
    # Paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    stories_dir = project_root / 'svelte' / 'static' / 'stories'
    
    # Collect all story files
    story_files = []
    for level_folder in ['a1', 'a2', 'b1']:
        level_dir = stories_dir / level_folder
        if level_dir.exists():
            story_files.extend(level_dir.glob('*.json'))
    
    if not story_files:
        print("❌ No story files found")
        return False
    
    print(f"Testing {len(story_files)} story files for TTS compatibility...\n")
    
    all_passed = True
    total_errors = []
    
    for story_file in sorted(story_files):
        passed, errors = test_story_file(story_file)
        
        if passed:
            print(f"✅ {story_file.name}")
        else:
            print(f"❌ {story_file.name}")
            for error in errors:
                print(f"   - {error}")
                total_errors.append(error)
            all_passed = False
    
    print()
    
    if all_passed:
        print("✅ All stories passed validation!")
        print("   - All dialogue lines have speaker, spanish, and finnish fields")
        print("   - All vocabulary words have spanish and finnish translations")
        print("   - All questions have proper structure")
        print("   - Stories are compatible with TTS and story reader")
        return True
    else:
        print(f"❌ Validation failed with {len(total_errors)} errors")
        return False


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
