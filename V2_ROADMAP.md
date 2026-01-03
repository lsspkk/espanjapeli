# Espanjapeli Architecture Analysis

## Decision: Migrating to Svelte

The current vanilla JavaScript approach works for one game, but we're adding multiple game modes with very different interfaces (word game, kids mode, practice modes). Rather than building a complex custom router and component system, we'll migrate to **SvelteKit with TypeScript**.

### Why Svelte?

- **Components** — Each game mode becomes a clean, self-contained component
- **Lightweight** — Compiles to tiny vanilla JS (important for mobile)
- **Simple syntax** — Feels like HTML, easy to read and maintain
- **Built-in routing** — Different game modes become different pages
- **TypeScript support** — Catch errors before they reach users
- **Svelte stores** — Clean state management for progress tracking

### Why Tailwind + DaisyUI?

- **Tailwind** — Utility-first CSS, no more writing custom stylesheets
- **DaisyUI** — Ready-made components (buttons, cards, modals, progress bars)
- **Themes** — DaisyUI has 30+ themes, including kid-friendly colors for Peppa mode
- **Fast development** — Just add classes, components work out of the box
- **Small bundle** — Only includes CSS we actually use

DaisyUI gives us everything we need: buttons, cards, progress indicators, tabs, modals, toasts — all accessible and mobile-friendly.

### Why Not Stay with Vanilla JS?

The current `game.js` is 1200 lines and handles everything. Adding Peppa Pig mode (completely different UI for kids) would mean either duplicating code or making one giant file even more complex. Svelte lets us keep things separate and simple.

### How We'll Do It

1. Create a new SvelteKit project alongside the current code
2. Move shared services (TTS, storage) first
3. Convert the word game to a Svelte component
4. Add new game modes as new routes
5. Set up GitHub Actions to build and deploy to Pages
6. Remove old vanilla JS once everything works

The current LocalStorage format stays the same — no data loss during migration.

---

## Current Structure

```
┌─────────────────────────────────────────────────────┐
│                    index.html                        │
│  ┌─────────────────────────────────────────────────┐│
│  │         .game-container[data-state=X]           ││
│  │  ┌─────┐ ┌─────────┐ ┌────────┐ ┌───────────┐  ││
│  │  │home │ │ playing │ │answered│ │  report   │  ││
│  │  └─────┘ └─────────┘ └────────┘ └───────────┘  ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
         │          │           │            │
         └──────────┴───────────┴────────────┘
                        ▼
              CSS visibility control
              via data-state attribute
```

## What Works Well

**State Management**  
Your `data-state` attribute approach is excellent. CSS handles visibility, keeping JS clean.

**Modular Files**  
Separating words, storage, tips, and messages shows good instinct for organization.

**Mobile-First Design**  
The compact mode and responsive breakpoints work well for a learning app.

**Caching Layer**  
TipService's cache-first strategy with LLM fallback is smart economics.

---

## What Needs Restructuring

### The Core Problem

```
        ┌─────────────────────────────────────────┐
        │            game.js (1200 lines)         │
        │  ┌─────────────────────────────────────┐│
        │  │  UI Logic                           ││
        │  │  Game State                         ││
        │  │  Answer Checking                    ││
        │  │  TTS Control                        ││
        │  │  DOM Manipulation                   ││
        │  │  Event Handlers                     ││
        │  │  Question Flow                      ││
        │  │  Scoring                            ││
        │  │  Reporting                          ││
        │  └─────────────────────────────────────┘│
        │                                         │
        │     Everything is one thing.            │
        └─────────────────────────────────────────┘
```

Adding another game means either:
- Duplicating all this code (bad)
- Making one giant file even bigger (worse)

---

## Proposed Multi-Game Architecture

```
                    ┌─────────────────────┐
                    │    Game Router      │
                    │  (game-manager.js)  │
                    └──────────┬──────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│ Word Game    │       │ Listening    │       │ Reading      │
│ (current)    │       │ Game         │       │ Lesson       │
└──────────────┘       └──────────────┘       └──────────────┘
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Shared Services   │
                    ├─────────────────────┤
                    │  • TTS Service      │
                    │  • Storage          │
                    │  • Score Manager    │
                    │  • UI Utilities     │
                    └─────────────────────┘
```

### Game Type Interface

Each game module should follow a pattern:

```
┌─────────────────────────────────────────────────┐
│                  Game Module                     │
├─────────────────────────────────────────────────┤
│  init()         → Set up game                   │
│  start()        → Begin a session               │
│  handleInput()  → Process user action           │
│  checkAnswer()  → Evaluate response             │
│  nextRound()    → Advance to next item          │
│  end()          → Show results, cleanup         │
│  getState()     → Return current state object   │
├─────────────────────────────────────────────────┤
│  HTML Template  → Game-specific UI fragment     │
│  Styles         → Game-specific CSS             │
│  Data Source    → Words / Phrases / Stories     │
└─────────────────────────────────────────────────┘
```

---

## Your New Games

### 1. Listening Comprehension

```
┌────────────────────────────────────────────┐
│          LISTENING GAME FLOW               │
│                                            │
│   ┌──────┐    User      ┌────────────────┐│
│   │ 🔊   │ ───hears───► │ Common Phrase  ││
│   └──────┘              └────────────────┘│
│      │                         │          │
│      │        Options          │          │
│      ▼                         ▼          │
│   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐     │
│   │ A   │  │ B   │  │ C   │  │ D   │     │
│   └─────┘  └─────┘  └─────┘  └─────┘     │
│                                            │
│   Dataset: Phrases with audio focus        │
│   "¿Cómo estás?" → multiple choice         │
└────────────────────────────────────────────┘
```

**Material:** Uses `themes/basics_travel.json` — phrases you'll actually hear:
- Greetings locals use ("¿Qué tal?" not just "Hola")
- Restaurant staff ("¿Qué desea?" / "¿Algo más?")
- Shop assistants ("¿Le puedo ayudar?")
- Friendly reactions ("¡Qué bien!" / "¡Genial!")

### 2. Speaking Practice (No Scoring)

```
┌────────────────────────────────────────────┐
│       SPEAKING PRACTICE FLOW               │
│                                            │
│   ┌────────────────────────────────────┐   │
│   │  hola                              │   │
│   │  (hei)                             │   │
│   └────────────────┬───────────────────┘   │
│                    │                       │
│          User tries to say it              │
│                    │                       │
│                    ▼                       │
│   ┌────────────────────────────────────┐   │
│   │         [🔊 Kuuntele]              │   │
│   └────────────────┬───────────────────┘   │
│                    │                       │
│          Computer speaks it                │
│          User compares mentally            │
│                    │                       │
│                    ▼                       │
│   ┌────────────────────────────────────┐   │
│   │         [→ Seuraava]               │   │
│   └────────────────────────────────────┘   │
│                                            │
│   No microphone needed                     │
│   No scoring — pure practice               │
│   Works offline with TTS                   │
└────────────────────────────────────────────┘
```

**Flow:** Word appears → User speaks aloud → Press button → Computer speaks → User self-evaluates → Next word

This removes all technical complexity. Just TTS, which you already have.

**Material:** See `themes/basics_travel.json` — curated phrases including:
- 🌅 Greetings & farewells (daily essentials)
- 😊 Positive expressions (happy, friendly words)
- 💬 Social phrases (making friends, celebrations)
- ✨ Compliments (spreading kindness)

### 3. Finnish → Spanish Recall (No Scoring)

```
┌────────────────────────────────────────────┐
│    FLASHCARD RECALL FLOW                   │
│                                            │
│   ┌────────────────────────────────────┐   │
│   │                                    │   │
│   │            koira                   │   │
│   │                                    │   │
│   └────────────────────────────────────┘   │
│                                            │
│      User says/thinks: "perro"             │
│                                            │
│   ┌────────────────────────────────────┐   │
│   │       [👁️ Näytä vastaus]           │   │
│   └────────────────┬───────────────────┘   │
│                    │                       │
│                    ▼                       │
│   ┌────────────────────────────────────┐   │
│   │            perro                   │   │
│   │       [🔊 Kuuntele]                │   │
│   └────────────────────────────────────┘   │
│                    │                       │
│                    ▼                       │
│   ┌────────────────────────────────────┐   │
│   │         [→ Seuraava]               │   │
│   └────────────────────────────────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

**Also works with phrases:**

```
┌────────────────────────────────────────────┐
│                                            │
│   ┌────────────────────────────────────┐   │
│   │      Mitä kuuluu?                  │   │
│   └────────────────────────────────────┘   │
│                                            │
│      User tries: "¿Cómo estás?"            │
│                                            │
│              [👁️ Näytä]                    │
│                    │                       │
│                    ▼                       │
│   ┌────────────────────────────────────┐   │
│   │      ¿Cómo estás?                  │   │
│   │      [🔊]                          │   │
│   └────────────────────────────────────┘   │
│                                            │
└────────────────────────────────────────────┘
```

**Key points:**
- No typing, no scoring, no grading
- Pure recall practice (most effective for learning)
- TTS lets user hear correct pronunciation
- Works with single words AND phrases
- Uses existing word database + new phrases

**Material:** See `themes/basics_travel.json` — organized by real-life situations:
- 🏨 Hotel (check-in, wifi, breakfast)
- 🍽️ Restaurant (ordering, recommendations, bill)
- 🛒 Shopping (prices, sizes, payment)
- 🚆 Transport (tickets, schedules, directions)
- 🆘 Emergency (help, doctor, police)

Focus on **friendly, positive communication** — the phrases language
teachers recommend for travelers who want to be polite and make friends.

---

## Practice Mode: Self-Assessment System

### Category Selection (like game mode)

```
┌─────────────────────────────────────────────────────────┐
│  🇫🇮→🇪🇸 Muistiharjoitus                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ 😊 Positiiv.│ │ 🍽️ Ravintola│ │ 🛒 Ostokset │       │
│  │ ████████░░  │ │ ██████░░░░  │ │ ░░░░░░░░░░  │       │
│  │ 80% tuttu   │ │ 60% tuttu   │ │ Ei aloitettu│       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ 🌅 Tervehdys│ │ 🏨 Hotelli  │ │ 🚆 Liikenne │       │
│  │ ██████████  │ │ ████░░░░░░  │ │ ██░░░░░░░░  │       │
│  │ ⭐ Valmis!  │ │ 40% tuttu   │ │ 20% tuttu   │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Self-Assessment During Practice

```
┌────────────────────────────────────────────────┐
│                                                │
│   ┌────────────────────────────────────┐       │
│   │      ¿Cuánto cuesta?               │       │
│   │      [🔊]                          │       │
│   └────────────────────────────────────┘       │
│                                                │
│   Finnish: Paljonko maksaa?                    │
│                                                │
│   ─────────────────────────────────────────    │
│                                                │
│   How did you do?                              │
│                                                │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│   │ 😕      │  │ 🤔      │  │ 😊      │       │
│   │ En osaa │  │ Melkein │  │ Osaan!  │       │
│   └─────────┘  └─────────┘  └─────────┘       │
│                                                │
└────────────────────────────────────────────────┘
```

### Progress Data Structure

```javascript
// Saved in localStorage
practiceProgress = {
  categories: {
    "positive_friendly": {
      status: "learning",     // "new" | "learning" | "mastered"
      masteredCount: 12,      // out of 15
      totalPhrases: 15,
      lastPracticed: "2026-01-04T14:30:00Z",
      firstStarted: "2026-01-02T10:00:00Z",
      practiceCount: 5,       // times practiced
      
      // Per-phrase tracking
      phrases: {
        "¡Qué bonito!": { 
          status: "mastered",  // "new" | "learning" | "mastered"
          lastSeen: "2026-01-04T14:30:00Z",
          seenCount: 3,
          markedMastered: "2026-01-04T14:30:00Z"
        },
        "¡Me encanta!": {
          status: "learning",
          lastSeen: "2026-01-04T14:32:00Z",
          seenCount: 2,
          markedMastered: null
        }
      }
    }
  },
  
  // Learning timeline for visualization
  timeline: [
    { date: "2026-01-02", category: "greetings", mastered: 5 },
    { date: "2026-01-03", category: "greetings", mastered: 12 },
    { date: "2026-01-04", category: "greetings", mastered: 15 },  // Done!
    { date: "2026-01-04", category: "positive", mastered: 8 }
  ]
}
```

### Category Summary View

```
┌─────────────────────────────────────────────────────────┐
│  📊 Oppimisen edistyminen                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🌅 Tervehdykset              ⭐ VALMIS                 │
│     15/15 fraasia                                       │
│     Aloitettu: 2.1.2026                                 │
│     Valmis: 4.1.2026 (2 päivää)                        │
│                                                         │
│  😊 Positiiviset              ████████░░ 80%           │
│     12/15 fraasia                                       │
│     Aloitettu: 3.1.2026                                 │
│     Viimeksi: tänään                                    │
│                                                         │
│  🍽️ Ravintola                 ██████░░░░ 60%           │
│     7/12 fraasia                                        │
│     Aloitettu: 4.1.2026                                 │
│     Viimeksi: tänään                                    │
│                                                         │
│  🛒 Ostokset                  ░░░░░░░░░░ Ei aloitettu  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

```
┌───────────────────────────────────────────────────────┐
│  USER IS THE JUDGE                                    │
│                                                       │
│  • No automated scoring                               │
│  • User marks what they know/don't know              │
│  • Progress = user's self-assessment over time       │
│  • System only TRACKS, never GRADES                  │
│                                                       │
│  WHAT WE TRACK:                                      │
│  ✓ When category was started                         │
│  ✓ When each phrase was marked "mastered"           │
│  ✓ How many practice sessions                        │
│  ✓ Time from start to mastery (learning rate)       │
│                                                       │
│  WHAT WE SHOW:                                       │
│  ✓ Progress bars per category                        │
│  ✓ "Days to learn" for completed categories         │
│  ✓ Phrases still to learn (prioritized in practice) │
│  ✓ Overall learning journey timeline                │
└───────────────────────────────────────────────────────┘
```

### 4. Peppa Pig Kids Mode 🐷 (For Children)

A special kid-friendly mode for children learning Spanish by watching Peppa Pig.

```
┌────────────────────────────────────────────────────────────┐
│  🐷 PIPSA POSSU / PEPPA PIG                                │
│                                                            │
│  For kids who watch the show and want to learn words!      │
│                                                            │
│  ════════════════════════════════════════════════════════  │
│                                                            │
│          🔊 "el charco"                                    │
│             (plays audio)                                  │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│     What does it mean? Pick the picture!                   │
│                                                            │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐                 │
│   │         │   │         │   │         │                 │
│   │   ☀️    │   │   💧    │   │   🏠    │                 │
│   │  (sun)  │   │(puddle) │   │ (house) │                 │
│   │         │   │         │   │         │                 │
│   │   [A]   │   │   [B]   │   │   [C]   │                 │
│   └─────────┘   └─────────┘   └─────────┘                 │
│                                                            │
└────────────────────────────────────────────────────────────┘

When correct:

┌────────────────────────────────────────────────────────────┐
│                                                            │
│              🎉  ¡Muy bien!  🎉                            │
│                   Hienoa!                                  │
│                                                            │
│                 💧 = lätäkkö                               │
│                                                            │
│               [🐷 Seuraava! →]                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Key Design Principles for Kids:**

```
┌───────────────────────────────────────────────────────────┐
│  KIDS MODE REQUIREMENTS                                   │
│                                                           │
│  ✓ NO READING REQUIRED                                   │
│    • Answers are pictures/icons, not text                │
│    • Audio plays the Spanish word                        │
│    • Big colorful buttons                                │
│                                                           │
│  ✓ ALWAYS POSITIVE                                       │
│    • No "wrong" feeling - just try again!               │
│    • Celebration sounds and animations                   │
│    • Spanish + Finnish praise words                      │
│                                                           │
│  ✓ FAMILIAR CONTENT                                      │
│    • Characters they know from the show                  │
│    • Activities from episodes (muddy puddles!)           │
│    • Simple everyday words                               │
│                                                           │
│  ✓ SIMPLE INTERACTION                                    │
│    • Tap the picture (A, B, or C)                       │
│    • Big touch targets for small fingers                 │
│    • Clear visual feedback                               │
└───────────────────────────────────────────────────────────┘
```

**Content from Peppa Pig (see `themes/peppa_pig_kids.json`):**

| Category | Examples |
|----------|----------|
| 🐷 Characters | Peppa, George, Papá Pig, Mamá Pig, Suzy Sheep |
| 💧 Famous phrases | "¡Me encanta saltar en los charcos de barro!" |
| 🏠 Places | casa, escuela, parque, jardín |
| 🎮 Activities | jugar, saltar, comer, dormir |
| 🦕 George's favorites | dinosaurio! |

**Positive Feedback (bilingual):**

```
Spanish               Finnish
─────────────────────────────────
¡Muy bien!       →   Hienoa!
¡Excelente!      →   Mahtavaa!
¡Fantástico!     →   Loistavaa!
¡Bravo!          →   Hyvin tehty!
¡Genial!         →   Upea!
```

---

### 5. Reading Lessons

```
┌────────────────────────────────────────────┐
│          READING LESSON FLOW               │
│                                            │
│   ┌────────────────────────────────────┐   │
│   │  María va al mercado. Ella compra  │   │
│   │  manzanas y naranjas. El vendedor  │   │
│   │  dice "¡Buenos días!"              │   │
│   └────────────────────────────────────┘   │
│                     │                      │
│                     ▼                      │
│   ┌────────────────────────────────────┐   │
│   │  Vocabulary Panel                  │   │
│   │  • mercado = tori                  │   │
│   │  • compra = ostaa                  │   │
│   │  • vendedor = myyjä                │   │
│   └────────────────────────────────────┘   │
│                     │                      │
│                     ▼                      │
│   ┌────────────────────────────────────┐   │
│   │  Comprehension Questions           │   │
│   │  "Minne María menee?"              │   │
│   └────────────────────────────────────┘   │
│                                            │
│   Dataset: Short stories + vocab lists     │
└────────────────────────────────────────────┘
```

---

## Navigation Concept

```
┌─────────────────────────────────────────────────────────┐
│  🇪🇸 Espanjapeli                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ 🇪🇸→🇫🇮 Sanat│ │ 🇫🇮→🇪🇸 Muisti│ │ 👂 Kuuntelu │       │
│  │  (current)  │ │  (recall)   │ │             │       │
│  │  + scoring  │ │  no score   │ │  + scoring  │       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
│                                                         │
│  ┌─────────────┐ ┌─────────────┐                        │
│  │ 🎤 Puhuminen│ │ 📖 Lukeminen│                        │
│  │  no score   │ │  no score   │                        │
│  └─────────────┘ └─────────────┘                        │
│                                                         │
│  ────────────────────────────────────────────────────── │
│                                                         │
│              [Selected Game Content Here]               │
│                                                         │
└─────────────────────────────────────────────────────────┘

Game Modes Summary:
─────────────────────────────────────────────────────────
1. 🇪🇸→🇫🇮 Sanat     Spanish word → type Finnish (SCORED)
2. 🇫🇮→🇪🇸 Muisti    Finnish → recall Spanish (flashcard)
3. 👂 Kuuntelu       Hear Spanish → pick meaning (SCORED)
4. 🎤 Puhuminen      See Spanish → speak → hear TTS
5. 🐷 Pipsa Possu    Kids mode - picture matching! (for children)
6. 📖 Lukeminen      Read stories + vocabulary
─────────────────────────────────────────────────────────
```

---

## Migration Steps (Svelte + TypeScript)

```
Phase 1: Setup
         Create SvelteKit project with TypeScript
         Add Tailwind CSS + DaisyUI
         Configure static adapter for GitHub Pages
         Set up GitHub Actions for automatic deployment

Phase 2: Shared Services
         Move TTS logic → src/lib/services/tts.ts
         Move storage logic → src/lib/stores/progress.ts
         Move theme JSON files → static/themes/

Phase 3: Word Game Migration
         Convert current game to Svelte component
         Keep same UI and behavior
         Verify LocalStorage compatibility

Phase 4: Navigation
         Add routing between game modes
         Create home page with game selection
         Style navigation for mobile

Phase 5: New Game Modes
         Add Peppa Pig kids mode
         Add practice modes
         Add music/nature themes

Phase 6: Cleanup
         Remove old vanilla JS files
         Update documentation
         Final testing on mobile
```

---

## Data Structure for New Games

**Current:**
```
words.js → { spanish, english, finnish }  // 400+ vocabulary words
```

**Themed content (all in `docs/themes/`):**

```
docs/themes/
├── basics_travel.json       ← 🌍 BASICS! (150+ phrases in 14 categories)
│                               Based on CEFR A1-A2, Babbel, Lingvist
│                               See recommendations.md for research
│
├── music_concerts.json      ← 🎻 Your hobby! (26 words + 15 phrases)
├── outdoor_nature.json      ← 🏕️ Your hobby! (30 words + 20 phrases)
├── peppa_pig_kids.json      ← 🐷 For children! (12 characters + 30 words)
└── (future additions...)
    ├── web_book_stories.json    ← Imported content
    └── custom_phrases.json      ← User-added
```

**basics_travel.json categories** (FRIENDLY, POSITIVE communication):
```
├── greetings_farewells    (15 phrases) - Daily essentials
├── polite_essentials      (10 phrases) - Please, thank you, sorry
├── positive_friendly      (15 phrases) - Happy expressions ✨
├── compliments            (10 phrases) - Kind words 💬
├── introductions          (8 phrases)  - Meeting people
├── asking_help            (10 phrases) - Getting assistance
├── directions             (10 phrases) - Finding your way
├── restaurant             (12 phrases) - Ordering food 🍽️
├── shopping               (10 phrases) - Buying things 🛒
├── hotel                  (8 phrases)  - Accommodation 🏨
├── transport              (9 phrases)  - Getting around 🚆
├── emergency              (8 phrases)  - Important safety 🆘
├── time_numbers           (10 phrases) - When and how much
└── social_phrases         (12 phrases) - Celebrations, fun 🎉
```

**Future: Story-based lessons**
```
stories.js → {
  title: "Ensimmäinen päivä",
  level: "A1",
  paragraphs: [...],
  vocabulary: [...],
  questions: [...]
}
```

---

## Themed Practice: Personal Interests

Practice modes are **for beginners** but should allow themed content
for personal relevance. Content can be added later from:
- Web books and learning materials
- Short stories on various topics
- Personal hobby vocabulary

### Example: Music & Concerts Theme 🎻🎶

```
┌─────────────────────────────────────────────────────────┐
│  🎵 Musiikki ja konsertit                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Basic vocabulary:                                      │
│  • el concierto = konsertti                            │
│  • el violín = viulu                                    │
│  • la música folclórica = kansanmusiikki               │
│  • el baile = tanssi                                    │
│  • el músico = muusikko                                 │
│  • la orquesta = orkesteri                              │
│  • el escenario = lava                                  │
│  • los aplausos = aplodit                               │
│                                                         │
│  Useful phrases:                                        │
│  • ¿Dónde hay conciertos esta noche?                   │
│    = Missä on konsertteja tänä iltana?                 │
│  • Me gusta la música folclórica                        │
│    = Pidän kansanmusiikista                            │
│  • ¿A qué hora empieza el concierto?                   │
│    = Mihin aikaan konsertti alkaa?                     │
│  • ¿Hay clases de baile?                               │
│    = Onko tanssitunteja?                               │
│  • ¡Qué música tan bonita!                             │
│    = Kuinka kaunista musiikkia!                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Example: Nature & Outdoors Theme 🏕️🌲

```
┌─────────────────────────────────────────────────────────┐
│  🌿 Luonto ja ulkoilu                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Basic vocabulary:                                      │
│  • el parque natural = luonnonpuisto                   │
│  • el camping = leirintäalue                           │
│  • la tienda de campaña = teltta                       │
│  • el sendero = polku                                   │
│  • la caminata = vaellus                               │
│  • el bosque = metsä                                    │
│  • la montaña = vuori                                   │
│  • el río = joki                                        │
│  • el lago = järvi                                      │
│  • la fauna = eläimistö                                │
│                                                         │
│  Useful phrases:                                        │
│  • ¿Dónde está el parque natural?                      │
│    = Missä luonnonpuisto sijaitsee?                    │
│  • ¿Se puede acampar aquí?                             │
│    = Voiko täällä leiriytyä?                           │
│  • ¿Cuánto dura la caminata?                           │
│    = Kuinka kauan vaellus kestää?                      │
│  • ¿Es difícil el sendero?                             │
│    = Onko polku vaikea?                                │
│  • ¡Qué paisaje tan hermoso!                           │
│    = Kuinka kaunis maisema!                            │
│  • ¿Hay animales salvajes?                             │
│    = Onko täällä villieläimiä?                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Content Extensibility Design

```
┌───────────────────────────────────────────────────────────┐
│  CONTENT SOURCES                                          │
│                                                           │
│  ┌─────────────────┐                                      │
│  │  Built-in       │  ← Ships with game                   │
│  │  • Basics       │     (themes/basics_travel.json)      │
│  │  • Travel       │     Based on CEFR A1-A2 research     │
│  │  • Polite       │     See recommendations.md           │
│  └────────┬────────┘                                      │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────┐                                      │
│  │  Themed Packs   │  ← Add later based on interests      │
│  │  • 🎻 Music     │     (downloadable JSON files)        │
│  │  • 🏕️ Nature    │                                      │
│  │  • 🍷 Food/Wine │                                      │
│  │  • ⚽ Sports    │                                      │
│  └────────┬────────┘                                      │
│           │                                               │
│           ▼                                               │
│  ┌─────────────────┐                                      │
│  │  Imported       │  ← From web books, courses           │
│  │  • Stories      │     (structured JSON)                │
│  │  • Textbooks    │                                      │
│  │  • Custom       │                                      │
│  └─────────────────┘                                      │
│                                                           │
└───────────────────────────────────────────────────────────┘

Themed pack JSON structure:
{
  "theme": "music_concerts",
  "name": "🎻 Musiikki ja konsertit",
  "level": "beginner",
  "vocabulary": [...],
  "phrases": [...],
  "dialogues": [...]   // Future: short conversations
}
```

### Beginner Focus

```
┌───────────────────────────────────────────────────────┐
│  PRACTICE MODES = BEGINNER FRIENDLY                   │
│                                                       │
│  ✓ No pressure (no scoring, no timer)                │
│  ✓ Self-paced (user controls everything)             │
│  ✓ Visual progress (motivating, not judging)         │
│  ✓ Audio support (hear correct pronunciation)        │
│  ✓ Themed content (personally relevant)              │
│                                                       │
│  Future growth:                                       │
│  • Add themed packs for hobbies/interests            │
│  • Import content from learning materials            │
│  • Short stories with vocabulary lists               │
│  • Dialogue practice for real situations             │
└───────────────────────────────────────────────────────┘
```

---

## Data Backup & Sharing Options

LocalStorage works well but is device-specific. Users may want to:
- Backup their progress
- Transfer to another device
- Share achievements with friends

### Options for Mobile Web Apps

**1. Web Share API (Modern Mobile)**
```
┌─────────────────────────────────────────────────────────┐
│  Best option for mobile! Native share dialog.          │
│                                                         │
│  User taps "Share Progress" button                      │
│           ↓                                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Share via...                                   │   │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │   │
│  │  │Email│ │Whats│ │Notes│ │Drive│ │More │      │   │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Works on: iOS Safari, Android Chrome                  │
│  Not on: Desktop browsers (fallback to download)       │
└─────────────────────────────────────────────────────────┘

Code:
  if (navigator.share) {
    navigator.share({
      title: 'Espanjapeli Progress',
      text: JSON.stringify(progressData),
      // or share as file on newer browsers
    });
  }
```

**2. Download/Upload JSON File**
```
┌─────────────────────────────────────────────────────────┐
│  Classic approach - works everywhere                    │
│                                                         │
│  Settings Screen:                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📊 Your Data                                   │   │
│  │                                                 │   │
│  │  [📥 Export Progress]  → Downloads .json file  │   │
│  │  [📤 Import Progress]  → Upload .json file     │   │
│  │                                                 │   │
│  │  ⚠️ Import will overwrite current progress     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Pros: Works on all browsers, reliable                 │
│  Cons: Manual file management, less intuitive          │
└─────────────────────────────────────────────────────────┘
```

**3. Copy to Clipboard (Simple)**
```
┌─────────────────────────────────────────────────────────┐
│  Simplest implementation                                │
│                                                         │
│  [📋 Copy Progress to Clipboard]                       │
│           ↓                                             │
│  "Copied! Paste into email or notes app"               │
│                                                         │
│  To restore: paste into text box and click Import      │
│                                                         │
│  Pros: Very simple, no file handling                   │
│  Cons: User must manually paste somewhere              │
└─────────────────────────────────────────────────────────┘
```

**4. QR Code (For Small Data)**
```
┌─────────────────────────────────────────────────────────┐
│  Cool for sharing between devices!                      │
│                                                         │
│  Phone A: [Generate QR]  →  ▓▓▓▓▓▓▓                    │
│                              ▓     ▓                    │
│                              ▓▓▓▓▓▓▓                    │
│                                                         │
│  Phone B: [Scan QR] → Progress imported!               │
│                                                         │
│  Limitation: QR can hold ~2KB max                      │
│  Good for: Category completion status                  │
│  Bad for: Full phrase-by-phrase history                │
└─────────────────────────────────────────────────────────┘
```

### Recommended Approach

```
┌───────────────────────────────────────────────────────┐
│  SETTINGS SCREEN                                      │
│                                                       │
│  📊 Oppimisen tiedot                                 │
│  ─────────────────────────────────────────────────── │
│                                                       │
│  Pelit pelattu: 42                                   │
│  Fraaseja opittu: 87/150                             │
│  Ensimmäinen peli: 2.1.2026                          │
│                                                       │
│  ─────────────────────────────────────────────────── │
│                                                       │
│  📤 Vie tiedot                                       │
│  ┌─────────────┐  ┌─────────────┐                   │
│  │ 📱 Jaa...   │  │ 💾 Lataa    │                   │
│  │ (mobile)    │  │ (tiedosto)  │                   │
│  └─────────────┘  └─────────────┘                   │
│                                                       │
│  📥 Tuo tiedot                                       │
│  ┌─────────────────────────────────────────────────┐│
│  │  Liitä tai valitse tiedosto...                  ││
│  └─────────────────────────────────────────────────┘│
│  [Tuo ja korvaa nykyiset tiedot]                    │
│                                                       │
│  ─────────────────────────────────────────────────── │
│                                                       │
│  🗑️ Nollaa kaikki tiedot                            │
│  (vaatii vahvistuksen)                               │
│                                                       │
└───────────────────────────────────────────────────────┘
```

### Data Format for Export

```javascript
// What gets exported
{
  "version": "1.0",
  "exportedAt": "2026-01-04T15:30:00Z",
  "device": "iPhone Safari",
  
  "gameHistory": [...],      // Last 20 games
  "practiceProgress": {...}, // Category mastery
  "preferences": {
    "autoSpeak": true,
    "compactMode": true,
    "gameLength": 21
  }
}
```

### Browser Support

```
Feature              Desktop    iOS Safari   Android Chrome
─────────────────────────────────────────────────────────────
LocalStorage         ✅         ✅           ✅
File Download        ✅         ✅           ✅
File Upload          ✅         ✅           ✅
Web Share API        ❌         ✅ (15+)     ✅ (Chrome 61+)
Clipboard API        ✅         ✅ (13.4+)   ✅
─────────────────────────────────────────────────────────────
```

### Implementation Priority

1. **First:** Export/Import via JSON file (works everywhere)
2. **Second:** Web Share API detection (better UX on mobile)
3. **Optional:** QR code for quick device-to-device transfer
4. **Future:** Cloud sync (requires backend, accounts, etc.)

---

## Verdict

Your current code is **good for one game**, but adding multiple game modes (especially the kid-friendly Peppa Pig mode) requires better structure. We'll migrate to **SvelteKit + TypeScript + Tailwind + DaisyUI** because it gives us components, routing, ready-made UI elements, and state management without building everything from scratch.

**Migration plan:**
1. Set up SvelteKit + GitHub Actions deployment
2. Move shared services (TTS, storage)
3. Convert word game to Svelte
4. Add new game modes as separate routes
5. Clean up old code

**Time estimate:** Migration takes 2-3 sessions. Each new game mode is then straightforward to add.

---

*Document generated: January 2026*

