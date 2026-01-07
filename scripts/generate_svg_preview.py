#!/usr/bin/env python3
"""
Generate an HTML preview page for all SVG files in the Peppa Advanced Spanish collection.
Shows a 3-column grid with: SVG image, filename, and Spanish phrase.

Output: ../svg_preview.html (gitignored)
"""

import json
import os
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
SVG_DIR = PROJECT_ROOT / "svelte" / "static" / "peppa_advanced_spanish_images" / "svg"
JSON_PATH = PROJECT_ROOT / "svelte" / "static" / "themes" / "peppa_advanced_spanish.json"
OUTPUT_HTML = PROJECT_ROOT / "svg_preview.html"


def load_phrase_mapping():
    """Load the JSON and build a mapping from SVG filename to phrase info."""
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Map: svg_filename -> {spanish, english, finnish, context/category}
    mapping = {}
    
    # Categories that contain image references
    categories = [
        ("introduction_phrases", "Introduction"),
        ("common_phrases", "Common Phrases"),
        ("family_phrases", "Family"),
        ("school_phrases", "School"),
        ("friendship_phrases", "Friendship"),
        ("activities_and_games", "Activities & Games"),
        ("emotions_and_reactions", "Emotions"),
        ("questions_and_answers", "Q&A"),
        ("weather_phrases", "Weather"),
        ("time_phrases", "Time"),
        ("food_phrases", "Food"),
    ]
    
    for cat_key, cat_name in categories:
        if cat_key not in data:
            continue
        for item in data[cat_key]:
            if "image" not in item:
                continue
            # Extract filename from path like "/peppa_advanced_spanish_images/svg/01_muddy_puddles.svg"
            image_path = item["image"]
            filename = os.path.basename(image_path)
            
            mapping[filename] = {
                "spanish": item.get("spanish", ""),
                "english": item.get("english", ""),
                "finnish": item.get("finnish", ""),
                "category": cat_name,
                "context": item.get("context", item.get("frequency", item.get("emotion", item.get("weather", ""))))
            }
    
    return mapping


def get_all_svg_files():
    """Get all SVG files in the svg directory, sorted by number prefix."""
    if not SVG_DIR.exists():
        print(f"SVG directory not found: {SVG_DIR}")
        return []
    
    files = list(SVG_DIR.glob("*.svg"))
    
    # Sort by numeric prefix if possible
    def sort_key(path):
        name = path.stem
        parts = name.split("_", 1)
        try:
            return (int(parts[0]), name)
        except ValueError:
            return (9999, name)
    
    return sorted(files, key=sort_key)


def generate_html(svg_files, phrase_mapping):
    """Generate the HTML preview page."""
    
    html_parts = ['''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Peppa Advanced Spanish - SVG Preview</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        h1 {
            text-align: center;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            margin-bottom: 10px;
        }
        .stats {
            text-align: center;
            color: rgba(255,255,255,0.9);
            margin-bottom: 30px;
            font-size: 14px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        @media (max-width: 1200px) {
            .grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
            .grid { grid-template-columns: 1fr; }
        }
        .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        .card-image {
            width: 100%;
            aspect-ratio: 1;
            background: #f8f9fa;
            display: flex;
            align-items: center;
            justify-content: center;
            border-bottom: 1px solid #eee;
        }
        .card-image img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        .card-content {
            padding: 15px;
        }
        .filename {
            font-family: "SF Mono", Monaco, "Courier New", monospace;
            font-size: 11px;
            color: #6c757d;
            margin-bottom: 8px;
            word-break: break-all;
        }
        .spanish {
            font-size: 18px;
            font-weight: 600;
            color: #E63946;
            margin-bottom: 5px;
        }
        .english {
            font-size: 14px;
            color: #495057;
            margin-bottom: 5px;
        }
        .finnish {
            font-size: 13px;
            color: #6c757d;
            font-style: italic;
        }
        .category {
            display: inline-block;
            font-size: 10px;
            background: #e9ecef;
            color: #495057;
            padding: 2px 8px;
            border-radius: 10px;
            margin-top: 8px;
        }
        .no-phrase {
            color: #adb5bd;
            font-style: italic;
        }
        .missing {
            background: #fff3cd;
        }
    </style>
</head>
<body>
    <h1>🐷 Peppa Advanced Spanish - SVG Preview</h1>
    <div class="stats">
        Total SVG files: ''' + str(len(svg_files)) + ''' | 
        With phrases: ''' + str(sum(1 for f in svg_files if f.name in phrase_mapping)) + ''' |
        Missing phrases: ''' + str(sum(1 for f in svg_files if f.name not in phrase_mapping)) + '''
    </div>
    <div class="grid">
''']
    
    for svg_path in svg_files:
        filename = svg_path.name
        rel_path = svg_path.relative_to(PROJECT_ROOT)
        phrase_info = phrase_mapping.get(filename, None)
        
        card_class = "card" if phrase_info else "card missing"
        
        html_parts.append(f'''        <div class="{card_class}">
            <div class="card-image">
                <img src="{rel_path}" alt="{filename}" loading="lazy">
            </div>
            <div class="card-content">
                <div class="filename">{filename}</div>
''')
        
        if phrase_info:
            spanish = phrase_info["spanish"]
            english = phrase_info["english"]
            finnish = phrase_info["finnish"]
            category = phrase_info["category"]
            
            html_parts.append(f'''                <div class="spanish">{spanish}</div>
                <div class="english">{english}</div>
                <div class="finnish">{finnish}</div>
                <span class="category">{category}</span>
''')
        else:
            html_parts.append('''                <div class="no-phrase">No phrase mapping found</div>
''')
        
        html_parts.append('''            </div>
        </div>
''')
    
    html_parts.append('''    </div>
</body>
</html>
''')
    
    return "".join(html_parts)


def main():
    print("Loading phrase mapping from JSON...")
    phrase_mapping = load_phrase_mapping()
    print(f"  Found {len(phrase_mapping)} phrases with image references")
    
    print("Scanning SVG files...")
    svg_files = get_all_svg_files()
    print(f"  Found {len(svg_files)} SVG files")
    
    print("Generating HTML preview...")
    html_content = generate_html(svg_files, phrase_mapping)
    
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print(f"\n✓ Generated: {OUTPUT_HTML}")
    print(f"  - Total SVGs: {len(svg_files)}")
    print(f"  - With phrases: {sum(1 for f in svg_files if f.name in phrase_mapping)}")
    print(f"  - Missing phrases: {sum(1 for f in svg_files if f.name not in phrase_mapping)}")


if __name__ == "__main__":
    main()

