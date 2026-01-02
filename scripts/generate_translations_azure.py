#!/usr/bin/env python3
"""
Generate Finnish translations for English learning tips using Azure Translator.

Reads words_and_tips.json and translates all English hints to Finnish,
saving results to words_tips_translations.json.

The script:
- Checks if words_tips_translations.json exists and continues from there
- Only translates tips that don't have Finnish translations yet
- Saves after each word to prevent data loss
- Uses Azure Translator API instead of Ollama
"""

import argparse
import requests
import json
import time
import os
import re
import hashlib
from pathlib import Path
from tqdm import tqdm
import statistics


# Configuration
INPUT_FILE = "words_and_tips.json"
OUTPUT_FILE = "words_tips_translations.json"
CACHE_FILE = "azure_translation_cache.json"
ENV_FILE = ".env"


def load_env_file(env_path: str = ENV_FILE) -> dict:
    """
    Load environment variables from .env file.
    
    Args:
        env_path: Path to .env file
        
    Returns:
        Dictionary of environment variables
    """
    env_path = Path(env_path)
    env_vars = {}
    
    if not env_path.exists():
        print(f"Warning: .env file not found at {env_path}")
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
                         subscription_key: str, region: str, cache: dict) -> tuple:
    """
    Translate text using Azure Translator API with caching.
    
    Args:
        text: Text to translate
        source_lang: Source language code (e.g., 'en')
        target_lang: Target language code (e.g., 'fi')
        subscription_key: Azure subscription key
        region: Azure region
        cache: Cache dictionary
        
    Returns:
        Tuple of (translation, from_cache: bool)
    """
    cache_key = f"{source_lang}_{target_lang}_{get_text_hash(text)}"
    
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
                return text, False
        elif response.status_code == 429:
            tqdm.write(f"  ⚠ Rate limited, waiting 5 seconds...")
            time.sleep(5)
            # Retry once
            return translate_with_azure(text, source_lang, target_lang, subscription_key, region, cache)
        else:
            tqdm.write(f"  ✗ Error: {response.status_code} - {response.text}")
            return text, False
            
    except Exception as e:
        tqdm.write(f"  ✗ Error during translation: {e}")
        return text, False


def load_source_data():
    """Load words_and_tips.json (source with English tips)."""
    if not os.path.exists(INPUT_FILE):
        print(f"✗ {INPUT_FILE} not found!")
        return None
    
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Count words with English tips
    words_with_tips = 0
    for category in data.values():
        for word in category['words']:
            tips = word.get('learningTips', [])
            if tips:
                english_tips = [t for t in tips if isinstance(t, dict) and t.get('language') == 'english']
                if len(english_tips) >= 3:
                    words_with_tips += 1
    
    total_words = sum(len(category['words']) for category in data.values())
    print(f"✓ Loaded {INPUT_FILE} ({words_with_tips}/{total_words} have English tips)")
    return data


def load_existing_translations():
    """Load existing words_tips_translations.json if it exists."""
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Count words with Azure Finnish translations
        words_with_azure_translations = 0
        for category in data.values():
            for word in category['words']:
                tips = word.get('learningTips', [])
                if tips:
                    azure_finnish_tips = [
                        t for t in tips 
                        if isinstance(t, dict) 
                        and t.get('language') == 'finnish'
                        and t.get('translationModel') == 'azureTranslatorService'
                    ]
                    if len(azure_finnish_tips) >= 3:
                        words_with_azure_translations += 1
        
        total_words = sum(len(category['words']) for category in data.values())
        print(f"✓ Loaded {OUTPUT_FILE} ({words_with_azure_translations}/{total_words} have Azure Finnish translations)")
        return data
    else:
        print(f"✓ No existing file, will create new")
        return None


def save_data(data):
    """Save data to words_tips_translations.json."""
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def word_needs_translation(source_word, existing_translations):
    """
    Check if a word needs Finnish translations from Azure.
    
    Args:
        source_word: Word from words_and_tips.json (with English tips)
        existing_translations: Dict mapping spanish -> word from words_tips_translations.json
    
    Returns:
        (needs_translation: bool, existing_word: dict or None)
    """
    tips = source_word.get('learningTips', [])
    
    if not tips or len(tips) < 3:
        return False, None  # No English tips to translate
    
    # Check if we have English tips to translate
    english_tips = [t for t in tips if isinstance(t, dict) and t.get('language') == 'english']
    
    if len(english_tips) < 3:
        return False, None  # Not enough English tips
    
    # Check if we already have Finnish translations FROM AZURE in the output file
    spanish = source_word['spanish']
    existing_word = existing_translations.get(spanish)
    
    if existing_word:
        existing_tips = existing_word.get('learningTips', [])
        # Only check for Finnish translations with translationModel = "azureTranslatorService"
        azure_finnish_tips = [
            t for t in existing_tips 
            if isinstance(t, dict) 
            and t.get('language') == 'finnish'
            and t.get('translationModel') == 'azureTranslatorService'
        ]
        if len(azure_finnish_tips) >= 3:
            return False, existing_word  # Already has Azure Finnish translations
    
    return True, existing_word


def translate_hints_azure(word, english_tips, subscription_key, region, cache):
    """
    Translate 3 English hints to Finnish using Azure in one API call.
    
    Returns (finnish_tips, duration, api_calls)
    """
    start_time = time.time()
    
    english_word = word['english']
    finnish_word = word['finnish']
    
    from tqdm import tqdm as tqdm_module
    tqdm_module.write(f"  🌍 Translating '{english_word}' → '{finnish_word}'...")
    
    # Format all 3 tips as numbered list
    numbered_text = '\n'.join([
        f"{i+1}. {tip['text']}"
        for i, tip in enumerate(english_tips)
    ])
    
    # Translate all at once
    translation, from_cache = translate_with_azure(
        text=numbered_text,
        source_lang='en',
        target_lang='fi',
        subscription_key=subscription_key,
        region=region,
        cache=cache
    )
    
    api_calls = 0 if from_cache else 1
    cache_symbol = "💾" if from_cache else "🌐"
    tqdm_module.write(f"    {cache_symbol} Translated all 3 tips")
    
    # Parse numbered list from response
    lines = translation.strip().split('\n')
    translations = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Match numbered lines: "1. text" or "1) text"
        match = re.match(r'^(\d+)[\.\)]\s*(.+)$', line)
        if match:
            translations.append(match.group(2).strip())
    
    if len(translations) < 3:
        tqdm_module.write(f"  ⚠ Warning: Only got {len(translations)} translations, expected 3")
        return None, time.time() - start_time, api_calls
    
    # Build Finnish tips
    difficulties = ['easy', 'medium', 'hard']
    finnish_tips = []
    for i in range(3):
        finnish_tips.append({
            'language': 'finnish',
            'difficulty': difficulties[i],
            'text': translations[i],
            'tipModel': english_tips[i].get('tipModel', 'unknown'),
            'translationModel': 'azureTranslatorService'
        })
        tqdm_module.write(f"    {difficulties[i]}: {translations[i][:60]}...")
    
    duration = time.time() - start_time
    return finnish_tips, duration, api_calls


def format_time(seconds):
    """Format seconds into human-readable time."""
    if seconds < 60:
        return f"{seconds:.0f}s"
    elif seconds < 3600:
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins}m {secs}s"
    else:
        hours = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        return f"{hours}h {mins}m"


def print_translations(word, english_tips, finnish_tips, duration):
    """Print translated tips in a nice format."""
    print(f"\n{'─' * 80}")
    print(f"🌍 {word['spanish'].upper()} = {word['english']} → {word['finnish']} | ⏱️  {duration:.1f}s")
    print(f"{'─' * 80}")
    
    for eng_tip, fin_tip in zip(english_tips, finnish_tips):
        difficulty_emoji = {'easy': '🟢', 'medium': '🟡', 'hard': '🔴'}
        emoji = difficulty_emoji.get(eng_tip['difficulty'], '⚪')
        print(f"{emoji} {eng_tip['difficulty'].upper():6s}:")
        print(f"  🇬🇧 {eng_tip['text']}")
        print(f"  🇫🇮 {fin_tip['text']}")
    
    print(f"{'─' * 80}")


def generate_all_translations(limit=None):
    """Main function to generate Finnish translations for all words using Azure.
    
    Args:
        limit: Maximum number of words to translate (None = translate all)
    """
    print("=" * 80)
    print("GENERATE FINNISH TRANSLATIONS WITH AZURE TRANSLATOR")
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
    print(f"✓ {len(cache)} cached translations")
    
    # Load source data (English tips)
    print(f"📖 Reading {INPUT_FILE}...", end=" ")
    source_data = load_source_data()
    if source_data is None:
        return
    
    # Load existing translations (if any)
    print(f"📖 Reading {OUTPUT_FILE}...", end=" ")
    existing_data = load_existing_translations()
    
    # Build lookup dict for existing translations: spanish -> word
    existing_translations = {}
    if existing_data:
        for category in existing_data.values():
            for word in category['words']:
                spanish = word['spanish']
                existing_translations[spanish] = word
    
    # Count words that need translation
    words_to_process = []
    for category_key, category in source_data.items():
        for word in category['words']:
            needs_translation, existing_word = word_needs_translation(word, existing_translations)
            if needs_translation:
                # Get English tips from source
                english_tips = [t for t in word.get('learningTips', []) 
                               if isinstance(t, dict) and t.get('language') == 'english']
                if len(english_tips) == 3:
                    words_to_process.append((category_key, word, english_tips, existing_word))
    
    total_words = sum(len(category['words']) for category in source_data.values())
    words_translated = total_words - len(words_to_process)
    
    # Initialize output data structure
    if existing_data:
        data = existing_data
    else:
        data = source_data.copy()  # Start with source data structure
    
    print("\n" + "=" * 80)
    print(f"📊 STATUS")
    print("=" * 80)
    print(f"  Total words:              {total_words}")
    print(f"  Already have Azure FI:    {words_translated}")
    print(f"  Need Azure translation:   {len(words_to_process)}")
    if limit:
        print(f"  Limit specified:          {limit}")
        print(f"  Will translate:           {min(limit, len(words_to_process))}")
    
    if len(words_to_process) == 0:
        print("\n✅ All words already have Azure Finnish translations!")
        print("=" * 80)
        return
    
    # Apply limit if specified
    if limit:
        words_to_process = words_to_process[:limit]
        print(f"  Processing first {len(words_to_process)} words only")
    
    # Estimate time (Azure is much faster than Ollama - assume ~2-3s per word)
    estimated_time_per_word = 2.5
    estimated_total = estimated_time_per_word * len(words_to_process)
    print(f"  Estimated time:           ~{format_time(estimated_total)} (assuming ~{estimated_time_per_word}s/word)")
    print("=" * 80)
    
    # Process each word with progress bar
    processed = 0
    failed = 0
    durations = []
    total_api_calls = 0
    
    print("\n🚀 Starting translation generation...\n")
    
    with tqdm(total=len(words_to_process), 
              desc="Translating", 
              unit="word",
              bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}]',
              ncols=80) as pbar:
        
        for category_key, word, english_tips, existing_word in words_to_process:
            processed += 1
            
            # Update progress bar description with current word
            pbar.set_description(f"Translating {word['spanish']:15s}")
            
            # Translate using Azure
            finnish_tips, duration, api_calls = translate_hints_azure(
                word, english_tips, subscription_key, region, cache
            )
            
            if finnish_tips and len(finnish_tips) == 3:
                durations.append(duration)
                total_api_calls += api_calls
                
                # Update word in data - add Azure Finnish translations to existing tips
                for cat_key, category in data.items():
                    if cat_key == category_key:
                        # Find or create word in output data
                        found_word = None
                        for w in category['words']:
                            if w['spanish'] == word['spanish']:
                                found_word = w
                                break
                        
                        if found_word:
                            # Update existing word: keep existing tips and add Azure Finnish translations
                            existing_tips = found_word.get('learningTips', [])
                            
                            # Remove any old Azure Finnish translations (in case we're re-translating)
                            filtered_tips = [
                                t for t in existing_tips
                                if not (t.get('language') == 'finnish' and t.get('translationModel') == 'azureTranslatorService')
                            ]
                            
                            # Add English tips if not already present
                            existing_english = [t for t in filtered_tips if t.get('language') == 'english']
                            if not existing_english:
                                filtered_tips.extend(english_tips)
                            
                            # Add new Azure Finnish translations
                            filtered_tips.extend(finnish_tips)
                            
                            found_word['learningTips'] = filtered_tips
                        else:
                            # Word doesn't exist in output, add it with both English and Finnish tips
                            new_word = word.copy()
                            new_word['learningTips'] = english_tips + finnish_tips
                            category['words'].append(new_word)
                        break
                else:
                    # Category doesn't exist in output, create it
                    data[category_key] = {
                        'name': source_data[category_key]['name'],
                        'words': []
                    }
                    new_word = word.copy()
                    new_word['learningTips'] = english_tips + finnish_tips
                    data[category_key]['words'].append(new_word)
                
                # Save after each word
                save_data(data)
                
                # Print translations nicely
                tqdm.write("")  # Empty line
                print_translations(word, english_tips, finnish_tips, duration)
                tqdm.write("")  # Empty line
                
                # Update time estimate based on actual average
                if len(durations) >= 3:
                    avg_duration = statistics.mean(durations)
                    remaining_words = len(words_to_process) - processed
                    estimated_remaining = avg_duration * remaining_words
                    pbar.set_postfix_str(f"avg: {avg_duration:.1f}s/word, eta: {format_time(estimated_remaining)}")
            else:
                failed += 1
                tqdm.write(f"✗ Failed to translate {word['spanish']} ({word['english']})")
            
            # Update progress bar
            pbar.update(1)
    
    # Final summary
    print("\n" + "=" * 80)
    print("📈 SUMMARY")
    print("=" * 80)
    print(f"  Words processed:         {processed}")
    print(f"  Successfully translated:  {processed - failed}")
    print(f"  Failed:                  {failed}")
    print(f"  Azure API calls:         {total_api_calls}")
    print(f"  Cache hits:              {processed - total_api_calls}")
    
    if durations:
        avg_duration = statistics.mean(durations)
        min_duration = min(durations)
        max_duration = max(durations)
        total_time = sum(durations)
        
        print(f"\n  ⏱️  TIMING STATISTICS")
        print(f"  {'─' * 76}")
        print(f"  Total time:              {format_time(total_time)}")
        print(f"  Average per word:        {avg_duration:.1f}s")
        print(f"  Fastest:                 {min_duration:.1f}s")
        print(f"  Slowest:                 {max_duration:.1f}s")
    
    print(f"\n  💾 Data saved to: {OUTPUT_FILE}")
    print(f"  💾 Cache saved to: {CACHE_FILE}")
    print("=" * 80)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Generate Finnish translations using Azure Translator'
    )
    parser.add_argument(
        '--limit', '-n',
        type=int,
        default=10,
        help='Maximum number of words to translate (default: 10, use 0 or negative for all)'
    )
    
    args = parser.parse_args()
    limit = None if args.limit <= 0 else args.limit
    generate_all_translations(limit=limit)

