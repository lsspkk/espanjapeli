#!/usr/bin/env python3
"""
Download trilingual sentence pairs from Tatoeba (Spanish, Finnish, English).

This script downloads the Tatoeba sentence corpus and extracts all sentence
triples that have translations in Spanish, Finnish, and English. The
deduplicated results are saved for use by tatoeba_categorize.py.

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
from pathlib import Path
from typing import List, Dict, Set

# Configuration
BASE_URL = "https://downloads.tatoeba.org/exports/"
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data" / "tatoeba_raw"
OUTPUT_DIR = SCRIPT_DIR / "data"

OUTPUT_JSON = OUTPUT_DIR / "tatoeba_deduplicated.json"

FILES = {
    "sentences": "sentences.tar.bz2",
    "links": "links.tar.bz2",
}

# Language codes
LANG_SPA = "spa"  # Spanish
LANG_FIN = "fin"  # Finnish
LANG_ENG = "eng"  # English


@dataclass
class RawSentenceTriple:
    """Raw sentence triple before categorization."""
    spa_id: str
    fin_id: str
    eng_id: str
    spa: str
    fin: str
    eng: str


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
    print("Deduplicating sentences...")
    seen = set()
    deduped = []

    for s in sentences:
        key = s["spa"]
        if key not in seen:
            seen.add(key)
            deduped.append(s)

    duplicates_removed = len(sentences) - len(deduped)
    if duplicates_removed > 0:
        print(f"  Removed {duplicates_removed} duplicates")
    print(f"  Final count: {len(deduped)} unique sentences")
    return deduped, duplicates_removed


def save_deduplicated_data(sentences: List[Dict]):
    """Save deduplicated sentences to JSON for use by categorization script."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(sentences, f, ensure_ascii=False, indent=2)

    print(f"Saved deduplicated data: {OUTPUT_JSON}")


def main():
    """Main entry point - runs the complete download pipeline."""
    print("=" * 60)
    print("Tatoeba Download Pipeline")
    print("Languages: Spanish, Finnish, English")
    print("=" * 60)
    print()

    # Pipeline step 1: Load raw sentences from Tatoeba
    raw_sentences = load_raw_sentences()

    # Pipeline step 2: Deduplicate sentences
    deduplicated, duplicates_removed = deduplicate_sentences(raw_sentences)

    # Pipeline step 3: Save for categorization
    save_deduplicated_data(deduplicated)

    print()
    print("=" * 60)
    print(f"Done! Downloaded and deduplicated {len(deduplicated)} sentences.")
    print("=" * 60)
    print()
    print("Next step: Run tatoeba_categorize.py to categorize and output JSON files")


if __name__ == "__main__":
    main()
