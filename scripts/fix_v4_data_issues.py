#!/usr/bin/env python3
"""
Fix V4 Data Issues

This script fixes data issues identified by validation scripts:
1. Remove legacy 'difficulty' field from all stories
2. Fix invalid story categories
3. Fix question structure issues (non-standard option counts)
4. Update story titles to Finnish (from manifest)

After running this script, regenerate the manifest to sync metadata.
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any

# Valid story categories according to StoryCategory type
VALID_CATEGORIES = [
    'cafe', 'culture', 'education', 'environment', 'everyday', 
    'family', 'food', 'health', 'home', 'housing', 'nature', 
    'shopping', 'social', 'technology', 'travel', 'work'
]

# Category mapping for invalid categories
CATEGORY_MAPPING = {
    'animals': 'nature',
    'numbers': 'education',
    'weather': 'nature',
    'fitness': 'health',
    'services': 'everyday',
    'transportation': 'travel',
    'life': 'everyday',
    'emergency': 'health',
    'sports': 'social',
    'business': 'work',
    'economy': 'work',
    'celebration': 'social'
}


def load_json_file(filepath: Path) -> Dict[str, Any]:
    """Load JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json_file(filepath: Path, data: Dict[str, Any]) -> None:
    """Save JSON file with pretty formatting."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def remove_difficulty_field(story: Dict[str, Any]) -> bool:
    """Remove legacy 'difficulty' field from story. Returns True if changed."""
    if 'difficulty' in story:
        del story['difficulty']
        return True
    return False


def fix_invalid_category(story: Dict[str, Any]) -> bool:
    """Fix invalid category. Returns True if changed."""
    category = story.get('category', '')
    if category not in VALID_CATEGORIES:
        if category in CATEGORY_MAPPING:
            story['category'] = CATEGORY_MAPPING[category]
            return True
        else:
            # Unknown category, default to 'everyday'
            print(f"  WARNING: Unknown category '{category}', defaulting to 'everyday'")
            story['category'] = 'everyday'
            return True
    return False


def fix_question_options(story: Dict[str, Any]) -> bool:
    """Fix questions with non-standard option counts. Returns True if changed."""
    changed = False
    questions = story.get('questions', [])
    
    for i, question in enumerate(questions):
        options = question.get('options', [])
        if len(options) != 4:
            print(f"  WARNING: Question {i+1} has {len(options)} options (expected 4)")
            
            if len(options) > 4:
                # Truncate to first 4 options
                question['options'] = options[:4]
                print(f"    → Truncated to first 4 options")
                changed = True
            elif len(options) < 4:
                # This is a more serious issue - we can't auto-fix this
                print(f"    → ERROR: Cannot auto-fix (too few options)")
    
    return changed


def update_title_to_finnish(story: Dict[str, Any], manifest_titles: Dict[str, str]) -> bool:
    """Update story title to Finnish from manifest. Returns True if changed."""
    story_id = story.get('id', '')
    if story_id in manifest_titles:
        finnish_title = manifest_titles[story_id]
        current_title = story.get('title', '')
        if current_title != finnish_title:
            story['title'] = finnish_title
            return True
    return False


def process_story_file(filepath: Path, manifest_titles: Dict[str, str], fix_titles: bool = False) -> Dict[str, int]:
    """Process a single story file. Returns counts of fixes applied."""
    counts = {
        'difficulty_removed': 0,
        'category_fixed': 0,
        'questions_fixed': 0,
        'title_updated': 0
    }
    
    try:
        story = load_json_file(filepath)
        changed = False
        
        # Fix 1: Remove difficulty field
        if remove_difficulty_field(story):
            counts['difficulty_removed'] += 1
            changed = True
        
        # Fix 2: Fix invalid category
        if fix_invalid_category(story):
            counts['category_fixed'] += 1
            changed = True
        
        # Fix 3: Fix question options
        if fix_question_options(story):
            counts['questions_fixed'] += 1
            changed = True
        
        # Fix 4: Update title to Finnish (optional)
        if fix_titles and update_title_to_finnish(story, manifest_titles):
            counts['title_updated'] += 1
            changed = True
        
        # Save if changed
        if changed:
            save_json_file(filepath, story)
            return counts
        
    except Exception as e:
        print(f"ERROR processing {filepath.name}: {e}")
    
    return counts


def load_manifest_titles(manifest_path: Path) -> Dict[str, str]:
    """Load Finnish titles from manifest."""
    titles = {}
    try:
        manifest = load_json_file(manifest_path)
        for story in manifest.get('stories', []):
            story_id = story.get('id', '')
            title = story.get('title', '')
            if story_id and title:
                titles[story_id] = title
    except Exception as e:
        print(f"ERROR loading manifest: {e}")
    return titles


def main():
    """Main function."""
    print("=" * 80)
    print("V4 Data Issues Fix Script")
    print("=" * 80)
    print()
    
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    stories_dir = project_root / 'svelte' / 'static' / 'stories'
    manifest_path = stories_dir / 'manifest.json'
    
    # Load manifest titles
    print("Loading manifest titles...")
    manifest_titles = load_manifest_titles(manifest_path)
    print(f"  Loaded {len(manifest_titles)} titles from manifest")
    print()
    
    # Ask user about title updates
    print("Fix options:")
    print("  1. Fix critical issues only (difficulty, categories, questions)")
    print("  2. Fix all issues including titles (cosmetic)")
    print()
    choice = input("Choose option (1 or 2, default=1): ").strip() or "1"
    fix_titles = (choice == "2")
    print()
    
    # Process all story files
    print("Processing story files...")
    print()
    
    total_counts = {
        'files_processed': 0,
        'difficulty_removed': 0,
        'category_fixed': 0,
        'questions_fixed': 0,
        'title_updated': 0
    }
    
    # Find all story JSON files in subdirectories (a1, a2, b1)
    story_files = []
    for level_dir in ['a1', 'a2', 'b1']:
        level_path = stories_dir / level_dir
        if level_path.exists():
            story_files.extend(sorted(level_path.glob('*.json')))
    
    for filepath in story_files:
        story_id = filepath.stem
        print(f"Processing: {story_id}")
        
        counts = process_story_file(filepath, manifest_titles, fix_titles)
        
        total_counts['files_processed'] += 1
        total_counts['difficulty_removed'] += counts['difficulty_removed']
        total_counts['category_fixed'] += counts['category_fixed']
        total_counts['questions_fixed'] += counts['questions_fixed']
        total_counts['title_updated'] += counts['title_updated']
        
        # Show what was fixed
        fixes = []
        if counts['difficulty_removed']:
            fixes.append("removed difficulty")
        if counts['category_fixed']:
            fixes.append("fixed category")
        if counts['questions_fixed']:
            fixes.append("fixed questions")
        if counts['title_updated']:
            fixes.append("updated title")
        
        if fixes:
            print(f"  ✓ {', '.join(fixes)}")
    
    print()
    print("=" * 80)
    print("Summary")
    print("=" * 80)
    print(f"Files processed: {total_counts['files_processed']}")
    print(f"Difficulty fields removed: {total_counts['difficulty_removed']}")
    print(f"Categories fixed: {total_counts['category_fixed']}")
    print(f"Questions fixed: {total_counts['questions_fixed']}")
    print(f"Titles updated: {total_counts['title_updated']}")
    print()
    
    if total_counts['difficulty_removed'] or total_counts['category_fixed'] or total_counts['questions_fixed']:
        print("✅ Critical issues fixed!")
        print()
        print("Next steps:")
        print("  1. Run validation scripts to verify fixes")
        print("  2. Run: python scripts/regenerate_manifest.py")
        print("  3. Run: python scripts/generate_data_consistency_report.py")
    else:
        print("✅ No critical issues found!")
    
    print()


if __name__ == '__main__':
    main()
