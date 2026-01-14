#!/usr/bin/env python3
"""Regenerate manifest.json from all story files in level folders."""

import json
from pathlib import Path
from datetime import datetime

def regenerate_manifest():
    """Scan all story files and regenerate manifest."""
    project_root = Path(__file__).parent.parent
    stories_dir = project_root / 'svelte' / 'static' / 'stories'
    
    manifest_entries = []
    
    # Scan all level folders
    for level_folder in ['a1', 'a2', 'b1']:
        level_dir = stories_dir / level_folder
        if not level_dir.exists():
            print(f"Folder {level_folder} not found, skipping...")
            continue
        
        for story_file in sorted(level_dir.glob('*.json')):
            with open(story_file, 'r', encoding='utf-8') as f:
                story = json.load(f)
            
            # Map difficulty if needed
            difficulty = story.get('difficulty', 'beginner')
            if difficulty == 'absolute-beginner':
                difficulty = 'beginner'
            
            # Calculate word count
            word_count = sum(len(line['spanish'].split()) for line in story.get('dialogue', []))
            estimated_minutes = max(2, word_count // 30)
            
            manifest_entry = {
                'id': story['id'],
                'title': story.get('title', story['titleSpanish']),
                'titleSpanish': story['titleSpanish'],
                'description': story.get('description', ''),
                'difficulty': difficulty,
                'level': story.get('level', level_folder.upper()),
                'category': story.get('category', 'general'),
                'icon': story.get('icon', '📖'),
                'wordCount': word_count,
                'estimatedMinutes': estimated_minutes,
                'vocabularyCount': len(story.get('vocabulary', [])),
                'questionCount': len(story.get('questions', []))
            }
            manifest_entries.append(manifest_entry)
            print(f"Added: {story['id']} ({manifest_entry['level']} - {difficulty})")
    
    # Write manifest
    manifest_data = {
        'version': '4.0.0',
        'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
        'stories': manifest_entries
    }
    
    manifest_file = stories_dir / 'manifest.json'
    with open(manifest_file, 'w', encoding='utf-8') as f:
        json.dump(manifest_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ Manifest regenerated with {len(manifest_entries)} stories")
    print(f"   Levels: A1={sum(1 for s in manifest_entries if s['level']=='A1')}, "
          f"A2={sum(1 for s in manifest_entries if s['level']=='A2')}, "
          f"B1={sum(1 for s in manifest_entries if s['level']=='B1')}")
    
    return True


if __name__ == '__main__':
    success = regenerate_manifest()
    exit(0 if success else 1)
