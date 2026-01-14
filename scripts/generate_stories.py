#!/usr/bin/env python3
"""
Story Generation Script
Converts V4_material.txt stories into JSON format for the Espanjapeli app.
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional


def parse_story_section(text: str) -> Optional[Dict]:
    """Parse a single story section from V4_material.txt"""
    
    # Extract story metadata
    id_match = re.search(r'ID:\s*(\S+)', text)
    title_en_match = re.search(r'Title EN:\s*(.+)', text)
    title_es_match = re.search(r'Title ES:\s*(.+)', text)
    category_match = re.search(r'Category:\s*(\S+)', text)
    difficulty_match = re.search(r'Difficulty:\s*(\S+)', text)
    icon_match = re.search(r'Icon:\s*(.+)', text)
    
    if not all([id_match, title_en_match, title_es_match]):
        return None
    
    story_id = id_match.group(1).strip()
    title_en = title_en_match.group(1).strip()
    title_es = title_es_match.group(1).strip()
    category = category_match.group(1).strip() if category_match else "general"
    difficulty = difficulty_match.group(1).strip() if difficulty_match else "beginner"
    icon = icon_match.group(1).strip() if icon_match else "📖"
    
    # Map difficulty to CEFR level
    level_map = {
        'absolute-beginner': 'A1',
        'beginner': 'A2',
        'intermediate': 'B1',
        'advanced': 'B2'
    }
    level = level_map.get(difficulty, 'A2')
    
    # Extract dialogue
    dialogue = []
    dialogue_section = re.search(r'DIALOGUE:(.*?)(?=VOCABULARY:|$)', text, re.DOTALL)
    if dialogue_section:
        dialogue_text = dialogue_section.group(1)
        # Parse dialogue lines
        lines = dialogue_text.strip().split('\n')
        current_speaker = None
        current_spanish = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if it's a speaker line (Name: Spanish text)
            speaker_match = re.match(r'^([A-Za-zÁÉÍÓÚáéíóúÑñ]+):\s*(.+)', line)
            if speaker_match:
                # Save previous line if exists
                if current_speaker and current_spanish:
                    dialogue.append({
                        'speaker': current_speaker,
                        'spanish': current_spanish,
                        'finnish': ''  # Will be filled by translation
                    })
                
                current_speaker = speaker_match.group(1)
                current_spanish = speaker_match.group(2)
            # Check if it's a translation line (starts with parentheses)
            elif line.startswith('(') and line.endswith(')'):
                # This is English translation, we'll skip it for now
                # Finnish translation will be added later
                pass
        
        # Add last dialogue line
        if current_speaker and current_spanish:
            dialogue.append({
                'speaker': current_speaker,
                'spanish': current_spanish,
                'finnish': ''
            })
    
    # Extract vocabulary
    vocabulary = []
    vocab_section = re.search(r'VOCABULARY:(.*?)(?=QUESTIONS:|$)', text, re.DOTALL)
    if vocab_section:
        vocab_text = vocab_section.group(1)
        lines = vocab_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('-'):
                # Parse format: - spanish = english/finnish
                vocab_match = re.match(r'-\s*(.+?)\s*=\s*(.+)', line)
                if vocab_match:
                    spanish = vocab_match.group(1).strip()
                    translation = vocab_match.group(2).strip()
                    vocabulary.append({
                        'spanish': spanish,
                        'finnish': translation  # Assuming English for now, needs Finnish translation
                    })
    
    # Extract questions
    questions = []
    questions_section = re.search(r'QUESTIONS:(.*?)(?=------|$)', text, re.DOTALL)
    if questions_section:
        questions_text = questions_section.group(1)
        lines = questions_text.strip().split('\n')
        
        current_question = None
        current_answers = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Check if it's a question line
            q_match = re.match(r'Q\d+:\s*(.+)', line)
            if q_match:
                # Save previous question if exists
                if current_question and current_answers:
                    # Find correct answer
                    correct_idx = 0
                    options = []
                    for i, ans in enumerate(current_answers):
                        if '(Correct)' in ans:
                            correct_idx = i
                            options.append(ans.replace('(Correct)', '').strip())
                        else:
                            options.append(ans.strip())
                    
                    questions.append({
                        'question': current_question,
                        'options': options,
                        'correctIndex': correct_idx,
                        'explanation': ''
                    })
                
                current_question = q_match.group(1)
                current_answers = []
            # Check if it's an answer line
            elif line.startswith('A:'):
                # Parse format: A: Option1 (Correct) / Option2 / Option3
                answers_text = line[2:].strip()
                current_answers = [a.strip() for a in answers_text.split('/')]
        
        # Add last question
        if current_question and current_answers:
            correct_idx = 0
            options = []
            for i, ans in enumerate(current_answers):
                if '(Correct)' in ans:
                    correct_idx = i
                    options.append(ans.replace('(Correct)', '').strip())
                else:
                    options.append(ans.strip())
            
            questions.append({
                'question': current_question,
                'options': options,
                'correctIndex': correct_idx,
                'explanation': ''
            })
    
    # Calculate word count and estimated minutes
    word_count = sum(len(line['spanish'].split()) for line in dialogue)
    estimated_minutes = max(2, word_count // 30)  # Rough estimate
    
    # Build story object
    story = {
        'id': story_id,
        'title': title_en,  # Will need Finnish translation
        'titleSpanish': title_es,
        'description': f'A {level} level story about {category}',  # Placeholder
        'level': level,
        'difficulty': difficulty,  # Keep for reference
        'category': category,
        'icon': icon,
        'dialogue': dialogue,
        'vocabulary': vocabulary,
        'questions': questions,
        'wordCount': word_count,
        'estimatedMinutes': estimated_minutes,
        'version': 1,
        'createdAt': '2026-01-14',
        'updatedAt': '2026-01-14'
    }
    
    return story


def extract_stories_from_material(material_file: Path) -> Dict[str, List[Dict]]:
    """Extract all stories from V4_material.txt and group by level"""
    
    with open(material_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by story sections
    story_sections = re.split(r'-{80,}\nSTORY', content)
    
    stories_by_level = {
        'A1': [],
        'A2': [],
        'B1': []
    }
    
    for section in story_sections[1:]:  # Skip first split (header)
        section = 'STORY' + section  # Add back the STORY prefix
        story = parse_story_section(section)
        if story:
            level = story['level']
            if level in stories_by_level:
                stories_by_level[level].append(story)
                print(f"✓ Parsed: {story['id']} ({level})")
    
    return stories_by_level


def save_stories(stories_by_level: Dict[str, List[Dict]], output_dir: Path):
    """Save stories to JSON files organized by level"""
    
    for level, stories in stories_by_level.items():
        level_dir = output_dir / level.lower()
        level_dir.mkdir(parents=True, exist_ok=True)
        
        for story in stories:
            story_file = level_dir / f"{story['id']}.json"
            
            # Skip if file already exists
            if story_file.exists():
                print(f"⊘ Skipped (exists): {story_file}")
                continue
            
            with open(story_file, 'w', encoding='utf-8') as f:
                json.dump(story, f, indent=2, ensure_ascii=False)
            print(f"✓ Saved: {story_file}")
    
    # Update manifest
    update_manifest(stories_by_level, output_dir)


def update_manifest(stories_by_level: Dict[str, List[Dict]], output_dir: Path):
    """Update the stories manifest file"""
    
    manifest_file = output_dir / 'manifest.json'
    
    # Load existing manifest if it exists
    if manifest_file.exists():
        with open(manifest_file, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
    else:
        manifest = {
            'version': '4.0.0',
            'lastUpdated': '2026-01-14',
            'stories': []
        }
    
    # Add new stories to manifest
    existing_ids = {s['id'] for s in manifest['stories']}
    
    for level, stories in stories_by_level.items():
        for story in stories:
            if story['id'] not in existing_ids:
                manifest['stories'].append({
                    'id': story['id'],
                    'title': story['title'],
                    'titleSpanish': story['titleSpanish'],
                    'level': story['level'],
                    'category': story['category'],
                    'icon': story['icon'],
                    'wordCount': story['wordCount'],
                    'estimatedMinutes': story['estimatedMinutes']
                })
    
    # Save manifest
    with open(manifest_file, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Updated manifest: {manifest_file}")


def main():
    """Main entry point"""
    
    # Paths
    project_root = Path(__file__).parent.parent
    material_file = project_root / 'docs' / 'V4_material.txt'
    output_dir = project_root / 'svelte' / 'static' / 'stories'
    
    if not material_file.exists():
        print(f"Error: {material_file} not found")
        sys.exit(1)
    
    print(f"Reading stories from: {material_file}")
    print()
    
    # Extract stories
    stories_by_level = extract_stories_from_material(material_file)
    
    # Print summary
    print()
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for level, stories in stories_by_level.items():
        print(f"{level}: {len(stories)} stories")
    print()
    
    # Save stories
    save_stories(stories_by_level, output_dir)
    
    print()
    print("=" * 60)
    print("DONE!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. Run Finnish translation script on new stories")
    print("2. Review and edit stories for quality")
    print("3. Test stories in the app")


if __name__ == '__main__':
    main()
