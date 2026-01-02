#!/usr/bin/env python3
"""
simple_translate.py - Simple Azure translation example with caching

Translates "hello world" to Finnish and caches the result.
"""

import json
import os
import hashlib
import requests
from pathlib import Path


# Configuration
OLLAMA_HOST = "172.23.64.1"
OLLAMA_PORT = 11434
CACHE_FILE = "translation_cache.json"


def load_env_file(env_path: str = ".env") -> dict:
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
                         subscription_key: str, region: str = "westeurope") -> str:
    """
    Translate text using Azure Translator API.
    
    Args:
        text: Text to translate
        source_lang: Source language code (e.g., 'en')
        target_lang: Target language code (e.g., 'fi')
        subscription_key: Azure subscription key
        region: Azure region
        
    Returns:
        Translated text
    """
    endpoint = "https://api.cognitive.microsofttranslator.com/translate"
    
    # Check cache first
    cache = load_cache()
    cache_key = f"{source_lang}_{target_lang}_{get_text_hash(text)}"
    
    if cache_key in cache:
        print(f"✓ Found in cache")
        return cache[cache_key]
    
    # Make API request
    print(f"→ Translating via Azure API...")
    
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
                
                print(f"✓ Translation complete, cached")
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


def main():
    """Main function to test Azure translation."""
    print("=" * 60)
    print("SIMPLE AZURE TRANSLATION TEST")
    print("=" * 60)
    
    # Load Azure credentials from .env
    print("\n📖 Loading Azure credentials...")
    env_vars = load_env_file()
    
    subscription_key = env_vars.get('AZURE_TRANSLATOR_KEY1') or env_vars.get('AZURE_TRANSLATOR_KEY')
    region = env_vars.get('AZURE_TRANSLATOR_REGION', 'westeurope')
    
    if not subscription_key:
        print("✗ Error: AZURE_TRANSLATOR_KEY1 not found in .env file")
        print("  Please add your Azure subscription key to .env")
        return
    
    print(f"✓ Loaded Azure credentials (region: {region})")
    
    # Test translation
    test_text = "hello world"
    source_lang = "en"
    target_lang = "fi"
    
    print(f"\n🌍 Translating: '{test_text}' ({source_lang} → {target_lang})")
    
    translation = translate_with_azure(
        text=test_text,
        source_lang=source_lang,
        target_lang=target_lang,
        subscription_key=subscription_key,
        region=region
    )
    
    print(f"\n{'=' * 60}")
    print(f"📝 RESULT")
    print(f"{'=' * 60}")
    print(f"  Original ({source_lang}): {test_text}")
    print(f"  Translation ({target_lang}): {translation}")
    print(f"{'=' * 60}")
    
    # Test cache on second run
    print(f"\n🔄 Testing cache (translating again)...")
    translation2 = translate_with_azure(
        text=test_text,
        source_lang=source_lang,
        target_lang=target_lang,
        subscription_key=subscription_key,
        region=region
    )
    
    print(f"  Result: {translation2}")
    print(f"\n💾 Cache file: {CACHE_FILE}")
    print("=" * 60)


if __name__ == "__main__":
    main()

