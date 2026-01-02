#!/usr/bin/env python3
"""
Test THREE different prompting strategies for hint generation.

Each strategy generates 3 hints (easy, medium, hard) for comparison:
- Strategy 1: MINIMAL - Very short, concise prompt
- Strategy 2: BALANCED - Medium detail with clear structure  
- Strategy 3: DETAILED - Comprehensive rules and detailed instructions
"""

import requests
import json
import time

OLLAMA_HOST = "172.23.64.1"
OLLAMA_PORT = 11434
MODELS = ["mistral:7b", "llama3.2:3b"]

# Test words - different types
TEST_WORDS = [
    {'spanish': 'perro', 'english': 'dog'},
    {'spanish': 'casa', 'english': 'house'},
    {'spanish': 'rojo', 'english': 'red'},
    {'spanish': 'comer', 'english': 'to eat'},
]


def preload_model(model_name):
    """Preload the model by making a simple request to warm it up."""
    print(f"🔄 Preloading {model_name}...")
    try:
        payload = {"model": model_name}
        result = requests.post(f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/chat", json=payload, timeout=480).json()
        load_time = result.get("load_duration", 0) / 1e9
        print(f"✓ {model_name} loaded ({load_time:.1f}s)" if load_time > 0 else f"✓ {model_name} already loaded")
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


# ============================================================================
# STRATEGY 1: MINIMAL - Very short prompt
# ============================================================================
def strategy_1_minimal(word, model_name):
    """Minimal prompt - very short and direct."""
    print(f"→ {model_name} | {word} | STRATEGY 1: MINIMAL")
    url = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/chat"
    
    user_prompt = f"""Create 3 hints for "{word}" (easy, medium, hard). Don't use the word "{word}". Number them 1, 2, 3."""
    
    payload = {
        "model": model_name,
        "messages": [
            {"role": "user", "content": user_prompt}
        ],
        "stream": False,
        "options": {"temperature": 0.7}
    }
    
    return make_request(url, payload)


# ============================================================================
# STRATEGY 2: BALANCED - Medium detail with clear structure
# ============================================================================
def strategy_2_balanced(word, model_name):
    """Balanced prompt - similar to current approach."""
    print(f"→ {model_name} | {word} | STRATEGY 2: BALANCED")
    url = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/chat"
    
    system_prompt = f"""You are a quiz hint generator. Generate exactly 3 hints at different difficulties.

RULES:
- NEVER use the target word "{word}" in any hint
- Do NOT use synonyms or rhymes of "{word}"
- Number each hint (1., 2., 3.)

DIFFICULTY LEVELS:
1. EASY - Multiple obvious clues with sensory details
   Example: "Four legs, barks, wagging tail, loyal companion"

2. MEDIUM - Contextual clues about where/when/how it's encountered
   Example: "Often found in parks on leashes, human's best friend"

3. HARD - Minimal cryptic information
   Example: "Domesticated canine mammal"

OUTPUT: Three numbered lines only."""

    user_prompt = f"""Generate 3 hints for the word "{word}". Do not use the word "{word}" in any hint."""
    
    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False,
        "options": {"temperature": 0.7}
    }
    
    return make_request(url, payload)


# ============================================================================
# STRATEGY 3: DETAILED - Comprehensive rules and detailed instructions
# ============================================================================
def strategy_3_detailed(word, model_name):
    """Detailed prompt - lots of rules and descriptions."""
    print(f"→ {model_name} | {word} | STRATEGY 3: DETAILED")
    url = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/chat"
    
    system_prompt = f"""You are a language teacher for kids. You generate three hints for a word at different difficulty levels.

CRITICAL FORBIDDEN WORDS RULE:
- You must NEVER, under ANY circumstances, use the target word "{word}" in any of your hints
- Do NOT use any part of the word "{word}"
- Do NOT use synonyms of "{word}"
- Do NOT use words that rhyme with or sound similar to "{word}"
- Do NOT use homophones (words that sound exactly like "{word}")
- Do NOT spell out the word or give spelling hints
- Do NOT use the word in examples, descriptions, or comparisons
- If you accidentally think of using "{word}", immediately stop and rephrase

DIFFICULTY LEVEL SPECIFICATIONS:

1. EASY HINT:
   - Provide multiple sensory characteristics (visual, auditory, tactile)
   - Include 3-5 distinct identifying features
   - Use common, everyday language
   - Give obvious associations that a beginner would recognize

2. MEDIUM HINT:
   - Provide contextual information (where, when, how it's used)
   - Include one identifying feature, that is not very obvious
   - Examples: house - "Humans live in it", dog - "This animal is humans' best friend", red - "It's a color found in many fruits", eat - "It's a food related verb", etc.

3. HARD HINT:
   - Provide minimal information (absolute minimum to identify it)
   - Include one very vague identifying feature
   - Examples: house - "It's a shelter", dog - "It's a pet", red - "It's a color", eat - "It's a verb", etc.

OUTPUT FORMAT:
Output exactly three lines, nothing else.
Use this format:
EASY: [hint text]
MEDIUM: [hint text]
HARD: [hint text]"""

    user_prompt = f"""Generate 3 hints (easy, medium, hard) for the word: "{word}"

CRITICAL REMINDER: The word "{word}" must NOT appear in any of your hints. Think carefully before each hint to ensure you are not using "{word}" or any derivative of it."""
    
    payload = {
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False,
        "options": {"temperature": 0.7}
    }
    
    return make_request(url, payload)


def make_request(url, payload):
    """Make the actual API request and return results."""
    try:
        response = requests.post(url, json=payload, timeout=180)
        response.raise_for_status()
        
        result = response.json()
        
        # Extract timing
        total_duration = result.get("total_duration", 0) / 1e9
        eval_count = result.get("eval_count", 0)
        
        # Get content
        message = result.get("message", {})
        content = message.get("content", "").strip()
        
        return {
            "success": bool(content),
            "raw_content": content,
            "duration": total_duration,
            "tokens": eval_count
        }
        
    except requests.exceptions.Timeout:
        return {"success": False, "raw_content": "", "duration": 0, "tokens": 0, "error": "Timeout"}
    except Exception as e:
        return {"success": False, "raw_content": "", "duration": 0, "tokens": 0, "error": str(e)}


def test_word_all_strategies(word_data):
    """Test all three prompting strategies for one word with both models."""
    spanish = word_data['spanish']
    english = word_data['english']
    
    print(f"\n{'='*80}")
    print(f"WORD: {spanish} = {english}")
    print(f"{'='*80}")
    
    strategies = [
        ("STRATEGY 1: MINIMAL", strategy_1_minimal),
        ("STRATEGY 2: BALANCED", strategy_2_balanced),
        ("STRATEGY 3: DETAILED", strategy_3_detailed)
    ]
    
    results = []
    
    for model_name in MODELS:
        for strategy_name, strategy_func in strategies:
            print(f"\n{'-'*80}")
            print(f"MODEL: {model_name} | {strategy_name}")
            print(f"{'-'*80}")
            
            # Clear context before each request
            clear_chat_context(model_name)
            time.sleep(0.5)
            
            # Make request
            result = strategy_func(english, model_name)
            
            if result["success"]:
                print(f"Duration: {result['duration']:.1f}s | Tokens: {result['tokens']}")
                print(f"\nRaw Output:")
                print(result["raw_content"])
                results.append((model_name, strategy_name, result))
            else:
                error = result.get("error", "Empty response")
                print(f"✗ FAILED: {error}")
    
    return results


def main():
    print("=" * 80)
    print("PROMPT STRATEGY COMPARISON TEST")
    print("=" * 80)
    print("\nTesting 3 different prompting approaches with 2 models:")
    print("  Models: mistral:7b, llama3.2:3b")
    print("  1. MINIMAL   - Very short, direct prompt")
    print("  2. BALANCED  - Medium detail with clear structure")
    print("  3. DETAILED  - Comprehensive rules and detailed instructions")
    print()
    
    # Test connection
    print("🔌 Testing connection...")
    try:
        resp = requests.get(f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/version", timeout=180)
        version = resp.json().get("version", "unknown")
        print(f"✓ Connected to Ollama v{version}")
    except Exception as e:
        print(f"✗ Failed: {e}")
        return
    
    # Preload models
    print()
    for model_name in MODELS:
        preload_model(model_name)
    print()
    
    # Test all words with all strategies and models
    all_results = {}
    for model_name in MODELS:
        all_results[model_name] = {
            "STRATEGY 1: MINIMAL": [],
            "STRATEGY 2: BALANCED": [],
            "STRATEGY 3: DETAILED": []
        }
    
    for word in TEST_WORDS:
        results = test_word_all_strategies(word)
        for model_name, strategy_name, result in results:
            all_results[model_name][strategy_name].append(result)
    
    # Print comparative statistics
    print("\n" + "=" * 80)
    print("COMPARATIVE STATISTICS")
    print("=" * 80)
    
    for model_name in MODELS:
        print(f"\n{'*' * 80}")
        print(f"MODEL: {model_name}")
        print(f"{'*' * 80}")
        
        for strategy_name in ["STRATEGY 1: MINIMAL", "STRATEGY 2: BALANCED", "STRATEGY 3: DETAILED"]:
            results = all_results[model_name][strategy_name]
            
            if results:
                total_requests = len(results)
                total_duration = sum(r["duration"] for r in results)
                total_tokens = sum(r["tokens"] for r in results)
                avg_duration = total_duration / total_requests
                avg_tokens = total_tokens / total_requests
                
                print(f"\n{strategy_name}:")
                print(f"  Words processed: {total_requests}")
                print(f"  Total hints: {total_requests * 3}")
                print(f"  Avg duration: {avg_duration:.1f}s per word")
                print(f"  Avg tokens: {avg_tokens:.0f} per word")
                print(f"  Total time: {total_duration:.1f}s")
            else:
                print(f"\n{strategy_name}:")
                print(f"  No successful results")
    
    print("\n" + "=" * 80)


if __name__ == "__main__":
    main()

