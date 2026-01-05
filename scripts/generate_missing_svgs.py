#!/usr/bin/env python3
"""
Generate SVG images for missing Peppa Pig Spanish phrases.
Each SVG is designed for kids who can't read - visual storytelling!
"""

import json
from pathlib import Path

def create_svg_template(content, signature="composer 1"):
    """Create SVG with signature"""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
{content}
  <text x="390" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="10" fill="#5B6470" opacity="0.7">{signature}</text>
</svg>'''

def peppa_pig_character(x=200, y=200, happy=True, color="#F9C6CF"):
    """Draw Peppa Pig character"""
    smile = 'M -5 -18 Q 10 -8 25 -18' if happy else 'M -5 -18 Q 10 -12 25 -18'
    return f'''  <!-- Peppa Pig -->
  <g transform="translate({x}, {y})">
    <!-- Body -->
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <!-- Legs -->
    <rect x="-20" y="60" width="10" height="35" rx="5" fill="{color}"/>
    <rect x="10" y="60" width="10" height="35" rx="5" fill="{color}"/>
    <!-- Head -->
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="{color}"/>
    <!-- Snout -->
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="{color}"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <!-- Ears -->
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="{color}"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="{color}"/>
    <!-- Eyes -->
    <ellipse cx="-5" cy="-35" rx="6" ry="8" fill="white"/>
    <ellipse cx="12" cy="-35" rx="6" ry="8" fill="white"/>
    <circle cx="-4" cy="-34" r="3" fill="#333"/>
    <circle cx="13" cy="-34" r="3" fill="#333"/>
    <!-- Smile -->
    <path d="{smile}" stroke="#333" stroke-width="3" fill="none"/>
  </g>'''

def george_pig(x=200, y=200):
    """Draw George (smaller, blue shirt)"""
    return f'''  <!-- George Pig -->
  <g transform="translate({x}, {y})">
    <!-- Body (blue shirt) -->
    <ellipse cx="0" cy="25" rx="28" ry="32" fill="#4A90E2"/>
    <!-- Legs -->
    <rect x="-15" y="50" width="8" height="28" rx="4" fill="#F9C6CF"/>
    <rect x="7" y="50" width="8" height="28" rx="4" fill="#F9C6CF"/>
    <!-- Head -->
    <ellipse cx="0" cy="-25" rx="35" ry="28" fill="#F9C6CF"/>
    <!-- Snout -->
    <ellipse cx="28" cy="-25" rx="14" ry="11" fill="#F9C6CF"/>
    <circle cx="33" cy="-27" r="3" fill="#FF69B4"/>
    <circle cx="33" cy="-23" r="3" fill="#FF69B4"/>
    <!-- Ears -->
    <ellipse cx="-12" cy="-50" rx="8" ry="14" fill="#F9C6CF"/>
    <ellipse cx="12" cy="-50" rx="8" ry="14" fill="#F9C6CF"/>
    <!-- Eyes -->
    <ellipse cx="-4" cy="-28" rx="5" ry="6" fill="white"/>
    <ellipse cx="10" cy="-28" rx="5" ry="6" fill="white"/>
    <circle cx="-3" cy="-27" r="2.5" fill="#333"/>
    <circle cx="11" cy="-27" r="2.5" fill="#333"/>
    <!-- Smile -->
    <path d="M -4 -15 Q 8 -8 20 -15" stroke="#333" stroke-width="2.5" fill="none"/>
  </g>'''

def mummy_pig(x=200, y=200):
    """Draw Mummy Pig (yellow dress)"""
    return f'''  <!-- Mummy Pig -->
  <g transform="translate({x}, {y})">
    <!-- Body (yellow dress) -->
    <ellipse cx="0" cy="30" rx="38" ry="42" fill="#FFD700"/>
    <!-- Legs -->
    <rect x="-22" y="65" width="12" height="38" rx="6" fill="#F9C6CF"/>
    <rect x="10" y="65" width="12" height="38" rx="6" fill="#F9C6CF"/>
    <!-- Head -->
    <ellipse cx="0" cy="-30" rx="48" ry="38" fill="#F9C6CF"/>
    <!-- Snout -->
    <ellipse cx="38" cy="-30" rx="19" ry="15" fill="#F9C6CF"/>
    <circle cx="45" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="45" cy="-27" r="4" fill="#FF69B4"/>
    <!-- Ears -->
    <ellipse cx="-16" cy="-68" rx="11" ry="19" fill="#F9C6CF"/>
    <ellipse cx="16" cy="-68" rx="11" ry="19" fill="#F9C6CF"/>
    <!-- Eyes -->
    <ellipse cx="-6" cy="-36" rx="7" ry="9" fill="white"/>
    <ellipse cx="13" cy="-36" rx="7" ry="9" fill="white"/>
    <circle cx="-5" cy="-35" r="3.5" fill="#333"/>
    <circle cx="14" cy="-35" r="3.5" fill="#333"/>
    <!-- Smile -->
    <path d="M -6 -20 Q 12 -10 30 -20" stroke="#333" stroke-width="3" fill="none"/>
  </g>'''

def daddy_pig(x=200, y=200):
    """Draw Daddy Pig (orange shirt, glasses)"""
    return f'''  <!-- Daddy Pig -->
  <g transform="translate({x}, {y})">
    <!-- Body (orange shirt) -->
    <ellipse cx="0" cy="32" rx="40" ry="45" fill="#FF8C42"/>
    <!-- Legs -->
    <rect x="-24" y="70" width="14" height="40" rx="7" fill="#F9C6CF"/>
    <rect x="10" y="70" width="14" height="40" rx="7" fill="#F9C6CF"/>
    <!-- Head -->
    <ellipse cx="0" cy="-28" rx="50" ry="40" fill="#F9C6CF"/>
    <!-- Glasses -->
    <rect x="-35" y="-40" width="25" height="20" rx="12" fill="none" stroke="#333" stroke-width="3"/>
    <rect x="10" y="-40" width="25" height="20" rx="12" fill="none" stroke="#333" stroke-width="3"/>
    <line x1="-10" y1="-30" x2="10" y2="-30" stroke="#333" stroke-width="3"/>
    <!-- Snout -->
    <ellipse cx="40" cy="-28" rx="20" ry="16" fill="#F9C6CF"/>
    <circle cx="48" cy="-31" r="4" fill="#FF69B4"/>
    <circle cx="48" cy="-25" r="4" fill="#FF69B4"/>
    <!-- Ears -->
    <ellipse cx="-18" cy="-70" rx="12" ry="20" fill="#F9C6CF"/>
    <ellipse cx="18" cy="-70" rx="12" ry="20" fill="#F9C6CF"/>
    <!-- Eyes -->
    <ellipse cx="-18" cy="-35" rx="8" ry="10" fill="white"/>
    <ellipse cx="18" cy="-35" rx="8" ry="10" fill="white"/>
    <circle cx="-17" cy="-34" r="4" fill="#333"/>
    <circle cx="19" cy="-34" r="4" fill="#333"/>
    <!-- Smile -->
    <path d="M -8 -18 Q 12 -8 32 -18" stroke="#333" stroke-width="3" fill="none"/>
  </g>'''

# Read mapping
with open('/tmp/phrase_mapping.json', 'r', encoding='utf-8') as f:
    phrase_map = json.load(f)

# SVG generation functions for each phrase
svg_templates = {}

# 1. ¡Bien! - Good!
svg_templates['¡Bien!'] = create_svg_template(f'''  <!-- Background -->
  <rect width="400" height="400" fill="#E8F5E9"/>
  <ellipse cx="200" cy="380" rx="220" ry="60" fill="#7BC043"/>
  
  {peppa_pig_character(200, 250, happy=True)}
  
  <!-- Thumbs up -->
  <g transform="translate(280, 180)">
    <path d="M 0 0 L 15 -25 L 25 -20 L 20 -5 L 30 5 L 20 15 L 10 10 Z" fill="#4CAF50"/>
    <circle cx="5" cy="-10" r="8" fill="#4CAF50"/>
  </g>
  
  <!-- Stars for "good" -->
  <g fill="#FFD700">
    <path d="M 100 100 L 105 115 L 120 115 L 108 125 L 113 140 L 100 130 L 87 140 L 92 125 L 80 115 L 95 115 Z"/>
    <path d="M 320 120 L 323 130 L 333 130 L 325 137 L 328 147 L 320 140 L 312 147 L 315 137 L 307 130 L 317 130 Z"/>
  </g>''')

# 2. George, ¡despierta! ¡Es mi cumpleaños! - George, wake up! It's my birthday!
svg_templates['George, ¡despierta! ¡Es mi cumpleaños!'] = create_svg_template(f'''  <!-- Background: Bedroom -->
  <rect width="400" height="400" fill="#E3F2FD"/>
  <rect x="0" y="300" width="400" height="100" fill="#8D6E63"/>
  
  <!-- Bed -->
  <rect x="50" y="280" width="120" height="80" rx="10" fill="#FFB74D"/>
  <rect x="60" y="290" width="100" height="60" rx="5" fill="#FFF9C4"/>
  <circle cx="70" cy="320" r="8" fill="#FFB74D"/>
  <circle cx="150" cy="320" r="8" fill="#FFB74D"/>
  
  {george_pig(110, 320)}
  
  <!-- Zzz bubbles -->
  <text x="140" y="250" font-family="Arial" font-size="24" fill="#90CAF9" opacity="0.7">Z</text>
  <text x="150" y="230" font-family="Arial" font-size="20" fill="#90CAF9" opacity="0.6">Z</text>
  <text x="160" y="210" font-family="Arial" font-size="16" fill="#90CAF9" opacity="0.5">Z</text>
  
  {peppa_pig_character(280, 250, happy=True)}
  
  <!-- Birthday cake -->
  <g transform="translate(280, 320)">
    <rect x="-20" y="-30" width="40" height="20" rx="5" fill="#FF6B9D"/>
    <rect x="-15" y="-50" width="30" height="20" rx="5" fill="#FFB74D"/>
    <circle cx="-10" cy="-55" r="3" fill="#FFF" opacity="0.9"/>
    <circle cx="0" cy="-55" r="3" fill="#FFF" opacity="0.9"/>
    <circle cx="10" cy="-55" r="3" fill="#FFF" opacity="0.9"/>
  </g>
  
  <!-- Sun rays -->
  <circle cx="340" cy="60" r="30" fill="#FFD700"/>
  <line x1="340" y1="20" x2="340" y2="10" stroke="#FFD700" stroke-width="4"/>
  <line x1="380" y1="60" x2="390" y2="60" stroke="#FFD700" stroke-width="4"/>
  <line x1="360" y1="40" x2="370" y2="30" stroke="#FFD700" stroke-width="4"/>
  <line x1="360" y1="80" x2="370" y2="90" stroke="#FFD700" stroke-width="4"/>''')

# Continue with more templates... (I'll create them all systematically)

# Save all SVGs
output_dir = Path('svelte/static/peppa_advanced_spanish_images/svg')
output_dir.mkdir(parents=True, exist_ok=True)

for phrase, data in phrase_map.items():
    file_num = data['file_num']
    id_name = data['id']
    filename = f"{file_num:02d}_{id_name}.svg"
    
    # Get SVG content or create default
    if phrase in svg_templates:
        svg_content = svg_templates[phrase]
    else:
        # Default template
        svg_content = create_svg_template(f'''  <rect width="400" height="400" fill="#E3F2FD"/>
  {peppa_pig_character(200, 200, happy=True)}
  <text x="200" y="350" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">{phrase[:30]}</text>''')
    
    (output_dir / filename).write_text(svg_content, encoding='utf-8')
    print(f"Created {filename}")

print(f"\nCreated {len(phrase_map)} SVG files")
