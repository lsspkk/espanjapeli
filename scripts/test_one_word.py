#!/usr/bin/env python3
"""
Test hint generation using chat API.
Clean output format with timing statistics.

IMPORTANT - Configuration:
- Uses chat API for better instruction following
- No token limits (num_predict) to avoid cutting off responses
- Long timeout (180s) for reliable generation
- Only uses 'content' field from response (ignores 'thinking')
"""

import requests
import json

OLLAMA_HOST = "172.23.64.1"
OLLAMA_PORT = 11434
#MODEL_NAME = "qwen3:1.7b"
MODEL_NAME = "mistral:7b"

# Test words - different types
TEST_WORDS = [
    {'spanish': 'perro', 'english': 'dog'},
    {'spanish': 'casa', 'english': 'house'},
    {'spanish': 'rojo', 'english': 'red'},
    {'spanish': 'comer', 'english': 'to eat'},
]


def preload_model():
    """Preload the model by making a simple request to warm it up."""
    print("🔄 Preloading model...")
    try:
        payload = {"model": MODEL_NAME}
        result = requests.post(f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/chat", json=payload, timeout=480).json()
        load_time = result.get("load_duration", 0) / 1e9
        print(f"✓ Model loaded ({load_time:.1f}s)" if load_time > 0 else "✓ Model already loaded")
    except Exception as e:
        print(f"⚠ Preload failed: {e}")


def call_chat_api(word, difficulty):
    """Call Ollama chat API to generate a hint."""
    url = f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/chat"
    
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": "You are a quiz hint generator. Be concise and direct. Generate one hint without using the target word."
            },
            {
                "role": "user",
                "content": f"Generate a {difficulty} difficulty hint for the word '{word}' without using that word."
            }
        ],
        "stream": False,
        "options": {
            "temperature": 0.7
            # No num_predict - let it generate freely
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=180)
        response.raise_for_status()
        
        result = response.json()
        
        # Extract timing from response
        total_duration = result.get("total_duration", 0) / 1e9  # nanoseconds to seconds
        eval_count = result.get("eval_count", 0)
        
        # Only use content field (ignore thinking)
        message = result.get("message", {})
        content = message.get("content", "").strip()
        
        return {
            "success": bool(content),
            "content": content,
            "duration": total_duration,
            "tokens": eval_count
        }
        
    except requests.exceptions.Timeout:
        return {"success": False, "content": "", "duration": 0, "tokens": 0, "error": "Timeout"}
    except Exception as e:
        return {"success": False, "content": "", "duration": 0, "tokens": 0, "error": str(e)}


def test_word(word_data, difficulty):
    """Test hint generation for one word at one difficulty."""
    spanish = word_data['spanish']
    english = word_data['english']
    
    print(f"\n{'='*70}")
    print(f"Word: {spanish} = {english} | Difficulty: {difficulty}")
    print(f"{'='*70}")
    
    result = call_chat_api(english, difficulty)
    
    if result["success"]:
        # Clean output: timing first, then content
        print(f"Duration: {result['duration']:.1f}s | Tokens: {result['tokens']}")
        print(f"Hint: {result['content']}")
    else:
        error = result.get("error", "Empty response")
        print(f"✗ FAILED: {error}")
    
    return result


def main():
    print("=" * 70)
    print("QUIZ HINT GENERATOR TEST")
    print("=" * 70)
    
    # Test connection
    print("\n🔌 Testing connection...")
    try:
        resp = requests.get(f"http://{OLLAMA_HOST}:{OLLAMA_PORT}/api/version", timeout=180)
        version = resp.json().get("version", "unknown")
        print(f"✓ Connected to Ollama v{version}")
    except Exception as e:
        print(f"✗ Failed: {e}")
        return
    
    # Preload model
    print()
    preload_model()
    print()
    
    # Test all words with all difficulty levels
    difficulties = ["easy", "medium", "hard"]
    statistics = []
    
    for word in TEST_WORDS:
        for difficulty in difficulties:
            result = test_word(word, difficulty)
            if result["success"]:
                statistics.append(result)
    
    # Print summary statistics
    print("\n" + "=" * 70)
    print("SUMMARY STATISTICS")
    print("=" * 70)
    
    if statistics:
        total_requests = len(statistics)
        total_duration = sum(s["duration"] for s in statistics)
        total_tokens = sum(s["tokens"] for s in statistics)
        avg_duration = total_duration / total_requests
        avg_tokens = total_tokens / total_requests
        
        print(f"Total requests: {total_requests}")
        print(f"Average duration: {avg_duration:.1f}s per hint")
        print(f"Average tokens: {avg_tokens:.0f} per hint")
        print(f"Total time: {total_duration:.1f}s")
    else:
        print("No successful hints generated")
    
    print("=" * 70)


if __name__ == "__main__":
    main()
