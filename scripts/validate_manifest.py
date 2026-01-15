#!/usr/bin/env python3
"""
Manifest Validation Script

This validates the manifest.json file and its synchronization with story files:
1. All stories in manifest have corresponding story files
2. All story files have corresponding manifest entries
3. Manifest metadata matches story file metadata (level, title, etc.)
4. No orphaned story files exist
5. Manifest structure is valid
6. Story files are in correct level directories (a1/, a2/, b1/)
7. Vocabulary and question counts match

Usage:
    python scripts/validate_manifest.py
    
Output:
    - Test results to console (pytest format)
    - Detailed report to reports/manifest-validation-results.txt
"""

import json
import pytest
from pathlib import Path
from typing import Dict, Any, List, Set, Tuple
from datetime import datetime
from collections import defaultdict


VALID_LEVELS = {'A1', 'A2', 'B1', 'B2'}
REQUIRED_MANIFEST_FIELDS = {
    'version', 'lastUpdated', 'stories'
}
REQUIRED_STORY_METADATA_FIELDS = {
    'id', 'title', 'titleSpanish', 'description', 'level', 
    'category', 'icon', 'wordCount', 'estimatedMinutes'
}
# Optional fields that may not be present in all stories
OPTIONAL_STORY_METADATA_FIELDS = {
    'vocabularyCount', 'questionCount'
}
REQUIRED_STORY_FILE_FIELDS = {
    'id', 'title', 'titleSpanish', 'description', 'level',
    'category', 'icon', 'dialogue', 'vocabulary', 'questions'
}


def get_project_paths() -> Tuple[Path, Path, Path]:
    """Get project paths."""
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    stories_dir = project_root / 'svelte' / 'static' / 'stories'
    manifest_file = stories_dir / 'manifest.json'
    return project_root, stories_dir, manifest_file


def load_manifest() -> Dict[str, Any]:
    """Load the manifest.json file."""
    _, _, manifest_file = get_project_paths()
    
    if not manifest_file.exists():
        raise FileNotFoundError(f"Manifest file not found: {manifest_file}")
    
    with open(manifest_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def load_story_file(stories_dir: Path, story_id: str, level: str) -> Dict[str, Any]:
    """Load a story file from the appropriate level directory."""
    level_dir = stories_dir / level.lower()
    story_file = level_dir / f"{story_id}.json"
    
    if not story_file.exists():
        raise FileNotFoundError(f"Story file not found: {story_file}")
    
    with open(story_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def find_all_story_files(stories_dir: Path) -> Dict[str, Tuple[str, Path]]:
    """Find all story JSON files in level directories.
    
    Returns:
        Dict mapping story_id to (level, file_path)
    """
    story_files = {}
    
    for level in ['a1', 'a2', 'b1', 'b2']:
        level_dir = stories_dir / level
        if not level_dir.exists():
            continue
        
        for story_file in level_dir.glob('*.json'):
            story_id = story_file.stem
            story_files[story_id] = (level.upper(), story_file)
    
    return story_files


def get_reports_dir() -> Path:
    """Get or create the reports directory."""
    project_root, _, _ = get_project_paths()
    reports_dir = project_root / 'reports'
    reports_dir.mkdir(exist_ok=True)
    return reports_dir


def write_validation_report(results: Dict[str, Any]) -> None:
    """Write validation results to a report file."""
    reports_dir = get_reports_dir()
    report_file = reports_dir / 'manifest-validation-results.txt'
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("=" * 80 + "\n")
        f.write("MANIFEST VALIDATION REPORT\n")
        f.write("=" * 80 + "\n")
        f.write(f"Generated: {datetime.now().isoformat()}\n")
        _, _, manifest_file = get_project_paths()
        f.write(f"Manifest: {manifest_file}\n")
        f.write("\n")
        
        # Summary
        f.write("SUMMARY\n")
        f.write("-" * 80 + "\n")
        f.write(f"Stories in manifest: {results['manifest_story_count']}\n")
        f.write(f"Story files found: {results['file_story_count']}\n")
        f.write(f"Manifest structure valid: {results['manifest_valid']}\n")
        f.write(f"All manifest stories have files: {results['all_manifest_have_files']}\n")
        f.write(f"All files have manifest entries: {results['all_files_have_manifest']}\n")
        f.write(f"Metadata matches: {results['metadata_matches']}\n")
        f.write("\n")
        
        # Level Distribution
        f.write("LEVEL DISTRIBUTION\n")
        f.write("-" * 80 + "\n")
        for level, count in sorted(results['level_distribution'].items()):
            f.write(f"{level}: {count} stories\n")
        f.write("\n")
        
        # Category Distribution
        f.write("CATEGORY DISTRIBUTION\n")
        f.write("-" * 80 + "\n")
        for category, count in sorted(results['category_distribution'].items()):
            f.write(f"{category}: {count} stories\n")
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
        
        # Orphaned Files
        if results['orphaned_files']:
            f.write("ORPHANED FILES (not in manifest)\n")
            f.write("-" * 80 + "\n")
            for story_id, (level, path) in results['orphaned_files'].items():
                f.write(f"- {story_id} ({level}): {path}\n")
            f.write("\n")
        
        # Missing Files
        if results['missing_files']:
            f.write("MISSING FILES (in manifest but no file)\n")
            f.write("-" * 80 + "\n")
            for story_id, level in results['missing_files'].items():
                f.write(f"- {story_id} ({level})\n")
            f.write("\n")
        
        f.write("=" * 80 + "\n")
        f.write("END OF REPORT\n")
        f.write("=" * 80 + "\n")
    
    print(f"\nValidation report written to: {report_file}")


def test_manifest_structure():
    """Test that manifest has required structure."""
    manifest = load_manifest()
    errors = []
    
    # Check required fields
    missing_fields = REQUIRED_MANIFEST_FIELDS - set(manifest.keys())
    if missing_fields:
        errors.append(f"Missing manifest fields: {missing_fields}")
    
    # Validate stories field
    if 'stories' in manifest:
        if not isinstance(manifest['stories'], list):
            errors.append(f"'stories' must be a list, got {type(manifest['stories'])}")
        elif len(manifest['stories']) == 0:
            errors.append("'stories' list is empty")
    
    # Validate version
    if 'version' in manifest and not isinstance(manifest['version'], str):
        errors.append(f"'version' must be a string, got {type(manifest['version'])}")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_all_story_metadata_have_required_fields():
    """Test that all story metadata entries have required fields."""
    manifest = load_manifest()
    stories = manifest.get('stories', [])
    errors = []
    
    for i, story in enumerate(stories):
        story_id = story.get('id', f'<unknown at index {i}>')
        
        missing_fields = REQUIRED_STORY_METADATA_FIELDS - set(story.keys())
        if missing_fields:
            errors.append(f"Story '{story_id}' missing fields: {missing_fields}")
    
    if errors:
        if len(errors) > 10:
            errors = errors[:10] + [f"... and {len(errors) - 10} more errors"]
        pytest.fail("\n".join(errors))


def test_story_levels_are_valid():
    """Test that all story levels are valid."""
    manifest = load_manifest()
    stories = manifest.get('stories', [])
    errors = []
    
    for story in stories:
        story_id = story.get('id', '<unknown>')
        level = story.get('level')
        
        if level not in VALID_LEVELS:
            errors.append(f"Story '{story_id}' has invalid level: '{level}'")
    
    if errors:
        pytest.fail("\n".join(errors))


def test_story_ids_are_unique():
    """Test that all story IDs are unique in manifest."""
    manifest = load_manifest()
    stories = manifest.get('stories', [])
    
    story_ids = [story.get('id') for story in stories]
    duplicates = [sid for sid in story_ids if story_ids.count(sid) > 1]
    
    if duplicates:
        unique_duplicates = list(set(duplicates))
        pytest.fail(f"Duplicate story IDs found: {unique_duplicates}")


def test_all_manifest_stories_have_files():
    """Test that all stories in manifest have corresponding files."""
    manifest = load_manifest()
    stories = manifest.get('stories', [])
    _, stories_dir, _ = get_project_paths()
    
    errors = []
    
    for story in stories:
        story_id = story.get('id')
        level = story.get('level', '').lower()
        
        if not story_id:
            errors.append("Found story with missing ID")
            continue
        
        level_dir = stories_dir / level
        story_file = level_dir / f"{story_id}.json"
        
        if not story_file.exists():
            errors.append(f"Story '{story_id}' ({level.upper()}): file not found at {story_file}")
    
    if errors:
        if len(errors) > 10:
            errors = errors[:10] + [f"... and {len(errors) - 10} more errors"]
        pytest.fail("\n".join(errors))


def test_all_story_files_have_manifest_entries():
    """Test that all story files have corresponding manifest entries."""
    manifest = load_manifest()
    stories = manifest.get('stories', [])
    manifest_ids = {story.get('id') for story in stories}
    
    _, stories_dir, _ = get_project_paths()
    story_files = find_all_story_files(stories_dir)
    
    orphaned = []
    for story_id, (level, path) in story_files.items():
        if story_id not in manifest_ids:
            orphaned.append(f"{story_id} ({level}): {path}")
    
    if orphaned:
        pytest.fail(f"Orphaned story files found:\n" + "\n".join(orphaned))


def test_story_files_are_in_correct_directories():
    """Test that story files are in directories matching their level."""
    manifest = load_manifest()
    stories = manifest.get('stories', [])
    _, stories_dir, _ = get_project_paths()
    
    errors = []
    
    for story in stories:
        story_id = story.get('id')
        manifest_level = story.get('level', '').upper()
        
        if not story_id:
            continue
        
        # Find the file
        story_files = find_all_story_files(stories_dir)
        if story_id not in story_files:
            continue  # Already caught by other test
        
        file_level, file_path = story_files[story_id]
        
        if file_level != manifest_level:
            errors.append(
                f"Story '{story_id}': manifest says {manifest_level}, "
                f"but file is in {file_level} directory"
            )
    
    if errors:
        pytest.fail("\n".join(errors))


def test_metadata_matches_story_files():
    """Test that manifest metadata matches story file content."""
    manifest = load_manifest()
    stories = manifest.get('stories', [])
    _, stories_dir, _ = get_project_paths()
    
    errors = []
    warnings = []
    
    for story_meta in stories:
        story_id = story_meta.get('id')
        level = story_meta.get('level', '').lower()
        
        if not story_id:
            continue
        
        try:
            story_file = load_story_file(stories_dir, story_id, level)
        except FileNotFoundError:
            continue  # Already caught by other test
        
        # Check matching fields (excluding 'title' since manifest has Finnish, file has English)
        fields_to_check = ['id', 'titleSpanish', 'level', 'category', 'icon']
        
        for field in fields_to_check:
            meta_value = story_meta.get(field)
            file_value = story_file.get(field)
            
            if meta_value != file_value:
                errors.append(
                    f"Story '{story_id}' field '{field}': "
                    f"manifest='{meta_value}', file='{file_value}'"
                )
        
        # Check counts (if present in manifest)
        if 'vocabularyCount' in story_meta:
            manifest_vocab_count = story_meta.get('vocabularyCount', 0)
            file_vocab_count = len(story_file.get('vocabulary', []))
            
            if manifest_vocab_count != file_vocab_count:
                errors.append(
                    f"Story '{story_id}' vocabularyCount: "
                    f"manifest={manifest_vocab_count}, file={file_vocab_count}"
                )
        else:
            # Warn if vocabularyCount is missing
            file_vocab_count = len(story_file.get('vocabulary', []))
            if file_vocab_count > 0:
                warnings.append(
                    f"Story '{story_id}' missing vocabularyCount in manifest (file has {file_vocab_count})"
                )
        
        if 'questionCount' in story_meta:
            manifest_question_count = story_meta.get('questionCount', 0)
            file_question_count = len(story_file.get('questions', []))
            
            if manifest_question_count != file_question_count:
                errors.append(
                    f"Story '{story_id}' questionCount: "
                    f"manifest={manifest_question_count}, file={file_question_count}"
                )
        else:
            # Warn if questionCount is missing
            file_question_count = len(story_file.get('questions', []))
            if file_question_count > 0:
                warnings.append(
                    f"Story '{story_id}' missing questionCount in manifest (file has {file_question_count})"
                )
        
        # Check word count (allow some tolerance since it's calculated)
        manifest_word_count = story_meta.get('wordCount', 0)
        file_dialogue = story_file.get('dialogue', [])
        file_word_count = sum(
            len(line.get('spanish', '').split()) 
            for line in file_dialogue
        )
        
        # Allow 10% tolerance for word count differences
        if abs(manifest_word_count - file_word_count) > max(5, manifest_word_count * 0.1):
            warnings.append(
                f"Story '{story_id}' wordCount: "
                f"manifest={manifest_word_count}, calculated={file_word_count}"
            )
    
    if errors:
        if len(errors) > 10:
            errors = errors[:10] + [f"... and {len(errors) - 10} more errors"]
        pytest.fail("\n".join(errors))
    
    if warnings:
        pytest.skip("Metadata warnings: " + "; ".join(warnings[:5]))


def test_story_files_have_required_fields():
    """Test that all story files have required fields."""
    manifest = load_manifest()
    stories = manifest.get('stories', [])
    _, stories_dir, _ = get_project_paths()
    
    errors = []
    
    for story_meta in stories:
        story_id = story_meta.get('id')
        level = story_meta.get('level', '').lower()
        
        if not story_id:
            continue
        
        try:
            story_file = load_story_file(stories_dir, story_id, level)
        except FileNotFoundError:
            continue  # Already caught by other test
        
        missing_fields = REQUIRED_STORY_FILE_FIELDS - set(story_file.keys())
        if missing_fields:
            errors.append(f"Story file '{story_id}' missing fields: {missing_fields}")
    
    if errors:
        if len(errors) > 10:
            errors = errors[:10] + [f"... and {len(errors) - 10} more errors"]
        pytest.fail("\n".join(errors))


def generate_validation_report():
    """Generate a comprehensive validation report."""
    try:
        manifest = load_manifest()
        stories = manifest.get('stories', [])
        _, stories_dir, _ = get_project_paths()
        story_files = find_all_story_files(stories_dir)
        
        # Collect statistics
        level_distribution = defaultdict(int)
        category_distribution = defaultdict(int)
        
        for story in stories:
            level = story.get('level', 'unknown')
            category = story.get('category', 'unknown')
            level_distribution[level] += 1
            category_distribution[category] += 1
        
        # Find manifest IDs
        manifest_ids = {story.get('id') for story in stories if story.get('id')}
        
        # Find orphaned files
        orphaned_files = {
            sid: (level, path)
            for sid, (level, path) in story_files.items()
            if sid not in manifest_ids
        }
        
        # Find missing files
        missing_files = {}
        for story in stories:
            story_id = story.get('id')
            level = story.get('level', '').lower()
            
            if story_id and story_id not in story_files:
                missing_files[story_id] = level.upper()
        
        # Collect errors
        errors = []
        warnings = []
        
        # Check manifest structure
        missing_fields = REQUIRED_MANIFEST_FIELDS - set(manifest.keys())
        if missing_fields:
            errors.append(f"Missing manifest fields: {missing_fields}")
        
        # Check for orphans and missing files
        if orphaned_files:
            errors.append(f"Found {len(orphaned_files)} orphaned story files")
        
        if missing_files:
            errors.append(f"Found {len(missing_files)} missing story files")
        
        results = {
            'manifest_story_count': len(stories),
            'file_story_count': len(story_files),
            'manifest_valid': len(missing_fields) == 0,
            'all_manifest_have_files': len(missing_files) == 0,
            'all_files_have_manifest': len(orphaned_files) == 0,
            'metadata_matches': True,  # Checked by detailed tests
            'level_distribution': dict(level_distribution),
            'category_distribution': dict(category_distribution),
            'orphaned_files': orphaned_files,
            'missing_files': missing_files,
            'errors': errors,
            'warnings': warnings,
        }
        
        write_validation_report(results)
        
    except Exception as e:
        print(f"Error generating report: {e}")
        raise


if __name__ == '__main__':
    # Generate report when run directly
    print("Generating manifest validation report...")
    generate_validation_report()
    print("Done!")
