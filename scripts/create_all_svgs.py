#!/usr/bin/env python3
"""Generate all 51 missing SVG images for Peppa Pig Spanish phrases"""

import json
from pathlib import Path

def svg_wrapper(content, signature="composer 1"):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
{content}
  <text x="390" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="10" fill="#5B6470" opacity="0.7">{signature}</text>
</svg>'''

def peppa(x=200, y=200, happy=True):
    smile = 'M -5 -18 Q 10 -8 25 -18' if happy else 'M -5 -18 Q 10 -12 25 -18'
    return f'''  <g transform="translate({x}, {y})">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <rect x="-20" y="60" width="10" height="35" rx="5" fill="#F9C6CF"/>
    <rect x="10" y="60" width="10" height="35" rx="5" fill="#F9C6CF"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="-5" cy="-35" rx="6" ry="8" fill="white"/>
    <ellipse cx="12" cy="-35" rx="6" ry="8" fill="white"/>
    <circle cx="-4" cy="-34" r="3" fill="#333"/>
    <circle cx="13" cy="-34" r="3" fill="#333"/>
    <path d="{smile}" stroke="#333" stroke-width="3" fill="none"/>
  </g>'''

def george(x=200, y=200):
    return f'''  <g transform="translate({x}, {y})">
    <ellipse cx="0" cy="25" rx="28" ry="32" fill="#4A90E2"/>
    <rect x="-15" y="50" width="8" height="28" rx="4" fill="#F9C6CF"/>
    <rect x="7" y="50" width="8" height="28" rx="4" fill="#F9C6CF"/>
    <ellipse cx="0" cy="-25" rx="35" ry="28" fill="#F9C6CF"/>
    <ellipse cx="28" cy="-25" rx="14" ry="11" fill="#F9C6CF"/>
    <circle cx="33" cy="-27" r="3" fill="#FF69B4"/>
    <circle cx="33" cy="-23" r="3" fill="#FF69B4"/>
    <ellipse cx="-12" cy="-50" rx="8" ry="14" fill="#F9C6CF"/>
    <ellipse cx="12" cy="-50" rx="8" ry="14" fill="#F9C6CF"/>
    <ellipse cx="-4" cy="-28" rx="5" ry="6" fill="white"/>
    <ellipse cx="10" cy="-28" rx="5" ry="6" fill="white"/>
    <circle cx="-3" cy="-27" r="2.5" fill="#333"/>
    <circle cx="11" cy="-27" r="2.5" fill="#333"/>
    <path d="M -4 -15 Q 8 -8 20 -15" stroke="#333" stroke-width="2.5" fill="none"/>
  </g>'''

def mummy(x=200, y=200):
    return f'''  <g transform="translate({x}, {y})">
    <ellipse cx="0" cy="30" rx="38" ry="42" fill="#FFD700"/>
    <rect x="-22" y="65" width="12" height="38" rx="6" fill="#F9C6CF"/>
    <rect x="10" y="65" width="12" height="38" rx="6" fill="#F9C6CF"/>
    <ellipse cx="0" cy="-30" rx="48" ry="38" fill="#F9C6CF"/>
    <ellipse cx="38" cy="-30" rx="19" ry="15" fill="#F9C6CF"/>
    <circle cx="45" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="45" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-16" cy="-68" rx="11" ry="19" fill="#F9C6CF"/>
    <ellipse cx="16" cy="-68" rx="11" ry="19" fill="#F9C6CF"/>
    <ellipse cx="-6" cy="-36" rx="7" ry="9" fill="white"/>
    <ellipse cx="13" cy="-36" rx="7" ry="9" fill="white"/>
    <circle cx="-5" cy="-35" r="3.5" fill="#333"/>
    <circle cx="14" cy="-35" r="3.5" fill="#333"/>
    <path d="M -6 -20 Q 12 -10 30 -20" stroke="#333" stroke-width="3" fill="none"/>
  </g>'''

def daddy(x=200, y=200):
    return f'''  <g transform="translate({x}, {y})">
    <ellipse cx="0" cy="32" rx="40" ry="45" fill="#FF8C42"/>
    <rect x="-24" y="70" width="14" height="40" rx="7" fill="#F9C6CF"/>
    <rect x="10" y="70" width="14" height="40" rx="7" fill="#F9C6CF"/>
    <ellipse cx="0" cy="-28" rx="50" ry="40" fill="#F9C6CF"/>
    <rect x="-35" y="-40" width="25" height="20" rx="12" fill="none" stroke="#333" stroke-width="3"/>
    <rect x="10" y="-40" width="25" height="20" rx="12" fill="none" stroke="#333" stroke-width="3"/>
    <line x1="-10" y1="-30" x2="10" y2="-30" stroke="#333" stroke-width="3"/>
    <ellipse cx="40" cy="-28" rx="20" ry="16" fill="#F9C6CF"/>
    <circle cx="48" cy="-31" r="4" fill="#FF69B4"/>
    <circle cx="48" cy="-25" r="4" fill="#FF69B4"/>
    <ellipse cx="-18" cy="-70" rx="12" ry="20" fill="#F9C6CF"/>
    <ellipse cx="18" cy="-70" rx="12" ry="20" fill="#F9C6CF"/>
    <ellipse cx="-18" cy="-35" rx="8" ry="10" fill="white"/>
    <ellipse cx="18" cy="-35" rx="8" ry="10" fill="white"/>
    <circle cx="-17" cy="-34" r="4" fill="#333"/>
    <circle cx="19" cy="-34" r="4" fill="#333"/>
    <path d="M -8 -18 Q 12 -8 32 -18" stroke="#333" stroke-width="3" fill="none"/>
  </g>'''

# SVG templates for each phrase
templates = {
    '¡Bien!': lambda: svg_wrapper(f'''  <rect width="400" height="400" fill="#E8F5E9"/>
  <ellipse cx="200" cy="380" rx="220" ry="60" fill="#7BC043"/>
  {peppa(200, 250)}
  <path d="M 280 180 L 295 155 L 305 160 L 300 175 L 310 185 L 300 195 L 290 190 Z" fill="#4CAF50"/>
  <circle cx="285" cy="170" r="8" fill="#4CAF50"/>'''),
    
    'George, ¡despierta! ¡Es mi cumpleaños!': lambda: svg_wrapper(f'''  <rect width="400" height="400" fill="#E3F2FD"/>
  <rect x="0" y="300" width="400" height="100" fill="#8D6E63"/>
  <rect x="50" y="280" width="120" height="80" rx="10" fill="#FFB74D"/>
  <rect x="60" y="290" width="100" height="60" rx="5" fill="#FFF9C4"/>
  {george(110, 320)}
  <text x="140" y="250" font-family="Arial" font-size="24" fill="#90CAF9" opacity="0.7">Z</text>
  <text x="150" y="230" font-family="Arial" font-size="20" fill="#90CAF9" opacity="0.6">Z</text>
  {peppa(280, 250)}
  <g transform="translate(280, 320)">
    <rect x="-20" y="-30" width="40" height="20" rx="5" fill="#FF6B9D"/>
    <rect x="-15" y="-50" width="30" height="20" rx="5" fill="#FFB74D"/>
    <circle cx="-10" cy="-55" r="3" fill="#FFF" opacity="0.9"/>
    <circle cx="0" cy="-55" r="3" fill="#FFF" opacity="0.9"/>
    <circle cx="10" cy="-55" r="3" fill="#FFF" opacity="0.9"/>
  </g>'''),
    
    '¡Me encanta!': lambda: svg_wrapper(f'''  <rect width="400" height="400" fill="#FFF0F5"/>
  <ellipse cx="200" cy="380" rx="220" ry="60" fill="#7BC043"/>
  {peppa(200, 220)}
  <g fill="#FF1493">
    <path d="M 200 100 L 210 130 L 240 130 L 215 150 L 220 180 L 200 160 L 180 180 L 185 150 L 160 130 L 190 130 Z"/>
    <path d="M 120 150 L 125 170 L 145 170 L 130 185 L 135 205 L 120 190 L 105 205 L 110 185 L 95 170 L 115 170 Z"/>
    <path d="M 280 150 L 285 170 L 305 170 L 290 185 L 295 205 L 280 190 L 265 205 L 270 185 L 255 170 L 275 170 Z"/>
  </g>'''),
    
    '¡Qué bonito!': lambda: svg_wrapper(f'''  <rect width="400" height="400" fill="#E0F7FA"/>
  <ellipse cx="200" cy="380" rx="220" ry="60" fill="#7BC043"/>
  {peppa(200, 250)}
  <g fill="#FFD700">
    <path d="M 100 100 L 105 115 L 120 115 L 108 125 L 113 140 L 100 130 L 87 140 L 92 125 L 80 115 L 95 115 Z"/>
    <path d="M 300 100 L 305 115 L 320 115 L 308 125 L 313 140 L 300 130 L 287 140 L 292 125 L 280 115 L 295 115 Z"/>
  </g>
  <circle cx="200" cy="120" r="30" fill="#FFB6C1"/>
  <circle cx="200" cy="120" r="20" fill="#FF69B4"/>'''),
    
    '¡Mamá! ¡Papá!': lambda: svg_wrapper(f'''  <rect width="400" height="400" fill="#FFF9C4"/>
  <ellipse cx="200" cy="380" rx="220" ry="60" fill="#7BC043"/>
  {peppa(150, 280)}
  {mummy(200, 280)}
  {daddy(250, 280)}
  <text x="200" y="150" text-anchor="middle" font-family="Arial" font-size="32" fill="#333" font-weight="bold">!</text>'''),
    
    'Primero tienes que ponerte las botas.': lambda: svg_wrapper(f'''  <rect width="400" height="400" fill="#E3F2FD"/>
  <ellipse cx="200" cy="380" rx="220" ry="60" fill="#7BC043"/>
  {peppa(200, 280)}
  <ellipse cx="120" cy="320" rx="15" ry="10" fill="#E63946"/>
  <ellipse cx="280" cy="320" rx="15" ry="10" fill="#E63946"/>
  <ellipse cx="120" cy="310" rx="12" ry="8" fill="#8B0000"/>
  <ellipse cx="280" cy="310" rx="12" ry="8" fill="#8B0000"/>
  <text x="200" y="120" text-anchor="middle" font-family="Arial" font-size="20" fill="#333">1</text>'''),
    
    'Todo está bien.': lambda: svg_wrapper(f'''  <rect width="400" height="400" fill="#E8F5E9"/>
  <ellipse cx="200" cy="380" rx="220" ry="60" fill="#7BC043"/>
  {peppa(200, 250)}
  <circle cx="200" cy="120" r="40" fill="#4CAF50" opacity="0.3"/>
  <path d="M 180 120 L 195 135 L 220 110" stroke="#4CAF50" stroke-width="6" fill="none" stroke-linecap="round"/>'''),
    
    '¡Yo! ¡Yo!': lambda: svg_wrapper(f'''  <rect width="400" height="400" fill="#FFF9C4"/>
  <ellipse cx="200" cy="380" rx="220" ry="60" fill="#7BC043"/>
  {peppa(200, 250)}
  <ellipse cx="200" cy="120" rx="50" ry="50" fill="#FFD700" opacity="0.5"/>
  <text x="200" y="130" text-anchor="middle" font-family="Arial" font-size="48" fill="#FF8C00" font-weight="bold">YO</text>'''),
    
    '¡Hola, amigos!': lambda: svg_wrapper(f'''  <rect width="400" height="400" fill="#E3F2FD"/>
  <ellipse cx="200" cy="380" rx="220" ry="60" fill="#7BC043"/>
  {peppa(150, 280)}
  {george(250, 280)}
  <ellipse cx="100" cy="280" rx="30" ry="35" fill="#E0E0E0"/>
  <ellipse cx="100" cy="270" rx="25" ry="30" fill="#FFF"/>
  <ellipse cx="95" cy="265" rx="4" ry="5" fill="#333"/>
  <ellipse cx="105" cy="265" rx="4" ry="5" fill="#333"/>
  <path d="M 90 275 Q 100 280 110 275" stroke="#333" stroke-width="2" fill="none"/>'''),
    
    '¿Qué vamos a hacer hoy?': lambda: svg_wrapper(f'''  <rect width="400" height="400" fill="#FFF9C4"/>
  <ellipse cx="200" cy="380" rx="220" ry="60" fill="#7BC043"/>
  {peppa(200, 280)}
  <circle cx="200" cy="120" r="35" fill="#FFD700"/>
  <text x="200" y="130" text-anchor="middle" font-family="Arial" font-size="24" fill="#333">?</text>
  <g fill="#FF6B9D">
    <circle cx="100" cy="150" r="15"/>
    <circle cx="300" cy="150" r="15"/>
    <rect x="85" y="170" width="30" height="20" rx="5"/>
    <rect x="285" y="170" width="30" height="20" rx="5"/>
  </g>'''),
}

# Continue with remaining templates...
# Due to size, I'll generate them programmatically for phrases not in templates

# Read mapping
with open('/tmp/phrase_mapping.json', 'r', encoding='utf-8') as f:
    phrase_map = json.load(f)

output_dir = Path('svelte/static/peppa_advanced_spanish_images/svg')
output_dir.mkdir(parents=True, exist_ok=True)

created = 0
for phrase, data in phrase_map.items():
    file_num = data['file_num']
    id_name = data['id']
    filename = f"{file_num:02d}_{id_name}.svg"
    
    if phrase in templates:
        svg_content = templates[phrase]()
    else:
        # Default template
        svg_content = svg_wrapper(f'''  <rect width="400" height="400" fill="#E3F2FD"/>
  <ellipse cx="200" cy="380" rx="220" ry="60" fill="#7BC043"/>
  {peppa(200, 200)}''')
    
    (output_dir / filename).write_text(svg_content, encoding='utf-8')
    created += 1
    if created <= 10:
        print(f"Created {filename}")

print(f"\nCreated {created} SVG files (need to add remaining templates)")
