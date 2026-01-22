#!/usr/bin/env python3
"""
Download trilingual sentence pairs from Tatoeba (Spanish, Finnish, English).

This script downloads the Tatoeba sentence corpus and extracts all sentence
triples that have translations in Spanish, Finnish, and English.

Data source: https://tatoeba.org
License: CC-BY 2.0 FR
"""

import csv
import json
import os
import tarfile
import urllib.request
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Set

# Configuration
BASE_URL = "https://downloads.tatoeba.org/exports/"
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data" / "tatoeba_raw"
OUTPUT_DIR = SCRIPT_DIR / "data"

OUTPUT_CSV = OUTPUT_DIR / "tatoeba_spa_fin_eng.csv"
OUTPUT_JSON = OUTPUT_DIR / "tatoeba_spa_fin_eng.json"

FILES = {
    "sentences": "sentences.tar.bz2",
    "links": "links.tar.bz2",
}

# Language codes
LANG_SPA = "spa"  # Spanish
LANG_FIN = "fin"  # Finnish
LANG_ENG = "eng"  # English

# Theme keywords for categorization
# Keywords are checked against Spanish text (case-insensitive)
THEME_KEYWORDS = {
    "greetings": [
        "hola", "buenos días", "buenas tardes", "buenas noches", "adiós", "hasta luego",
        "bienvenido", "gracias", "por favor", "perdón", "disculpa", "cómo estás",
        "mucho gusto", "encantado", "hasta pronto", "nos vemos", "saludos"
    ],
    "food": [
        "comida", "comer", "beber", "desayuno", "almuerzo", "cena", "restaurante",
        "cocina", "plato", "pan", "agua", "café", "té", "leche", "fruta", "verdura",
        "carne", "pescado", "pollo", "arroz", "pasta", "sopa", "ensalada", "postre",
        "dulce", "azúcar", "sal", "sabor", "delicioso", "hambre", "sed", "mesa",
        "tenedor", "cuchillo", "cuchara", "vaso", "taza", "botella", "menú"
    ],
    "travel": [
        "viajar", "viaje", "turismo", "hotel", "aeropuerto", "avión", "tren", "autobús",
        "taxi", "coche", "billete", "boleto", "equipaje", "maleta", "pasaporte", "visa",
        "ciudad", "país", "mapa", "guía", "reserva", "vacaciones", "playa", "montaña",
        "museo", "monumento", "foto", "fotografía", "caminar", "visitar", "destino",
        "vuelo", "estación", "parada", "carretera", "camino"
    ],
    "family": [
        "familia", "padre", "madre", "papá", "mamá", "hijo", "hija", "hermano", "hermana",
        "abuelo", "abuela", "tío", "tía", "primo", "prima", "esposo", "esposa", "marido",
        "mujer", "niño", "niña", "bebé", "pariente", "familiar", "padres", "hijos",
        "hermanos", "abuelos", "matrimonio", "boda", "casarse", "nacer", "nacimiento"
    ],
    "work": [
        "trabajo", "trabajar", "empleo", "empleado", "jefe", "oficina", "empresa",
        "compañía", "negocio", "reunión", "proyecto", "cliente", "colega", "compañero",
        "sueldo", "salario", "dinero", "pagar", "cobrar", "contrato", "carrera",
        "profesión", "ocupación", "horario", "turno", "vacante", "entrevista",
        "currículum", "experiencia", "habilidad", "tarea", "responsabilidad"
    ],
    "leisure": [
        "tiempo libre", "diversión", "jugar", "juego", "deporte", "fútbol", "música",
        "cantar", "bailar", "película", "cine", "teatro", "concierto", "fiesta",
        "celebrar", "cumpleaños", "regalo", "amigo", "amiga", "pasatiempo", "hobby",
        "leer", "libro", "revista", "televisión", "ver", "escuchar", "parque",
        "jardín", "pasear", "caminar", "correr", "nadar", "arte", "pintar", "dibujar"
    ]
}


@dataclass
class Sentence:
    """Represents a sentence with translations in Spanish, Finnish, and English."""
    id: str  # Spanish sentence ID (primary)
    spanish: str
    finnish: str
    english: str
    wordCount: int
    themes: List[str]


def download_if_needed(filename: str) -> Path:
    """Download a file from Tatoeba if it doesn't exist locally."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path = DATA_DIR / filename
    
    if not path.exists():
        print(f"Downloading {filename}...")
        urllib.request.urlretrieve(BASE_URL + filename, path)
        print(f"  Saved to {path}")
    else:
        print(f"Using cached {filename}")
    
    return path


def extract_member(archive_path: Path, member_name: str) -> Path:
    """Extract a specific file from a tar.bz2 archive."""
    print(f"Extracting {member_name} from {archive_path.name}...")
    with tarfile.open(archive_path, "r:bz2") as tar:
        tar.extract(member_name, path=DATA_DIR)
    return DATA_DIR / member_name


def load_sentences(sentences_path: Path) -> dict:
    """Load sentences for target languages."""
    print("Loading sentences...")
    sent_text = {}
    lang_filter = {LANG_SPA, LANG_FIN, LANG_ENG}
    
    with open(sentences_path, encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 3:
                continue
            sid, lang, text = row[0], row[1], row[2]
            if lang in lang_filter:
                sent_text[sid] = (lang, text)
    
    print(f"  Loaded {len(sent_text)} sentences in spa/fin/eng")
    return sent_text


def load_links(links_path: Path) -> dict:
    """Load translation links between sentences."""
    print("Loading translation links...")
    neighbors = defaultdict(set)
    
    with open(links_path, encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            if len(row) < 2:
                continue
            a, b = row[0], row[1]
            neighbors[a].add(b)
            neighbors[b].add(a)
    
    print(f"  Loaded links for {len(neighbors)} sentences")
    return neighbors


def load_raw_sentences() -> List[Dict]:
    """Load raw sentence triples from Tatoeba data.
    
    Returns:
        List of raw sentence dictionaries with spa_id, fin_id, eng_id, spa, fin, eng.
    """
    print("Loading raw sentences from Tatoeba...")
    
    # Download archives
    sentences_tar = download_if_needed(FILES["sentences"])
    links_tar = download_if_needed(FILES["links"])
    
    # Extract if needed
    sentences_csv = DATA_DIR / "sentences.csv"
    links_csv = DATA_DIR / "links.csv"
    
    if not sentences_csv.exists():
        extract_member(sentences_tar, "sentences.csv")
    
    if not links_csv.exists():
        extract_member(links_tar, "links.csv")
    
    # Process data
    sent_text = load_sentences(sentences_csv)
    neighbors = load_links(links_csv)
    
    # Find trilingual triples
    print("Finding trilingual sentence triples...")
    spa_to_triple = {}
    
    # Start from Spanish sentences (our primary language)
    for spa_id, (lang, spa_txt) in sent_text.items():
        if lang != LANG_SPA:
            continue
        
        # Skip if we already have a translation for this Spanish text
        if spa_txt in spa_to_triple:
            continue
        
        linked_ids = neighbors.get(spa_id, set())
        
        # Find Finnish and English translations (take first available)
        fin_ids = [sid for sid in linked_ids if sid in sent_text and sent_text[sid][0] == LANG_FIN]
        eng_ids = [sid for sid in linked_ids if sid in sent_text and sent_text[sid][0] == LANG_ENG]
        
        if not fin_ids or not eng_ids:
            continue
        
        # Take only the first translation for each language
        fin_id = fin_ids[0]
        eng_id = eng_ids[0]
        fin_txt = sent_text[fin_id][1]
        eng_txt = sent_text[eng_id][1]
        
        spa_to_triple[spa_txt] = {
            "spa_id": spa_id,
            "fin_id": fin_id,
            "eng_id": eng_id,
            "spa": spa_txt,
            "fin": fin_txt,
            "eng": eng_txt,
        }
    
    results = list(spa_to_triple.values())
    print(f"  Found {len(results)} unique Spanish sentences with translations")
    return results


def deduplicate_sentences(sentences: List[Dict]) -> List[Dict]:
    """Remove duplicate sentences based on Spanish text.
    
    Args:
        sentences: List of raw sentence dictionaries
        
    Returns:
        Deduplicated list of sentence dictionaries
    """
    seen = set()
    deduped = []
    
    for s in sentences:
        key = s["spa"]
        if key not in seen:
            seen.add(key)
            deduped.append(s)
    
    if len(deduped) < len(sentences):
        print(f"  Removed {len(sentences) - len(deduped)} duplicates")
    print(f"  Final count: {len(deduped)} unique sentences")
    return deduped


def assign_themes(sentence: Dict) -> List[str]:
    """Assign theme categories to a sentence based on keywords.
    
    Args:
        sentence: Raw sentence dictionary with 'spa', 'fin', 'eng' keys
        
    Returns:
        List of theme strings (may be empty)
    """
    spanish_text = sentence["spa"].lower()
    themes = []
    
    for theme, keywords in THEME_KEYWORDS.items():
        for keyword in keywords:
            if keyword in spanish_text:
                themes.append(theme)
                break  # Only add theme once even if multiple keywords match
    
    return themes


def group_by_theme(sentences: List[Sentence]) -> Dict[str, List[Sentence]]:
    """Group sentences by their themes.
    
    Args:
        sentences: List of Sentence objects
        
    Returns:
        Dictionary mapping theme names to lists of sentences
    """
    groups = defaultdict(list)
    
    for sentence in sentences:
        if not sentence.themes:
            # Sentences without themes go to 'general' group
            groups['general'].append(sentence)
        else:
            # Sentence can belong to multiple theme groups
            for theme in sentence.themes:
                groups[theme].append(sentence)
    
    print(f"  Grouped into {len(groups)} themes")
    return dict(groups)


def write_output_files(groups: Dict[str, List[Sentence]]):
    """Write sentence groups to static JSON files.
    
    Creates:
    - svelte/static/sentences/index.json (manifest)
    - svelte/static/sentences/{theme}.json (or {theme}-1.json, {theme}-2.json if split)
    
    Args:
        groups: Dictionary mapping theme names to lists of sentences
    """
    # Determine output directory relative to script location
    # scripts/data_story_pipeline/download_tatoeba.py -> svelte/static/sentences/
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    output_dir = project_root / "svelte" / "static" / "sentences"
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"  Writing output files to: {output_dir}")
    
    # Maximum file size in bytes (500KB)
    MAX_FILE_SIZE = 500 * 1024
    
    manifest = {
        "themes": []
    }
    
    # Process each theme group
    for theme, sentences in groups.items():
        # Convert Sentence objects to dictionaries
        sentence_dicts = [
            {
                "id": s.id,
                "spanish": s.spanish,
                "finnish": s.finnish,
                "english": s.english,
                "wordCount": s.wordCount,
                "themes": s.themes
            }
            for s in sentences
        ]
        
        # Serialize to JSON to check size
        json_str = json.dumps(sentence_dicts, ensure_ascii=False, indent=2)
        json_bytes = json_str.encode('utf-8')
        
        # Check if we need to split the file
        if len(json_bytes) > MAX_FILE_SIZE:
            # Calculate how many parts we need
            num_parts = (len(json_bytes) // MAX_FILE_SIZE) + 1
            sentences_per_part = len(sentence_dicts) // num_parts + 1
            
            # Split into multiple files
            for part_num in range(num_parts):
                start_idx = part_num * sentences_per_part
                end_idx = min((part_num + 1) * sentences_per_part, len(sentence_dicts))
                part_sentences = sentence_dicts[start_idx:end_idx]
                
                # Write part file
                part_filename = f"{theme}-{part_num + 1}.json"
                part_path = output_dir / part_filename
                with open(part_path, 'w', encoding='utf-8') as f:
                    json.dump(part_sentences, f, ensure_ascii=False, indent=2)
                
                # Add to manifest
                manifest["themes"].append({
                    "id": f"{theme}-{part_num + 1}",
                    "name": theme,
                    "part": part_num + 1,
                    "count": len(part_sentences),
                    "filename": part_filename
                })
                
                print(f"    Written: {part_filename} ({len(part_sentences)} sentences)")
        else:
            # Write single file
            filename = f"{theme}.json"
            file_path = output_dir / filename
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(sentence_dicts, f, ensure_ascii=False, indent=2)
            
            # Add to manifest
            manifest["themes"].append({
                "id": theme,
                "name": theme,
                "count": len(sentence_dicts),
                "filename": filename
            })
            
            print(f"    Written: {filename} ({len(sentence_dicts)} sentences)")
    
    # Write manifest file
    manifest_path = output_dir / "index.json"
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    
    print(f"  Written manifest: {manifest_path}")
    print(f"  Total theme files: {len(manifest['themes'])}")


def save_results(results: list):
    """Save results to CSV and JSON files (legacy format for backwards compatibility)."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Save CSV
    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["spa_id", "fin_id", "eng_id", "spa", "fin", "eng"])
        for r in results:
            writer.writerow([r["spa_id"], r["fin_id"], r["eng_id"], r["spa"], r["fin"], r["eng"]])
    print(f"Saved CSV: {OUTPUT_CSV}")
    
    # Save JSON
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"Saved JSON: {OUTPUT_JSON}")


def convert_to_sentence_objects(raw_sentences: List[Dict]) -> List[Sentence]:
    """Convert raw sentence dictionaries to Sentence objects.
    
    Args:
        raw_sentences: List of raw sentence dictionaries
        
    Returns:
        List of Sentence objects with themes and word counts
    """
    sentences = []
    
    for raw in raw_sentences:
        # Calculate word count (simple split by spaces)
        word_count = len(raw["spa"].split())
        
        # Assign themes
        themes = assign_themes(raw)
        
        sentence = Sentence(
            id=raw["spa_id"],
            spanish=raw["spa"],
            finnish=raw["fin"],
            english=raw["eng"],
            wordCount=word_count,
            themes=themes
        )
        sentences.append(sentence)
    
    print(f"  Converted {len(sentences)} sentences to Sentence objects")
    return sentences


def generate_report(sentences: List[Sentence], groups: Dict[str, List[Sentence]], 
                   total_raw: int, duplicates_removed: int):
    """Generate pipeline report with statistics.
    
    Args:
        sentences: List of all processed Sentence objects
        groups: Dictionary mapping theme names to lists of sentences
        total_raw: Total number of raw sentences before deduplication
        duplicates_removed: Number of duplicates removed
    """
    # Determine output directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    reports_dir = project_root / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    
    # Calculate theme distribution
    theme_distribution = {}
    for theme, theme_sentences in groups.items():
        theme_distribution[theme] = len(theme_sentences)
    
    # Calculate unassigned percentage
    unassigned_count = len(groups.get('general', []))
    total_sentences = len(sentences)
    unassigned_percentage = (unassigned_count / total_sentences * 100) if total_sentences > 0 else 0
    
    # Calculate word count distribution
    word_count_distribution = {
        "1-4": 0,
        "5-8": 0,
        "9+": 0
    }
    
    for sentence in sentences:
        if sentence.wordCount <= 4:
            word_count_distribution["1-4"] += 1
        elif sentence.wordCount <= 8:
            word_count_distribution["5-8"] += 1
        else:
            word_count_distribution["9+"] += 1
    
    # Get sample unassigned sentences (up to 10)
    unassigned_sentences = groups.get('general', [])
    sample_unassigned = [
        {
            "spanish": s.spanish,
            "finnish": s.finnish,
            "english": s.english,
            "wordCount": s.wordCount
        }
        for s in unassigned_sentences[:10]
    ]
    
    # Build report
    report = {
        "generatedAt": datetime.now().isoformat(),
        "totalSentences": total_sentences,
        "duplicatesRemoved": duplicates_removed,
        "themeDistribution": theme_distribution,
        "unassignedPercentage": round(unassigned_percentage, 2),
        "wordCountDistribution": word_count_distribution,
        "sampleUnassigned": sample_unassigned
    }
    
    # Write report file
    report_path = reports_dir / "sentence-pipeline-report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    print()
    print("=" * 60)
    print("PIPELINE REPORT")
    print("=" * 60)
    print(f"Total sentences: {total_sentences}")
    print(f"Duplicates removed: {duplicates_removed}")
    print(f"Unassigned percentage: {unassigned_percentage:.2f}%")
    print()
    print("Theme distribution:")
    for theme, count in sorted(theme_distribution.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / total_sentences * 100) if total_sentences > 0 else 0
        print(f"  {theme}: {count} ({percentage:.1f}%)")
    print()
    print("Word count distribution:")
    for range_name, count in word_count_distribution.items():
        percentage = (count / total_sentences * 100) if total_sentences > 0 else 0
        print(f"  {range_name} words: {count} ({percentage:.1f}%)")
    print()
    print(f"Report saved to: {report_path}")
    print("=" * 60)


def main():
    """Main entry point - runs the complete pipeline."""
    print("=" * 60)
    print("Tatoeba Trilingual Sentence Downloader")
    print("Languages: Spanish, Finnish, English")
    print("=" * 60)
    print()
    
    # Pipeline step 1: Load raw sentences from Tatoeba
    raw_sentences = load_raw_sentences()
    total_raw = len(raw_sentences)
    
    # Pipeline step 2: Deduplicate sentences
    raw_sentences = deduplicate_sentences(raw_sentences)
    duplicates_removed = total_raw - len(raw_sentences)
    
    # Pipeline step 3: Convert to Sentence objects (includes theme assignment and word count)
    sentences = convert_to_sentence_objects(raw_sentences)
    
    # Pipeline step 4: Group sentences by theme
    groups = group_by_theme(sentences)
    
    # Pipeline step 5: Write output files
    write_output_files(groups)
    
    # Pipeline step 6: Generate report
    generate_report(sentences, groups, total_raw, duplicates_removed)
    
    # Legacy output for backwards compatibility
    save_results(raw_sentences)
    
    print()
    print("=" * 60)
    print(f"Done! Processed {len(sentences)} sentences into {len(groups)} theme groups.")
    print("=" * 60)


if __name__ == "__main__":
    main()
