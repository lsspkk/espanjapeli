import json
import os

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def normalize_text(text):
    if not text:
        return ""
    return text.strip().lower().replace('¡', '').replace('!', '').replace('¿', '').replace('?', '').replace('.', '').replace(',', '')

def main():
    source_path = 'svelte/static/themes/peppa_advanced_spanish.json'
    manifest_path = 'svelte/static/peppa_advanced_spanish_images/image_manifest.json'

    if not os.path.exists(source_path):
        print(f"Error: Source file not found at {source_path}")
        return
    if not os.path.exists(manifest_path):
        print(f"Error: Manifest file not found at {manifest_path}")
        return

    source_data = load_json(source_path)
    manifest_data = load_json(manifest_path)

    # Flatten source phrases into a lookup dictionary
    # Key: normalized spanish text
    # Value: {finnish, english}
    translation_map = {}
    
    categories = [
        "introduction_phrases", "common_phrases", "family_phrases", 
        "school_phrases", "friendship_phrases", "activities_and_games", 
        "emotions_and_reactions", "questions_and_answers", "weather_phrases",
        "time_phrases", "food_phrases", "places_vocabulary", "verbs_from_episodes",
        "numbers_from_show", "colors_from_show", "animals_from_show", "sentence_patterns"
    ]

    count_source = 0
    for category in categories:
        if category in source_data:
            items = source_data[category]
            for item in items:
                spanish = item.get('spanish')
                if spanish:
                    norm = normalize_text(spanish)
                    translation_map[norm] = {
                        'finnish': item.get('finnish', ''),
                        'english': item.get('english', '')
                    }
                    count_source += 1

    print(f"Loaded {count_source} phrases from source.")

    # Update manifest
    updated_count = 0
    not_found = []

    for item in manifest_data['phraseQueue']:
        spanish = item.get('spanish')
        if not spanish:
            continue

        norm = normalize_text(spanish)
        
        # Try exact match first
        match = translation_map.get(norm)
        
        if match:
            # Update fields
            item['finnish'] = match['finnish']
            item['english'] = match['english']
            updated_count += 1
        else:
            # Special handling for "No me gusta" vs "No, no me gusta"
            if norm == "no me gusta":
                match = translation_map.get("no no me gusta")
                if match:
                    item['finnish'] = match['finnish']
                    item['english'] = match['english']
                    updated_count += 1
                    continue
            
            not_found.append(spanish)

    print(f"Updated {updated_count} items in manifest.")
    if not_found:
        print("The following Spanish phrases were not found in source:")
        for s in not_found:
            print(f" - {s}")

    save_json(manifest_path, manifest_data)
    print("Manifest saved.")

if __name__ == '__main__':
    main()
