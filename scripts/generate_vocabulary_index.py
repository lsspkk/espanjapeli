#!/usr/bin/env python3
"""
Generate vocabulary index from all stories.

Creates a reverse index mapping Spanish words to the stories they appear in.
This allows:
- Finding which stories contain a specific word
- Showing "seen in X stories" in vocabulary displays
- Recommending stories based on known vocabulary
"""

import json
from pathlib import Path
from typing import Dict, List, Set
from collections import defaultdict


def normalize_word(word: str) -> str:
    """
    Normalize a Spanish word for indexing.
    
    - Convert to lowercase
    - Remove gender markers (el/la, o/a endings)
    - Keep the base form
    """
    word = word.lower().strip()
    
    # Remove articles
    for article in ['el ', 'la ', 'los ', 'las ', 'un ', 'una ', 'unos ', 'unas ']:
        if word.startswith(article):
            word = word[len(article):]
    
    return word


def extract_vocabulary_from_story(story_path: Path) -> List[Dict[str, str]]:
    """Extract vocabulary words from a story file."""
    with open(story_path, 'r', encoding='utf-8') as f:
        story = json.load(f)
    
    vocabulary = []
    for vocab in story.get('vocabulary', []):
        spanish = vocab.get('spanish', '')
        finnish = vocab.get('finnish', '')
        if spanish and finnish:
            vocabulary.append({
                'spanish': spanish,
                'finnish': finnish,
                'normalized': normalize_word(spanish)
            })
    
    return vocabulary


def build_vocabulary_index(stories_dir: Path) -> Dict[str, Dict]:
    """
    Build a vocabulary index from all stories.
    
    Returns a dictionary mapping normalized Spanish words to:
    - stories: list of story IDs containing this word
    - translations: set of Finnish translations
    - original_forms: set of original Spanish forms
    """
    index = defaultdict(lambda: {
        'stories': [],
        'translations': set(),
        'original_forms': set()
    })
    
    # Process all story files
    for level_dir in ['a1', 'a2', 'b1']:
        level_path = stories_dir / level_dir
        if not level_path.exists():
            continue
        
        for story_file in level_path.glob('*.json'):
            story_id = story_file.stem
            
            # Load story to get level and title
            with open(story_file, 'r', encoding='utf-8') as f:
                story = json.load(f)
            
            level = story.get('level', level_dir.upper())
            title = story.get('titleSpanish', story.get('title', ''))
            
            # Extract vocabulary
            vocabulary = extract_vocabulary_from_story(story_file)
            
            for vocab in vocabulary:
                normalized = vocab['normalized']
                index[normalized]['stories'].append({
                    'id': story_id,
                    'level': level,
                    'title': title
                })
                index[normalized]['translations'].add(vocab['finnish'])
                index[normalized]['original_forms'].add(vocab['spanish'])
    
    # Convert sets to lists for JSON serialization
    result = {}
    for word, data in index.items():
        result[word] = {
            'stories': data['stories'],
            'translations': sorted(list(data['translations'])),
            'original_forms': sorted(list(data['original_forms'])),
            'count': len(data['stories'])
        }
    
    return result


def generate_word_statistics(index: Dict[str, Dict]) -> Dict:
    """Generate statistics about vocabulary coverage."""
    stats = {
        'total_unique_words': len(index),
        'words_by_frequency': {},
        'words_by_level': {
            'A1': 0,
            'A2': 0,
            'B1': 0
        }
    }
    
    # Count words by frequency (how many stories they appear in)
    frequency_counts = defaultdict(int)
    for word_data in index.values():
        count = word_data['count']
        frequency_counts[count] += 1
        
        # Count by level (word appears in at least one story of this level)
        levels = {story['level'] for story in word_data['stories']}
        for level in levels:
            if level in stats['words_by_level']:
                stats['words_by_level'][level] += 1
    
    stats['words_by_frequency'] = dict(sorted(frequency_counts.items()))
    
    return stats


def main():
    """Main entry point."""
    print("=" * 60)
    print("VOCABULARY INDEX GENERATOR")
    print("=" * 60)
    print()
    
    # Paths
    project_root = Path(__file__).parent.parent
    stories_dir = project_root / 'svelte' / 'static' / 'stories'
    output_file = stories_dir / 'vocabulary-index.json'
    
    if not stories_dir.exists():
        print(f"✗ Error: Stories directory not found: {stories_dir}")
        return False
    
    print(f"📚 Reading stories from: {stories_dir}")
    print()
    
    # Build index
    print("Building vocabulary index...")
    index = build_vocabulary_index(stories_dir)
    
    # Generate statistics
    stats = generate_word_statistics(index)
    
    # Create output
    output = {
        'version': '4.0.0',
        'generated': '2026-01-14',
        'statistics': stats,
        'index': index
    }
    
    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved vocabulary index: {output_file}")
    print()
    
    # Print statistics
    print("=" * 60)
    print("STATISTICS")
    print("=" * 60)
    print(f"Total unique words: {stats['total_unique_words']}")
    print()
    print("Words by level:")
    for level, count in sorted(stats['words_by_level'].items()):
        print(f"  {level}: {count} words")
    print()
    print("Words by frequency (appears in N stories):")
    for freq, count in sorted(stats['words_by_frequency'].items()):
        print(f"  {freq} stories: {count} words")
    print()
    
    # Show some examples
    print("=" * 60)
    print("EXAMPLES")
    print("=" * 60)
    
    # Find most common words
    common_words = sorted(
        index.items(),
        key=lambda x: x[1]['count'],
        reverse=True
    )[:5]
    
    print("Most common words (appear in most stories):")
    for word, data in common_words:
        print(f"\n  '{word}' - appears in {data['count']} stories")
        print(f"    Forms: {', '.join(data['original_forms'])}")
        print(f"    Translations: {', '.join(data['translations'][:3])}")
        print(f"    Stories: {', '.join([s['id'] for s in data['stories'][:3]])}...")
    
    print()
    print("=" * 60)
    print("DONE!")
    print("=" * 60)
    
    return True


if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
