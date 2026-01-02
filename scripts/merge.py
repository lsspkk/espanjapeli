#!/usr/bin/env python3
"""
Merge new words and tips from words_and_tips.json into words_tips_translations.json.

This script:
- Reads words_and_tips.json (source with English tips)
- Reads words_tips_translations.json (destination with English + Finnish tips)
- Merges new words/tips from source into destination
- Preserves existing Finnish translations
- Updates words_tips_translations.json with merged data
"""

import json
import os
from tqdm import tqdm

SOURCE_FILE = "words_and_tips.json"
DEST_FILE = "words_tips_translations.json"


def load_json_file(filepath):
    """Load a JSON file, return None if it doesn't exist."""
    if not os.path.exists(filepath):
        return None
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json_file(filepath, data):
    """Save data to a JSON file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def has_finnish_translations(word):
    """Check if a word has Finnish translations."""
    tips = word.get('learningTips', [])
    if not tips:
        return False
    
    finnish_tips = [t for t in tips if isinstance(t, dict) and t.get('language') == 'finnish']
    return len(finnish_tips) >= 3


def tips_are_different(tips1, tips2):
    """Check if two sets of tips are different (comparing English tips only)."""
    if not tips1 or not tips2:
        return tips1 != tips2
    
    # Extract English tips
    eng1 = [t for t in tips1 if isinstance(t, dict) and t.get('language') == 'english']
    eng2 = [t for t in tips2 if isinstance(t, dict) and t.get('language') == 'english']
    
    if len(eng1) != len(eng2):
        return True
    
    # Compare tip texts
    for t1, t2 in zip(eng1, eng2):
        if t1.get('text') != t2.get('text'):
            return True
    
    return False


def merge_words(source_word, dest_word):
    """
    Merge source word into destination word.
    Returns True if destination was updated.
    """
    updated = False
    
    # If destination doesn't have tips, copy from source
    if not dest_word.get('learningTips'):
        dest_word['learningTips'] = source_word.get('learningTips', [])
        updated = True
        return updated
    
    # Check if source has new/different English tips
    source_tips = source_word.get('learningTips', [])
    dest_tips = dest_word.get('learningTips', [])
    
    # If source has tips and destination doesn't, copy them
    if source_tips and not dest_tips:
        dest_word['learningTips'] = source_tips
        updated = True
        return updated
    
    # Check if English tips are different
    if tips_are_different(source_tips, dest_tips):
        # Preserve Finnish translations if they exist
        if has_finnish_translations(dest_word):
            # Keep Finnish tips, update English tips
            finnish_tips = [t for t in dest_tips if isinstance(t, dict) and t.get('language') == 'finnish']
            english_tips = source_tips  # Use new English tips from source
            dest_word['learningTips'] = english_tips + finnish_tips
        else:
            # No Finnish translations, just update English tips
            dest_word['learningTips'] = source_tips
        updated = True
    
    return updated


def merge_data(source_data, dest_data):
    """
    Merge source_data into dest_data.
    Returns (words_added, words_updated, words_skipped).
    """
    words_added = 0
    words_updated = 0
    words_skipped = 0
    
    for category_key, source_category in source_data.items():
        # Create category in destination if it doesn't exist
        if category_key not in dest_data:
            dest_data[category_key] = {
                'name': source_category['name'],
                'words': []
            }
        
        dest_category = dest_data[category_key]
        
        # Process each word in source category
        for source_word in source_category['words']:
            spanish = source_word['spanish']
            
            # Find matching word in destination
            dest_word = None
            for dw in dest_category['words']:
                if dw['spanish'] == spanish:
                    dest_word = dw
                    break
            
            if dest_word is None:
                # Word doesn't exist in destination, add it
                dest_category['words'].append(source_word.copy())
                words_added += 1
            else:
                # Word exists, merge tips
                if merge_words(source_word, dest_word):
                    words_updated += 1
                else:
                    words_skipped += 1
    
    return words_added, words_updated, words_skipped


def main():
    """Main function to merge files."""
    print("=" * 80)
    print("MERGE WORDS AND TIPS")
    print("=" * 80)
    
    # Load source file
    print(f"\n📖 Reading {SOURCE_FILE}...", end=" ")
    source_data = load_json_file(SOURCE_FILE)
    if source_data is None:
        print(f"✗ {SOURCE_FILE} not found!")
        return
    
    source_word_count = sum(len(c['words']) for c in source_data.values())
    print(f"✓ Found {len(source_data)} categories, {source_word_count} words")
    
    # Load destination file
    print(f"📖 Reading {DEST_FILE}...", end=" ")
    dest_data = load_json_file(DEST_FILE)
    
    if dest_data is None:
        print("✗ Not found, creating new file from source")
        dest_data = source_data.copy()
        save_json_file(DEST_FILE, dest_data)
        print(f"✓ Created {DEST_FILE} with {source_word_count} words")
        return
    
    dest_word_count = sum(len(c['words']) for c in dest_data.values())
    print(f"✓ Found {len(dest_data)} categories, {dest_word_count} words")
    
    # Merge data
    print("\n🔄 Merging data...")
    words_added, words_updated, words_skipped = merge_data(source_data, dest_data)
    
    # Save merged data
    print(f"💾 Saving merged data to {DEST_FILE}...", end=" ")
    save_json_file(DEST_FILE, dest_data)
    
    final_word_count = sum(len(c['words']) for c in dest_data.values())
    print("✓")
    
    # Print summary
    print("\n" + "=" * 80)
    print("📊 MERGE SUMMARY")
    print("=" * 80)
    print(f"  Words added:              {words_added}")
    print(f"  Words updated:            {words_updated}")
    print(f"  Words skipped (no change): {words_skipped}")
    print(f"  Total words in dest:      {final_word_count}")
    print("=" * 80)


if __name__ == "__main__":
    main()

