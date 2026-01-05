import json
import os

# Define the 20 new images
new_images = [
    {
        "id": "i_am_thirsty",
        "filename": "46_i_am_thirsty.svg",
        "phrases": ["Tengo sed.", "Estoy sediento."],
        "category": "emotions",
        "keywords": ["thirsty", "drink", "water", "juice"],
        "emojiTip": {"emojis": ["🐷", "🥤", "🥵", "💧"], "display": "🐷🥤🥵💧", "description": "Pig + drink + hot face + droplet"},
        "iconTip": {
            "lucide": ["GlassWater", "Droplets"],
            "phosphor": ["Glass", "Drop"],
            "iconify": ["noto:pig-face", "noto:cup-with-straw"]
        },
        "distractorPool": ["i_am_hungry", "i_am_happy", "bedtime"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#FFEFD5"/> <!-- Background -->
  
  <!-- Table -->
  <rect x="50" y="300" width="300" height="100" fill="#8B4513"/>
  
  <!-- Peppa -->
  <g transform="translate(150, 150)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/> <!-- Dress -->
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/> <!-- Head -->
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/> <!-- Snout -->
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/> <!-- Ears -->
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/> <!-- Eyes -->
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    <path d="M -5 -20 Q 10 -10 25 -20" stroke="#333" stroke-width="2" fill="none"/> <!-- Mouth (neutral/open) -->
    
    <!-- Arm holding glass -->
    <path d="M 25 20 L 60 50" stroke="#F9C6CF" stroke-width="8" stroke-linecap="round"/>
  </g>
  
  <!-- Glass of juice -->
  <g transform="translate(220, 200)">
     <path d="M 0 0 L 10 50 L 40 50 L 50 0 Z" fill="#ADD8E6" stroke="#333" stroke-width="2"/>
     <path d="M 5 5 L 12 45 L 38 45 L 45 5 Z" fill="#FFA500"/> <!-- Juice -->
     <line x1="25" y1="0" x2="35" y2="-20" stroke="#FFF" stroke-width="3"/> <!-- Straw -->
  </g>
  
  <!-- Thought bubble with water drop -->
  <ellipse cx="300" cy="100" rx="40" ry="30" fill="white" stroke="#333"/>
  <circle cx="270" cy="140" r="5" fill="white" stroke="#333"/>
  <circle cx="260" cy="150" r="3" fill="white" stroke="#333"/>
  <path d="M 300 80 Q 290 100 300 115 Q 310 100 300 80" fill="#00BFFF" transform="translate(0, 5)"/>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "its_cold",
        "filename": "47_its_cold.svg",
        "phrases": ["Hace frío.", "Tengo frío."],
        "category": "weather",
        "keywords": ["cold", "winter", "snow", "shiver"],
        "emojiTip": {"emojis": ["❄️", "🥶", "🧥", "🧣"], "display": "❄️🥶🧥🧣", "description": "Snowflake + cold face + coat + scarf"},
        "iconTip": {
            "lucide": ["Snowflake", "ThermometerSnowflake"],
            "phosphor": ["Snowflake", "ThermometerCold"],
            "iconify": ["noto:snowflake", "noto:cold-face"]
        },
        "distractorPool": ["its_hot", "sunny_day", "bedtime"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#E0F7FA"/> <!-- Icy Background -->
  
  <!-- Snowflakes -->
  <text x="50" y="80" font-size="40" fill="#AEEEEE">❄️</text>
  <text x="300" y="100" font-size="30" fill="#AEEEEE">❄️</text>
  <text x="100" y="300" font-size="30" fill="#AEEEEE">❄️</text>
  
  <!-- Peppa in winter clothes -->
  <g transform="translate(200, 220)">
    <ellipse cx="0" cy="30" rx="38" ry="42" fill="#E63946"/> <!-- Coat -->
    <rect x="-40" y="20" width="80" height="10" fill="#000080"/> <!-- Belt/Buttons -->
    
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/> <!-- Head -->
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Scarf -->
    <path d="M -30 -10 Q 0 10 30 -10 L 30 10 Q 0 30 -30 10 Z" fill="#32CD32"/>
    <rect x="15" y="0" width="15" height="40" fill="#32CD32" transform="rotate(-10)"/>
    
    <!-- Hat -->
    <path d="M -40 -50 Q 0 -90 40 -50" fill="#000080" stroke="#000080" stroke-width="15"/>
    <circle cx="0" cy="-75" r="10" fill="#FF0000"/>
    
    <!-- Shiver lines -->
    <path d="M -60 -30 L -50 -25 L -60 -20" stroke="#333" fill="none"/>
    <path d="M 60 -30 L 70 -25 L 60 -20" stroke="#333" fill="none"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "its_hot",
        "filename": "48_its_hot.svg",
        "phrases": ["Hace calor.", "¡Qué calor!"],
        "category": "weather",
        "keywords": ["hot", "sun", "summer", "sweat"],
        "emojiTip": {"emojis": ["☀️", "🥵", "🍦", "💦"], "display": "☀️🥵🍦💦", "description": "Sun + hot face + ice cream + sweat"},
        "iconTip": {
            "lucide": ["Sun", "ThermometerSun"],
            "phosphor": ["Sun", "ThermometerHot"],
            "iconify": ["noto:sun", "noto:hot-face"]
        },
        "distractorPool": ["its_cold", "its_raining", "night"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#FFFACD"/> <!-- Warm Background -->
  
  <!-- Big Sun -->
  <circle cx="350" cy="50" r="40" fill="#FFD700"/>
  <g stroke="#FFD700" stroke-width="4">
    <line x1="350" y1="0" x2="350" y2="-20"/>
    <line x1="350" y1="100" x2="350" y2="120"/>
    <line x1="300" y1="50" x2="280" y2="50"/>
  </g>
  
  <!-- Peppa Sweating -->
  <g transform="translate(200, 220)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/> 
    
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Sweat drops -->
    <path d="M 20 -50 Q 25 -60 30 -50" fill="#00BFFF"/>
    <path d="M -20 -50 Q -25 -60 -30 -50" fill="#00BFFF"/>
    
    <!-- Fan -->
    <path d="M 40 10 L 60 0 L 70 20 Z" fill="#FF69B4" stroke="#333"/>
    <line x1="50" y1="15" x2="50" y2="35" stroke="#333" stroke-width="2"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "its_windy",
        "filename": "49_its_windy.svg",
        "phrases": ["Hace viento."],
        "category": "weather",
        "keywords": ["wind", "blow", "leaves", "autumn"],
        "emojiTip": {"emojis": ["💨", "🍃", "🌬️", "🍂"], "display": "💨🍃🌬️🍂", "description": "Wind + leaves + face blowing + leaf"},
        "iconTip": {
            "lucide": ["Wind", "CloudFog"],
            "phosphor": ["Wind", "Leaf"],
            "iconify": ["noto:wind-face", "noto:fallen-leaf"]
        },
        "distractorPool": ["sunny_day", "rainy", "hot"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#F0F8FF"/>
  
  <!-- Wind lines -->
  <path d="M 50 100 Q 150 50 250 100" stroke="#A9A9A9" stroke-width="3" fill="none"/>
  <path d="M 20 200 Q 120 150 220 200" stroke="#A9A9A9" stroke-width="3" fill="none"/>
  <path d="M 100 300 Q 200 250 300 300" stroke="#A9A9A9" stroke-width="3" fill="none"/>
  
  <!-- Flying leaves -->
  <path d="M 300 150 Q 310 140 320 150 L 310 160 Z" fill="#D2691E"/>
  <path d="M 100 250 Q 110 240 120 250 L 110 260 Z" fill="#DAA520"/>
  
  <!-- Peppa leaning against wind -->
  <g transform="translate(180, 220) rotate(-10)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/> 
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF" transform="rotate(20 -15 -65)"/> <!-- Ears blown back -->
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF" transform="rotate(20 15 -65)"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "lets_ride_bikes",
        "filename": "50_lets_ride_bikes.svg",
        "phrases": ["Vamos a montar en bicicleta.", "Vamos en bici."],
        "category": "activities",
        "keywords": ["bike", "bicycle", "ride", "helmet"],
        "emojiTip": {"emojis": ["🚲", "🐷", "🛣️", "😄"], "display": "🚲🐷🛣️😄", "description": "Bike + pig + road + happy"},
        "iconTip": {
            "lucide": ["Bike", "Map"],
            "phosphor": ["Bicycle", "RoadHorizon"],
            "iconify": ["noto:bicycle", "noto:pig-face"]
        },
        "distractorPool": ["lets_swim", "lets_draw", "bedtime"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#E0FFFF"/>
  <rect x="0" y="300" width="400" height="100" fill="#7BC043"/> <!-- Grass -->
  <rect x="0" y="320" width="400" height="20" fill="#808080"/> <!-- Road -->
  
  <!-- Bike -->
  <g transform="translate(150, 260)">
    <circle cx="0" cy="50" r="25" stroke="#333" stroke-width="3" fill="none"/> <!-- Wheel 1 -->
    <circle cx="100" cy="50" r="25" stroke="#333" stroke-width="3" fill="none"/> <!-- Wheel 2 -->
    <path d="M 0 50 L 40 20 L 90 20 L 100 50" stroke="#E63946" stroke-width="4" fill="none"/> <!-- Frame -->
    <path d="M 40 20 L 35 0" stroke="#333" stroke-width="3"/> <!-- Handlebars -->
    <path d="M 90 20 L 90 10" stroke="#333" stroke-width="3"/> <!-- Seat post -->
    <rect x="80" y="10" width="20" height="5" fill="#333"/> <!-- Seat -->
    
    <!-- Peppa on bike -->
    <g transform="translate(70, -30)">
       <ellipse cx="0" cy="30" rx="30" ry="35" fill="#E63946"/>
       <ellipse cx="0" cy="-30" rx="40" ry="30" fill="#F9C6CF"/>
       <ellipse cx="30" cy="-30" rx="15" ry="12" fill="#F9C6CF"/>
       <circle cx="36" cy="-33" r="3" fill="#FF69B4"/>
       <circle cx="36" cy="-27" r="3" fill="#FF69B4"/>
       
       <!-- Helmet -->
       <path d="M -40 -30 Q 0 -70 40 -30 Z" fill="#FFD700"/>
       
       <circle cx="-5" cy="-35" r="3" fill="#333"/>
       <circle cx="12" cy="-35" r="3" fill="#333"/>
       
       <!-- Arms holding handlebars -->
       <path d="M 10 10 L -30 40" stroke="#F9C6CF" stroke-width="6"/>
    </g>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "lets_play_hide_and_seek",
        "filename": "51_lets_play_hide_and_seek.svg",
        "phrases": ["Vamos a jugar al escondite.", "Escondite."],
        "category": "activities",
        "keywords": ["hide", "seek", "game", "tree"],
        "emojiTip": {"emojis": ["🫣", "🌳", "🐷", "👀"], "display": "🫣🌳🐷👀", "description": "Peeking face + tree + pig + eyes"},
        "iconTip": {
            "lucide": ["Eye", "Trees"],
            "phosphor": ["EyeClosed", "Tree"],
            "iconify": ["noto:face-with-peeking-eye", "noto:deciduous-tree"]
        },
        "distractorPool": ["lets_play_ball", "lets_swim", "school"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#E0FFFF"/>
  <rect x="0" y="300" width="400" height="100" fill="#7BC043"/>
  
  <!-- Tree -->
  <g transform="translate(100, 300)">
    <rect x="-20" y="-100" width="40" height="100" fill="#8B4513"/>
    <circle cx="0" cy="-120" r="70" fill="#228B22"/>
    <circle cx="-40" cy="-100" r="50" fill="#228B22"/>
    <circle cx="40" cy="-100" r="50" fill="#228B22"/>
  </g>
  
  <!-- Peppa Hiding behind tree -->
  <g transform="translate(140, 250)">
    <ellipse cx="0" cy="-30" rx="30" ry="35" fill="#F9C6CF"/> <!-- Head poking out -->
    <ellipse cx="25" cy="-30" rx="12" ry="10" fill="#F9C6CF"/>
    <circle cx="30" cy="-32" r="2" fill="#FF69B4"/>
    <circle cx="30" cy="-28" r="2" fill="#FF69B4"/>
    <circle cx="5" cy="-35" r="3" fill="#333"/>
    
    <!-- Body partially visible -->
    <path d="M -20 0 L 20 0 L 20 40 L -20 40 Z" fill="#E63946"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "lets_play_ball",
        "filename": "52_lets_play_ball.svg",
        "phrases": ["Vamos a jugar a la pelota.", "Juguemos al balón."],
        "category": "activities",
        "keywords": ["ball", "soccer", "play", "kick"],
        "emojiTip": {"emojis": ["⚽", "🐷", "🏃", "🥅"], "display": "⚽🐷🏃🥅", "description": "Soccer ball + pig + runner + goal"},
        "iconTip": {
            "lucide": ["Trophy", "Activity"],
            "phosphor": ["SoccerBall", "SneakerMove"],
            "iconify": ["noto:soccer-ball", "noto:pig-face"]
        },
        "distractorPool": ["lets_read_a_story", "bedtime", "eating"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#87CEEB"/>
  <rect x="0" y="300" width="400" height="100" fill="#7BC043"/>
  
  <!-- Ball -->
  <circle cx="300" cy="320" r="25" fill="white" stroke="#333" stroke-width="2"/>
  <path d="M 300 295 L 300 345 M 275 320 L 325 320" stroke="#333" stroke-width="2"/>
  <circle cx="300" cy="320" r="10" fill="#333"/>
  
  <!-- Peppa Kicking -->
  <g transform="translate(150, 250)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/> 
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Leg kicking -->
    <rect x="10" y="60" width="10" height="30" fill="#F9C6CF" transform="rotate(-45 10 60)"/>
    <ellipse cx="40" cy="80" rx="10" ry="6" fill="#000"/> <!-- Shoe -->
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "lets_go_for_a_walk",
        "filename": "53_lets_go_for_a_walk.svg",
        "phrases": ["Vamos de paseo.", "Caminamos."],
        "category": "activities",
        "keywords": ["walk", "stroll", "outside", "path"],
        "emojiTip": {"emojis": ["🚶", "🐷", "🌳", "☀️"], "display": "🚶🐷🌳☀️", "description": "Walker + pig + tree + sun"},
        "iconTip": {
            "lucide": ["Footprints", "Sun"],
            "phosphor": ["Footprints", "Sun"],
            "iconify": ["noto:person-walking", "noto:deciduous-tree"]
        },
        "distractorPool": ["bedtime", "school", "rainy"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#E0FFFF"/>
  <path d="M 0 300 Q 200 250 400 300 L 400 400 L 0 400 Z" fill="#7BC043"/>
  
  <!-- Path -->
  <path d="M 0 400 Q 200 350 400 380" stroke="#DEB887" stroke-width="40" fill="none"/>
  
  <!-- Sun -->
  <circle cx="50" cy="50" r="30" fill="#FFD700"/>
  
  <!-- Peppa Walking -->
  <g transform="translate(200, 280)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Walking Legs -->
    <rect x="-10" y="60" width="10" height="35" fill="#F9C6CF" transform="rotate(20 0 60)"/>
    <rect x="10" y="60" width="10" height="35" fill="#F9C6CF" transform="rotate(-20 20 60)"/>
    <ellipse cx="-20" cy="95" rx="10" ry="6" fill="#000"/>
    <ellipse cx="20" cy="95" rx="10" ry="6" fill="#000"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "its_recess_time",
        "filename": "54_its_recess_time.svg",
        "phrases": ["Es hora del recreo.", "Recreo."],
        "category": "school",
        "keywords": ["recess", "play", "school", "break"],
        "emojiTip": {"emojis": ["🔔", "🏃", "🤸", "🏫"], "display": "🔔🏃🤸🏫", "description": "Bell + runner + cartwheel + school"},
        "iconTip": {
            "lucide": ["Bell", "Play"],
            "phosphor": ["BellRinging", "Playground"],
            "iconify": ["noto:bell", "noto:school"]
        },
        "distractorPool": ["class_time", "bedtime", "eating"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#E0FFFF"/>
  <rect x="0" y="300" width="400" height="100" fill="#7BC043"/>
  
  <!-- School Bell -->
  <g transform="translate(50, 50)">
    <circle cx="0" cy="0" r="20" fill="#FFD700"/>
    <path d="M -5 20 L 5 20 L 10 30 L -10 30 Z" fill="#333"/>
    <path d="M 15 -15 L 25 -25 M -15 -15 L -25 -25" stroke="#333" stroke-width="2"/> <!-- Ringing lines -->
  </g>
  
  <!-- Slide -->
  <path d="M 300 200 L 380 350 L 320 350 L 260 200 Z" fill="#FF0000"/>
  <rect x="250" y="200" width="10" height="150" fill="#333"/> <!-- Ladder pole -->
  
  <!-- Peppa Running -->
  <g transform="translate(150, 300)">
    <ellipse cx="0" cy="20" rx="30" ry="35" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="40" ry="30" fill="#F9C6CF"/>
    <ellipse cx="30" cy="-30" rx="15" ry="12" fill="#F9C6CF"/>
    <circle cx="36" cy="-33" r="3" fill="#FF69B4"/>
    <circle cx="36" cy="-27" r="3" fill="#FF69B4"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Arms up -->
    <rect x="-40" y="0" width="30" height="8" fill="#F9C6CF" transform="rotate(-45)"/>
    <rect x="10" y="0" width="30" height="8" fill="#F9C6CF" transform="rotate(45)"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "its_time_to_sing",
        "filename": "55_its_time_to_sing.svg",
        "phrases": ["Es hora de cantar.", "Cantemos."],
        "category": "activities",
        "keywords": ["sing", "song", "music", "microphone"],
        "emojiTip": {"emojis": ["🎤", "🎵", "🎶", "🐷"], "display": "🎤🎵🎶🐷", "description": "Mic + music note + notes + pig"},
        "iconTip": {
            "lucide": ["Mic", "Music"],
            "phosphor": ["Microphone", "MusicNote"],
            "iconify": ["noto:microphone", "noto:musical-note"]
        },
        "distractorPool": ["reading", "sleeping", "eating"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#FFF0F5"/>
  
  <!-- Music Notes -->
  <text x="50" y="100" font-size="40" fill="#333">🎵</text>
  <text x="320" y="80" font-size="50" fill="#333">🎶</text>
  <text x="300" y="200" font-size="30" fill="#333">🎵</text>
  
  <!-- Peppa Singing -->
  <g transform="translate(200, 250)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Open Mouth -->
    <circle cx="10" cy="-15" r="8" fill="#000"/>
    
    <!-- Microphone -->
    <rect x="40" y="0" width="10" height="30" fill="#333" transform="rotate(-20)"/>
    <circle cx="45" cy="0" r="10" fill="#A9A9A9" transform="translate(5, -5)"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "who_wants_ice_cream",
        "filename": "56_who_wants_ice_cream.svg",
        "phrases": ["¿Quién quiere helado?", "Helado."],
        "category": "food",
        "keywords": ["ice cream", "dessert", "cone", "want"],
        "emojiTip": {"emojis": ["🍦", "❓", "😋", "🐷"], "display": "🍦❓😋🐷", "description": "Ice cream + question + yum + pig"},
        "iconTip": {
            "lucide": ["IceCream", "Smile"],
            "phosphor": ["IceCream", "Smiley"],
            "iconify": ["noto:soft-ice-cream", "noto:pig-face"]
        },
        "distractorPool": ["soup", "vegetables", "bedtime"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#FFFACD"/>
  
  <!-- Ice Cream Cart/Stand -->
  <rect x="50" y="150" width="100" height="150" fill="#FF69B4"/>
  <rect x="50" y="130" width="100" height="20" fill="#FFF"/> <!-- Top -->
  <circle cx="70" cy="300" r="20" fill="#333"/> <!-- Wheel -->
  <circle cx="130" cy="300" r="20" fill="#333"/>
  <text x="65" y="220" font-size="40">🍦</text>
  
  <!-- Peppa -->
  <g transform="translate(250, 250)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Arm raised -->
    <rect x="-30" y="-10" width="10" height="40" fill="#F9C6CF" transform="rotate(150 -30 -10)"/>
  </g>
  
  <!-- Giant Ice Cream Cone -->
  <g transform="translate(200, 100)">
    <polygon points="0,50 30,50 15,100" fill="#F4A460"/>
    <circle cx="15" cy="50" r="18" fill="#FFC0CB"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "be_careful",
        "filename": "57_be_careful.svg",
        "phrases": ["Ten cuidado.", "Cuidado."],
        "category": "family",
        "keywords": ["careful", "danger", "warning", "watch out"],
        "emojiTip": {"emojis": ["⚠️", "👀", "🐷", "🛑"], "display": "⚠️👀🐷🛑", "description": "Warning + eyes + pig + stop"},
        "iconTip": {
            "lucide": ["AlertTriangle", "Eye"],
            "phosphor": ["Warning", "Eye"],
            "iconify": ["noto:warning", "noto:pig-face"]
        },
        "distractorPool": ["run_fast", "jump", "sleep"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#FFF"/>
  
  <!-- Warning Sign -->
  <g transform="translate(100, 100)">
    <path d="M 0 0 L 100 0 L 50 -90 Z" fill="#FFD700" stroke="#000" stroke-width="3"/>
    <rect x="45" y="-70" width="10" height="40" fill="#000"/>
    <rect x="45" y="-20" width="10" height="10" fill="#000"/>
  </g>
  
  <!-- Peppa -->
  <g transform="translate(250, 250)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Hands out stopping -->
    <path d="M -30 10 L -50 0" stroke="#F9C6CF" stroke-width="6"/>
    <path d="M 30 10 L 50 0" stroke="#F9C6CF" stroke-width="6"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "dont_worry",
        "filename": "58_dont_worry.svg",
        "phrases": ["No te preocupes.", "Tranquilo."],
        "category": "family",
        "keywords": ["calm", "okay", "fine", "comfort"],
        "emojiTip": {"emojis": ["😌", "🐷", "💖", "✨"], "display": "😌🐷💖✨", "description": "Relieved face + pig + heart + sparkle"},
        "iconTip": {
            "lucide": ["Smile", "Heart"],
            "phosphor": ["Smiley", "Heart"],
            "iconify": ["noto:relieved-face", "noto:sparkling-heart"]
        },
        "distractorPool": ["cry", "panic", "scared"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#E6E6FA"/>
  
  <!-- Mummy Pig comforting Peppa -->
  
  <!-- Mummy Pig -->
  <g transform="translate(150, 250) scale(1.2)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#F6D55C"/> <!-- Yellow Dress -->
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Arm around Peppa -->
    <path d="M 30 10 Q 50 10 70 30" stroke="#F9C6CF" stroke-width="6" fill="none"/>
  </g>
  
  <!-- Peppa (Small) -->
  <g transform="translate(250, 280) scale(0.8)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "very_good",
        "filename": "59_very_good.svg",
        "phrases": ["¡Muy bien!", "¡Excelente!"],
        "category": "common_phrases",
        "keywords": ["good", "great", "excellent", "star"],
        "emojiTip": {"emojis": ["🌟", "🐷", "👍", "👏"], "display": "🌟🐷👍👏", "description": "Star + pig + thumbs up + clap"},
        "iconTip": {
            "lucide": ["Star", "ThumbsUp"],
            "phosphor": ["Star", "ThumbsUp"],
            "iconify": ["noto:star", "noto:thumbs-up"]
        },
        "distractorPool": ["bad", "try_again", "sad"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#FFF"/>
  
  <!-- Gold Star -->
  <path transform="translate(200, 150) scale(3)" d="M 0 -20 L 5 -5 L 20 -5 L 8 5 L 12 20 L 0 10 L -12 20 L -8 5 L -20 -5 L -5 -5 Z" fill="#FFD700" stroke="#DAA520" stroke-width="1"/>
  
  <!-- Peppa -->
  <g transform="translate(200, 300)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Thumbs Up -->
    <path d="M 30 10 L 50 0" stroke="#F9C6CF" stroke-width="6"/>
    <circle cx="50" cy="0" r="5" fill="#F9C6CF"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "how_fun",
        "filename": "60_how_fun.svg",
        "phrases": ["¡Qué divertido!", "Divertido."],
        "category": "common_phrases",
        "keywords": ["fun", "play", "party", "happy"],
        "emojiTip": {"emojis": ["🎉", "🐷", "😄", "🎈"], "display": "🎉🐷😄🎈", "description": "Party popper + pig + happy + balloon"},
        "iconTip": {
            "lucide": ["PartyPopper", "Smile"],
            "phosphor": ["Confetti", "Smiley"],
            "iconify": ["noto:party-popper", "noto:grinning-face"]
        },
        "distractorPool": ["boring", "sad", "sleeping"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#FFC0CB"/>
  
  <!-- Confetti -->
  <circle cx="50" cy="50" r="5" fill="red"/>
  <circle cx="350" cy="80" r="5" fill="blue"/>
  <rect x="100" y="100" width="5" height="10" fill="green" transform="rotate(45)"/>
  <rect x="300" y="50" width="5" height="10" fill="yellow" transform="rotate(-45)"/>
  
  <!-- Peppa Jumping -->
  <g transform="translate(200, 250)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Arms Up -->
    <path d="M -30 10 L -50 -20" stroke="#F9C6CF" stroke-width="6"/>
    <path d="M 30 10 L 50 -20" stroke="#F9C6CF" stroke-width="6"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "i_am_scared",
        "filename": "61_i_am_scared.svg",
        "phrases": ["Tengo miedo.", "Estoy asustado."],
        "category": "emotions",
        "keywords": ["scared", "fear", "ghost", "hide"],
        "emojiTip": {"emojis": ["😨", "🐷", "👻", "🫣"], "display": "😨🐷👻🫣", "description": "Scared face + pig + ghost + peeking"},
        "iconTip": {
            "lucide": ["Ghost", "Frown"],
            "phosphor": ["Ghost", "FaceScreaming"],
            "iconify": ["noto:fearful-face", "noto:ghost"]
        },
        "distractorPool": ["brave", "happy", "sleeping"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#708090"/> <!-- Dark/Grey background -->
  
  <!-- Spider web -->
  <path d="M 300 0 L 300 100" stroke="#FFF" stroke-width="1"/>
  <circle cx="300" cy="110" r="10" fill="#000"/> <!-- Spider -->
  <line x1="290" y1="110" x2="280" y2="100" stroke="#000"/>
  <line x1="310" y1="110" x2="320" y2="100" stroke="#000"/>
  
  <!-- Peppa Scared -->
  <g transform="translate(150, 250)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Scared Mouth (wiggly) -->
    <path d="M 0 -15 Q 5 -10 10 -15 T 20 -15" stroke="#333" fill="none"/>
    
    <!-- Tears/Sweat -->
    <circle cx="-20" cy="-40" r="2" fill="#00BFFF"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "what_a_fright",
        "filename": "62_what_a_fright.svg",
        "phrases": ["¡Qué susto!"],
        "category": "emotions",
        "keywords": ["fright", "surprise", "scare", "jump"],
        "emojiTip": {"emojis": ["😱", "🐷", "‼️", "💨"], "display": "😱🐷‼️💨", "description": "Screaming face + pig + bang + dash"},
        "iconTip": {
            "lucide": ["AlertCircle", "Zap"],
            "phosphor": ["WarningCircle", "Lightning"],
            "iconify": ["noto:face-screaming-in-fear", "noto:red-exclamation-mark"]
        },
        "distractorPool": ["calm", "happy", "sleeping"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#FFF"/>
  
  <!-- Surprise lines -->
  <path d="M 200 150 L 200 100" stroke="#FFA500" stroke-width="4"/>
  <path d="M 250 160 L 290 120" stroke="#FFA500" stroke-width="4"/>
  <path d="M 150 160 L 110 120" stroke="#FFA500" stroke-width="4"/>
  
  <!-- Peppa Startled -->
  <g transform="translate(200, 250)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    
    <!-- Wide Eyes -->
    <circle cx="-5" cy="-35" r="5" fill="#FFF" stroke="#333" stroke-width="1"/>
    <circle cx="12" cy="-35" r="5" fill="#FFF" stroke="#333" stroke-width="1"/>
    <circle cx="-5" cy="-35" r="2" fill="#333"/>
    <circle cx="12" cy="-35" r="2" fill="#333"/>
    
    <!-- Open Mouth -->
    <ellipse cx="5" cy="-10" rx="10" ry="10" fill="#000"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "i_like_it",
        "filename": "63_i_like_it.svg",
        "phrases": ["¡Me gusta!", "Me gusta."],
        "category": "common_phrases",
        "keywords": ["like", "love", "heart", "good"],
        "emojiTip": {"emojis": ["👍", "🐷", "💖", "😊"], "display": "👍🐷💖😊", "description": "Thumbs up + pig + heart + smile"},
        "iconTip": {
            "lucide": ["ThumbsUp", "Heart"],
            "phosphor": ["ThumbsUp", "Heart"],
            "iconify": ["noto:thumbs-up", "noto:red-heart"]
        },
        "distractorPool": ["i_dont_like_it", "sad", "angry"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#FFF"/>
  
  <!-- Hearts -->
  <text x="50" y="100" font-size="40" fill="#FF0000">❤️</text>
  <text x="300" y="80" font-size="50" fill="#FF0000">❤️</text>
  
  <!-- Peppa -->
  <g transform="translate(200, 250)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Smile -->
    <path d="M -5 -20 Q 10 -10 25 -20" stroke="#333" stroke-width="2" fill="none"/>
    
    <!-- Thumbs Up -->
    <path d="M 30 10 L 50 0" stroke="#F9C6CF" stroke-width="6"/>
    <circle cx="55" cy="-5" r="6" fill="#F9C6CF"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "i_dont_like_it",
        "filename": "64_i_dont_like_it.svg",
        "phrases": ["No me gusta.", "No me gusta nada."],
        "category": "common_phrases",
        "keywords": ["dislike", "bad", "thumbs down", "sad"],
        "emojiTip": {"emojis": ["👎", "🐷", "🤢", "🙅"], "display": "👎🐷🤢🙅", "description": "Thumbs down + pig + nauseated + no gesture"},
        "iconTip": {
            "lucide": ["ThumbsDown", "Frown"],
            "phosphor": ["ThumbsDown", "SmileySad"],
            "iconify": ["noto:thumbs-down", "noto:pouting-face"]
        },
        "distractorPool": ["i_like_it", "happy", "delicious"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#F0F0F0"/>
  
  <!-- Broken Heart or Cross -->
  <text x="300" y="100" font-size="50" fill="#000">❌</text>
  
  <!-- Peppa Displeased -->
  <g transform="translate(200, 250)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Frown -->
    <path d="M -5 -10 Q 10 -20 25 -10" stroke="#333" stroke-width="2" fill="none"/>
    
    <!-- Thumbs Down -->
    <path d="M 30 10 L 50 20" stroke="#F9C6CF" stroke-width="6"/>
    <circle cx="55" cy="25" r="6" fill="#F9C6CF"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    },
    {
        "id": "its_my_turn",
        "filename": "65_its_my_turn.svg",
        "phrases": ["Es mi turno.", "Me toca a mí."],
        "category": "friendship",
        "keywords": ["turn", "share", "game", "me"],
        "emojiTip": {"emojis": ["☝️", "🐷", "🎲", "⏱️"], "display": "☝️🐷🎲⏱️", "description": "Finger up + pig + dice + stopwatch"},
        "iconTip": {
            "lucide": ["User", "Clock"],
            "phosphor": ["User", "Timer"],
            "iconify": ["noto:index-pointing-up", "noto:pig-face"]
        },
        "distractorPool": ["your_turn", "waiting", "sleeping"],
        "svg_content": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <rect width="400" height="400" fill="#FFF"/>
  
  <!-- Game Board / Dice -->
  <rect x="50" y="200" width="100" height="100" fill="#FFD700" stroke="#000"/>
  <circle cx="80" cy="230" r="5" fill="#000"/>
  <circle cx="120" cy="270" r="5" fill="#000"/>
  
  <!-- Peppa Pointing to Self -->
  <g transform="translate(250, 250)">
    <ellipse cx="0" cy="30" rx="35" ry="40" fill="#E63946"/>
    <ellipse cx="0" cy="-30" rx="45" ry="35" fill="#F9C6CF"/>
    <ellipse cx="35" cy="-30" rx="18" ry="14" fill="#F9C6CF"/>
    <circle cx="42" cy="-33" r="4" fill="#FF69B4"/>
    <circle cx="42" cy="-27" r="4" fill="#FF69B4"/>
    <ellipse cx="-15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <ellipse cx="15" cy="-65" rx="10" ry="18" fill="#F9C6CF"/>
    <circle cx="-5" cy="-35" r="3" fill="#333"/>
    <circle cx="12" cy="-35" r="3" fill="#333"/>
    
    <!-- Hand pointing to chest -->
    <path d="M 30 10 Q 50 10 20 20" stroke="#F9C6CF" stroke-width="6" fill="none"/>
    <path d="M -30 10 L -40 30" stroke="#F9C6CF" stroke-width="6"/>
  </g>
  
  <text x="380" y="390" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#5B6470" opacity="0.85">Gemini 3 Pro</text>
</svg>
"""
    }
]

# Path to files
svg_dir = "/home/lvp/study/espanjapeli/svelte/static/peppa_advanced_spanish_images/svg"
manifest_path = "/home/lvp/study/espanjapeli/svelte/static/peppa_advanced_spanish_images/image_manifest.json"

# Read existing manifest
with open(manifest_path, 'r') as f:
    manifest = json.load(f)

# Keep track of existing IDs to avoid duplicates (though we chose unique ones)
existing_ids = set(img['id'] for img in manifest['images'])

# Process each new image
for img_data in new_images:
    # 1. Write SVG file
    svg_filename = img_data['filename']
    svg_path = os.path.join(svg_dir, svg_filename)
    
    with open(svg_path, 'w') as f:
        f.write(img_data['svg_content'].strip())
    
    print(f"Created {svg_filename}")
    
    # 2. Add to manifest if not exists
    if img_data['id'] not in existing_ids:
        new_entry = {
            "id": img_data['id'],
            "file": f"svg/{svg_filename}",
            "phrases": img_data['phrases'],
            "category": img_data['category'],
            "keywords": img_data['keywords'],
            "emojiTip": img_data['emojiTip'],
            "iconTip": img_data['iconTip'],
            "distractorPool": img_data['distractorPool']
        }
        manifest['images'].append(new_entry)
        
        # Add to phraseQueue (simple round-robin or append)
        new_queue_item = {
            "spanish": img_data['phrases'][0],
            "finnish": "TODO", # Placeholder
            "english": "TODO", # Placeholder
            "correctImage": img_data['id'],
            "distractors": img_data['distractorPool'],
            "difficulty": "medium",
            "category": img_data['category']
        }
        manifest['phraseQueue'].append(new_queue_item)
        existing_ids.add(img_data['id'])

# Write updated manifest
with open(manifest_path, 'w') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)

print("Manifest updated.")
