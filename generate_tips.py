#!/usr/bin/env python3
"""
Generate learning tips (hints) for all words in words.js

Creates/updates words_and_tips.json with:
- All word data from words.js
- Three hints per word (easy, medium, hard) in English
- Metadata about which models were used

The script:
- Checks if words_and_tips.json exists and continues from there
- Only generates tips for words that don't have them yet
- Saves after each word to prevent data loss
"""

import requests
import json
import time
import os
import re
from tqdm import tqdm
import statistics

OLLAMA_HOST = "172.23.64.1"
OLLAMA_PORT = 11434
MODEL = "llama3.2:3b"
OUTPUT_FILE = "words_and_tips.json"
WORDS_JS_FILE = "game/words.js"

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


def parse_words_js():
    """Parse words.js to extract all words and categories."""
    with open(WORDS_JS_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the WORD_CATEGORIES object
    categories = {}
    
    # Find all category blocks
    category_pattern = r'(\w+):\s*{\s*name:\s*[\'"]([^\'"]+)[\'"],\s*words:\s*\[(.*?)\]\s*}'
    
    for match in re.finditer(category_pattern, content, re.DOTALL):
        category_key = match.group(1)
        category_name = match.group(2)
        words_str = match.group(3)
        
        # Extract words
        words = []
        word_pattern = r'\{\s*spanish:\s*[\'"]([^\'"]+)[\'"],\s*english:\s*[\'"]([^\'"]+)[\'"],\s*finnish:\s*[\'"]([^\'"]+)[\'"](?:,\s*learningTips:\s*\[[^\]]*\])?\s*\}'
        
        for word_match in re.finditer(word_pattern, words_str):
            words.append({
                'spanish': word_match.group(1),
                'english': word_match.group(2),
                'finnish': word_match.group(3),
                'learningTips': []  # Will be filled with tip objects
            })
        
        categories[category_key] = {
            'name': category_name,
            'words': words
        }
    
    total_words = sum(len(c['words']) for c in categories.values())
    print(f"✓ Found {len(categories)} categories, {total_words} words")
    return categories


def load_existing_data():
    """Load existing words_and_tips.json if it exists."""
    if os.path.exists(OUTPUT_FILE):
        with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Count words with tips
        words_with_tips = 0
        for category in data.values():
            for word in category['words']:
                if word.get('learningTips') and len(word['learningTips']) > 0:
                    if not all(isinstance(tip, str) and len(tip) == 8 for tip in word['learningTips']):
                        words_with_tips += 1
        
        total_words = sum(len(category['words']) for category in data.values())
        print(f"✓ Loaded {OUTPUT_FILE} ({words_with_tips}/{total_words} have tips)")
        return data
    else:
        print(f"✓ No existing file, creating new")
        return None


def save_data(data):
    """Save data to words_and_tips.json."""
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def word_needs_tips(word):
    """Check if a word needs tips generated."""
    tips = word.get('learningTips', [])
    
    # Check if we have 3 proper tip objects (not placeholder strings)
    if not tips or len(tips) == 0:
        return True
    
    # Check if tips are placeholder strings (like "a1b2c3d4")
    if all(isinstance(tip, str) and len(tip) == 8 for tip in tips):
        return True
    
    # Check if we have proper tip objects
    if not all(isinstance(tip, dict) for tip in tips):
        return True
    
    # Check if we have all 3 difficulty levels
    difficulties = [tip.get('difficulty') for tip in tips if isinstance(tip, dict)]
    required_difficulties = ['easy', 'medium', 'hard']
    
    if not all(diff in difficulties for diff in required_difficulties):
        return True
    
    return False


def generate_hints_for_word(english_word, spanish_word, finnish_word):
    """Generate 3 hints (easy, medium, hard) for a word. Returns (hints, duration)."""
    url = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/chat"
    
    system_prompt = f"""Generate 3 hints for "{english_word}" without using the word itself.

DIFFICULTY:
1. EASY - Multiple obvious clues (sensory details, common associations)
2. MEDIUM - Contextual information (where/when/how encountered)  
3. HARD - Very minimal vague information (one vague identifying feature only)

OUTPUT: Three numbered lines:
1. [easy hint]
2. [medium hint]
3. [hard hint]"""

    user_prompt = f"""Generate 3 hints for "{english_word}". Never mention "{english_word}" in any hint. Make hint 3 very difficult."""
    
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False,
        "options": {"temperature": 0.7}
    }
    
    # Print request status
    from tqdm import tqdm as tqdm_module
    tqdm_module.write(f"  🤖 Sending request to {MODEL} for '{english_word}'...")
    
    try:
        response = requests.post(url, json=payload, timeout=180)
        response.raise_for_status()
        
        tqdm_module.write(f"  ✓ Response received, processing...")
        
        result = response.json()
        
        # Extract timing
        total_duration = result.get("total_duration", 0) / 1e9
        eval_count = result.get("eval_count", 0)
        
        # Get content
        message = result.get("message", {})
        content = message.get("content", "").strip()
        
        # Debug: Show raw content
        tqdm_module.write(f"  📄 Raw response:\n{content}\n")
        
        if not content:
            return None, 0
        
        # Parse the three hints
        lines = content.strip().split('\n')
        hints = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Try to extract numbered hint
            match = re.match(r'^(\d+)\.\s*(.+)$', line)
            if match:
                hints.append(match.group(2).strip())
        
        if len(hints) < 3:
            # Try alternative parsing - just take non-empty lines
            hints = [line.strip() for line in lines if line.strip() and not line.strip().startswith('Here')]
            # Remove numbering if present
            hints = [re.sub(r'^\d+\.\s*', '', h) for h in hints]
        
        if len(hints) < 3:
            tqdm_module.write(f"  ⚠ Only parsed {len(hints)} hints from response")
            return None, total_duration
        
        # Take first 3 hints
        hints = hints[:3]
        
        return hints, total_duration
        
    except requests.exceptions.Timeout:
        tqdm_module.write(f"  ✗ Request timeout for '{english_word}'")
        return None, 0
    except Exception as e:
        tqdm_module.write(f"  ✗ Error for '{english_word}': {e}")
        return None, 0


def create_tip_objects(hints, model_name):
    """Convert hint strings to tip objects."""
    difficulties = ['easy', 'medium', 'hard']
    tip_objects = []
    
    for i, hint in enumerate(hints):
        tip_objects.append({
            'language': 'english',
            'difficulty': difficulties[i],
            'text': hint,
            'tipModel': model_name,
            'translationModel': None
        })
    
    return tip_objects


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


def print_tips(word, tip_objects, duration):
    """Print generated tips in a nice format."""
    print(f"\n{'─' * 80}")
    print(f"📝 {word['spanish'].upper()} = {word['english']} ({word['finnish']}) | ⏱️  {duration:.1f}s")
    print(f"{'─' * 80}")
    for tip in tip_objects:
        difficulty_emoji = {'easy': '🟢', 'medium': '🟡', 'hard': '🔴'}
        emoji = difficulty_emoji.get(tip['difficulty'], '⚪')
        print(f"{emoji} {tip['difficulty'].upper():6s}: {tip['text']}")
    print(f"{'─' * 80}")


def generate_all_tips():
    """Main function to generate tips for all words."""
    print("=" * 80)
    print("GENERATE LEARNING TIPS FOR ALL WORDS")
    print("=" * 80)
    
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
    
    # Parse words.js
    print(f"\n📖 Reading {WORDS_JS_FILE}...", end=" ")
    parsed_data = parse_words_js()
    
    # Load existing data or use parsed data
    data = load_existing_data()
    if data is None:
        data = parsed_data
    
    # Count words that need tips
    words_to_process = []
    for category_key, category in data.items():
        for word in category['words']:
            if word_needs_tips(word):
                words_to_process.append((category_key, word))
    
    total_words = sum(len(category['words']) for category in data.values())
    words_with_tips = total_words - len(words_to_process)
    
    print("\n" + "=" * 80)
    print(f"📊 STATUS")
    print("=" * 80)
    print(f"  Total words:        {total_words}")
    print(f"  Already have tips:  {words_with_tips}")
    print(f"  Need tips:          {len(words_to_process)}")
    
    if len(words_to_process) == 0:
        print("\n✅ All words already have tips!")
        print("=" * 80)
        return
    
    # Estimate time (assume ~20s per word based on test results)
    estimated_time_per_word = 20  # seconds, will be updated with actual data
    estimated_total = estimated_time_per_word * len(words_to_process)
    print(f"  Estimated time:     ~{format_time(estimated_total)} (assuming ~{estimated_time_per_word}s/word)")
    print("=" * 80)
    
    # Process each word with progress bar
    processed = 0
    failed = 0
    durations = []
    
    print("\n🚀 Starting tip generation...\n")
    
    with tqdm(total=len(words_to_process), 
              desc="Generating tips", 
              unit="word",
              bar_format='{l_bar}{bar}| {n_fmt}/{total_fmt} [{elapsed}<{remaining}, {rate_fmt}]',
              ncols=80) as pbar:
        
        for category_key, word in words_to_process:
            processed += 1
            
            # Update progress bar description with current word
            pbar.set_description(f"Processing {word['spanish']:15s}")
            
            # Clear context
            clear_chat_context(MODEL)
            time.sleep(0.3)
            
            # Generate hints
            hints, duration = generate_hints_for_word(word['english'], word['spanish'], word['finnish'])
            
            if hints:
                durations.append(duration)
                
                # Convert to tip objects
                tip_objects = create_tip_objects(hints, MODEL)
                
                # Update word in data
                for cat_key, category in data.items():
                    if cat_key == category_key:
                        for w in category['words']:
                            if w['spanish'] == word['spanish']:
                                # Preserve existing Finnish translations if they exist
                                existing_tips = w.get('learningTips', [])
                                finnish_tips = [t for t in existing_tips if isinstance(t, dict) and t.get('language') == 'finnish']
                                w['learningTips'] = tip_objects + finnish_tips
                                break
                
                # Save after each word
                save_data(data)
                
                # Print tips nicely (will appear above progress bar)
                tqdm.write("")  # Empty line
                print_tips(word, tip_objects, duration)
                tqdm.write("")  # Empty line
                
                # Update time estimate based on actual average
                if len(durations) >= 3:
                    avg_duration = statistics.mean(durations)
                    remaining_words = len(words_to_process) - processed
                    estimated_remaining = avg_duration * remaining_words
                    pbar.set_postfix_str(f"avg: {avg_duration:.1f}s/word, eta: {format_time(estimated_remaining)}")
            else:
                failed += 1
                tqdm.write(f"✗ Failed to generate hints for {word['spanish']} ({word['english']})")
            
            # Update progress bar
            pbar.update(1)
    
    # Final summary
    print("\n" + "=" * 80)
    print("📈 SUMMARY")
    print("=" * 80)
    print(f"  Words processed:     {processed}")
    print(f"  Successfully created: {processed - failed}")
    print(f"  Failed:              {failed}")
    
    if durations:
        avg_duration = statistics.mean(durations)
        min_duration = min(durations)
        max_duration = max(durations)
        total_time = sum(durations)
        
        print(f"\n  ⏱️  TIMING STATISTICS")
        print(f"  {'─' * 76}")
        print(f"  Total time:          {format_time(total_time)}")
        print(f"  Average per word:    {avg_duration:.1f}s")
        print(f"  Fastest:             {min_duration:.1f}s")
        print(f"  Slowest:             {max_duration:.1f}s")
    
    print(f"\n  💾 Data saved to: {OUTPUT_FILE}")
    print("=" * 80)


if __name__ == "__main__":
    generate_all_tips()

