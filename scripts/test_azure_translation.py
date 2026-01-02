#!/usr/bin/env python3
"""
Test script to verify Azure translation logic for a single word
"""

import json
import sys
sys.path.insert(0, '.')

from generate_translations_azure import (
    load_env_file, 
    word_needs_translation,
    translate_hints_azure,
    load_cache
)

# Load credentials
env_vars = load_env_file()
subscription_key = env_vars.get('AZURE_TRANSLATOR_KEY1') or env_vars.get('AZURE_TRANSLATOR_KEY')
region = env_vars.get('AZURE_TRANSLATOR_REGION', 'westeurope')

if not subscription_key:
    print("Error: Azure credentials not found")
    sys.exit(1)

# Load data files
with open('words_and_tips.json', 'r') as f:
    source_data = json.load(f)

with open('words_tips_translations.json', 'r') as f:
    existing_data = json.load(f)

# Build lookup
existing_translations = {}
for category in existing_data.values():
    for word in category['words']:
        existing_translations[word['spanish']] = word

# Find a word that has Ollama translations but not Azure
test_word = None
for category_key, category in source_data.items():
    for word in category['words']:
        needs_translation, existing_word = word_needs_translation(word, existing_translations)
        if needs_translation and existing_word:
            # This word exists and needs Azure translation
            existing_tips = existing_word.get('learningTips', [])
            ollama_fi = [t for t in existing_tips if t.get('language') == 'finnish' and t.get('translationModel') == 'llama3.2:3b']
            if len(ollama_fi) >= 3:
                test_word = word
                test_category = category_key
                break
    if test_word:
        break

if not test_word:
    print("No suitable test word found")
    sys.exit(0)

print(f"Testing with word: {test_word['spanish']} = {test_word['english']} → {test_word['finnish']}")
print(f"Category: {test_category}")

# Get English tips
english_tips = [t for t in test_word.get('learningTips', []) 
               if isinstance(t, dict) and t.get('language') == 'english']

print(f"\nEnglish tips ({len(english_tips)}):")
for tip in english_tips:
    print(f"  - {tip['difficulty']}: {tip['text'][:60]}...")

# Get existing Ollama translations
existing_word = existing_translations[test_word['spanish']]
ollama_tips = [t for t in existing_word.get('learningTips', [])
              if t.get('language') == 'finnish' and t.get('translationModel') == 'llama3.2:3b']

print(f"\nExisting Ollama translations ({len(ollama_tips)}):")
for tip in ollama_tips:
    print(f"  - {tip['difficulty']}: {tip['text'][:60]}...")

# Load cache
cache = load_cache()

print(f"\n{'=' * 80}")
print("Translating with Azure...")
print(f"{'=' * 80}")

# Translate
finnish_tips, duration, api_calls = translate_hints_azure(
    test_word, english_tips, subscription_key, region, cache
)

print(f"\n{'=' * 80}")
print("Results:")
print(f"{'=' * 80}")
print(f"Duration: {duration:.2f}s")
print(f"API calls: {api_calls}")
print(f"Cache hits: {len(finnish_tips) - api_calls}")

print(f"\nNew Azure translations ({len(finnish_tips)}):")
for tip in finnish_tips:
    print(f"  - {tip['difficulty']}: {tip['text'][:60]}...")
    print(f"    translationModel: {tip['translationModel']}")
    print(f"    tipModel: {tip['tipModel']}")

print("\n✓ Test complete!")

