#!/usr/bin/env python3
"""
Analyze 'general' category sentences and identify potential subcategories.

This script loads deduplicated sentences and filters for those in the 'general'
category (sentences that didn't match any existing category keywords). It then
performs statistical analysis and applies additional semantic categorization
patterns based on common Spanish discourse themes.

Data source: https://tatoeba.org
License: CC-BY 2.0 FR
"""

import json
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Set, Tuple
from collections import defaultdict, Counter

# Configuration
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
PROJECT_ROOT = SCRIPT_DIR.parent.parent
REPORTS_DIR = PROJECT_ROOT / "reports"

INPUT_JSON = DATA_DIR / "tatoeba_deduplicated.json"
OUTPUT_REPORT = REPORTS_DIR / "tatoeba-general-analysis-report.txt"

# RECOMMENDATION THRESHOLD - Minimum sentence count for a category to be recommended
RECOMMENDATION_THRESHOLD = 20

# SEMANTIC ANALYSIS CONFIGURATION
# These categories are derived from linguistic research on Spanish discourse patterns
# and common semantic themes in everyday Spanish communication.
# Sources:
# - https://www.spanish.academy/blog/100-essential-spanish-phrases-for-conversational-fluency/
# - https://www.fluentu.com/blog/spanish/common-spanish-phrases/
# - https://spanish.kwiziq.com/learn/theme

SEMANTIC_CATEGORIES = {
    "statements_of_fact": {
        "priority": 1,
        "keywords": [
            "son", "está", "están", "hay", "existe", "existen",
            "verdad", "realidad", "hecho", "cierto", "verdadero",
        ],
        "patterns": [
            r"^[^.!?]*\s(es|son|está|están|hay)\s",
            r"\b(es decir|o sea|es cierto|es verdad|es evidente)\b",
        ]
    },

    "opinions_and_beliefs": {
        "priority": 2,
        "keywords": [
            "creo", "pienso", "opino", "considero", "parece", "me parece",
            "a mi juicio", "en mi opinión", "personalmente", "me imagino",
            "supongo", "imagino", "siento", "me siento",
        ],
        "patterns": [
            r"\b(creo|pienso|me parece|opino|considero|supongo)\b",
            r"^(yo|a mi)\s+(creo|pienso|opino)",
        ]
    },

    "questions_inquiries": {
        "priority": 3,
        "keywords": [
            "¿", "qué", "cuál", "cuáles", "cuándo", "dónde", "por qué",
            "cómo", "cuánto", "cuántos", "cuánta", "cuántas", "quién",
        ],
        "patterns": [
            r"^.*\?$",
            r"^¿.*\?$",
        ]
    },

    "requests_and_imperatives": {
        "priority": 4,
        "keywords": [
            "por favor", "harías", "puedes", "podrías", "haz", "hacer",
            "necesito", "quiero", "deseo", "quisiera", "me gustaría",
            "pide", "pedido", "solicito",
        ],
        "patterns": [
            r"^(haz|hazme|dime|dame|pon|trae|lleva|espera|escucha)\b",
            r"\b(por favor|si no te importa|si es posible)\b",
        ]
    },


    "temporal_references": {
        "priority": 6,
        "keywords": [
            "cuando", "mientras", "antes", "después", "siempre", "nunca",
            "a veces", "frecuentemente", "jamás", "alguna vez", "todavía",
            "aún", "durante", "entre", "hace", "hace poco", "hace mucho",
        ],
        "patterns": [
            r"\b(cuando|mientras|antes|después|siempre|nunca|a veces)\b",
            r"\b(hace\s+\w+\s+(días|meses|años|semanas))\b",
        ]
    },

    "conditional_statements": {
        "priority": 7,
        "keywords": [
            "si", "si no", "en caso de", "a menos que", "si acaso", "si por",
            "condicional", "sería", "fuera", "fuese", "hubiera", "habría",
        ],
        "patterns": [
            r"^si\s+",
            r"\b(si|en caso de|a menos que)\b",
            r"\b(sería|fuera|hubiera|habría)\b",
        ]
    },

    "comparison_and_contrast": {
        "priority": 8,
        "keywords": [
            "como", "igual", "diferente", "distinto", "similar", "parecido",
            "más que", "menos que", "más", "menos", "tanto", "también",
            "tampoco", "en cambio", "por el contrario", "al contrario",
        ],
        "patterns": [
            r"\b(como|igual|diferente|similar|parecido)\b",
            r"\b(más que|menos que|en cambio|por el contrario|al contrario)\b",
        ]
    },

    "negation_and_denial": {
        "priority": 9,
        "keywords": [
            "no", "ni", "nada", "nadie", "nunca", "jamás", "nunca jamás",
            "de ninguna forma", "de ningún modo", "de ninguna manera",
            "para nada", "en absoluto",
        ],
        "patterns": [
            r"^no\s+",
            r"\b(no|ni|nada|nadie|nunca)\b",
        ]
    },




    "interpersonal_dynamics": {
        "priority": 13,
        "keywords": [
            "tú", "yo", "él", "ella", "nosotros", "vosotros", "ellos",
            "mío", "tuyo", "suyo", "nuestro", "vuestro", "sus",
            "relación", "amistad", "enemistad", "alianza", "conflicto",
        ],
        "patterns": [
            r"\b(mí|ti|él|ella|nosotros|vosotros|ellos|ellas)\b",
        ]
    },

    "reasoning_assessment": {
        "priority": 10,
        "keywords": [
            # Cause and Effect
            "porque", "por eso", "por lo tanto", "por consiguiente", "así que",
            "resultado", "consecuencia", "razón", "causa", "motivo",
            "debido a", "a causa de", "por culpa de",
            # Possibility and Probability
            "puede", "pueda", "posible", "probable", "probablemente", "quizá",
            "quizás", "tal vez", "posiblemente", "seguramente", "debe",
            "podría", "habría",
            # Evaluations and Judgments
            "bueno", "malo", "mejor", "peor", "excelente", "horrible",
            "fantástico", "terrible", "perfecto", "pésimo", "magnífico",
            # Abstract Concepts
            "mundo", "vida", "muerte", "alma", "espíritu", "idea", "concepto",
            "pensamiento", "sentimiento", "verdad", "mentira", "esperanza",
            "miedo", "valor", "cobardía", "amor", "odio", "justicia",
        ],
        "patterns": [
            # Cause and Effect
            r"\b(porque|por eso|debido a|a causa de|como resultado)\b",
            r"\b(por lo tanto|por consiguiente|así que|en consecuencia)\b",
            # Possibility and Probability
            r"\b(puede|posible|probable|probablemente|quizá|quizás|tal vez)\b",
            r"\b(seguramente|debe|podría|sería|habría)\b",
            # Evaluations and Judgments
            r"\b(bueno|malo|mejor|peor|excelente|horrible|fantástico|terrible)\b",
            # Abstract Concepts
            r"\b(mundo|vida|muerte|alma|espíritu|idea|verdad|mentira)\b",
        ]
    },
}


@dataclass
class Sentence:
    """Represents a sentence."""
    id: str
    spanish: str
    finnish: str
    english: str
    wordCount: int


def load_deduplicated_sentences() -> List[Dict]:
    """Load deduplicated sentences from download script output."""
    print("Loading deduplicated sentences...")
    if not INPUT_JSON.exists():
        raise FileNotFoundError(f"Deduplicated sentences not found: {INPUT_JSON}")

    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        sentences = json.load(f)

    print(f"  Loaded {len(sentences)} sentences")
    return sentences


def load_general_sentences_from_output() -> List[Dict]:
    """Load sentences that were categorized as 'general' from the output JSON files."""
    print("Loading general category sentences from output files...")

    output_dir = Path(__file__).parent.parent.parent / "svelte" / "static" / "sentences"

    general_files = []
    for i in range(1, 10):  # Check for general-1.json, general-2.json, etc.
        general_file = output_dir / f"general-{i}.json"
        if general_file.exists():
            general_files.append(general_file)

    if not general_files:
        # Try single general.json file
        general_file = output_dir / "general.json"
        if general_file.exists():
            general_files = [general_file]
        else:
            raise FileNotFoundError(f"No general.json files found in {output_dir}")

    all_general_sentences = []
    for general_file in general_files:
        with open(general_file, "r", encoding="utf-8") as f:
            sentences = json.load(f)
            all_general_sentences.extend(sentences)

    print(f"  Loaded {len(all_general_sentences)} sentences from general category")
    return all_general_sentences


def assign_semantic_categories(sentence_text: str) -> List[Tuple[str, str]]:
    """Assign semantic categories based on linguistic patterns.

    Args:
        sentence_text: Spanish text to analyze

    Returns:
        List of (category_id, matched_by) tuples
    """
    spanish_lower = sentence_text.lower()
    matches = []

    for category_id, category_data in SEMANTIC_CATEGORIES.items():
        # Check keywords
        for keyword in category_data["keywords"]:
            if keyword in spanish_lower:
                matches.append((category_id, f"keyword: {keyword}"))
                break

        # Check patterns if no keyword matched
        if not any(m[0] == category_id for m in matches):
            for pattern in category_data["patterns"]:
                if re.search(pattern, sentence_text, re.IGNORECASE):
                    matches.append((category_id, f"pattern: {pattern[:30]}..."))
                    break

    return matches


def analyze_general_sentences_round1(general_sentences: List[Dict]) -> Dict:
    """Analysis Round 1: Initial categorization of general sentences.

    Args:
        general_sentences: List of sentences already in general category

    Returns:
        Dictionary with analysis results
    """
    print("ANALYSIS ROUND 1: Initial categorization...")

    # Analyze semantic categories
    semantic_matches = defaultdict(list)
    sentences_by_category = defaultdict(list)

    for sentence in general_sentences:
        matches = assign_semantic_categories(sentence["spanish"])

        if matches:
            # Assign to first (highest priority) match
            category_id, matched_by = matches[0]
            semantic_matches[category_id].append({
                "spanish": sentence["spanish"],
                "matched_by": matched_by
            })
            sentences_by_category[category_id].append(sentence)

    # Calculate statistics
    total_general = len(general_sentences)
    categorized_general = sum(len(v) for v in sentences_by_category.values())
    categorization_rate = (categorized_general / total_general * 100) if total_general > 0 else 0

    return {
        "total_general_sentences": total_general,
        "semantic_matches": semantic_matches,
        "sentences_by_category": sentences_by_category,
        "categorization_rate": categorization_rate,
        "total_semantic_categories": len(semantic_matches),
    }


def analyze_general_sentences_round2(round1_analysis: Dict, general_sentences: List[Dict]) -> Dict:
    """Analysis Round 2: Re-categorize by processing lowest sentence count first.

    This round processes categories in order of increasing sentence count, filtering
    them out from the remaining sentences as they are categorized.

    Args:
        round1_analysis: Results from analysis round 1
        general_sentences: List of all sentences in general category

    Returns:
        Dictionary with round 2 analysis results
    """
    print("ANALYSIS ROUND 2: Re-categorization by priority (lowest count first)...")

    # Start with all sentences
    remaining_sentences = list(general_sentences)
    round2_matches = defaultdict(list)
    round2_sentences_by_category = defaultdict(list)

    # Get categories sorted by sentence count (ascending - lowest first)
    round1_categories = round1_analysis['sentences_by_category']
    categories_by_count = sorted(
        round1_categories.items(),
        key=lambda x: len(x[1])
    )

    print(f"  Processing {len(categories_by_count)} categories in order of lowest count first...")

    for category_id, _ in categories_by_count:
        category_matches = []

        # Process remaining sentences
        newly_categorized = []
        for sentence in remaining_sentences:
            matches = assign_semantic_categories(sentence["spanish"])

            if matches and matches[0][0] == category_id:
                matched_by = matches[0][1]
                category_matches.append({
                    "spanish": sentence["spanish"],
                    "matched_by": matched_by
                })
                round2_sentences_by_category[category_id].append(sentence)
                newly_categorized.append(sentence)

        # Remove categorized sentences from remaining pool
        for sentence in newly_categorized:
            remaining_sentences.remove(sentence)

        if category_matches:
            round2_matches[category_id] = category_matches

    # Calculate statistics
    total_general = len(general_sentences)
    categorized_general = sum(len(v) for v in round2_sentences_by_category.values())
    categorization_rate = (categorized_general / total_general * 100) if total_general > 0 else 0

    return {
        "total_general_sentences": total_general,
        "semantic_matches": round2_matches,
        "sentences_by_category": round2_sentences_by_category,
        "categorization_rate": categorization_rate,
        "total_semantic_categories": len(round2_matches),
        "remaining_uncategorized": remaining_sentences,
    }


def calculate_word_count_stats(sentences: List[Dict]) -> Dict:
    """Calculate word count statistics for sentences."""
    word_counts = []

    for sentence in sentences:
        word_count = len(sentence["spa"].split())
        word_counts.append(word_count)

    if not word_counts:
        return {
            "min": 0, "max": 0, "avg": 0,
            "median": 0, "mode": 0
        }

    word_counts.sort()

    return {
        "min": min(word_counts),
        "max": max(word_counts),
        "avg": sum(word_counts) / len(word_counts),
        "median": word_counts[len(word_counts) // 2],
        "mode": Counter(word_counts).most_common(1)[0][0],
    }


def generate_analysis_report(analysis: Dict):
    """Generate human-readable analysis report.

    Args:
        analysis: Analysis results dictionary
    """
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    report_lines = []
    report_lines.append("TATOEBA GENERAL CATEGORY ANALYSIS REPORT")
    report_lines.append("=" * 80)
    report_lines.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report_lines.append("")

    # Overview
    report_lines.append("OVERVIEW")
    report_lines.append("-" * 80)
    report_lines.append(f"Total sentences in general category: {analysis['total_general_sentences']:,}")
    report_lines.append(f"Sentences successfully categorized: {sum(len(v) for v in analysis['sentences_by_category'].values()):,}")
    report_lines.append(f"Categorization rate: {analysis['categorization_rate']:.1f}%")
    report_lines.append(f"Total semantic categories identified: {analysis['total_semantic_categories']}")
    report_lines.append("")

    # Semantic category breakdown
    report_lines.append("SEMANTIC CATEGORIES (ordered by priority)")
    report_lines.append("-" * 80)
    report_lines.append(f"{'Category':<35} {'Count':>10} {'Percentage':>10}")
    report_lines.append("-" * 80)

    total_categorized = sum(len(v) for v in analysis['sentences_by_category'].values())

    # Sort by priority from SEMANTIC_CATEGORIES
    sorted_categories = sorted(
        analysis['sentences_by_category'].items(),
        key=lambda x: SEMANTIC_CATEGORIES.get(x[0], {}).get("priority", 999)
    )

    for category_id, sentences in sorted_categories:
        count = len(sentences)
        percentage = (count / analysis['total_general_sentences'] * 100) if analysis['total_general_sentences'] > 0 else 0
        category_name = category_id.replace("_", " ").title()
        report_lines.append(f"{category_name:<35} {count:>10,} {percentage:>9.1f}%")

    report_lines.append("")

    # Uncategorized sentences
    uncategorized_count = analysis['total_general_sentences'] - total_categorized
    if uncategorized_count > 0:
        uncategorized_pct = (uncategorized_count / analysis['total_general_sentences'] * 100)
        report_lines.append(f"{'Remaining (uncategorized)':<35} {uncategorized_count:>10,} {uncategorized_pct:>9.1f}%")
        report_lines.append("")

    # Keywords and patterns tested
    report_lines.append("SEMANTIC ANALYSIS METHODOLOGY")
    report_lines.append("-" * 80)
    report_lines.append("The following semantic categories and patterns were tested against general sentences:")
    report_lines.append("")

    for category_id, category_data in sorted(
        SEMANTIC_CATEGORIES.items(),
        key=lambda x: x[1]["priority"]
    ):
        report_lines.append(f"[{category_data['priority']}] {category_id.replace('_', ' ').title()}")
        report_lines.append(f"    Keywords: {', '.join(category_data['keywords'][:5])}...")
        report_lines.append(f"    Patterns: {len(category_data['patterns'])} regex patterns")
        report_lines.append("")

    # Sample matches for top categories
    report_lines.append("")
    report_lines.append("SAMPLE MATCHES (3 examples per category)")
    report_lines.append("-" * 80)

    for category_id, matches in sorted(
        analysis['semantic_matches'].items(),
        key=lambda x: SEMANTIC_CATEGORIES.get(x[0], {}).get("priority", 999)
    ):
        category_name = category_id.replace("_", " ").title()
        report_lines.append(f"\n{category_name} ({len(matches)} total matches)")

        for match in matches[:3]:
            report_lines.append(f"  • {match['spanish']}")
            report_lines.append(f"    [{match['matched_by']}]")

    report_lines.append("")

    # Analysis and recommendations
    report_lines.append("")
    report_lines.append("ANALYSIS AND INSIGHTS")
    report_lines.append("-" * 80)

    if analysis['categorization_rate'] > 70:
        report_lines.append("✓ GOOD: Most general sentences can be categorized using semantic patterns.")
        report_lines.append("  Recommendation: Consider adding these semantic categories to the main pipeline.")
    elif analysis['categorization_rate'] > 50:
        report_lines.append("~ MODERATE: About half of general sentences can be categorized.")
        report_lines.append("  Recommendation: Expand keyword lists and patterns for better coverage.")
    else:
        report_lines.append("✗ LOW: Limited categorization success.")
        report_lines.append("  Recommendation: Investigate uncategorized sentences for patterns.")

    report_lines.append("")

    # Recommended new categories (above threshold)
    report_lines.append("")
    report_lines.append("RECOMMENDED NEW CATEGORIES FOR MAIN PIPELINE")
    report_lines.append("-" * 80)
    report_lines.append(f"Categories with {RECOMMENDATION_THRESHOLD}+ sentences identified in general category:")
    report_lines.append("")

    recommended_categories = []
    for category_id, matches in sorted(
        analysis['semantic_matches'].items(),
        key=lambda x: SEMANTIC_CATEGORIES.get(x[0], {}).get("priority", 999)
    ):
        if len(matches) >= RECOMMENDATION_THRESHOLD:
            recommended_categories.append((category_id, matches))

    if recommended_categories:
        # Calculate next available priority
        max_priority = max(cat.get("priority", 0) for cat in SEMANTIC_CATEGORIES.values())

        # Sort by sentence count (ascending - lowest count gets highest priority)
        recommended_categories.sort(key=lambda x: len(x[1]))

        for idx, (category_id, matches) in enumerate(recommended_categories):
            new_priority = max_priority + idx + 1
            category_data = SEMANTIC_CATEGORIES.get(category_id, {})

            report_lines.append(f"[CATEGORY {new_priority}] {category_id.replace('_', ' ').upper()}")
            report_lines.append(f"  Suggested Priority: {new_priority}")
            report_lines.append(f"  Sentence Count: {len(matches)}")
            report_lines.append(f"  Percentage of General: {(len(matches) / analysis['total_general_sentences'] * 100):.1f}%")
            report_lines.append(f"  Keywords: {', '.join(category_data['keywords'][:8])}")
            report_lines.append(f"  Regex Patterns:")
            for i, pattern in enumerate(category_data['patterns'], 1):
                report_lines.append(f"    {i}. {pattern}")
            report_lines.append("")
    else:
        report_lines.append(f"No new categories with {RECOMMENDATION_THRESHOLD}+ sentences found.")
        report_lines.append("")

    # Sources
    report_lines.append("")
    report_lines.append("RESEARCH SOURCES")
    report_lines.append("-" * 80)
    report_lines.append("Semantic categories based on linguistic research:")
    report_lines.append("- Spanish Academy: Common Spanish phrases and conversational fluency")
    report_lines.append("- FluentU: Spanish discourse patterns and communication themes")
    report_lines.append("- KwizIQ: Spanish vocabulary organization by semantic theme")
    report_lines.append("")

    # Write report
    with open(OUTPUT_REPORT, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"Report saved: {OUTPUT_REPORT}")
    print("")
    print("\n".join(report_lines))


def main():
    """Main entry point - runs the complete analysis pipeline."""
    print("=" * 80)
    print("Tatoeba General Category Analysis (Two-Round Analysis)")
    print("=" * 80)
    print()

    # Load sentences in general category from output files
    general_sentences = load_general_sentences_from_output()

    # Analyze general category - Round 1
    analysis_round1 = analyze_general_sentences_round1(general_sentences)
    print(f"  Round 1: Identified {analysis_round1['total_semantic_categories']} categories")
    print()

    # Analyze general category - Round 2
    analysis_round2 = analyze_general_sentences_round2(analysis_round1, general_sentences)
    print(f"  Round 2: Identified {analysis_round2['total_semantic_categories']} categories")
    print()

    # Generate report using Round 2 results (which incorporates Round 1 logic)
    generate_analysis_report(analysis_round2)

    print()
    print("=" * 80)
    print(f"Analysis complete. Analyzed {analysis_round2['total_general_sentences']:,} general sentences.")
    print(f"Identified {analysis_round2['total_semantic_categories']} potential semantic subcategories.")
    print("=" * 80)


if __name__ == "__main__":
    main()
