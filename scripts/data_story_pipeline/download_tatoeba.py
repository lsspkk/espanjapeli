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
from pathlib import Path

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


def find_triples(sent_text: dict, neighbors: dict) -> list:
    """Find all Spanish sentences that have both Finnish and English translations."""
    print("Finding trilingual sentence triples...")
    results = []
    
    # Start from Spanish sentences (our primary language)
    for spa_id, (lang, spa_txt) in sent_text.items():
        if lang != LANG_SPA:
            continue
        
        linked_ids = neighbors.get(spa_id, set())
        
        # Find Finnish and English translations
        fin_ids = [sid for sid in linked_ids if sid in sent_text and sent_text[sid][0] == LANG_FIN]
        eng_ids = [sid for sid in linked_ids if sid in sent_text and sent_text[sid][0] == LANG_ENG]
        
        if not fin_ids or not eng_ids:
            continue
        
        # Create all combinations
        for fin_id in fin_ids:
            for eng_id in eng_ids:
                fin_txt = sent_text[fin_id][1]
                eng_txt = sent_text[eng_id][1]
                results.append({
                    "spa_id": spa_id,
                    "fin_id": fin_id,
                    "eng_id": eng_id,
                    "spa": spa_txt,
                    "fin": fin_txt,
                    "eng": eng_txt,
                })
    
    print(f"  Found {len(results)} triples (before deduplication)")
    return results


def deduplicate(results: list) -> list:
    """Remove duplicate triples."""
    seen = set()
    deduped = []
    
    for r in results:
        key = (r["spa_id"], r["fin_id"], r["eng_id"])
        if key not in seen:
            seen.add(key)
            deduped.append(r)
    
    print(f"  After deduplication: {len(deduped)} unique triples")
    return deduped


def save_results(results: list):
    """Save results to CSV and JSON files."""
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


def main():
    """Main entry point."""
    print("=" * 60)
    print("Tatoeba Trilingual Sentence Downloader")
    print("Languages: Spanish, Finnish, English")
    print("=" * 60)
    print()
    
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
    
    results = find_triples(sent_text, neighbors)
    results = deduplicate(results)
    
    # Save output
    save_results(results)
    
    print()
    print("=" * 60)
    print(f"Done! Found {len(results)} trilingual sentence triples.")
    print("=" * 60)


if __name__ == "__main__":
    main()
