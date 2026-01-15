#!/usr/bin/env python3
"""
Generate comprehensive V4 data consistency report.

Aggregates results from all validation scripts:
- Story data validation
- Frequency data validation
- Vocabulary database validation
- Story-vocabulary cross-reference validation
- Manifest validation

Outputs a markdown report with executive summary and detailed findings.
Also generates CSV file with detailed issue information.
"""

import json
import os
import csv
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any


def load_validation_results() -> Dict[str, Any]:
    """Load all validation result files."""
    reports_dir = Path(__file__).parent.parent / "reports"
    
    results = {
        "story": reports_dir / "story-validation-results.txt",
        "frequency": reports_dir / "frequency-validation-results.txt",
        "vocabulary": reports_dir / "vocabulary-validation-results.txt",
        "crossref": reports_dir / "story-vocabulary-crossref-results.txt",
        "manifest": reports_dir / "manifest-validation-results.txt"
    }
    
    loaded = {}
    for key, path in results.items():
        if path.exists():
            with open(path, 'r', encoding='utf-8') as f:
                loaded[key] = f.read()
        else:
            loaded[key] = None
    
    return loaded


def load_stories() -> List[Dict]:
    """Load stories from JSON file."""
    stories_file = Path(__file__).parent.parent / "svelte/static/stories/stories.json"
    with open(stories_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data.get('stories', [])


def parse_story_validation(content: str) -> Dict[str, Any]:
    """Parse story validation results."""
    if not content:
        return {"available": False}
    
    issues = {
        "legacy_difficulty": 0,
        "invalid_categories": 0,
        "title_mismatches": 0,
        "vocab_count_mismatches": 0,
        "question_count_mismatches": 0,
        "question_structure_issues": 0,
        "total_issues": 0
    }
    
    # Parse total stories
    total_stories = 0
    for line in content.split('\n'):
        if line.startswith("Total stories:"):
            total_stories = int(line.split(":")[1].strip())
        elif "Stories with legacy 'difficulty' field:" in line:
            issues["legacy_difficulty"] = int(line.split(":")[1].strip())
        elif "Stories with invalid categories:" in line:
            issues["invalid_categories"] = int(line.split(":")[1].strip())
        elif "Stories with title mismatches:" in line:
            issues["title_mismatches"] = int(line.split(":")[1].strip())
        elif "Vocabulary count mismatches:" in line:
            issues["vocab_count_mismatches"] = int(line.split(":")[1].strip())
        elif "Question count mismatches:" in line:
            issues["question_count_mismatches"] = int(line.split(":")[1].strip())
        elif "Questions with non-standard option count:" in line:
            issues["question_structure_issues"] = int(line.split(":")[1].strip())
        elif line.startswith("Total issues found:"):
            issues["total_issues"] = int(line.split(":")[1].strip())
    
    return {
        "available": True,
        "total_stories": total_stories,
        "issues": issues
    }


def parse_frequency_validation(content: str) -> Dict[str, Any]:
    """Parse frequency validation results."""
    if not content:
        return {"available": False}
    
    data = {
        "total_words": 0,
        "errors": [],
        "warnings": [],
        "valid": False
    }
    
    for line in content.split('\n'):
        if line.startswith("Total words:"):
            data["total_words"] = int(line.split(":")[1].strip())
        elif line.startswith("Structure valid:"):
            data["valid"] = line.split(":")[1].strip() == "True"
        elif line.startswith("NO ERRORS FOUND"):
            data["errors"] = []
        elif line.startswith("- A1+A2 levels only"):
            data["warnings"].append(line.strip("- "))
    
    return {
        "available": True,
        "data": data
    }


def parse_vocabulary_validation(content: str) -> Dict[str, Any]:
    """Parse vocabulary validation results."""
    if not content:
        return {"available": False}
    
    data = {
        "total_words": 0,
        "total_categories": 0,
        "words_with_tips": 0,
        "words_in_frequency": 0,
        "words_not_in_frequency": 0,
        "top100_coverage": 0,
        "top500_coverage": 0,
        "top1000_coverage": 0,
        "duplicate_words": 0
    }
    
    for line in content.split('\n'):
        if line.startswith("Total categories:"):
            data["total_categories"] = int(line.split(":")[1].strip())
        elif line.startswith("Total vocabulary words:"):
            data["total_words"] = int(line.split(":")[1].strip())
        elif "Words with learning tips:" in line:
            parts = line.split(":")
            if len(parts) > 1:
                nums = parts[1].split("/")
                if len(nums) >= 2:
                    data["words_with_tips"] = int(nums[0].strip())
        elif "Vocabulary words in frequency data:" in line:
            parts = line.split(":")
            if len(parts) > 1:
                nums = parts[1].split("/")
                if len(nums) >= 2:
                    data["words_in_frequency"] = int(nums[0].strip())
        elif "Vocabulary words NOT in frequency data:" in line:
            data["words_not_in_frequency"] = int(line.split(":")[1].strip())
        elif "Top 100 words in vocabulary:" in line:
            parts = line.split(":")
            if len(parts) > 1:
                nums = parts[1].split("/")
                if len(nums) >= 2:
                    data["top100_coverage"] = int(nums[0].strip())
        elif "Top 500 words in vocabulary:" in line:
            parts = line.split(":")
            if len(parts) > 1:
                nums = parts[1].split("/")
                if len(nums) >= 2:
                    data["top500_coverage"] = int(nums[0].strip())
        elif "Top 1000 words in vocabulary:" in line:
            parts = line.split(":")
            if len(parts) > 1:
                nums = parts[1].split("/")
                if len(nums) >= 2:
                    data["top1000_coverage"] = int(nums[0].strip())
        elif "Total words in multiple categories:" in line:
            data["duplicate_words"] = int(line.split(":")[1].strip())
    
    return {
        "available": True,
        "data": data
    }


def parse_crossref_validation(content: str) -> Dict[str, Any]:
    """Parse story-vocabulary cross-reference validation results."""
    if not content:
        return {"available": False}
    
    data = {
        "total_stories": 0,
        "orphaned_vocab": 0,
        "missing_from_db": 0,
        "inconsistent_translations": 0
    }
    
    for line in content.split('\n'):
        if line.startswith("Total stories:"):
            data["total_stories"] = int(line.split(":")[1].strip())
        elif line.startswith("Total orphaned vocabulary words:"):
            data["orphaned_vocab"] = int(line.split(":")[1].strip())
        elif line.startswith("Total vocabulary words missing from database:"):
            data["missing_from_db"] = int(line.split(":")[1].strip())
        elif line.startswith("Total inconsistent translations:"):
            data["inconsistent_translations"] = int(line.split(":")[1].strip())
    
    return {
        "available": True,
        "data": data
    }


def parse_manifest_validation(content: str) -> Dict[str, Any]:
    """Parse manifest validation results."""
    if not content:
        return {"available": False}
    
    data = {
        "stories_in_manifest": 0,
        "story_files_found": 0,
        "valid": False,
        "errors": []
    }
    
    for line in content.split('\n'):
        if line.startswith("Stories in manifest:"):
            data["stories_in_manifest"] = int(line.split(":")[1].strip())
        elif line.startswith("Story files found:"):
            data["story_files_found"] = int(line.split(":")[1].strip())
        elif line.startswith("Manifest structure valid:"):
            data["valid"] = line.split(":")[1].strip() == "True"
        elif line.startswith("NO ERRORS FOUND"):
            data["errors"] = []
    
    return {
        "available": True,
        "data": data
    }


def calculate_health_score(parsed_results: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate overall data health score."""
    scores = {}
    
    # Story validation score (0-100)
    if parsed_results["story"]["available"]:
        story_data = parsed_results["story"]
        total_issues = story_data["issues"]["total_issues"]
        total_stories = story_data["total_stories"]
        # Deduct points for each issue type
        deductions = 0
        deductions += story_data["issues"]["legacy_difficulty"] * 0.5  # Minor issue
        deductions += story_data["issues"]["invalid_categories"] * 2  # Major issue
        deductions += story_data["issues"]["title_mismatches"] * 0.3  # Minor issue
        deductions += story_data["issues"]["vocab_count_mismatches"] * 1  # Medium issue
        deductions += story_data["issues"]["question_count_mismatches"] * 1  # Medium issue
        deductions += story_data["issues"]["question_structure_issues"] * 3  # Major issue
        
        scores["story"] = max(0, 100 - deductions)
    else:
        scores["story"] = None
    
    # Frequency validation score (0-100)
    if parsed_results["frequency"]["available"]:
        freq_data = parsed_results["frequency"]["data"]
        score = 100 if freq_data["valid"] else 0
        score -= len(freq_data["warnings"]) * 5  # Deduct for warnings
        scores["frequency"] = max(0, score)
    else:
        scores["frequency"] = None
    
    # Vocabulary validation score (0-100)
    if parsed_results["vocabulary"]["available"]:
        vocab_data = parsed_results["vocabulary"]["data"]
        score = 100
        # Deduct for missing frequency data
        if vocab_data["total_words"] > 0:
            missing_pct = (vocab_data["words_not_in_frequency"] / vocab_data["total_words"]) * 100
            score -= missing_pct * 0.3  # 30% weight
        # Deduct for low tip coverage
        if vocab_data["total_words"] > 0:
            tip_pct = (vocab_data["words_with_tips"] / vocab_data["total_words"]) * 100
            if tip_pct < 10:
                score -= (10 - tip_pct) * 0.5  # Deduct if below 10%
        scores["vocabulary"] = max(0, score)
    else:
        scores["vocabulary"] = None
    
    # Cross-reference validation score (0-100)
    if parsed_results["crossref"]["available"]:
        crossref_data = parsed_results["crossref"]["data"]
        score = 100
        score -= crossref_data["orphaned_vocab"] * 2  # Major issue
        score -= crossref_data["missing_from_db"] * 1  # Medium issue
        score -= crossref_data["inconsistent_translations"] * 3  # Major issue
        scores["crossref"] = max(0, score)
    else:
        scores["crossref"] = None
    
    # Manifest validation score (0-100)
    if parsed_results["manifest"]["available"]:
        manifest_data = parsed_results["manifest"]["data"]
        score = 100 if manifest_data["valid"] else 0
        if manifest_data["stories_in_manifest"] != manifest_data["story_files_found"]:
            score -= 20  # Major issue
        scores["manifest"] = max(0, score)
    else:
        scores["manifest"] = None
    
    # Overall score (average of available scores)
    available_scores = [s for s in scores.values() if s is not None]
    overall = sum(available_scores) / len(available_scores) if available_scores else 0
    
    return {
        "scores": scores,
        "overall": overall
    }


def generate_csv_report(stories: List[Dict], crossref_content: str) -> List[Dict[str, str]]:
    """
    Generate CSV data with detailed issue information.
    
    Returns list of dictionaries with fields:
    - story_filename: Story file name
    - word: The problematic word (Spanish)
    - word_finnish: Finnish translation from story vocabulary
    - issue_type: ORPHANED|MISSING|INCONSISTENT
    - phrase_number: Phrase number in dialogue (if applicable)
    - phrase_spanish: Spanish text of the phrase
    - phrase_finnish: Finnish translation of the phrase
    - phrase_english: English translation of the phrase
    """
    csv_data = []
    
    if not crossref_content:
        return csv_data
    
    # Parse the crossref report to extract detailed information
    current_section = None
    current_story = None
    current_story_title = None
    
    lines = crossref_content.split('\n')
    i = 0
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Stop at RECOMMENDATIONS section
        if "RECOMMENDATIONS" in line:
            break
        
        # Detect section headers
        if "ORPHANED VOCABULARY" in line:
            current_section = "ORPHANED"
        elif "VOCABULARY MISSING FROM DATABASE" in line:
            current_section = "MISSING"
        elif "INCONSISTENT TRANSLATIONS" in line:
            current_section = "INCONSISTENT"
        elif line.startswith("Story:"):
            # Extract story ID and title
            match = re.match(r"Story:\s+([^\s]+)\s+-\s+(.+)", line)
            if match:
                current_story = match.group(1)
                current_story_title = match.group(2)
        elif line.startswith("- ") and current_section and current_story:
            # Extract word from the line
            word = line[2:].strip()
            
            # Skip lines that are part of recommendations or sub-items
            if any(skip_word in word.lower() for skip_word in ['standardize', 'choose', 'update', 'review', 'add', 'consider']):
                i += 1
                continue
            
            # For INCONSISTENT section, skip the "Story:" and "DB:" lines that follow
            if current_section == "INCONSISTENT":
                # Skip next two lines (Story: and DB:)
                i += 2
            
            # Find the story data
            story_data = next((s for s in stories if s.get('id') == current_story), None)
            
            if story_data:
                # Get Finnish translation from story vocabulary
                word_finnish = get_finnish_from_vocabulary(word, story_data.get('vocabulary', []))
                
                # Find phrase containing this word in dialogue
                dialogue = story_data.get('dialogue', [])
                phrase_info = find_word_in_dialogue(word, dialogue)
                
                csv_row = {
                    'story_filename': f"{current_story}.json",
                    'story_title': current_story_title,
                    'word': word,
                    'word_finnish': word_finnish,
                    'issue_type': current_section,
                    'phrase_number': phrase_info['phrase_number'],
                    'phrase_spanish': phrase_info['spanish'],
                    'phrase_finnish': phrase_info['finnish'],
                    'phrase_english': phrase_info['english']
                }
                csv_data.append(csv_row)
        
        i += 1
    
    return csv_data


def get_finnish_from_vocabulary(spanish_word: str, vocabulary: List[Dict]) -> str:
    """
    Get Finnish translation from story vocabulary list.
    """
    for vocab_entry in vocabulary:
        if vocab_entry.get('spanish', '').lower() == spanish_word.lower():
            return vocab_entry.get('finnish', '')
    return ''


def find_word_in_dialogue(word: str, dialogue: List[Dict]) -> Dict[str, str]:
    """
    Find a word in the dialogue and return phrase information.
    Returns dict with phrase_number, spanish, finnish, english.
    """
    # Normalize word for searching (remove articles, lowercase)
    search_word = word.lower().strip()
    for article in ['el ', 'la ', 'los ', 'las ', 'un ', 'una ', 'unos ', 'unas ']:
        if search_word.startswith(article):
            search_word = search_word[len(article):]
            break
    
    # Extract significant tokens from the word
    word_tokens = re.findall(r'\b[a-záéíóúñü]+\b', search_word)
    articles = {'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'}
    significant_tokens = [t for t in word_tokens if t not in articles]
    
    # Search through dialogue
    for idx, line in enumerate(dialogue, 1):
        spanish_text = line.get('spanish', '').lower()
        
        # Check if any significant token appears in this line
        for token in significant_tokens:
            if token in spanish_text:
                return {
                    'phrase_number': str(idx),
                    'spanish': line.get('spanish', ''),
                    'finnish': line.get('finnish', ''),
                    'english': line.get('english', '')
                }
    
    # If not found in dialogue, return empty
    return {
        'phrase_number': 'N/A',
        'spanish': '',
        'finnish': '',
        'english': ''
    }


def generate_markdown_report(parsed_results: Dict[str, Any], health_scores: Dict[str, Any]) -> str:
    """Generate markdown report."""
    report = []
    
    # Header
    report.append("# V4 Data Consistency Report")
    report.append("")
    report.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("")
    report.append("This report aggregates results from all data validation scripts to provide")
    report.append("a comprehensive overview of data quality in Espanjapeli V4.")
    report.append("")
    
    # Executive Summary
    report.append("## Executive Summary")
    report.append("")
    
    overall_score = health_scores["overall"]
    if overall_score >= 90:
        status = "🟢 EXCELLENT"
        summary = "Data is in excellent condition with minimal issues."
    elif overall_score >= 75:
        status = "🟡 GOOD"
        summary = "Data is in good condition with some minor issues to address."
    elif overall_score >= 60:
        status = "🟠 FAIR"
        summary = "Data has several issues that should be addressed."
    else:
        status = "🔴 NEEDS ATTENTION"
        summary = "Data has significant issues that require immediate attention."
    
    report.append(f"**Overall Health Score:** {overall_score:.1f}/100 - {status}")
    report.append("")
    report.append(summary)
    report.append("")
    
    # Component Scores
    report.append("### Component Scores")
    report.append("")
    report.append("| Component | Score | Status |")
    report.append("|-----------|-------|--------|")
    
    for component, score in health_scores["scores"].items():
        if score is not None:
            if score >= 90:
                status_icon = "🟢"
            elif score >= 75:
                status_icon = "🟡"
            elif score >= 60:
                status_icon = "🟠"
            else:
                status_icon = "🔴"
            report.append(f"| {component.title()} | {score:.1f} | {status_icon} |")
        else:
            report.append(f"| {component.title()} | N/A | ⚪ |")
    
    report.append("")
    
    # Story Validation
    if parsed_results["story"]["available"]:
        report.append("## Story Data Validation")
        report.append("")
        story_data = parsed_results["story"]
        report.append(f"**Total Stories:** {story_data['total_stories']}")
        report.append(f"**Total Issues:** {story_data['issues']['total_issues']}")
        report.append("")
        
        report.append("### Issues Breakdown")
        report.append("")
        issues = story_data["issues"]
        report.append(f"- **Legacy 'difficulty' field:** {issues['legacy_difficulty']} stories")
        report.append(f"- **Invalid categories:** {issues['invalid_categories']} stories")
        report.append(f"- **Title mismatches:** {issues['title_mismatches']} stories")
        report.append(f"- **Vocabulary count mismatches:** {issues['vocab_count_mismatches']} stories")
        report.append(f"- **Question count mismatches:** {issues['question_count_mismatches']} stories")
        report.append(f"- **Question structure issues:** {issues['question_structure_issues']} questions")
        report.append("")
        
        report.append("### Priority Actions")
        report.append("")
        if issues["legacy_difficulty"] > 0:
            report.append(f"1. **Remove legacy 'difficulty' field** from {issues['legacy_difficulty']} stories")
        if issues["invalid_categories"] > 0:
            report.append(f"2. **Fix invalid categories** in {issues['invalid_categories']} stories")
        if issues["vocab_count_mismatches"] > 0 or issues["question_count_mismatches"] > 0:
            report.append(f"3. **Regenerate manifest** to sync metadata counts")
        if issues["question_structure_issues"] > 0:
            report.append(f"4. **Fix question structure** in {issues['question_structure_issues']} questions")
        if issues["title_mismatches"] > 0:
            report.append(f"5. **Update story titles** to Finnish in {issues['title_mismatches']} stories")
        report.append("")
    
    # Frequency Validation
    if parsed_results["frequency"]["available"]:
        report.append("## Frequency Data Validation")
        report.append("")
        freq_data = parsed_results["frequency"]["data"]
        report.append(f"**Total Words:** {freq_data['total_words']}")
        report.append(f"**Valid:** {'✅ Yes' if freq_data['valid'] else '❌ No'}")
        report.append("")
        
        if freq_data["warnings"]:
            report.append("### Warnings")
            report.append("")
            for warning in freq_data["warnings"]:
                report.append(f"- {warning}")
            report.append("")
        else:
            report.append("✅ **No issues found** - Frequency data is valid")
            report.append("")
    
    # Vocabulary Validation
    if parsed_results["vocabulary"]["available"]:
        report.append("## Vocabulary Database Validation")
        report.append("")
        vocab_data = parsed_results["vocabulary"]["data"]
        report.append(f"**Total Categories:** {vocab_data['total_categories']}")
        report.append(f"**Total Words:** {vocab_data['total_words']}")
        report.append("")
        
        report.append("### Coverage Statistics")
        report.append("")
        if vocab_data["total_words"] > 0:
            in_freq_pct = (vocab_data["words_in_frequency"] / vocab_data["total_words"]) * 100
            report.append(f"- **Words in frequency data:** {vocab_data['words_in_frequency']}/{vocab_data['total_words']} ({in_freq_pct:.1f}%)")
        report.append(f"- **Words NOT in frequency data:** {vocab_data['words_not_in_frequency']}")
        report.append(f"- **Top 100 coverage:** {vocab_data['top100_coverage']}/100")
        report.append(f"- **Top 500 coverage:** {vocab_data['top500_coverage']}/500")
        report.append(f"- **Top 1000 coverage:** {vocab_data['top1000_coverage']}/1000")
        report.append("")
        
        report.append("### Learning Tips")
        report.append("")
        if vocab_data["total_words"] > 0:
            tip_pct = (vocab_data["words_with_tips"] / vocab_data["total_words"]) * 100
            report.append(f"- **Words with tips:** {vocab_data['words_with_tips']}/{vocab_data['total_words']} ({tip_pct:.1f}%)")
        report.append("")
        
        if vocab_data["duplicate_words"] > 0:
            report.append("### Duplicates")
            report.append("")
            report.append(f"- **Words in multiple categories:** {vocab_data['duplicate_words']}")
            report.append("")
    
    # Cross-reference Validation
    if parsed_results["crossref"]["available"]:
        report.append("## Story-Vocabulary Cross-Reference")
        report.append("")
        crossref_data = parsed_results["crossref"]["data"]
        report.append(f"**Stories Analyzed:** {crossref_data['total_stories']}")
        report.append("")
        
        report.append("### Issues Found")
        report.append("")
        report.append(f"- **Orphaned vocabulary words:** {crossref_data['orphaned_vocab']}")
        report.append(f"  _(Words in story vocabulary but not in dialogue)_")
        report.append("")
        report.append(f"- **Missing from database:** {crossref_data['missing_from_db']}")
        report.append(f"  _(Story vocabulary words not in main database)_")
        report.append("")
        report.append(f"- **Inconsistent translations:** {crossref_data['inconsistent_translations']}")
        report.append(f"  _(Different translations between story and database)_")
        report.append("")
        
        if crossref_data["orphaned_vocab"] > 0 or crossref_data["missing_from_db"] > 0 or crossref_data["inconsistent_translations"] > 0:
            report.append("### Recommendations")
            report.append("")
            if crossref_data["orphaned_vocab"] > 0:
                report.append("1. Review orphaned vocabulary and update dialogues to include these words")
            if crossref_data["missing_from_db"] > 0:
                report.append("2. Add missing words to main vocabulary database (words.ts)")
            if crossref_data["inconsistent_translations"] > 0:
                report.append("3. Standardize translations between stories and database")
            report.append("")
    
    # Manifest Validation
    if parsed_results["manifest"]["available"]:
        report.append("## Manifest Validation")
        report.append("")
        manifest_data = parsed_results["manifest"]["data"]
        report.append(f"**Stories in Manifest:** {manifest_data['stories_in_manifest']}")
        report.append(f"**Story Files Found:** {manifest_data['story_files_found']}")
        report.append(f"**Valid:** {'✅ Yes' if manifest_data['valid'] else '❌ No'}")
        report.append("")
        
        if manifest_data["valid"] and manifest_data["stories_in_manifest"] == manifest_data["story_files_found"]:
            report.append("✅ **No issues found** - Manifest is in sync with story files")
            report.append("")
        else:
            report.append("### Issues")
            report.append("")
            if not manifest_data["valid"]:
                report.append("- Manifest structure is invalid")
            if manifest_data["stories_in_manifest"] != manifest_data["story_files_found"]:
                report.append("- Manifest and story files are out of sync")
            report.append("")
    
    # Next Steps
    report.append("## Next Steps")
    report.append("")
    
    if overall_score >= 90:
        report.append("Data quality is excellent. Continue monitoring with periodic validation runs.")
    elif overall_score >= 75:
        report.append("Address minor issues identified above to improve data quality.")
    else:
        report.append("**Priority actions required:**")
        report.append("")
        report.append("1. Run individual validation scripts for detailed issue lists")
        report.append("2. Address high-priority issues (invalid categories, question structure)")
        report.append("3. Regenerate manifest after fixing story data")
        report.append("4. Add missing vocabulary to database")
        report.append("5. Standardize translations across all data sources")
    
    report.append("")
    
    # Footer
    report.append("---")
    report.append("")
    report.append("## Validation Scripts")
    report.append("")
    report.append("This report aggregates data from:")
    report.append("")
    report.append("- `scripts/test_story_data_integrity.py` - Story structure validation")
    report.append("- `scripts/validate_frequency_data.py` - Frequency data validation")
    report.append("- `scripts/validate_vocabulary_database.py` - Vocabulary database validation")
    report.append("- `scripts/validate_story_vocabulary_crossref.py` - Cross-reference validation")
    report.append("- `scripts/validate_manifest.py` - Manifest sync validation")
    report.append("")
    report.append("To regenerate this report, run:")
    report.append("```bash")
    report.append("python scripts/generate_data_consistency_report.py")
    report.append("```")
    report.append("")
    
    return "\n".join(report)


def main():
    """Main execution."""
    print("Loading validation results...")
    raw_results = load_validation_results()
    
    print("Parsing validation data...")
    parsed_results = {
        "story": parse_story_validation(raw_results["story"]),
        "frequency": parse_frequency_validation(raw_results["frequency"]),
        "vocabulary": parse_vocabulary_validation(raw_results["vocabulary"]),
        "crossref": parse_crossref_validation(raw_results["crossref"]),
        "manifest": parse_manifest_validation(raw_results["manifest"])
    }
    
    print("Calculating health scores...")
    health_scores = calculate_health_score(parsed_results)
    
    print("Generating markdown report...")
    markdown_report = generate_markdown_report(parsed_results, health_scores)
    
    # Write markdown report
    output_path = Path(__file__).parent.parent / "reports" / "v4-data-consistency-report.md"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown_report)
    
    print(f"\n✅ Markdown report generated: {output_path}")
    
    # Generate CSV report
    print("Generating CSV report...")
    stories = load_stories()
    csv_data = generate_csv_report(stories, raw_results["crossref"])
    
    if csv_data:
        csv_output_path = Path(__file__).parent.parent / "reports" / "v4-data-consistency-issues.csv"
        with open(csv_output_path, 'w', encoding='utf-8', newline='') as f:
            fieldnames = ['story_filename', 'story_title', 'word', 'word_finnish', 'issue_type', 
                         'phrase_number', 'phrase_spanish', 'phrase_finnish', 'phrase_english']
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(csv_data)
        
        print(f"✅ CSV report generated: {csv_output_path}")
        print(f"   Total issues: {len(csv_data)}")
    else:
        print("⚠️  No CSV data to generate (no cross-reference issues found)")
    
    print(f"\nOverall Health Score: {health_scores['overall']:.1f}/100")
    
    # Print summary to console
    print("\nComponent Scores:")
    for component, score in health_scores["scores"].items():
        if score is not None:
            print(f"  {component.title()}: {score:.1f}/100")
        else:
            print(f"  {component.title()}: N/A")


if __name__ == "__main__":
    main()
