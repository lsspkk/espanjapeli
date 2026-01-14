#!/usr/bin/env python3
"""
Translate story dialogues and vocabulary from English/Spanish to Finnish.
Uses Azure Translator API with caching.
"""

import json
import os
import hashlib
import requests
from pathlib import Path
from typing import Dict, List


# Configuration
CACHE_FILE = "translation_cache.json"


def load_env_file(env_path: str = ".env") -> dict:
    """Load environment variables from .env file."""
    env_path = Path(env_path)
    env_vars = {}
    
    if not env_path.exists():
        print(f"Warning: .env file not found at {env_path}")
        return env_vars
    
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    env_vars[key] = value
    except Exception as e:
        print(f"Error loading .env file: {e}")
    
    return env_vars


def get_text_hash(text: str) -> str:
    """Generate MD5 hash for cache key."""
    return hashlib.md5(text.encode('utf-8')).hexdigest()


def load_cache() -> dict:
    """Load translation cache from JSON file."""
    if not os.path.exists(CACHE_FILE):
        return {}
    
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"Warning: Could not load cache file: {e}")
        return {}


def save_cache(cache: dict):
    """Save translation cache to JSON file."""
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except IOError as e:
        print(f"Warning: Could not save cache file: {e}")


def translate_with_azure(text: str, source_lang: str, target_lang: str, 
                         subscription_key: str, region: str = "westeurope") -> str:
    """Translate text using Azure Translator API with caching."""
    endpoint = "https://api.cognitive.microsofttranslator.com/translate"
    
    # Check cache first
    cache = load_cache()
    cache_key = f"{source_lang}_{target_lang}_{get_text_hash(text)}"
    
    if cache_key in cache:
        return cache[cache_key]
    
    # Make API request
    headers = {
        'Ocp-Apim-Subscription-Key': subscription_key,
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json'
    }
    
    params = {
        'api-version': '3.0',
        'from': source_lang,
        'to': target_lang
    }
    
    body = [{'text': text}]
    
    try:
        response = requests.post(
            endpoint,
            params=params,
            json=body,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            if result and len(result) > 0 and 'translations' in result[0]:
                translation = result[0]['translations'][0]['text']
                
                # Save to cache
                cache[cache_key] = translation
                save_cache(cache)
                
                return translation
            else:
                print(f"Unexpected response format: {result}")
                return text
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return text
            
    except Exception as e:
        print(f"Error during translation: {e}")
        return text


def translate_story(story_path: Path, subscription_key: str, region: str) -> bool:
    """Translate a single story file."""
    
    # Load story
    with open(story_path, 'r', encoding='utf-8') as f:
        story = json.load(f)
    
    modified = False
    
    # Translate dialogue Finnish fields
    for line in story.get('dialogue', []):
        if not line.get('finnish'):
            spanish_text = line.get('spanish', '')
            if spanish_text:
                print(f"  Translating dialogue: {spanish_text[:50]}...")
                finnish = translate_with_azure(spanish_text, 'es', 'fi', subscription_key, region)
                line['finnish'] = finnish
                modified = True
    
    # Translate vocabulary Finnish fields (from English)
    for vocab in story.get('vocabulary', []):
        finnish_text = vocab.get('finnish', '')
        # If it looks like English (contains common English words), translate it
        if finnish_text and any(word in finnish_text.lower() for word in ['to be', 'to ', 'the ', 'a ', 'an ']):
            print(f"  Translating vocab: {vocab.get('spanish')} = {finnish_text[:30]}...")
            finnish = translate_with_azure(finnish_text, 'en', 'fi', subscription_key, region)
            vocab['finnish'] = finnish
            modified = True
    
    # Translate title if needed
    if not story.get('title') or story.get('title') == story.get('titleSpanish'):
        print(f"  Translating title: {story.get('titleSpanish')}...")
        title_fi = translate_with_azure(story.get('titleSpanish', ''), 'es', 'fi', subscription_key, region)
        story['title'] = title_fi
        modified = True
    
    # Translate questions from English to Finnish
    for question in story.get('questions', []):
        q_text = question.get('question', '')
        if q_text:
            # Check if it's in English (simple heuristic)
            if any(word in q_text.lower() for word in ['what', 'where', 'when', 'who', 'how', 'does', 'is', 'are']):
                print(f"  Translating question: {q_text[:50]}...")
                q_fi = translate_with_azure(q_text, 'en', 'fi', subscription_key, region)
                question['question'] = q_fi
                modified = True
        
        # Translate options
        for i, option in enumerate(question.get('options', [])):
            if option and isinstance(option, str):
                # Simple check if it's English
                if any(word in option.lower() for word in ['yes', 'no', 'the', 'a', 'an', 'to', 'from']):
                    print(f"    Translating option: {option[:30]}...")
                    opt_fi = translate_with_azure(option, 'en', 'fi', subscription_key, region)
                    question['options'][i] = opt_fi
                    modified = True
    
    # Save story if modified
    if modified:
        with open(story_path, 'w', encoding='utf-8') as f:
            json.dump(story, f, indent=2, ensure_ascii=False)
        return True
    
    return False


def main():
    """Main entry point."""
    print("=" * 60)
    print("STORY TRANSLATION SCRIPT")
    print("=" * 60)
    
    # Load Azure credentials
    print("\n📖 Loading Azure credentials...")
    env_vars = load_env_file()
    
    subscription_key = env_vars.get('AZURE_TRANSLATOR_KEY1') or env_vars.get('AZURE_TRANSLATOR_KEY')
    region = env_vars.get('AZURE_TRANSLATOR_REGION', 'westeurope')
    
    if not subscription_key:
        print("✗ Error: AZURE_TRANSLATOR_KEY1 not found in .env file")
        print("  Please add your Azure subscription key to .env")
        return
    
    print(f"✓ Loaded Azure credentials (region: {region})")
    
    # Find all story files
    project_root = Path(__file__).parent.parent
    stories_dir = project_root / 'svelte' / 'static' / 'stories'
    
    story_files = []
    for level_dir in ['a1', 'a2', 'b1']:
        level_path = stories_dir / level_dir
        if level_path.exists():
            story_files.extend(level_path.glob('*.json'))
    
    print(f"\n📚 Found {len(story_files)} story files")
    print()
    
    # Translate each story
    translated_count = 0
    for story_file in story_files:
        print(f"Processing: {story_file.name}")
        if translate_story(story_file, subscription_key, region):
            translated_count += 1
            print(f"  ✓ Updated")
        else:
            print(f"  ✓ Already translated")
        print()
    
    print("=" * 60)
    print(f"DONE! Translated {translated_count} stories")
    print("=" * 60)


if __name__ == '__main__':
    main()
