#!/usr/bin/env python3
"""
Add Missing Vocabulary Words Script

Reads the v4-data-consistency-issues.csv file and adds all MISSING words
to the vocabulary database (words.ts). For each word, it:
1. Adds the word with Spanish, English, and Finnish translations
2. Looks up frequency data if available
3. Determines part of speech and gender from context
4. Generates a unique ID
5. Adds to the most appropriate category or creates 'stories' category

Usage:
    python scripts/add_missing_vocabulary_words.py
"""

import csv
import json
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from collections import defaultdict


def load_csv_issues() -> List[Dict[str, str]]:
    """Load the CSV file with consistency issues."""
    csv_path = Path(__file__).parent.parent / "reports" / "v4-data-consistency-issues.csv"
    
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")
    
    issues = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['issue_type'] == 'MISSING':
                issues.append(row)
    
    return issues


def load_frequency_data() -> Dict[str, Dict]:
    """Load Spanish frequency data."""
    freq_path = Path(__file__).parent.parent / "svelte/static/data/frequency-spanish-top5000.json"
    
    if not freq_path.exists():
        print(f"Warning: Frequency file not found: {freq_path}")
        return {}
    
    with open(freq_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        return data.get('words', {})


def load_existing_words() -> Tuple[Set[str], Set[str]]:
    """
    Parse words.ts to get existing Spanish words.
    Returns both raw words and normalized words.
    """
    words_path = Path(__file__).parent.parent / "svelte/src/lib/data/words.ts"
    
    if not words_path.exists():
        raise FileNotFoundError(f"Words file not found: {words_path}")
    
    existing_words_raw = set()
    existing_words_normalized = set()
    
    with open(words_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
        # Find all spanish: 'word' patterns
        pattern = r"spanish:\s*['\"]([^'\"]+)['\"]"
        matches = re.findall(pattern, content)
        existing_words_raw.update(matches)
        
        # Also store normalized versions
        for word in matches:
            existing_words_normalized.add(normalize_word(word))
    
    return existing_words_raw, existing_words_normalized


def normalize_word(word: str) -> str:
    """Normalize a word by removing articles."""
    word = word.strip().lower()
    
    # Remove articles
    articles = ['el ', 'la ', 'los ', 'las ', 'un ', 'una ', 'unos ', 'unas ']
    for article in articles:
        if word.startswith(article):
            word = word[len(article):]
            break
    
    return word


def determine_part_of_speech(spanish_word: str, finnish_word: str) -> str:
    """Determine part of speech from word patterns."""
    spanish_lower = spanish_word.lower()
    finnish_lower = finnish_word.lower()
    
    # Common verb endings in Spanish
    verb_endings = ['ar', 'er', 'ir', 'arse', 'erse', 'irse']
    for ending in verb_endings:
        if spanish_lower.endswith(ending) and not spanish_lower.startswith('el ') and not spanish_lower.startswith('la '):
            return 'verb'
    
    # Adjectives often end with o/a and Finnish equivalents
    if spanish_lower.endswith('/a') or spanish_lower.endswith('/o'):
        return 'adjective'
    
    # If starts with article, it's a noun
    if spanish_lower.startswith(('el ', 'la ', 'los ', 'las ', 'un ', 'una ')):
        return 'noun'
    
    # Default to noun for most cases
    return 'noun'


def determine_gender(spanish_word: str) -> Optional[str]:
    """Determine gender from Spanish article."""
    spanish_lower = spanish_word.lower().strip()
    
    if spanish_lower.startswith(('el ', 'los ', 'un ', 'unos ')):
        return 'masculine'
    elif spanish_lower.startswith(('la ', 'las ', 'una ', 'unas ')):
        return 'feminine'
    
    return None


def generate_word_id(spanish_word: str) -> str:
    """Generate a unique ID for a word."""
    # Remove articles and special characters
    normalized = normalize_word(spanish_word)
    # Replace spaces with hyphens
    word_id = normalized.replace(' ', '-').replace('/', '-')
    # Remove special characters except hyphens
    word_id = re.sub(r'[^a-z0-9\-ñáéíóúü]', '', word_id)
    return word_id


def translate_to_english(spanish_word: str, finnish_word: str) -> str:
    """
    Generate English translation.
    This is a simple heuristic - ideally would use a translation API.
    """
    # Common translations dictionary (minimal set)
    translations = {
        # From the CSV data
        'frutas': 'fruits',
        'pasillo': 'aisle',
        'entrada': 'entrance',
        'kilo': 'kilo',
        'efectivo': 'cash',
        'caja': 'cash register',
        'fresco': 'fresh',
        'cafetería': 'cafeteria',
        'café con leche': 'coffee with milk',
        'croissant': 'croissant',
        'tostada': 'toast',
        'pastel': 'pastry',
        'mantequilla': 'butter',
        'terraza': 'terrace',
        'pequeño': 'small',
        'servir': 'to serve',
        'sentarse': 'to sit down',
        'disfrutar': 'to enjoy',
        'alquilar': 'to rent',
        'casco': 'helmet',
        'mapa': 'map',
        'ruta': 'route',
        'plano': 'flat',
        'devolver': 'to return',
        'cerrar': 'to close',
        'depósito': 'deposit',
        'hostal': 'hostel',
        'reserva': 'reservation',
        'doble': 'double',
        'ducha': 'shower',
        'aire acondicionado': 'air conditioning',
        'desayuno': 'breakfast',
        'comedor': 'dining room',
        'llave': 'key',
        'hora de salida': 'checkout time',
        'parque natural': 'natural park',
        'ardilla': 'squirrel',
        'ciervo': 'deer',
        'área de picnic': 'picnic area',
        'nadar': 'to swim',
        'prohibido': 'prohibited',
        'camping': 'campsite',
        'tienda de campaña': 'tent',
        'sitio': 'place',
        'servicios': 'facilities',
        'agua caliente': 'hot water',
        'barbacoa': 'barbecue',
        'silencio': 'silence',
        'horario': 'schedule',
        'poner la tienda': 'to pitch the tent',
        'llover': 'to rain',
        'paraguas': 'umbrella',
        'nublado': 'cloudy',
        'calor': 'heat',
        'pronóstico': 'forecast',
        'grado': 'degree',
        'pasear': 'to walk',
        'comida': 'food',
        'típico': 'typical',
        'paella': 'paella',
        'caro': 'expensive',
        'razonable': 'reasonable',
        'almuerzo': 'lunch',
        'cenar': 'to have dinner',
        'vegetariano': 'vegetarian',
        'tapas': 'tapas',
        'girar': 'to turn',
        'tiempo': 'weather',
    }
    
    # Normalize word
    normalized = normalize_word(spanish_word)
    
    # Check dictionary
    if normalized in translations:
        return translations[normalized]
    
    # Fallback: use Finnish as hint (not ideal but better than nothing)
    return f"[{finnish_word}]"


def group_words_by_category(issues: List[Dict[str, str]]) -> Dict[str, List[Dict[str, str]]]:
    """Group words by their most appropriate category."""
    categorized = defaultdict(list)
    
    for issue in issues:
        spanish = issue['word']
        finnish = issue['word_finnish']
        
        # Determine category based on word type and context
        pos = determine_part_of_speech(spanish, finnish)
        
        if pos == 'verb':
            category = 'verbs'
        elif pos == 'adjective':
            category = 'adjectives'
        else:
            # For nouns, try to categorize by semantic field
            normalized = normalize_word(spanish)
            
            # Food related
            if any(word in normalized for word in ['fruta', 'comida', 'café', 'leche', 'croissant', 'tostada', 'pastel', 'mantequilla', 'paella', 'tapa']):
                category = 'food'
            # Travel/accommodation -> places
            elif any(word in normalized for word in ['hostal', 'reserva', 'habitación', 'llave', 'ducha', 'desayuno', 'hotel']):
                category = 'places'
            # Nature
            elif any(word in normalized for word in ['parque', 'ardilla', 'ciervo', 'pato', 'árbol', 'lago', 'camping', 'tienda']):
                category = 'nature'
            # Weather -> nature
            elif any(word in normalized for word in ['tiempo', 'lluvia', 'nublado', 'calor', 'grado', 'pronóstico', 'paraguas']):
                category = 'nature'
            # Default to stories category
            else:
                category = 'stories'
        
        categorized[category].append(issue)
    
    return categorized


def format_word_entry(issue: Dict[str, str], frequency_data: Dict[str, Dict]) -> str:
    """Format a word entry for the TypeScript file."""
    spanish = issue['word']
    finnish = issue['word_finnish']
    english = translate_to_english(spanish, finnish)
    
    # Normalize for frequency lookup
    normalized = normalize_word(spanish)
    
    # Build the word object
    parts = [
        f"spanish: '{spanish}'",
        f"english: '{english}'",
        f"finnish: '{finnish}'"
    ]
    
    # Add frequency data if available
    if normalized in frequency_data:
        freq = frequency_data[normalized]
        parts.append(f"id: '{generate_word_id(spanish)}'")
        
        freq_obj_parts = [
            f"rank: {freq['rank']}",
            f"cefrLevel: '{freq['cefr']}'"
        ]
        
        if freq.get('isTop100'):
            freq_obj_parts.append("isTop100: true")
        if freq.get('isTop500'):
            freq_obj_parts.append("isTop500: true")
        if freq.get('isTop1000'):
            freq_obj_parts.append("isTop1000: true")
        if freq.get('isTop3000'):
            freq_obj_parts.append("isTop3000: true")
        if freq.get('isTop5000'):
            freq_obj_parts.append("isTop5000: true")
        
        parts.append(f"frequency: {{ {', '.join(freq_obj_parts)} }}")
        
        # Add linguistic data
        pos = determine_part_of_speech(spanish, finnish)
        gender = determine_gender(spanish)
        
        ling_parts = [f"partOfSpeech: '{pos}'"]
        if gender:
            ling_parts.append(f"gender: '{gender}'")
        
        parts.append(f"linguistic: {{ {', '.join(ling_parts)} }}")
    
    return "{ " + ", ".join(parts) + " }"


def find_category_insertion_point(content: str, category: str) -> Optional[int]:
    """Find the insertion point for a category in the words.ts file."""
    # Look for the category definition
    pattern = rf"{category}:\s*\{{\s*name:\s*['\"]([^'\"]+)['\"],\s*words:\s*\["
    match = re.search(pattern, content)
    
    if not match:
        return None
    
    # Find the closing bracket of the words array
    start_pos = match.end()
    bracket_count = 1
    pos = start_pos
    
    while pos < len(content) and bracket_count > 0:
        if content[pos] == '[':
            bracket_count += 1
        elif content[pos] == ']':
            bracket_count -= 1
        pos += 1
    
    # Go back to find the last word entry
    # We want to insert before the closing ]
    return pos - 1


def add_words_to_category(content: str, category: str, word_entries: List[str]) -> str:
    """Add word entries to a category in the words.ts file."""
    insertion_point = find_category_insertion_point(content, category)
    
    if insertion_point is None:
        print(f"Warning: Could not find category '{category}', skipping words")
        return content
    
    # Format the new entries
    formatted_entries = []
    for entry in word_entries:
        formatted_entries.append(f"\t\t\t{entry}")
    
    # Check if we need a comma before the new entries
    # Look back to see if there's already content
    check_pos = insertion_point - 1
    while check_pos > 0 and content[check_pos] in ' \t\n':
        check_pos -= 1
    
    needs_comma = content[check_pos] == '}'
    
    # Build the insertion text
    if needs_comma:
        insertion_text = ",\n" + ",\n".join(formatted_entries)
    else:
        insertion_text = "\n" + ",\n".join(formatted_entries)
    
    # Insert the text
    return content[:insertion_point] + insertion_text + "\n\t\t" + content[insertion_point:]


def create_stories_category(content: str, word_entries: List[str]) -> str:
    """Create a new 'stories' category and add it to the file."""
    # Find the end of WORD_CATEGORIES object (before the closing brace)
    # Look for the pattern: }; (end of WORD_CATEGORIES)
    pattern = r'(}\s*;\s*\n\s*// Get)'
    match = re.search(pattern, content)
    
    if not match:
        print("Warning: Could not find insertion point for new category")
        return content
    
    # Build the new category
    formatted_entries = []
    for entry in word_entries:
        formatted_entries.append(f"\t\t{entry}")
    
    new_category = f"""\t
\tstories: {{
\t\tname: 'Tarinoista',
\t\twords: [
{',\n'.join(formatted_entries)}
\t\t]
\t}},
\t
"""
    
    # Insert before the closing brace
    insertion_point = match.start()
    return content[:insertion_point] + new_category + content[insertion_point:]


def main():
    """Main execution."""
    print("Loading CSV issues...")
    issues = load_csv_issues()
    
    if not issues:
        print("No MISSING words found in CSV file")
        return
    
    print(f"Found {len(issues)} missing words")
    
    print("Loading frequency data...")
    frequency_data = load_frequency_data()
    print(f"Loaded frequency data for {len(frequency_data)} words")
    
    print("Loading existing vocabulary...")
    existing_words_raw, existing_words_normalized = load_existing_words()
    print(f"Found {len(existing_words_raw)} existing words")
    
    # Filter out words that already exist (check both raw and normalized)
    new_issues = []
    skipped = 0
    seen_normalized = set()  # Track what we're adding to avoid duplicates
    
    for issue in issues:
        word_raw = issue['word']
        word_normalized = normalize_word(word_raw)
        
        # Skip if already exists in database
        if word_normalized in existing_words_normalized:
            skipped += 1
            continue
        
        # Skip if we've already queued this normalized form
        if word_normalized in seen_normalized:
            skipped += 1
            continue
        
        new_issues.append(issue)
        seen_normalized.add(word_normalized)
    
    print(f"Filtered to {len(new_issues)} truly new words ({skipped} already exist or duplicates)")
    
    if not new_issues:
        print("All words already exist in vocabulary!")
        return
    
    # Group by category
    print("Categorizing words...")
    categorized = group_words_by_category(new_issues)
    
    for category, words in categorized.items():
        print(f"  {category}: {len(words)} words")
    
    # Load words.ts
    words_path = Path(__file__).parent.parent / "svelte/src/lib/data/words.ts"
    with open(words_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add words to each category
    for category, category_issues in categorized.items():
        print(f"\nAdding {len(category_issues)} words to '{category}' category...")
        
        word_entries = []
        for issue in category_issues:
            entry = format_word_entry(issue, frequency_data)
            word_entries.append(entry)
            print(f"  + {issue['word']} -> {issue['word_finnish']}")
        
        if category == 'stories':
            # Check if category exists
            if 'stories:' in content:
                content = add_words_to_category(content, category, word_entries)
            else:
                content = create_stories_category(content, word_entries)
        else:
            # Check if category exists before trying to add
            if f'{category}:' in content:
                content = add_words_to_category(content, category, word_entries)
            else:
                print(f"  Warning: Category '{category}' not found, adding to 'stories' instead")
                if 'stories:' not in content:
                    content = create_stories_category(content, word_entries)
                else:
                    content = add_words_to_category(content, 'stories', word_entries)
    
    # Write back to file
    print("\nWriting updated vocabulary to words.ts...")
    with open(words_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Successfully added {len(new_issues)} new words to vocabulary database")
    print(f"   Total words in database: {len(existing_words_raw) + len(new_issues)}")


if __name__ == "__main__":
    main()
