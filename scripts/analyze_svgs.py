#!/usr/bin/env python3
"""
Analyze SVG files to find bad ones:
1. Wrong character colors (Peppa should be red #E63946, George should be blue #6B9BD2)
2. Very minimal content (few elements/low complexity)
3. Exact duplicates
4. Missing expected content for educational context

Usage: python analyze_svgs.py
"""

import os
import re
import hashlib
from collections import defaultdict
from pathlib import Path

SVG_DIR = Path(__file__).parent.parent / "svelte/static/peppa_advanced_spanish_images/svg"

# Expected colors from the guidelines
PEPPA_DRESS_COLOR = "#E63946"  # Red dress
GEORGE_SHIRT_COLOR = "#6B9BD2"  # Blue shirt
PIG_HEAD_COLOR = "#F9C6CF"  # Pink head
SNOUT_COLOR = "#FF69B4"  # Pink snout
MUMMY_DADDY_BODY = "#FF8A65"  # Orange body

# Colors that indicate wrong character coloring
WRONG_PEPPA_COLORS = ["#6B9BD2", "#6b9bd2"]  # Blue (George's color) on Peppa
WRONG_GEORGE_COLORS = ["#E63946", "#e63946"]  # Red (Peppa's color) on George

def get_file_hash(filepath):
    """Get MD5 hash of file content for duplicate detection."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    # Normalize content by removing whitespace
    normalized = re.sub(r'\s+', ' ', content.strip())
    return hashlib.md5(normalized.encode()).hexdigest()

def count_svg_elements(content):
    """Count meaningful SVG elements (excluding defs, text watermarks)."""
    # Count shapes
    shapes = len(re.findall(r'<(rect|circle|ellipse|path|line|polygon|polyline)\s', content))
    # Count groups
    groups = len(re.findall(r'<g\s', content))
    return shapes + groups

def has_minimal_content(content, threshold=10):
    """Check if SVG has very minimal content."""
    element_count = count_svg_elements(content)
    return element_count < threshold, element_count

def check_character_colors(content, filename):
    """Check if character colors are correct based on filename."""
    issues = []
    
    # Extract all fill colors
    fill_colors = re.findall(r'fill="(#[0-9A-Fa-f]{6})"', content)
    
    # Check for George-related files with wrong colors
    if 'george' in filename.lower() or 'male' in filename.lower():
        # George should have blue shirt, not red
        if PEPPA_DRESS_COLOR.lower() in [c.lower() for c in fill_colors]:
            # Check if it's the main body/dress
            red_count = sum(1 for c in fill_colors if c.lower() == PEPPA_DRESS_COLOR.lower())
            blue_count = sum(1 for c in fill_colors if c.lower() == GEORGE_SHIRT_COLOR.lower())
            if red_count > 0 and blue_count == 0:
                issues.append(f"George might have red dress instead of blue shirt")
    
    return issues

def find_composer_watermark(content):
    """Check for 'composer' watermark which indicates AI-generated simple content."""
    return bool(re.search(r'composer\s*\d*', content, re.IGNORECASE))

def find_generic_peppa_template(content):
    """Check if the file uses a very generic Peppa template without context-specific elements."""
    # Count how many unique identifiable props/context objects exist beyond the basic pig
    context_props = 0
    
    # Common context-specific elements
    context_patterns = [
        r'text.*(?:BIEN|¡|ball|book|food|rain|sun|moon|star|rainbow)', # Text labels
        r'(?:house|tree|school|playground|car|kitchen|bedroom)',  # Locations
        r'(?:umbrella|boot|toy|dinosaur|ball|book|food|plate|cup)',  # Objects
    ]
    
    for pattern in context_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            context_props += 1
    
    return context_props

def analyze_svgs():
    """Analyze all SVGs and report issues."""
    if not SVG_DIR.exists():
        print(f"Directory not found: {SVG_DIR}")
        return
    
    svg_files = sorted(SVG_DIR.glob("*.svg"))
    
    # Track duplicates
    hash_to_files = defaultdict(list)
    
    # Track issues
    minimal_files = []
    color_issues = []
    watermarked_files = []
    low_context_files = []
    
    print(f"Analyzing {len(svg_files)} SVG files...\n")
    
    for svg_file in svg_files:
        with open(svg_file, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        
        filename = svg_file.name
        
        # Check for duplicates
        file_hash = get_file_hash(svg_file)
        hash_to_files[file_hash].append(filename)
        
        # Check for minimal content
        is_minimal, element_count = has_minimal_content(content, threshold=15)
        if is_minimal:
            minimal_files.append((filename, element_count))
        
        # Check character colors
        color_problems = check_character_colors(content, filename)
        if color_problems:
            color_issues.append((filename, color_problems))
        
        # Check for composer watermark (indicates simpler AI-generated content)
        if find_composer_watermark(content):
            watermarked_files.append(filename)
        
        # Check for low context/generic templates
        context_count = find_generic_peppa_template(content)
        if context_count == 0 and element_count < 25:
            low_context_files.append((filename, element_count))
    
    # Report duplicates
    print("=" * 80)
    print("EXACT DUPLICATES:")
    print("=" * 80)
    duplicate_groups = []
    for file_hash, files in hash_to_files.items():
        if len(files) > 1:
            print(f"\nDuplicate group (same content):")
            for f in sorted(files):
                print(f"  - {f}")
            duplicate_groups.append(sorted(files))
    if not any(len(files) > 1 for files in hash_to_files.values()):
        print("No exact duplicates found.")
    
    # Report minimal files
    print("\n" + "=" * 80)
    print("MINIMAL CONTENT FILES (< 15 SVG elements):")
    print("=" * 80)
    for filename, count in sorted(minimal_files, key=lambda x: x[1]):
        print(f"  {filename}: {count} elements")
    
    # Report files with composer watermark (simpler AI content)
    print("\n" + "=" * 80)
    print("FILES WITH 'COMPOSER' WATERMARK (likely simpler AI-generated):")
    print("=" * 80)
    for filename in sorted(watermarked_files):
        print(f"  - {filename}")
    
    # Report low context files
    print("\n" + "=" * 80)
    print("LOW CONTEXT FILES (generic template, few context elements):")
    print("=" * 80)
    for filename, count in sorted(low_context_files, key=lambda x: x[1]):
        print(f"  {filename}: {count} elements, no clear context objects")
    
    # Report color issues
    if color_issues:
        print("\n" + "=" * 80)
        print("POTENTIAL COLOR ISSUES:")
        print("=" * 80)
        for filename, issues in color_issues:
            print(f"\n{filename}:")
            for issue in issues:
                print(f"  - {issue}")
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY:")
    print("=" * 80)
    print(f"Total files analyzed: {len(svg_files)}")
    print(f"Duplicate groups: {len(duplicate_groups)}")
    print(f"Files with minimal content: {len(minimal_files)}")
    print(f"Files with composer watermark: {len(watermarked_files)}")
    print(f"Low context files: {len(low_context_files)}")
    
    # Return data for further processing
    return {
        'duplicates': duplicate_groups,
        'minimal': minimal_files,
        'watermarked': watermarked_files,
        'low_context': low_context_files,
        'color_issues': color_issues
    }

if __name__ == "__main__":
    analyze_svgs()
