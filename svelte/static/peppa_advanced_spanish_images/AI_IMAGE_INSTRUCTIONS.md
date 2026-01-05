# 🐷 Peppa Pig Spanish Learning - Image Generation Guide

## Overview

This folder contains visual materials for the **Peppa Pig Spanish Learning Game**. The game speaks Spanish phrases aloud, and kids must select the correct image that matches what they heard.

## 🎮 Game Concept

1. **Audio plays**: "¡Me encanta saltar en los charcos de barro!" (Spanish TTS)
2. **4 images shown**: Kid must pick the one showing "jumping in muddy puddles"
3. **Dual Display**: Each button **alternates** between SVG illustration and emoji composition every 2 seconds
4. **Feedback**: Correct = celebration, Wrong = try again with hint

## 📦 Installed Icon Packages (npm)

Three high-quality icon libraries are installed and ready to use:

| Package | Icons | License | Usage |
|---------|-------|---------|-------|
| **lucide-svelte** | 1,400+ | ISC | `import { Sun, Moon } from 'lucide-svelte'` |
| **phosphor-svelte** | 7,000+ | MIT | `import { Sun, Moon } from 'phosphor-svelte'` |
| **@iconify/svelte** | 200,000+ | MIT | `import Icon from '@iconify/svelte'` then `<Icon icon="noto:sun" />` |

### Iconify Collections (Most Useful)
- `noto:` - Google Noto Color Emoji (best for kids!)
- `twemoji:` - Twitter Emoji
- `fluent-emoji:` - Microsoft Fluent Emoji
- `openmoji:` - Open source emoji
- `mdi:` - Material Design Icons
- `ph:` - Phosphor Icons

### Example Usage in Svelte
```svelte
<script>
  import Icon from '@iconify/svelte';
  import { Sun, Cloud } from 'lucide-svelte';
  import { Heart } from 'phosphor-svelte';
</script>

<!-- Iconify with Noto emoji -->
<Icon icon="noto:pig-face" width="48" />
<Icon icon="noto:sun" width="48" />

<!-- Lucide -->
<Sun size={48} color="#FFD700" />

<!-- Phosphor -->
<Heart size={48} weight="fill" color="#FF69B4" />
```

---

## 🔄 Dual Display System (SVG + Emoji)

Each phrase has TWO visual representations that alternate:

### 1. SVG Illustration
Hand-crafted or AI-generated scene illustrations (400x400px)

### 2. Emoji Composition (emojiTip)
1-5 Unicode emojis that represent the phrase concept

### Example: "¡Me encanta saltar en los charcos de barro!"

**SVG Mode:**
```
[Beautiful illustration of Peppa jumping in muddy puddle]
```

**Emoji Mode:**
```
🐷💦🟤👢😄
(pig + splash + brown/mud + boots + happy)
```

### Manifest Structure for Each Image
```json
{
  "id": "muddy_puddles",
  "file": "svg/01_muddy_puddles.svg",
  "emojiTip": {
    "emojis": ["🐷", "💦", "🟤", "👢", "😄"],
    "display": "🐷💦🟤👢😄",
    "description": "Pig + water splash + brown (mud) + boots + happy"
  },
  "iconTip": {
    "lucide": ["Footprints", "Droplets", "Smile"],
    "phosphor": ["Boot", "Drop", "SmileyWink"],
    "iconify": ["noto:pig-face", "noto:droplet", "noto:hiking-boot"]
  }
}
```

---

## 🎨 Image Style Guidelines

### Visual Style: "Peppa Pig Inspired Simple"
- **Colors**: Bright, primary colors (pink, blue, red, yellow, green)
- **Style**: Simple, flat, child-friendly illustrations
- **Elements**: Rounded shapes, minimal detail, maximum clarity
- **Characters**: Represented by animal silhouettes/icons (pig, sheep, dog, etc.)

### Icon Sources (Free for Use)
1. **Emoji Glyphs** - Universal, no licensing issues
2. **Lucide Icons** (MIT) - https://lucide.dev
3. **Heroicons** (MIT) - https://heroicons.com
4. **Phosphor Icons** (MIT) - https://phosphoricons.com
5. **Font Awesome Free** (CC BY 4.0) - https://fontawesome.com
6. **Simple Icons** - Brand icons if needed

### SVG Composition Technique
Combine multiple simple icons/emojis to create scenes:

```
🐷 + 💦 + 🟤 = Peppa jumping in muddy puddle
🌧️ + ☀️ + 🌈 = Weather after rain (rainbow)
🎂 + 🕯️ + 🎁 = Birthday party scene
```

---

## 📋 Phrase Categories & Visual Mapping

### 1. INTRODUCTION PHRASES
| Spanish | Visual Elements | Suggested Composition |
|---------|-----------------|----------------------|
| "Yo soy Peppa Pig" | 🐷 pointing to self | Pink pig with arrow pointing to chest |
| "Este es mi hermano pequeño, George" | 🐷 small + 🦖 | Small blue pig + dinosaur toy |
| "Esta es Mamá Pig" | 🐷 + 👗 yellow | Pig figure with yellow dress, larger size |
| "Y este es Papá Pig" | 🐷 + 👓 + 🟠 | Large pig with glasses, orange |

### 2. ICONIC PEPPA MOMENTS
| Spanish | Visual Elements | Scene Description |
|---------|-----------------|-------------------|
| "¡Me encanta saltar en los charcos de barro!" | 🐷💦🟤 | Pig jumping, water splashing, brown puddle |
| "¡Qué divertido!" | 😄🎉 | Happy face with celebration sparkles |
| "¡Vamos a jugar!" | 🏃‍♂️⚽🎮 | Running figures, play symbols |
| "¡Hora de ir a la cama!" | 🛏️🌙⭐ | Bed with moon and stars |

### 3. WEATHER
| Spanish | Visual Elements | Scene Description |
|---------|-----------------|-------------------|
| "Hace sol" | ☀️😎 | Bright yellow sun |
| "Está lloviendo" | 🌧️💧 | Rain clouds with drops |
| "Hay un arcoíris" | 🌈☀️🌧️ | Rainbow arc with sun and clouds |
| "Hace frío" | ❄️🧥 | Snowflake, winter coat |
| "Hace calor" | ☀️🥵💦 | Sun, sweating face |

### 4. EMOTIONS
| Spanish | Visual Elements | Expression |
|---------|-----------------|------------|
| "Estoy feliz" | 😊🐷 | Smiling pig face |
| "Estoy triste" | 😢🐷 | Crying pig face |
| "Tengo miedo" | 😨🐷 | Scared pig face |
| "Estoy cansado/a" | 😴🐷 | Sleepy pig face |

### 5. ACTIVITIES
| Spanish | Visual Elements | Action Scene |
|---------|-----------------|--------------|
| "Vamos a dibujar" | 🎨🖌️✏️ | Art supplies |
| "Vamos a nadar" | 🏊‍♂️💦🩱 | Swimming figure, water |
| "Vamos a bailar" | 💃🎵🎶 | Dancing figure with music notes |
| "Es hora de pintar" | 🎨🖼️ | Paint palette, canvas |

### 6. SCHOOL
| Spanish | Visual Elements | Scene |
|---------|-----------------|-------|
| "Buenos días, Madame Gazelle" | 🦌👩‍🏫 | Gazelle teacher figure |
| "Es hora del recreo" | 🎠🏃‍♂️⚽ | Playground, running kids |
| "Vamos a contar hasta diez" | 1️⃣2️⃣3️⃣...🔟 | Number sequence |

### 7. FOOD
| Spanish | Visual Elements | Items |
|---------|-----------------|-------|
| "¡Qué rico!" | 😋🍽️ | Yummy face with plate |
| "¿Quién quiere helado?" | 🍦🍨❓ | Ice cream with question |
| "Es hora de comer" | 🍽️⏰ | Plate with clock |

### 8. FAMILY
| Spanish | Visual Elements | Figures |
|---------|-----------------|---------|
| "Vamos a visitar a los abuelos" | 🏠👴👵 | House with grandparents |
| "¿Podemos ir al parque?" | 🌳🎠❓ | Park elements with question |

---

## 🖼️ Image File Structure

```
peppa_advanced_spanish_images/
├── AI_IMAGE_INSTRUCTIONS.md          # This file
├── image_manifest.json               # Mapping of phrases to images
├── svg/                              # SVG compositions
│   ├── muddy_puddles.svg
│   ├── birthday_party.svg
│   ├── sunny_day.svg
│   ├── rainy_day.svg
│   └── ...
├── generated/                        # AI-generated images (if any)
└── sprites/                          # Reusable character sprites
    ├── peppa.svg
    ├── george.svg
    ├── mummy_pig.svg
    └── daddy_pig.svg
```

---

## 🤖 AI Image Generation Prompts

When using AI image generators (DALL-E, Midjourney, Stable Diffusion), use these prompt templates:

### Base Prompt Template
```
Simple flat illustration in Peppa Pig cartoon style, 
[SCENE DESCRIPTION], 
bright primary colors, 
child-friendly, 
white background,
no text,
clean vector style
```

### Example Prompts

**Muddy Puddles:**
```
Simple flat illustration in Peppa Pig cartoon style, 
a happy pink pig jumping and splashing in a brown muddy puddle, 
water droplets flying, 
wearing red boots,
bright primary colors, 
child-friendly, 
white background,
no text
```

**Birthday Party:**
```
Simple flat illustration in Peppa Pig cartoon style,
a birthday cake with 5 candles, 
colorful balloons and wrapped presents,
party hats,
bright primary colors,
child-friendly,
white background,
no text
```

**School Time:**
```
Simple flat illustration in Peppa Pig cartoon style,
a classroom scene with small desks,
crayons and paper on tables,
a blackboard in background,
bright primary colors,
child-friendly,
white background,
no text
```

---

## 🎯 Game Distractor Images

For multiple choice, each correct answer needs 3 **plausible but wrong** images:

### Distractor Strategy
- Same category, different action (swimming vs jumping)
- Similar elements, different emotion (happy vs sad)
- Related but distinct (park vs school)

### Example for "¡Me encanta saltar en los charcos de barro!"
- ✅ **Correct**: Pig jumping in puddle
- ❌ **Wrong 1**: Pig swimming in pool (water but different)
- ❌ **Wrong 2**: Pig in bathtub (water, indoors)
- ❌ **Wrong 3**: Pig looking at puddle sadly (same scene, wrong emotion)

---

## 🎨 Color Palette

Based on Peppa Pig show:

| Element | Color | Hex |
|---------|-------|-----|
| Peppa/Pink | Pink | #F9C6CF |
| George | Blue | #6B9BD2 |
| Mummy Pig | Yellow dress | #F6D55C |
| Daddy Pig | Orange/Brown | #ED553B |
| Grass | Green | #7BC043 |
| Sky | Light Blue | #87CEEB |
| Mud | Brown | #8B4513 |
| Sun | Yellow | #FFD700 |
| Clouds | White | #FFFFFF |

---

## 📱 Technical Specifications

- **Format**: SVG (preferred) or PNG
- **Size**: 400x400px minimum
- **Aspect Ratio**: 1:1 square
- **Background**: White or transparent
- **File naming**: `[category]_[phrase_key].svg`

---

## 🎮 Implementation Notes

The game component should:
1. Load audio for Spanish phrase
2. Display 4 images (1 correct + 3 distractors)
3. Shuffle positions randomly
4. Track score and progress
5. Show encouraging feedback

### Svelte Component Integration
```svelte
<script>
  import { getImagesForPhrase } from './imageService';
  
  let currentPhrase = phrases[currentIndex];
  let images = getImagesForPhrase(currentPhrase.spanish);
</script>

<audio src={getAudioUrl(currentPhrase.spanish)} autoplay />

<div class="image-grid">
  {#each images as img}
    <button on:click={() => checkAnswer(img)}>
      <img src={img.url} alt="" />
    </button>
  {/each}
</div>
```

---

## ✅ Priority Phrases for Visual Content

Create images for these first (most common/iconic):

1. "¡Me encanta saltar en los charcos de barro!" ⭐
2. "Yo soy Peppa Pig" ⭐
3. "¡Vamos a jugar!" ⭐
4. "¡Hora de ir a la cama!" ⭐
5. "Hace sol" / "Está lloviendo" ⭐
6. "Estoy feliz" / "Estoy triste"
7. "¿Quieres jugar conmigo?"
8. "Es hora de comer"
9. "Vamos a la escuela"
10. "¡Feliz cumpleaños!"

---

*Generated for Peppa Pig Spanish Learning Game - espanjapeli project*
