#!/usr/bin/env python3
"""
Translate distractor image descriptions from English to Finnish using Azure Translator.

Reads distractorImages from image_manifest.json and creates distractor_translations.json
with Finnish translations for TTS use in the pipsan-ystavat game.
"""

import json
import os
import hashlib
from pathlib import Path

# Configuration
MANIFEST_PATH = "../svelte/static/peppa_advanced_spanish_images/image_manifest.json"
OUTPUT_PATH = "../svelte/static/peppa_advanced_spanish_images/distractor_translations.json"
CACHE_FILE = "azure_translation_cache.json"
ENV_FILE = ".env"


def load_env_file(env_path: str = ENV_FILE) -> dict:
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


def translate_with_azure(texts: list[str], source_lang: str, target_lang: str, 
                         subscription_key: str, region: str, cache: dict) -> list[tuple[str, bool]]:
    """
    Translate multiple texts using Azure Translator API with caching.
    
    Returns list of (translation, from_cache) tuples.
    """
    import requests
    
    results = []
    texts_to_translate = []
    text_indices = []
    
    # Check cache for each text
    for i, text in enumerate(texts):
        cache_key = f"{source_lang}_{target_lang}_{get_text_hash(text)}"
        if cache_key in cache:
            results.append((cache[cache_key], True))
        else:
            results.append(None)  # Placeholder
            texts_to_translate.append(text)
            text_indices.append(i)
    
    if not texts_to_translate:
        return results
    
    # Make API request for uncached texts
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
    
    body = [{'text': text} for text in texts_to_translate]
    
    try:
        response = requests.post(
            endpoint,
            params=params,
            json=body,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            api_results = response.json()
            for i, result in enumerate(api_results):
                if result and 'translations' in result:
                    translation = result['translations'][0]['text']
                    original_index = text_indices[i]
                    original_text = texts_to_translate[i]
                    
                    # Save to cache
                    cache_key = f"{source_lang}_{target_lang}_{get_text_hash(original_text)}"
                    cache[cache_key] = translation
                    
                    results[original_index] = (translation, False)
                else:
                    original_index = text_indices[i]
                    results[original_index] = (texts_to_translate[i], False)
            
            save_cache(cache)
        else:
            print(f"Error: {response.status_code} - {response.text}")
            for i in text_indices:
                if results[i] is None:
                    results[i] = (texts[i], False)
                    
    except Exception as e:
        print(f"Error during translation: {e}")
        for i in text_indices:
            if results[i] is None:
                results[i] = (texts[i], False)
    
    return results


def main():
    print("=" * 60)
    print("TRANSLATE DISTRACTOR DESCRIPTIONS TO FINNISH")
    print("=" * 60)
    
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
    
    # Load manifest
    print(f"📖 Loading manifest...", end=" ")
    manifest_path = Path(__file__).parent / MANIFEST_PATH
    
    if not manifest_path.exists():
        print(f"\n✗ Error: Manifest not found at {manifest_path}")
        return
    
    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)
    
    distractor_images = manifest.get('distractorImages', {})
    print(f"✓ Found {len(distractor_images)} distractor images")
    
    # Collect all English descriptions
    descriptions = []
    distractor_ids = []
    
    for distractor_id, distractor_data in distractor_images.items():
        description = distractor_data.get('description', '')
        if description:
            descriptions.append(description)
            distractor_ids.append(distractor_id)
    
    print(f"\n📝 Translating {len(descriptions)} descriptions...")
    
    # Translate all at once
    translations = translate_with_azure(
        descriptions,
        source_lang='en',
        target_lang='fi',
        subscription_key=subscription_key,
        region=region,
        cache=cache
    )
    
    # Build output
    output = {
        "version": "1.0",
        "description": "Finnish translations of distractor image descriptions for TTS",
        "translations": {}
    }
    
    cached_count = 0
    api_count = 0
    
    print("\n" + "-" * 60)
    print(f"{'ID':<20} {'English':<30} {'Finnish':<30}")
    print("-" * 60)
    
    for i, (distractor_id, (finnish, from_cache)) in enumerate(zip(distractor_ids, translations)):
        english = descriptions[i]
        output["translations"][distractor_id] = {
            "english": english,
            "finnish": finnish
        }
        
        if from_cache:
            cached_count += 1
            source = "💾"
        else:
            api_count += 1
            source = "🌐"
        
        # Truncate for display
        en_display = english[:28] + ".." if len(english) > 30 else english
        fi_display = finnish[:28] + ".." if len(finnish) > 30 else finnish
        print(f"{source} {distractor_id:<18} {en_display:<30} {fi_display:<30}")
    
    print("-" * 60)
    
    # Save output
    output_path = Path(__file__).parent / OUTPUT_PATH
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ SUMMARY")
    print(f"  Total translations: {len(translations)}")
    print(f"  From cache:         {cached_count}")
    print(f"  API calls:          {api_count}")
    print(f"  Output saved to:    {output_path}")
    print("=" * 60)


if __name__ == "__main__":
    main()
