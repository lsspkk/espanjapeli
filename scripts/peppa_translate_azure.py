#!/usr/bin/env python3
"""
Translate Peppa Pig Spanish material to Finnish using Azure Translator.

This script:
- Creates a backup of the original peppa_advanced_spanish.json files
- Translates Spanish phrases to Finnish using Azure Translator API
- Uses and updates the existing azure_translation_cache.json
- Saves translated content back to the original files
"""

import argparse
import requests
import json
import time
import os
import shutil
import hashlib
from pathlib import Path
from datetime import datetime
from tqdm import tqdm


# Configuration
SCRIPT_DIR = Path(__file__).parent
DOCS_THEMES_FILE = SCRIPT_DIR.parent / "docs" / "themes" / "peppa_advanced_spanish.json"
SVELTE_THEMES_FILE = SCRIPT_DIR.parent / "svelte" / "static" / "themes" / "peppa_advanced_spanish.json"
CACHE_FILE = SCRIPT_DIR / "azure_translation_cache.json"
ENV_FILE = SCRIPT_DIR / ".env"


def load_env_file(env_path: Path = ENV_FILE) -> dict:
    """
    Load environment variables from .env file.
    
    Args:
        env_path: Path to .env file
        
    Returns:
        Dictionary of environment variables
    """
    env_vars = {}
    
    if not env_path.exists():
        print(f"✗ Error: .env file not found at {env_path}")
        return env_vars
    
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                # Parse KEY=VALUE format
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    # Remove quotes if present
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    env_vars[key] = value
    except Exception as e:
        print(f"✗ Error loading .env file: {e}")
    
    return env_vars


def get_text_hash(text: str, source_lang: str = "es", target_lang: str = "fi") -> str:
    """Generate cache key for translation."""
    return f"{source_lang}_{target_lang}_{hashlib.md5(text.encode('utf-8')).hexdigest()}"


def load_cache() -> dict:
    """Load translation cache from JSON file."""
    if not CACHE_FILE.exists():
        return {}
    
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"⚠ Warning: Could not load cache file: {e}")
        return {}


def save_cache(cache: dict):
    """Save translation cache to JSON file."""
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except IOError as e:
        print(f"⚠ Warning: Could not save cache file: {e}")


def translate_with_azure(text: str, subscription_key: str, region: str, 
                         cache: dict, source_lang: str = "es", 
                         target_lang: str = "fi") -> tuple:
    """
    Translate text using Azure Translator API with caching.
    
    Args:
        text: Text to translate
        subscription_key: Azure subscription key
        region: Azure region
        cache: Cache dictionary
        source_lang: Source language code (default: 'es' for Spanish)
        target_lang: Target language code (default: 'fi' for Finnish)
        
    Returns:
        Tuple of (translation, from_cache: bool)
    """
    cache_key = get_text_hash(text, source_lang, target_lang)
    
    # Check cache first
    if cache_key in cache:
        return cache[cache_key], True
    
    # Make API request
    endpoint = "https://api.cognitive.microsofttranslator.com/translate"
    
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
                
                return translation, False
            else:
                tqdm.write(f"  ⚠ Unexpected response format: {result}")
                return None, False
        elif response.status_code == 429:
            tqdm.write(f"  ⚠ Rate limited, waiting 5 seconds...")
            time.sleep(5)
            # Retry once
            return translate_with_azure(text, subscription_key, region, cache, source_lang, target_lang)
        else:
            tqdm.write(f"  ✗ Error: {response.status_code} - {response.text}")
            return None, False
            
    except Exception as e:
        tqdm.write(f"  ✗ Error during translation: {e}")
        return None, False


def create_backup(file_path: Path) -> Path:
    """Create a timestamped backup of the file."""
    if not file_path.exists():
        return None
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = file_path.parent / f"{file_path.stem}_backup_{timestamp}{file_path.suffix}"
    
    shutil.copy2(file_path, backup_path)
    return backup_path


def load_peppa_data(file_path: Path) -> dict:
    """Load Peppa Pig JSON data."""
    if not file_path.exists():
        print(f"✗ Error: File not found: {file_path}")
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError) as e:
        print(f"✗ Error loading {file_path}: {e}")
        return None


def save_peppa_data(data: dict, file_path: Path):
    """Save Peppa Pig JSON data."""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except IOError as e:
        print(f"✗ Error saving {file_path}: {e}")
        return False


def collect_items_to_translate(data: dict) -> list:
    """
    Collect all items that need Finnish translation.
    
    Returns list of tuples: (section_key, item_index, item, spanish_text)
    For nested structures like episode_specific_vocabulary, returns:
    (section_key, subsection_key, item_index, item, spanish_text)
    """
    items = []
    
    # Keys that contain arrays of phrase/word objects
    array_sections = [
        'introduction_phrases',
        'common_phrases', 
        'family_phrases',
        'school_phrases',
        'friendship_phrases',
        'activities_and_games',
        'emotions_and_reactions',
        'questions_and_answers',
        'weather_phrases',
        'time_phrases',
        'food_phrases',
        'places_vocabulary',
        'verbs_from_episodes',
        'numbers_from_show',
        'colors_from_show',
        'animals_from_show',
        'sentence_patterns',
    ]
    
    # Process regular array sections
    for section_key in array_sections:
        if section_key in data:
            section = data[section_key]
            if isinstance(section, list):
                for idx, item in enumerate(section):
                    if isinstance(item, dict) and 'spanish' in item:
                        finnish = item.get('finnish', '')
                        if not finnish or finnish.strip() == '':
                            items.append((section_key, idx, item, item['spanish']))
    
    # Process nested episode_specific_vocabulary
    if 'episode_specific_vocabulary' in data:
        episode_vocab = data['episode_specific_vocabulary']
        if isinstance(episode_vocab, dict):
            for subsection_key, subsection in episode_vocab.items():
                if isinstance(subsection, list):
                    for idx, item in enumerate(subsection):
                        if isinstance(item, dict) and 'spanish' in item:
                            finnish = item.get('finnish', '')
                            if not finnish or finnish.strip() == '':
                                items.append(('episode_specific_vocabulary', subsection_key, idx, item, item['spanish']))
    
    return items


def translate_peppa_material(limit: int = None):
    """
    Main function to translate Peppa Pig material from Spanish to Finnish.
    
    Args:
        limit: Maximum number of items to translate (None = translate all)
    """
    print("=" * 80)
    print("🐷 PEPPA PIG (PIPSA POSSU) - SPANISH TO FINNISH TRANSLATION")
    print("=" * 80)
    
    # Load Azure credentials
    print("\n📖 Loading Azure credentials...", end=" ")
    env_vars = load_env_file()
    
    subscription_key = env_vars.get('AZURE_TRANSLATOR_KEY1') or env_vars.get('AZURE_TRANSLATOR_KEY')
    region = env_vars.get('AZURE_TRANSLATOR_REGION', 'westeurope')
    
    if not subscription_key:
        print(f"\n✗ Error: AZURE_TRANSLATOR_KEY1 not found in {ENV_FILE}")
        print("  Please add your Azure subscription key to the .env file")
        return
    
    print(f"✓ Loaded (region: {region})")
    
    # Load translation cache
    print(f"📖 Loading translation cache...", end=" ")
    cache = load_cache()
    initial_cache_size = len(cache)
    print(f"✓ {initial_cache_size} cached translations")
    
    # Check which files exist
    docs_exists = DOCS_THEMES_FILE.exists()
    svelte_exists = SVELTE_THEMES_FILE.exists()
    
    if not docs_exists and not svelte_exists:
        print(f"\n✗ Error: No Peppa Pig files found!")
        print(f"  Expected: {DOCS_THEMES_FILE}")
        print(f"       or: {SVELTE_THEMES_FILE}")
        return
    
    # Use docs file as primary, svelte as secondary
    primary_file = DOCS_THEMES_FILE if docs_exists else SVELTE_THEMES_FILE
    
    print(f"\n📂 FILES:")
    print(f"  Primary:   {primary_file} {'✓' if docs_exists else '✗'}")
    print(f"  Secondary: {SVELTE_THEMES_FILE} {'✓' if svelte_exists else '✗'}")
    
    # Create backups
    print(f"\n💾 Creating backups...")
    if docs_exists:
        backup1 = create_backup(DOCS_THEMES_FILE)
        if backup1:
            print(f"  ✓ {backup1.name}")
    if svelte_exists:
        backup2 = create_backup(SVELTE_THEMES_FILE)
        if backup2:
            print(f"  ✓ {backup2.name}")
    
    # Load data
    print(f"\n📖 Loading Peppa Pig data...", end=" ")
    data = load_peppa_data(primary_file)
    if data is None:
        return
    print("✓")
    
    # Collect items needing translation
    items_to_translate = collect_items_to_translate(data)
    total_items = len(items_to_translate)
    
    print("\n" + "=" * 80)
    print(f"📊 STATUS")
    print("=" * 80)
    print(f"  Items needing Finnish translation: {total_items}")
    
    if total_items == 0:
        print("\n✅ All items already have Finnish translations!")
        print("=" * 80)
        return
    
    if limit:
        print(f"  Limit specified: {limit}")
        items_to_translate = items_to_translate[:limit]
        print(f"  Will translate: {len(items_to_translate)}")
    
    print("=" * 80)
    
    # Translate items
    print("\n🚀 Starting translations...\n")
    
    translated = 0
    failed = 0
    cached = 0
    
    with tqdm(total=len(items_to_translate), 
              desc="Translating", 
              unit="item",
              bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}]',
              ncols=80) as pbar:
        
        for item_tuple in items_to_translate:
            # Handle both regular and nested (episode_specific_vocabulary) items
            if len(item_tuple) == 4:
                section_key, idx, item, spanish_text = item_tuple
                subsection_key = None
            else:
                section_key, subsection_key, idx, item, spanish_text = item_tuple
            
            pbar.set_description(f"Translating: {spanish_text[:30]:30s}")
            
            # Translate
            finnish, from_cache = translate_with_azure(
                spanish_text, 
                subscription_key, 
                region, 
                cache
            )
            
            if finnish:
                translated += 1
                if from_cache:
                    cached += 1
                    cache_symbol = "💾"
                else:
                    cache_symbol = "🌐"
                
                # Update the item in data
                if subsection_key:
                    # Nested structure
                    data[section_key][subsection_key][idx]['finnish'] = finnish
                else:
                    # Regular structure
                    data[section_key][idx]['finnish'] = finnish
                
                tqdm.write(f"  {cache_symbol} {spanish_text[:40]:40s} → {finnish[:40]}")
            else:
                failed += 1
                tqdm.write(f"  ✗ Failed: {spanish_text[:50]}")
            
            pbar.update(1)
    
    # Save updated data
    print(f"\n💾 Saving translated data...")
    
    if docs_exists:
        if save_peppa_data(data, DOCS_THEMES_FILE):
            print(f"  ✓ Saved to {DOCS_THEMES_FILE}")
    
    if svelte_exists:
        if save_peppa_data(data, SVELTE_THEMES_FILE):
            print(f"  ✓ Saved to {SVELTE_THEMES_FILE}")
    
    # Final summary
    print("\n" + "=" * 80)
    print("📈 SUMMARY")
    print("=" * 80)
    print(f"  Items processed:         {len(items_to_translate)}")
    print(f"  Successfully translated: {translated}")
    print(f"  From cache:              {cached}")
    print(f"  New API calls:           {translated - cached}")
    print(f"  Failed:                  {failed}")
    print(f"\n  Cache size before:       {initial_cache_size}")
    print(f"  Cache size after:        {len(cache)}")
    print(f"  New cache entries:       {len(cache) - initial_cache_size}")
    print(f"\n  💾 Cache saved to: {CACHE_FILE}")
    print("=" * 80)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Translate Peppa Pig Spanish material to Finnish using Azure Translator'
    )
    parser.add_argument(
        '--limit', '-n',
        type=int,
        default=None,
        help='Maximum number of items to translate (default: all)'
    )
    
    args = parser.parse_args()
    translate_peppa_material(limit=args.limit)
