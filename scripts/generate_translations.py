#!/usr/bin/env python3
"""
Generate Finnish translations for English learning tips.

Reads words_and_tips.json and translates all English hints to Finnish,
saving results to words_tips_translations.json.

The script:
- Checks if words_tips_translations.json exists and continues from there
- Only translates tips that don't have Finnish translations yet
- Saves after each word to prevent data loss
- By default, does NOT call LLM (use --use-llm flag to enable)
"""

import requests
import json
import time
import os
import re
import argparse
from tqdm import tqdm
import statistics

OLLAMA_HOST = "172.23.64.1"
OLLAMA_PORT = 11434
MODEL = "llama3.2:3b"
INPUT_FILE = "words_and_tips.json"
OUTPUT_FILE = "words_tips_translations.json"

def preload_model(model_name):
    """Preload the model by making a simple request to warm it up."""
    try:
        payload = {"model": model_name}
        result = requests.post(f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/chat", json=payload, timeout=480).json()
        load_time = result.get("load_duration", 0) / 1e9
        print(f"✓ Loaded ({load_time:.1f}s)" if load_time > 0 else "✓ Already loaded")
    except Exception as e:
        print(f"⚠ Preload failed: {e}")


def clear_chat_context(model_name):
    """Clear the chat context by sending an empty request."""
    url = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/chat"
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": "clear"}],
        "stream": False
    }
    try:
        requests.post(url, json=payload, timeout=30)
    except:
        pass  # Ignore errors


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
    # Since INPUT_FILE and OUTPUT_FILE are the same, we just load it once
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Count words with Finnish translations
        words_with_translations = 0
        for category in data.values():
            for word in category['words']:
                tips = word.get('learningTips', [])
                if tips:
                    finnish_tips = [t for t in tips if isinstance(t, dict) and t.get('language') == 'finnish']
                    if len(finnish_tips) >= 3:
                        words_with_translations += 1
        
        total_words = sum(len(category['words']) for category in data.values())
        print(f"✓ Loaded {OUTPUT_FILE} ({words_with_translations}/{total_words} have Finnish translations)")
        return data
    else:
        print(f"✓ No existing file, will create new")
        return None


def save_data(data):
    """Save data to words_tips_translations.json."""
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def word_needs_translation(source_word, existing_translations, check_model=None):
    """
    Check if a word needs Finnish translations.
    
    Args:
        source_word: Word from words_and_tips.json (with English tips)
        existing_translations: Dict mapping spanish -> word from words_tips_translations.json
        check_model: If provided, only consider translations made with this specific model.
                     If None, accept any Finnish translations.
    
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
    
    # Check if we already have Finnish translations in the output file
    spanish = source_word['spanish']
    existing_word = existing_translations.get(spanish)
    
    if existing_word:
        existing_tips = existing_word.get('learningTips', [])
        finnish_tips = [t for t in existing_tips if isinstance(t, dict) and t.get('language') == 'finnish']
        
        if check_model:
            # When --use-llm is enabled, only count translations from the specified model
            model_finnish_tips = [t for t in finnish_tips if t.get('translationModel') == check_model]
            # Check if we have all 3 difficulty levels from this model
            difficulties = {t.get('difficulty') for t in model_finnish_tips}
            if len(difficulties) >= 3 and all(d in difficulties for d in ['easy', 'medium', 'hard']):
                return False, existing_word  # Already has all 3 difficulty levels from this model
        else:
            # When not using LLM, accept any Finnish translations
            if len(finnish_tips) >= 3:
                return False, existing_word  # Already has Finnish translations
    
    return True, existing_word


def translate_hints(word, english_tips):
    """Translate 3 English hints to Finnish. Returns (finnish_tips, duration)."""
    english_word = word['english']
    spanish_word = word['spanish']
    finnish_word = word['finnish']
    
    # Format hints for translation
    hints_text = '\n'.join([
        f"{i+1}. {tip['text']}"
        for i, tip in enumerate(english_tips)
    ])
    
    url = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/chat"
    
    system_prompt = f"""You are a professional translator specializing in quiz hint translation from English to Finnish.

RULES:
- Translate the quizhints from English to Finnish
- NEVER use the Finnish word "{finnish_word}" or any part of it in the translated hints
- Output exactly three numbered lines in Finnish, nothing else.
- Each line should start with the number (1., 2., 3.) followed by the translated hint.
"""

    user_prompt = f"""Translate these English hints to Finnish:

{hints_text}

CRITICAL: Do NOT use the word "{finnish_word}" or any of its forms in your Finnish translation.
The quiz word "{english_word}" (Finnish: "{finnish_word}") must NOT appear in the translated hints."""
    
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False,
        "options": {"temperature": 0.3}  # Lower temperature for consistent translation
    }
    
    # Print request status
    from tqdm import tqdm as tqdm_module
    tqdm_module.write(f"  🤖 Sending translation request for '{english_word}' → '{finnish_word}'...")
    
    try:
        response = requests.post(url, json=payload, timeout=180)
        response.raise_for_status()
        
        tqdm_module.write(f"  ✓ Translation received, processing...")
        
        result = response.json()
        
        # Extract timing
        total_duration = result.get("total_duration", 0) / 1e9
        eval_count = result.get("eval_count", 0)
        
        # Get content
        message = result.get("message", {})
        content = message.get("content", "").strip()
        
        # Debug: Show raw content
        tqdm_module.write(f"  📄 Raw translation:\n{content}\n")
        
        if not content:
            return None, 0
        
        # Parse the three translated hints
        lines = content.strip().split('\n')
        translations = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Try to extract numbered hint
            match = re.match(r'^(\d+)\.\s*(.+)$', line)
            if match:
                translations.append(match.group(2).strip())
        
        if len(translations) < 3:
            # Try alternative parsing
            translations = [line.strip() for line in lines if line.strip()]
            translations = [re.sub(r'^\d+\.\s*', '', t) for t in translations]
        
        if len(translations) < 3:
            tqdm_module.write(f"  ⚠ Only parsed {len(translations)} translations from response")
            return None, total_duration
        
        # Take first 3 translations
        translations = translations[:3]
        
        # Create Finnish tip objects
        finnish_tips = []
        difficulties = ['easy', 'medium', 'hard']
        for i, (translation, english_tip) in enumerate(zip(translations, english_tips)):
            finnish_tips.append({
                'language': 'finnish',
                'difficulty': difficulties[i],
                'text': translation,
                'tipModel': english_tip['tipModel'],  # Original model that created English tip
                'translationModel': MODEL
            })
        
        return finnish_tips, total_duration
        
    except requests.exceptions.Timeout:
        tqdm_module.write(f"  ✗ Translation timeout for '{english_word}'")
        return None, 0
    except Exception as e:
        tqdm_module.write(f"  ✗ Translation error for '{english_word}': {e}")
        return None, 0


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


def generate_all_translations(use_llm=False):
    """Main function to generate Finnish translations for all words.
    
    Args:
        use_llm: If True, call local LLM to translate missing tips. Default False.
    """
    print("=" * 80)
    print("GENERATE FINNISH TRANSLATIONS FOR LEARNING TIPS")
    print("=" * 80)
    
    if use_llm:
        # Test connection
        print("\n🔌 Testing connection...", end=" ")
        try:
            resp = requests.get(f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/version", timeout=180)
            version = resp.json().get("version", "unknown")
            print(f"✓ Connected to Ollama v{version}")
        except Exception as e:
            print(f"\n✗ Failed: {e}")
            return
        
        # Preload model
        print(f"🔄 Preloading {MODEL}...", end=" ")
        preload_model(MODEL)
    else:
        print("\n⚠️  LLM translation is DISABLED (use --use-llm to enable)")
        print("   Only analyzing existing translations, not generating new ones.")
    
    # Load source data (English tips)
    print(f"\n📖 Reading {INPUT_FILE}...", end=" ")
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
    # When using LLM, only translate words that don't have translations from current MODEL
    check_model = MODEL if use_llm else None
    
    words_to_process = []
    for category_key, category in source_data.items():
        for word in category['words']:
            needs_translation, existing_word = word_needs_translation(word, existing_translations, check_model)
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
    print(f"  Already have Finnish:     {words_translated}")
    print(f"  Need translation:         {len(words_to_process)}")
    print(f"  LLM translation:          {'ENABLED' if use_llm else 'DISABLED'}")
    if use_llm:
        print(f"  Translation model:        {MODEL}")
    
    if len(words_to_process) == 0:
        if use_llm:
            print(f"\n✅ All words already have Finnish translations from {MODEL}!")
        else:
            print("\n✅ All words already have Finnish translations!")
        print("=" * 80)
        return
    
    if not use_llm:
        print("\n⚠️  Found words without Finnish translations, but LLM is disabled.")
        print("   Run with --use-llm flag to generate translations.")
        print("=" * 80)
        return
    
    # Estimate time (assume ~25s per translation based on test results)
    estimated_time_per_word = 25  # seconds
    estimated_total = estimated_time_per_word * len(words_to_process)
    print(f"  Estimated time:           ~{format_time(estimated_total)} (assuming ~{estimated_time_per_word}s/word)")
    print("=" * 80)
    
    # Process each word with progress bar
    processed = 0
    failed = 0
    durations = []
    
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
            
            # Clear context
            clear_chat_context(MODEL)
            time.sleep(0.3)
            
            # Translate
            finnish_tips, duration = translate_hints(word, english_tips)
            
            if finnish_tips:
                durations.append(duration)
                
                # Update word in data - combine English tips from source with Finnish translations
                for cat_key, category in data.items():
                    if cat_key == category_key:
                        # Find or create word in output data
                        found_word = None
                        for w in category['words']:
                            if w['spanish'] == word['spanish']:
                                found_word = w
                                break
                        
                        if found_word:
                            # Update existing word: combine English tips from source with new Finnish translations
                            found_word['learningTips'] = english_tips + finnish_tips
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
    print("=" * 80)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Generate Finnish translations for English learning tips.',
        epilog='By default, only analyzes existing translations without calling LLM.'
    )
    parser.add_argument(
        '--use-llm',
        action='store_true',
        help='Enable local LLM to translate missing Finnish tips (default: disabled)'
    )
    
    args = parser.parse_args()
    generate_all_translations(use_llm=args.use_llm)

