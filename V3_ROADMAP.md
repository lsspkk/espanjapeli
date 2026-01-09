# Espanjapeli V3 Roadmap

Version 3 focuses on three main areas:
- Refactoring monolithic game components into reusable pieces
- Adding story-based reading comprehension games
- Extending knowledge tracking across all game modes with progress motivation


================================================================================
  PART 1: SVELTE REFACTORING BEST PRACTICES
================================================================================

Research Sources:

- Svelte Component Organization (Official Docs)
  https://svelte.dev/docs/introduction

- SvelteKit Project Structure
  https://kit.svelte.dev/docs/project-structure

- Component Composition Patterns
  https://learn.svelte.dev/tutorial/component-composition

- Svelte Society Patterns
  https://sveltesociety.dev/recipes


--------------------------------------------------------------------------------
  1.1 Current Problem: Monolithic Page Components
--------------------------------------------------------------------------------

Current game page sizes (lines of code):

```
  1575  yhdistasanat/+page.svelte    <- Largest monolith
  1412  sanapeli/+page.svelte
  1127  pipsan-ystavat/+page.svelte
  1020  kielten-oppiminen/+page.svelte
   800  pipsan-maailma/+page.svelte
   319  asetukset/+page.svelte
```

Each game page contains:
- Game state management (state machine)
- UI layout and styling
- Event handlers
- Answer validation logic
- Score tracking
- Feedback animations
- Settings modals
- Vocabulary display (sanakirja)

This creates several problems:
- Hard to test individual parts
- Duplicated code across games
- Hard to maintain consistency
- Difficult to add new features


--------------------------------------------------------------------------------
  1.2 Svelte Best Practices for Large Components
--------------------------------------------------------------------------------

PRINCIPLE 1: Single Responsibility Components

Break down by feature, not by technical layer.

Before:
```
routes/sanapeli/+page.svelte  (1400 lines - everything)
```

After:
```
routes/sanapeli/
  +page.svelte                 (100 lines - orchestration only)

lib/components/games/
  GameHeader.svelte            (progress bar, score, quit button)
  GameQuestion.svelte          (displays question, handles TTS)
  AnswerInput.svelte           (text input with validation)
  AnswerOptions.svelte         (multiple choice buttons)
  FeedbackOverlay.svelte       (correct/wrong animation)
  GameReport.svelte            (end-of-game summary)
  CategoryPicker.svelte        (modal for selecting category)
  Sanakirja.svelte             (vocabulary viewer modal)
```


PRINCIPLE 2: Composition over Configuration

Use slots and props to make components flexible.

Bad (too many props):
```svelte
<GameQuestion
  word={currentWord}
  showSpanish={true}
  showFinnish={false}
  showIcon={true}
  ttsLanguage="spanish"
  size="large"
  theme="primary"
/>
```

Good (composition with slots):
```svelte
<GameQuestion word={currentWord}>
  <svelte:fragment slot="display">
    <span class="text-2xl">{currentWord.spanish}</span>
  </svelte:fragment>
  <svelte:fragment slot="actions">
    <button on:click={speakWord}>🔊</button>
  </svelte:fragment>
</GameQuestion>
```


PRINCIPLE 3: Extract State into Stores

Move game state out of components into dedicated stores.

Create per-game-session stores:
```
lib/stores/
  gameSession.ts     <- Active game state (current question, score, etc)
  gameConfig.ts      <- Game settings (length, category, etc)
  wordKnowledge.ts   <- Already exists - long-term learning data
  progress.ts        <- Already exists - history and preferences
```

Store pattern:
```typescript
// lib/stores/gameSession.ts
import { writable, derived } from 'svelte/store';

interface GameSession {
  state: 'home' | 'playing' | 'feedback' | 'report';
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  questions: QuestionResult[];
}

function createGameSession() {
  const { subscribe, set, update } = writable<GameSession>(initialState);
  
  return {
    subscribe,
    start: (config) => { ... },
    answer: (result) => { ... },
    nextQuestion: () => { ... },
    end: () => { ... },
    reset: () => set(initialState)
  };
}

export const gameSession = createGameSession();
```


PRINCIPLE 4: Separate Logic from Presentation

Move complex logic into service files.

```
lib/services/
  wordSelection.ts    <- Already exists
  answerChecker.ts    <- Already exists
  tipService.ts       <- Already exists
  gameEngine.ts       <- NEW: shared game flow logic
  storyLoader.ts      <- NEW: story content management
```


PRINCIPLE 5: Use TypeScript Interfaces for Contracts

Define clear interfaces for component props.

```typescript
// lib/types/game.ts
export interface GameConfig {
  gameType: 'sanapeli' | 'yhdistasanat' | 'tarinat' | 'peppa';
  questionCount: number;
  category: string;
  direction: 'spanish_to_finnish' | 'finnish_to_spanish';
  timed: boolean;
}

export interface QuestionDisplay {
  id: string;
  displayText: string;
  audioText: string;
  audioLanguage: 'spanish' | 'finnish';
}

export interface AnswerResult {
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  pointsEarned: number;
  feedback: string;
}
```


--------------------------------------------------------------------------------
  1.3 Proposed Component Architecture
--------------------------------------------------------------------------------

IMPORTANT: Basic games and Kids games have SEPARATE component sets.

This allows:
- Different visual styles (kids: colorful, big buttons, emojis)
- Different animations (kids: more playful, celebratory)
- Different feedback (kids: always positive, no failure feeling)
- Independent evolution without breaking the other

```
svelte/src/lib/
  components/
  
    basic/                       <- BASIC GAME COMPONENTS
      core/
        GameShell.svelte         <- Layout wrapper for basic games
        GameHeader.svelte        <- Progress, score, quit
        GameFooter.svelte        <- Navigation hints
        QuestionCard.svelte      <- Word/phrase display
        TTSButton.svelte         <- Audio playback
        
      feedback/
        CorrectFeedback.svelte   <- Success animation
        WrongFeedback.svelte     <- Try again or reveal answer
        ScorePopup.svelte        <- Points earned animation
        
      input/
        TextInput.svelte         <- For sanapeli typing
        OptionButtons.svelte     <- For yhdistasanat choices
        
      modals/
        CategoryPicker.svelte    <- Category selection
        Sanakirja.svelte         <- Vocabulary viewer
        GameSettings.svelte      <- Per-game settings
        
      report/
        GameSummary.svelte       <- Score breakdown
        WrongAnswersList.svelte  <- Words to review
        ProgressChart.svelte     <- Visual progress
        
      home/
        GameCard.svelte          <- Game selection card
        ProgressCard.svelte      <- Progress with stats
        
    kids/                        <- KIDS GAME COMPONENTS (separate!)
      core/
        KidsGameShell.svelte     <- Colorful layout for kids
        KidsGameHeader.svelte    <- Simple progress (stars, not numbers)
        KidsQuestionCard.svelte  <- Large, friendly display
        KidsTTSButton.svelte     <- Big speaker emoji button
        
      feedback/
        KidsCelebration.svelte   <- Confetti, sounds, excitement
        KidsTryAgain.svelte      <- Gentle encouragement, no failure
        KidsStarEarned.svelte    <- Star collection animation
        
      input/
        KidsImageOptions.svelte  <- Big picture buttons
        KidsEmojiOptions.svelte  <- Emoji selection grid
        
      home/
        KidsGameCard.svelte      <- Fun, colorful game card
        KidsMainPage.svelte      <- Kids-only home screen (future)
        
    stories/
      StoryReader.svelte         <- Main story display
      StoryParagraph.svelte      <- Single paragraph with TTS
      VocabularyPanel.svelte     <- Word definitions sidebar
      ComprehensionQuiz.svelte   <- Questions after reading
      
    shared/                      <- Truly shared (both adult and kids)
      ProgressBar.svelte         <- Reusable progress indicator
      LoadingSpinner.svelte      <- Loading state
```


--------------------------------------------------------------------------------
  1.4 Settings Architecture
--------------------------------------------------------------------------------

Settings are stored per-audience (basic vs kids) because:
- Same device may be used by parent and child
- Kids need simpler, more forgiving settings
- Basic games want fine-tuned control

```typescript
// lib/stores/settings.ts

interface BasicSettings {
  // Display
  theme: string;              // DaisyUI theme (dark, light, etc)
  compactMode: boolean;       // Smaller UI elements
  
  // Audio
  autoSpeak: boolean;         // Auto-play TTS
  ttsSpeed: 'slow' | 'normal' | 'fast';
  
  // Gameplay
  feedbackDuration: number;   // How long to show correct answer (ms)
  defaultGameLength: number;  // 10, 21, or 42 questions
  defaultCategory: string;
  
  // Difficulty tuning
  knownWordWeight: number;    // 0-100, how often to include known words
  unknownWordWeight: number;  // 0-100, how often to prioritize weak words
  repeatFailedWords: boolean; // Re-ask failed words in same game
}

interface KidsSettings {
  // Display (kids get their own theme options)
  kidsTheme: string;          // cupcake, garden, etc
  
  // Audio
  autoSpeak: boolean;
  celebrationSounds: boolean; // Play sounds on correct answer
  
  // Gameplay (simpler options)
  questionCount: number;      // Fewer options: 5, 10, 15
  showHints: boolean;         // Always show helpful hints
  noFailMode: boolean;        // Never show "wrong", just encourage
}

// Stored separately in localStorage
const BASIC_SETTINGS_KEY = 'espanjapeli_basic_settings';
const KIDS_SETTINGS_KEY = 'espanjapeli_kids_settings';
```

Settings UI location:
- Basic settings: /asetukset (existing)
- Kids settings: accessible from kids game home (with parental gate)


--------------------------------------------------------------------------------
  1.4 Migration Strategy
--------------------------------------------------------------------------------

Phase 1: Extract Shared Components (No Breaking Changes)
- Create GameHeader, FeedbackOverlay, CategoryPicker
- Use them in new code first
- Gradually replace in existing games

Phase 2: Create GameShell Wrapper
- Common layout for all games
- Handles keyboard shortcuts
- Manages screen states (home/playing/report)

Phase 3: Extract State to Stores
- Move gameSession to store
- Connect existing components to store
- Reduce prop drilling

Phase 4: Refactor One Game at a Time
- Start with smallest (pipsan-maailma)
- Then yhdistasanat (most recent, cleanest)
- Finally sanapeli (largest, most complex)

Estimation: 4-6 coding sessions


================================================================================
  PART 2: STORY-BASED READING COMPREHENSION GAME
================================================================================

--------------------------------------------------------------------------------
  2.1 Concept Overview
--------------------------------------------------------------------------------

Inspired by classic language textbooks where each chapter has:
- A short story set in a real-life situation
- Vocabulary list with translations
- Comprehension questions

Target audience: Adults learning Spanish
Complements the word games with contextual reading practice


--------------------------------------------------------------------------------
  2.2 Story Topics (Prioritized)
--------------------------------------------------------------------------------

High Priority (Common Travel Situations):

1. En el cafe (At the cafe)
   - Ordering drinks and snacks
   - Asking for the bill
   - Small talk with waiter

2. En el mercado (At the market)
   - Buying fruits and vegetables
   - Asking prices
   - Counting and numbers

3. En la playa (At the beach)
   - Describing weather
   - Renting equipment
   - Beach activities

4. En el hotel (At the hotel)
   - Check-in conversation
   - Asking about amenities
   - Reporting problems

5. Pidiendo direcciones (Asking for directions)
   - Where is...?
   - Turn left/right
   - How far is it?


Medium Priority (Daily Life):

6. En el restaurante (At the restaurant)
   - Making reservations
   - Ordering food
   - Dietary restrictions

7. De compras (Shopping)
   - Clothing sizes
   - Colors and materials
   - Payment methods

8. En el transporte (Transportation)
   - Buying tickets
   - Asking schedules
   - Train/bus vocabulary

9. En el medico (At the doctor)
   - Describing symptoms
   - Body parts
   - Pharmacy vocabulary

10. Conociendo gente (Meeting people)
    - Introductions
    - Talking about yourself
    - Making plans


Future Topics:

- En el camping (Camping trip)
- En el concierto (At a concert)
- En el supermercado (At the supermarket)
- Alquilando un coche (Renting a car)
- En el banco (At the bank)


--------------------------------------------------------------------------------
  2.3 Story Data Structure
--------------------------------------------------------------------------------

```typescript
// lib/types/story.ts

interface Story {
  id: string;
  title: {
    spanish: string;
    finnish: string;
  };
  level: 'A1' | 'A2' | 'B1';
  topic: string;
  estimatedMinutes: number;
  
  // The story content
  paragraphs: StoryParagraph[];
  
  // Vocabulary extracted from story
  vocabulary: VocabularyItem[];
  
  // Comprehension questions
  questions: ComprehensionQuestion[];
  
  // Optional cultural notes
  culturalNotes?: string[];
}

interface StoryParagraph {
  spanish: string;
  finnish: string;
  audioFile?: string;  // Pre-recorded or use TTS
}

interface VocabularyItem {
  spanish: string;
  finnish: string;
  english?: string;
  partOfSpeech?: 'noun' | 'verb' | 'adjective' | 'phrase';
  example?: string;
}

interface ComprehensionQuestion {
  id: string;
  questionFinnish: string;      // Question in Finnish
  questionContext?: string;     // Optional Spanish context
  correctAnswer: string;        // Spanish answer
  wrongAnswers: string[];       // Distractors in Spanish
  explanation?: string;         // Why this is correct
}
```


--------------------------------------------------------------------------------
  2.4 Example Story: En el cafe
--------------------------------------------------------------------------------

```json
{
  "id": "cafe-01",
  "title": {
    "spanish": "Un cafe con leche, por favor",
    "finnish": "Maitorahvi, kiitos"
  },
  "level": "A1",
  "topic": "cafe",
  "estimatedMinutes": 5,
  
  "paragraphs": [
    {
      "spanish": "Maria entra en un cafe pequeno. Es por la manana y tiene sueno.",
      "finnish": "Maria astuu pieneen kahvilaan. On aamu ja hanta vasyyttaa."
    },
    {
      "spanish": "El camarero dice: Buenos dias, que desea?",
      "finnish": "Tarjoilija sanoo: Hyva huomenta, mita saisi olla?"
    },
    {
      "spanish": "Maria responde: Un cafe con leche y un croissant, por favor.",
      "finnish": "Maria vastaa: Maitorahvi ja croissant, kiitos."
    },
    {
      "spanish": "Cuanto cuesta? pregunta Maria.",
      "finnish": "Paljonko maksaa? Maria kysyy."
    },
    {
      "spanish": "Son cuatro euros cincuenta, dice el camarero.",
      "finnish": "Nelja euroa viisikymmentα senttiα, tarjoilija sanoo."
    },
    {
      "spanish": "Maria paga y busca una mesa cerca de la ventana.",
      "finnish": "Maria maksaa ja etsii poydan ikkunan vieresta."
    }
  ],
  
  "vocabulary": [
    { "spanish": "el cafe", "finnish": "kahvila / kahvi" },
    { "spanish": "el camarero", "finnish": "tarjoilija" },
    { "spanish": "buenos dias", "finnish": "hyva huomenta" },
    { "spanish": "que desea", "finnish": "mita saisi olla" },
    { "spanish": "un cafe con leche", "finnish": "maitorahvi" },
    { "spanish": "por favor", "finnish": "kiitos / ole hyva" },
    { "spanish": "cuanto cuesta", "finnish": "paljonko maksaa" },
    { "spanish": "la mesa", "finnish": "poyta" },
    { "spanish": "la ventana", "finnish": "ikkuna" },
    { "spanish": "pagar", "finnish": "maksaa" }
  ],
  
  "questions": [
    {
      "id": "q1",
      "questionFinnish": "Mita Maria tilaa?",
      "correctAnswer": "un cafe con leche y un croissant",
      "wrongAnswers": [
        "un te con limon",
        "una cerveza",
        "un zumo de naranja"
      ]
    },
    {
      "id": "q2",
      "questionFinnish": "Paljonko Marian tilaus maksaa?",
      "correctAnswer": "cuatro euros cincuenta",
      "wrongAnswers": [
        "tres euros",
        "cinco euros",
        "dos euros cincuenta"
      ]
    },
    {
      "id": "q3",
      "questionFinnish": "Minne Maria istuu?",
      "correctAnswer": "cerca de la ventana",
      "wrongAnswers": [
        "cerca de la puerta",
        "en la terraza",
        "en la barra"
      ]
    }
  ]
}
```


--------------------------------------------------------------------------------
  2.5 Game Flow
--------------------------------------------------------------------------------

```
┌─────────────────────────────────────────────────────────────────┐
│  STORY SELECTION SCREEN                                         │
│                                                                 │
│  Tarinat (Stories)                                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ A1  En el cafe                            5 min  [Aloita] │ │
│  │     ████████░░░░ 75% luettu                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ A1  En el mercado                         7 min  [Aloita] │ │
│  │     ░░░░░░░░░░░░ Ei aloitettu                             │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ A1  En la playa                           6 min  [Aloita] │ │
│  │     ████████████ Valmis!                                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                            |
                            v

┌─────────────────────────────────────────────────────────────────┐
│  READING PHASE                                                  │
│                                                                 │
│  En el cafe                                    1/6  [Sanasto]   │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  Maria entra en un cafe pequeno.                          │ │
│  │  Es por la manana y tiene sueno.                          │ │
│  │                                                           │ │
│  │                    [🔊]                                    │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Finnish translation (toggleable):                              │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Maria astuu pieneen kahvilaan.                           │ │
│  │  On aamu ja hanta vasyyttaa.                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│           [Edellinen]              [Seuraava]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                            |
                            v (after all paragraphs)

┌─────────────────────────────────────────────────────────────────┐
│  VOCABULARY REVIEW                                              │
│                                                                 │
│  Tarinan sanasto                                                │
│                                                                 │
│  ┌──────────────────────┬──────────────────────┬─────┐         │
│  │ el cafe              │ kahvila / kahvi      │ 🔊  │         │
│  ├──────────────────────┼──────────────────────┼─────┤         │
│  │ el camarero          │ tarjoilija           │ 🔊  │         │
│  ├──────────────────────┼──────────────────────┼─────┤         │
│  │ buenos dias          │ hyva huomenta        │ 🔊  │         │
│  ├──────────────────────┼──────────────────────┼─────┤         │
│  │ que desea            │ mita saisi olla      │ 🔊  │         │
│  └──────────────────────┴──────────────────────┴─────┘         │
│                                                                 │
│                     [Aloita kysymykset]                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                            |
                            v

┌─────────────────────────────────────────────────────────────────┐
│  COMPREHENSION QUESTIONS                                        │
│                                                                 │
│  Kysymys 1/3                                                    │
│                                                                 │
│  Mita Maria tilaa?                                              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  un cafe con leche y un croissant                         │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  un te con limon                                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  una cerveza                                              │ │
│  └───────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  un zumo de naranja                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

                            |
                            v

┌─────────────────────────────────────────────────────────────────┐
│  COMPLETION SCREEN                                              │
│                                                                 │
│  Tarina luettu!                                                 │
│                                                                 │
│  Oikein: 3/3                                                    │
│  Uusia sanoja: 10                                               │
│                                                                 │
│  [Lue uudelleen]    [Takaisin tarinoihin]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```


--------------------------------------------------------------------------------
  2.6 Story Game Components
--------------------------------------------------------------------------------

New components needed:

```
lib/components/stories/
  StoryList.svelte           <- List of available stories
  StoryCard.svelte           <- Single story preview
  StoryReader.svelte         <- Main reading interface
  ParagraphView.svelte       <- Spanish + Finnish paragraph
  VocabularyPanel.svelte     <- Sliding vocabulary sidebar
  VocabularyItem.svelte      <- Single word with TTS
  QuestionView.svelte        <- Multiple choice question
  StoryCompletion.svelte     <- End screen with stats
```


--------------------------------------------------------------------------------
  2.7 Story Content Files
--------------------------------------------------------------------------------

Location: svelte/static/stories/

```
stories/
  index.json                 <- List of all stories with metadata
  cafe-01.json               <- Individual story files
  mercado-01.json
  playa-01.json
  hotel-01.json
  direcciones-01.json
  ...
```


================================================================================
  PART 3: KNOWLEDGE TRACKING ACROSS ALL GAMES
================================================================================

--------------------------------------------------------------------------------
  3.1 Current State
--------------------------------------------------------------------------------

Knowledge tracking exists but is limited:
- wordKnowledge.ts tracks yhdistasanat results
- Each game has its own progress tracking
- Main screen shows basic stats only

Goal: Unified knowledge system that:
- Works across all game modes
- Shows motivation on main screen
- Prioritizes weak words in all games


--------------------------------------------------------------------------------
  3.2 Extended Knowledge Store
--------------------------------------------------------------------------------

```typescript
// lib/stores/wordKnowledge.ts (extended)

interface WordKnowledge {
  // Existing fields...
  score: number;
  practiceCount: number;
  
  // New: track by game type
  gameTypeStats: {
    sanapeli?: GameTypeStats;
    yhdistasanat?: GameTypeStats;
    tarinat?: GameTypeStats;
    peppa?: GameTypeStats;
  };
}

interface GameTypeStats {
  attempts: number;
  correct: number;
  lastPlayed: string;
  averageScore: number;
}

// New: category-level knowledge
interface CategoryKnowledge {
  categoryKey: string;
  wordsTotal: number;
  wordsPracticed: number;
  averageScore: number;
  
  // Game-specific progress
  sanapeliScore: number;
  yhdistasanatScore: number;
  tarinatCompleted: number;
  
  lastActivity: string;
  streak: number;  // Days in a row
}
```


--------------------------------------------------------------------------------
  3.3 Main Screen Progress Cards
--------------------------------------------------------------------------------

Each game card shows personalized motivation:

```
┌─────────────────────────────────────────────────────────────────┐
│  Espanjapeli                                                    │
│  Hauskaa ja tehokasta opiskelua                                 │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🇪🇸→🇫🇮  Sanapeli                                          │ │
│  │        Kirjoita espanjan sanan kaannos                    │ │
│  │                                                           │ │
│  │        ┌────────────────────────────────────────────────┐ │ │
│  │        │ ████████████████░░░░ 78%                       │ │ │
│  │        │ 156/200 sanaa opittu                           │ │ │
│  │        │ 12 sanaa tarvitsee kertausta                   │ │ │
│  │        └────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │        Viimeksi pelattu: tanaan                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🔗     Yhdista sanat                                      │ │
│  │        Valitse oikea kaannos                              │ │
│  │                                                           │ │
│  │        ┌────────────────────────────────────────────────┐ │ │
│  │        │ 5 pelin putki!                                 │ │ │
│  │        │ Keskiarvo: 87/100 pistetta                     │ │ │
│  │        │ 8 heikkoa sanaa tunnistettu                    │ │ │
│  │        └────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │        Viimeksi pelattu: eilen                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📖     Tarinat                                            │ │
│  │        Lue tarinoita ja vastaa kysymyksiin                │ │
│  │                                                           │ │
│  │        ┌────────────────────────────────────────────────┐ │ │
│  │        │ 3/10 tarinaa luettu                            │ │ │
│  │        │ Seuraava: En el mercado                        │ │ │
│  │        │ Arvioitu aika: 7 min                           │ │ │
│  │        └────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │        Uusi tarina saatavilla!                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  Lasten pelit                                                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 🐷     Pipsan maailma                                     │ │
│  │        Valitse oikea emoji                                │ │
│  │                                                           │ │
│  │        21 sanaa opittu                                    │ │
│  │        Viimeksi: 2 paivaa sitten                          │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 👫     Pipsan ystavat                                     │ │
│  │        Kuuntele ja valitse kuva                           │ │
│  │                                                           │ │
│  │        15 hahmoa tunnistettu                              │ │
│  │        Paras tulos: 10/10                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```


--------------------------------------------------------------------------------
  3.4 Progress Motivation Messages
--------------------------------------------------------------------------------

Dynamic messages based on user data:

For consistent players:
- "5 paivan putki! Jatka samaan malliin!"
- "Olet oppinut 15 uutta sanaa talla viikolla"
- "Heikot sanat vahenevat - hyva tyo!"

For returning players:
- "Tervetuloa takaisin! Viimeksi pelasit 3 paivaa sitten"
- "12 sanaa kaipaa kertausta"
- "Uusi tarina odottaa sinua"

For new players:
- "Aloita matkasi espanjan pariin!"
- "Kokeile ensin Yhdista sanat -pelia"

For completed categories:
- "Ravintola-kategoria hallinnassa!"
- "Kokeile seuraavaksi Matkustaminen"


--------------------------------------------------------------------------------
  3.5 Integration with Word Selection
--------------------------------------------------------------------------------

All games use the knowledge store for word selection:

```typescript
// lib/services/wordSelection.ts

export function selectGameWords(
  availableWords: Word[],
  questionsNeeded: number,
  category: string,
  direction: LanguageDirection,
  gameType: GameType  // NEW: game type context
): Word[] {
  
  // Existing selection logic...
  
  // Final layer: knowledge-based optimization
  return optimizeWordSelectionByKnowledge(
    selectedWords,
    availableWords,
    direction,
    gameType  // Pass game type for game-specific scoring
  );
}
```


================================================================================
  PART 4: IMPLEMENTATION
================================================================================

Implementation tasks have been extracted to V3_TODO.md for detailed tracking.

See V3_TODO.md for the complete checklist with granular tasks for:
- Phase 1: Component Extraction (Foundation)
- Phase 2: Story Game Foundation
- Phase 3: Knowledge System Expansion
- Phase 4: Full Game Refactoring
- Phase 5: Content Expansion


================================================================================
  PART 5: FILE STRUCTURE AFTER V3
================================================================================

```
svelte/src/
  lib/
    components/
    
      basic/                     <- BASIC GAME COMPONENTS
        core/
          GameShell.svelte
          GameHeader.svelte
          QuestionCard.svelte
          TTSButton.svelte
        feedback/
          CorrectFeedback.svelte
          WrongFeedback.svelte
          ScorePopup.svelte
        input/
          TextInput.svelte
          OptionButtons.svelte
        modals/
          CategoryPicker.svelte
          Sanakirja.svelte
          GameSettings.svelte
        report/
          GameSummary.svelte
          WrongAnswersList.svelte
          ProgressChart.svelte
        home/
          GameCard.svelte
          ProgressCard.svelte
          MotivationBanner.svelte
          
      kids/                      <- KIDS GAME COMPONENTS (separate!)
        core/
          KidsGameShell.svelte
          KidsGameHeader.svelte
          KidsQuestionCard.svelte
          KidsTTSButton.svelte
        feedback/
          KidsCelebration.svelte
          KidsTryAgain.svelte
          KidsStarEarned.svelte
        input/
          KidsImageOptions.svelte
          KidsEmojiOptions.svelte
        home:
          KidsGameCard.svelte
          KidsMainPage.svelte
          
      stories/
        StoryList.svelte
        StoryCard.svelte
        StoryReader.svelte
        ParagraphView.svelte
        VocabularyPanel.svelte
        QuestionView.svelte
        StoryCompletion.svelte
        
      shared/
        ProgressBar.svelte
        LoadingSpinner.svelte
        
    services/
      answerChecker.ts
      gameEngine.ts          <- NEW
      storyLoader.ts         <- NEW
      tipService.ts
      tts.ts
      wordSelection.ts
      
    stores/
      gameSession.ts         <- NEW
      progress.ts
      settings.ts            <- NEW (basic + kids settings)
      theme.ts
      wordKnowledge.ts       (extended)
      
    types/
      game.ts                <- NEW
      story.ts               <- NEW
      
    data/
      categoryConfig.ts
      messages.ts
      words.ts
      
  routes/
    +page.svelte             (updated with progress cards)
    sanapeli/
      +page.svelte           (refactored, uses basic/ components)
    yhdistasanat/
      +page.svelte           (refactored, uses basic/ components)
    tarinat/                 <- NEW
      +page.svelte
      [storyId]/
        +page.svelte
    pipsan-maailma/
      +page.svelte           (refactored, uses kids/ components)
    pipsan-ystavat/
      +page.svelte           (refactored, uses kids/ components)
    lapset/                  <- NEW: Kids home page (future)
      +page.svelte
    asetukset/
      +page.svelte
      
  static/
    stories/                 <- NEW
      index.json
      cafe-01.json
      mercado-01.json
      playa-01.json
      ...
    themes/
      (existing files)
```


================================================================================
  PART 6: FUTURE IDEAS (V4 AND BEYOND)
================================================================================

Ideas collected from language learning research and V2 roadmap.
These are not planned for V3 but worth considering later.


--------------------------------------------------------------------------------
  6.1 Gamification Features
--------------------------------------------------------------------------------

Daily Streaks:
- Track consecutive days of practice
- Show streak count on home screen
- Streak freeze for missed days (earned reward)
- Weekly and monthly streak milestones

Hearts / Lives System:
- Limited mistakes per session
- Hearts regenerate over time
- Encourages careful thinking
- Optional: can be disabled in settings

Experience Points (XP):
- Earn XP from all activities
- Daily XP goals
- Weekly leaderboard (personal best)
- Level progression with milestones

Achievements / Badges:
- First game completed
- 7-day streak
- 100 words learned
- Category mastered
- Speed achievements


--------------------------------------------------------------------------------
  6.2 Game Modes from V2 (Not Yet Built)
--------------------------------------------------------------------------------

Listening Comprehension:
- Hear Spanish phrase
- Select correct Finnish meaning
- No text shown initially
- Tests ear training

Speaking Practice:
- See Spanish word/phrase
- User speaks aloud (self-assessment)
- Press button to hear correct pronunciation
- No scoring, pure practice

Finnish to Spanish Recall:
- See Finnish word
- Think of Spanish translation
- Reveal answer to check
- Self-assessment buttons (knew it / almost / no idea)


--------------------------------------------------------------------------------
  6.3 Advanced Learning Features
--------------------------------------------------------------------------------

Spaced Repetition Integration:
- Track optimal review intervals per word
- Suggest daily review sessions
- Integrate with game word selection

Mistake Review Mode:
- Dedicated practice for failed words
- Show words that need attention
- Focused repetition until mastered

Timed Challenges:
- Race against clock
- Bonus points for speed
- Optional mode for advanced users

Difficulty Levels:
- Beginner: 3 answer options, hints available
- Normal: 4-6 options, standard play
- Hard: 8 options, time pressure, no hints


--------------------------------------------------------------------------------
  6.4 Content Features
--------------------------------------------------------------------------------

Audio Recordings:
- Pre-recorded native speaker audio
- Higher quality than TTS
- Especially for stories and dialogues

Dialogue Practice:
- Two-person conversations
- Role-play one side
- Practice real interactions

Grammar Explanations:
- Brief notes on verb forms
- Common patterns highlighted
- Links to full explanations

Cultural Notes:
- Regional variations
- Polite vs casual forms
- When to use different phrases


--------------------------------------------------------------------------------
  6.5 Kids Game Ideas
--------------------------------------------------------------------------------

Separate Kids Home Screen:
- Large colorful tiles
- No text required
- Character guides (Peppa, etc)

Memory Matching Game:
- Flip cards to find Spanish-Finnish pairs
- Familiar from classic memory games
- Works well for younger children

Coloring Activities:
- Color pictures of vocabulary items
- Learn while playing
- Low pressure activity

Sing-Along Songs:
- Simple Spanish songs
- Lyrics with bouncing ball
- Music engages children


--------------------------------------------------------------------------------
  6.6 Social Features
--------------------------------------------------------------------------------

Progress Sharing:
- Share achievements to social media
- Export progress report as image
- Celebrate milestones

Family Accounts:
- Multiple profiles on one device
- Parent sees child progress
- Separate statistics

Classroom Mode:
- Teacher creates word lists
- Students join class
- Progress visible to teacher


--------------------------------------------------------------------------------
  6.7 Technical Improvements
--------------------------------------------------------------------------------

Offline Mode:
- Download content packs
- Play without internet
- Sync progress when online

PWA Improvements:
- Better install prompts
- Push notifications for streaks
- Background sync

Performance:
- Lazy load game components
- Preload next question
- Optimize for slow devices


================================================================================
  SUMMARY
================================================================================

V3 Goals:

1. REFACTORING
   - Break monolithic pages into reusable components
   - Separate component libraries for adults and kids
   - Follow Svelte composition patterns
   - Extract state into stores

2. SETTINGS ARCHITECTURE
   - Separate settings for basic games and kids games
   - Basic: theme, compact mode, difficulty tuning
   - Kids: celebration sounds, no-fail mode, simpler options
   - Same device can be used by parent and child

3. STORY GAME
   - Add story-based reading comprehension
   - Topics from real-life situations
   - Vocabulary + comprehension questions
   - 10 stories for launch

4. KNOWLEDGE TRACKING
   - Unified progress across all games
   - Motivational progress cards on home screen
   - Smart word selection in all games
   - Configurable known/unknown word weighting

5. USER EXPERIENCE
   - Basic games show detailed progress and stats
   - Kids section stays simple and fun
   - Personalized recommendations
   - Clear learning path


Timeline Estimate: 12-18 coding sessions over 2-3 months


================================================================================

Document created: January 2026
