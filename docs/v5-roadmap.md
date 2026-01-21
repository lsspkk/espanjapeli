# Espanjapeli V5 Roadmap

Version 5 focuses on three areas:
- Data model refactoring for polysemous words
- Stepwise reveal UX pattern across all quiz games
- Two new game modes using Tatoeba sentence corpus


================================================================================
  PART 1: DATA MODEL REFACTORING
================================================================================

--------------------------------------------------------------------------------
  1.1 The Polysemy Problem
--------------------------------------------------------------------------------

The current system assumes 1:1 word mappings. Real language has polysemy where
one surface form carries multiple distinct meanings.

Examples in Spanish:
- `tiempo` → `aika` (time) vs `sää` (weather)
- `banco` → `pankki` (bank) vs `penkki` (bench)

Examples in Finnish (reverse direction):
- `aika` → `tiempo` (time) vs `bastante` (quite)
- `kieli` → `lengua` (tongue) vs `idioma` (language)

When a user learns "tiempo = sää" in a weather story, that knowledge should not
count toward knowing "tiempo = aika" for time expressions. These are distinct
word-sense pairs requiring separate tracking.


--------------------------------------------------------------------------------
  1.2 Current Data Model
--------------------------------------------------------------------------------

Word interface in `words.ts`:

```typescript
export interface Word {
  spanish: string;
  english: string;
  finnish: string;
  learningTips?: string[];
  id?: string;           // Exists but unused
  frequency?: FrequencyData;
  linguistic?: LinguisticData;
}
```

Knowledge store in `wordKnowledge.ts`:

```typescript
export interface WordKnowledgeData {
  version: number;
  words: Record<string, WordKnowledgeBidirectional>;  // Keyed by Spanish word
  gameHistory: GameRecord[];
  meta: { ... };
}
```

Games record answers using Spanish string as key:

```typescript
wordKnowledge.recordAnswer(currentWord.spanish, ...);
```

Problem: Two Word entries with same `spanish` but different `finnish` meanings
share the same knowledge record.


--------------------------------------------------------------------------------
  1.3 Solution: Sense-Aware Word IDs
--------------------------------------------------------------------------------

Extend Word interface:

```typescript
export interface Word {
  spanish: string;
  english: string;
  finnish: string;

  id?: string;         // Required for polysemous words
  senseKey?: string;   // Human-readable disambiguator

  learningTips?: string[];
  frequency?: FrequencyData;
  linguistic?: LinguisticData;
}
```

ID format convention: `{spanish}#{sense}` for polysemous words.

Examples in words.ts:
```typescript
{ id: "tiempo#time", spanish: "tiempo", finnish: "aika", senseKey: "time" }
{ id: "tiempo#weather", spanish: "tiempo", finnish: "sää", senseKey: "weather" }
```

For non-polysemous words, ID defaults to Spanish value when not specified.


--------------------------------------------------------------------------------
  1.4 Knowledge Store Changes
--------------------------------------------------------------------------------

Key by word ID instead of Spanish string:

```typescript
words: Record<string, WordKnowledgeBidirectional>  // Now keyed by Word.id
```

Add helper function:

```typescript
function getWordId(word: Word): string {
  return word.id ?? word.spanish;
}
```

Update all game components:

```typescript
// Before
wordKnowledge.recordAnswer(currentWord.spanish, ...);

// After
wordKnowledge.recordAnswer(getWordId(currentWord), ...);
```

Affected files:
- `routes/yhdistasanat/+page.svelte`
- `routes/sanapeli/+page.svelte`
- `routes/pipsan-maailma/+page.svelte`
- `routes/pipsan-ystavat/+page.svelte`
- `routes/tarinat/[storyId]/+page.svelte`


--------------------------------------------------------------------------------
  1.5 Migration Strategy
--------------------------------------------------------------------------------

On load, detect old data and migrate:
1. For each old key (plain Spanish word), find matching Word entries
2. If single match: map to word's ID
3. If multiple matches (polysemous): assign to primary sense
4. If no match (word removed): preserve with old key

Bump data model version to trigger migration.


--------------------------------------------------------------------------------
  1.6 Known Polysemous Words
--------------------------------------------------------------------------------

| Spanish | Sense    | Finnish | Proposed ID      |
|---------|----------|---------|------------------|
| tiempo  | time     | aika    | tiempo#time      |
| tiempo  | weather  | sää     | tiempo#weather   |
| banco   | finance  | pankki  | banco#finance    |
| banco   | seating  | penkki  | banco#seating    |

To be expanded as more cases are identified during content review.


================================================================================
  PART 2: STEPWISE REVEAL UX PATTERN
================================================================================

--------------------------------------------------------------------------------
  2.1 The Pattern
--------------------------------------------------------------------------------

Stepwise multiple-choice improves vocabulary retention by forcing covert recall
before showing answer options. Research demonstrates this significantly improves
retention in both adults and children compared to standard multiple-choice.

Flow:
1. Show question prompt alone (word or sentence)
2. Use TTS to speak the word/sentence (optional, respects autoSpeak setting)
3. Pause for configurable delay (0-4 seconds)
4. Reveal multiple-choice answers

This pattern applies to all quiz-style games.

Why it works:
- Forces covert recall before seeing options
- User must attempt mental retrieval first
- Touch-friendly UX preserved
- Configurable to user preference


--------------------------------------------------------------------------------
  2.2 Basic Games Implementation
--------------------------------------------------------------------------------

Yhdistäsanat quiz phase:
- Show Spanish/Finnish word (question card area only)
- TTS speaks the word if autoSpeak enabled
- Pause with subtle waiting indicator
- Reveal answer buttons after delay

Settings:
- Delay configurable in game settings (0-4 seconds)
- Stored in localStorage per game mode
- Default: 3 seconds


--------------------------------------------------------------------------------
  2.3 Kids Games Implementation
--------------------------------------------------------------------------------

Pipsan maailma and Pipsan ystävät:
- Show question area (top part of game state)
- Display animated waiting indicator (kid-friendly)
- After delay, reveal image/emoji answer options

New component: TokenDelayAnimation (dual purpose)

As waiting animation:
- Mobile-first, horizontal or vertical layout
- Displays 1-3 discrete tokens appearing sequentially (one per second)
- After last token appears, wait ~200ms before revealing answers
- Tokens are themeable: dots, eggs, mud puddles, raindrops, suns
- Theme affects visuals only (SVG/CSS/micro-motion), not logic
- Game chooses theme randomly, avoids repeating same theme twice in a row

As delay selector UI on game home pages:
- Mobile-first, horizontal layout
- Each token represents one second of covert recall time
- Tap to toggle tokens (0-3 seconds)
- Delay value configured individually per game mode
- Saved to localStorage

Uses same visual themes as waiting animation for consistency.


--------------------------------------------------------------------------------
  2.4 Component Architecture
--------------------------------------------------------------------------------

New shared components:

```
lib/components/shared/
  StepwiseReveal.svelte      <- Handles delay and reveal logic
  
lib/components/kids/
  TokenDelayAnimation.svelte        <- Animated waiting indicator
  TokenDelaySelector.svelte  <- Delay configuration UI
```

TokenDelayAnimation props:
- `count: number` (1-3 tokens to display)
- `theme: string` (visual style)
- `onComplete: () => void` (callback when done)
- `layout: 'horizontal' | 'vertical'` (default: horizontal)

TokenDelaySelector props:
- `value: number` (current delay in seconds, 0-3)
- `onChange: (value: number) => void`
- `theme: string`

StepwiseReveal props:
- `delay: number` (seconds before reveal)
- `onReveal: () => void` (callback when answers should show)
- Slot for question content
- Slot for answer content (hidden until reveal)


================================================================================
  PART 3: NEW GAME MODE - "MITÄ SÄ SANOIT?"
================================================================================

Route: `/mita-sa-sanoit`

Finnish name uses casual register to sound approachable.
Spanish: "¿Qué dijiste?" / English: "What did you say?"

--------------------------------------------------------------------------------
  3.1 Concept
--------------------------------------------------------------------------------

Listening/reading comprehension game using Tatoeba sentence pairs.

Flow:
1. Play Spanish sentence audio (or show text in silent mode)
2. Apply stepwise reveal delay
3. Show Finnish translation options
4. User selects matching translation

Supports both audio and silent modes for different contexts.


--------------------------------------------------------------------------------
  3.2 Data Source
--------------------------------------------------------------------------------

Tatoeba trilingual corpus (CC-BY 2.0 FR):
- 8,238 unique Spanish-Finnish-English sentence triples
- Sentence length: 1-26 words, average 5.5 words
- Natural conversational phrases

Location:
- Raw data: `scripts/data_story_pipeline/data/tatoeba_spa_fin_eng.json`
- Pipeline: `scripts/data_story_pipeline/download_tatoeba.py`


--------------------------------------------------------------------------------
  3.3 Data Preparation
--------------------------------------------------------------------------------

Tasks:
- Filter sentences by estimated difficulty/CEFR level
- Group sentences by topic/theme
- Create dialogue sequences from related sentences
- Transform to game-ready format

Sentence grouping criteria:
- Shared vocabulary
- Thematic similarity
- Conversation flow potential

Difficulty estimation:
- Sentence word count (1-26 words, average 5.5)
- Vocabulary frequency ranking
- Grammar complexity indicators

Dialogue sequence creation:
- Group related sentences into conversation flows
- Fill gaps with generated connecting phrases if needed
- Since content is curated, some narrative "fluff" between sentences is acceptable
- Store dialogue metadata for statistics tracking

Handling similar sentences:
- Many Tatoeba sentences are close variations
- Consider option for user to include/exclude similar sentences per session
- Or handle automatically in selection algorithm

Output format (static JSON):

```typescript
interface SentenceGroup {
  id: string;
  theme: string;
  level: 'A1' | 'A2' | 'B1';
  sentences: Sentence[];
  wordCount: number;        // Average for difficulty display
}

interface Sentence {
  id: string;
  spanish: string;
  finnish: string;
  english: string;
  wordCount: number;
}
```


--------------------------------------------------------------------------------
  3.4 Game Variations
--------------------------------------------------------------------------------

1. Listen and translate (Spanish audio → Finnish text)
   - TTS plays Spanish sentence
   - User selects Finnish translation from options
   - Progressive difficulty based on sentence length

2. Read and match (Spanish text → Finnish translation)
   - Silent mode: Spanish text shown instead of audio
   - Same mechanics, different input modality

3. Thematic sessions (grouped by topic)
   - User selects theme (greetings, food, travel, etc.)
   - Sentences from that theme presented in sequence


================================================================================
  PART 4: NEW GAME MODE - "VALITUT SANAT"
================================================================================

Route: `/valitut-sanat`

Finnish name uses casual form of "selected words" (Palabras / Keywords).

--------------------------------------------------------------------------------
  4.1 Concept
--------------------------------------------------------------------------------

Structured vocabulary lessons combining teaching and testing phases.
Words ordered by frequency (usefulness in real language).

Lesson structure:
1. Vocabulary teaching: word list with translations
2. Vocabulary in context: example phrases from Tatoeba
3. Quiz phase: stepwise multiple-choice testing


--------------------------------------------------------------------------------
  4.2 Teaching Phase One: Word List
--------------------------------------------------------------------------------

Display category word list (pronouns, colors, verbs, etc.).
- Short lists preferred (fit in single lesson)
- Large categories split into frequency tiers
- First lesson: most common words
- Second lesson: less common words

Words ordered by frequency (usefulness in real language use).

UX optimized for vertically held mobile device:
- List-like layout, minimal extra UI elements
- Mostly text with occasional icons
- Progress bar and close button at top
- TTS button per word for pronunciation


--------------------------------------------------------------------------------
  4.3 Teaching Phase Two: Example Phrases
--------------------------------------------------------------------------------

Show example sentences for each word.
- Source: Tatoeba sentence corpus
- Spanish sentence with Finnish translation
- TTS available for Spanish

Phrases chosen based on:
- Contains target vocabulary word
- Appropriate difficulty level
- Natural conversational usage


--------------------------------------------------------------------------------
  4.4 Quiz Phase
--------------------------------------------------------------------------------

Uses stepwise reveal pattern:
- Show prompt word (e.g., "perro → ?")
- TTS speaks the word if autoSpeak enabled
- Pause for configurable delay (0-4 seconds)
- Reveal multiple-choice answer options

Knowledge recorded to shared wordKnowledge store.
Uses same knowledge tracking as other game modes for unified progress.


--------------------------------------------------------------------------------
  4.5 Spaced Repetition Integration
--------------------------------------------------------------------------------

Game home page suggests repeating recently learned categories according to
recommended repetition intervals from language learning science.

Reference: `svelte/src/routes/kielten-oppiminen/+page.svelte` describes
optimal review intervals, or at least the concept.

Home page recommendations based on:
- Time since last practice (optimal review intervals)
- Word knowledge scores from previous sessions (were words learned well?)
- Category completion status

Lesson data model:

```typescript
interface Lesson {
  id: string;
  category: string;
  tier: number;           // 1 = most common, 2 = less common
  words: string[];        // Word IDs
  phrases: string[];      // Sentence IDs from Tatoeba
}

interface LessonProgress {
  lessonId: string;
  completedAt: string;
  wordScores: Record<string, number>;  // Per-word scores from quiz
  nextReviewAt: string;                 // Calculated from interval algorithm
}
```

Knowledge tracking shared with other game modes - practicing words here
improves scores visible in Yhdistäsanat and other games.


--------------------------------------------------------------------------------
  4.6 Data Requirements
--------------------------------------------------------------------------------

New static data files:
- Lesson definitions (word groupings, phrase selections)
- Tatoeba sentences filtered and grouped

Lesson structure saved to localStorage for progress tracking.


================================================================================
  PART 5: VERSIONING AND MIGRATION
================================================================================

--------------------------------------------------------------------------------
  5.1 Data Model Version
--------------------------------------------------------------------------------

Current version in `lib/config/dataModelVersion.ts`:
- DATA_MODEL_VERSION: '4.0.0'
- DATA_MODEL_VERSION_NUMBER: 4

V5 update:
- DATA_MODEL_VERSION: '5.0.0'
- DATA_MODEL_VERSION_NUMBER: 5


--------------------------------------------------------------------------------
  5.2 localStorage Migration
--------------------------------------------------------------------------------

The wordKnowledge store already has migration infrastructure (V1→V2, V2→V3, etc.).

V5 migration adds:
- Migrate word keys from Spanish strings to word IDs
- Preserve all existing knowledge data
- Handle edge cases (polysemous words, removed words)

Migration function in `wordKnowledge.ts`:

```typescript
function migrateV4toV5(oldData: WordKnowledgeData): WordKnowledgeData {
  const newWords: Record<string, WordKnowledgeBidirectional> = {};
  
  for (const [oldKey, knowledge] of Object.entries(oldData.words)) {
    const matchingWords = getAllWords().filter(w => w.spanish === oldKey);
    
    if (matchingWords.length === 1) {
      const newKey = matchingWords[0].id ?? oldKey;
      newWords[newKey] = knowledge;
    } else if (matchingWords.length > 1) {
      // Polysemous: assign to primary sense
      const newKey = matchingWords[0].id ?? oldKey;
      newWords[newKey] = knowledge;
    } else {
      // Word removed from database: preserve with old key
      newWords[oldKey] = knowledge;
    }
  }
  
  return { ...oldData, words: newWords, version: 5 };
}
```


--------------------------------------------------------------------------------
  5.3 Migration Testing
--------------------------------------------------------------------------------

Create test file `wordKnowledge.migration.test.ts`:

Test cases:
- V4 data with simple words migrates correctly
- V4 data with polysemous words assigns to primary sense
- V4 data with removed words preserves old keys
- Empty V4 data migrates to valid V5 structure
- Existing V5 data is not re-migrated

Use fixture data representing realistic V4 localStorage contents.


--------------------------------------------------------------------------------
  5.4 Application Version
--------------------------------------------------------------------------------

Update version number displayed in UI:
- Settings page version display
- About/Tietoja page
- Any footer or version indicators

Location: typically in `package.json` or dedicated config file.


================================================================================
  PART 6: LICENSING AND DATA PIPELINE
================================================================================

--------------------------------------------------------------------------------
  6.1 Tatoeba License Attribution
--------------------------------------------------------------------------------

Tatoeba corpus requires attribution (CC-BY 2.0 FR).

Tasks:
- Add Tatoeba to licenses data in `lib/data/licenses.ts`
- Display attribution on `/tietoja` page
- Include license header in relevant source files
- Update repository LICENSE or NOTICES file


--------------------------------------------------------------------------------
  6.2 Tatoeba Data Pipeline Update
--------------------------------------------------------------------------------

Current pipeline: `scripts/data_story_pipeline/download_tatoeba.py`

Pipeline updates needed:
- Add filtering by estimated CEFR level
- Add grouping by theme/topic
- Output sentence groups as static JSON
- Generate lesson definition files

New output files in `svelte/static/`:
- `sentences/index.json` - manifest of all sentence groups
- `sentences/themes/*.json` - sentences grouped by theme
- `lessons/index.json` - manifest of all lessons
- `lessons/*.json` - individual lesson definitions

Pipeline should be idempotent and reproducible.


================================================================================
  PART 7: IMPLEMENTATION PHASES
================================================================================

--------------------------------------------------------------------------------
  7.1 Phase 1: Data Model Refactoring
--------------------------------------------------------------------------------

Tasks:
- Add `senseKey` to Word interface
- Add `getWordId()` helper function
- Update known polysemous words in words.ts
- Update all recordAnswer calls to use word ID
- Add V4→V5 migration function to wordKnowledge store
- Bump DATA_MODEL_VERSION to '5.0.0' and DATA_MODEL_VERSION_NUMBER to 5
- Create migration test file with fixture data
- Test migration with realistic V4 localStorage contents


--------------------------------------------------------------------------------
  7.2 Phase 2: Stepwise Reveal Components
--------------------------------------------------------------------------------

Tasks:
- Create StepwiseReveal shared component
- Create TokenDelayAnimation kids component
- Create TokenDelaySelector kids component
- Add delay settings to localStorage
- Test with existing quiz components


--------------------------------------------------------------------------------
  7.3 Phase 3: Integrate Stepwise Reveal
--------------------------------------------------------------------------------

Tasks:
- Refactor Yhdistäsanat quiz phase
- Refactor Pipsan maailma question display
- Refactor Pipsan ystävät question display
- Add delay selector to kids game home pages


--------------------------------------------------------------------------------
  7.4 Phase 4: Tatoeba Data Pipeline and Licensing
--------------------------------------------------------------------------------

Tasks:
- Update download_tatoeba.py with filtering and grouping
- Generate sentence group JSON files
- Generate lesson definition JSON files
- Add Tatoeba to licenses.ts
- Update /tietoja page with attribution
- Update repository LICENSE/NOTICES


--------------------------------------------------------------------------------
  7.5 Phase 5: Mitä sä sanoit Game
--------------------------------------------------------------------------------

Tasks:
- Create route and page structure
- Implement sentence selection logic
- Create game components (reuse where possible)
- Add audio/silent mode toggle
- Integrate with knowledge tracking


--------------------------------------------------------------------------------
  7.6 Phase 6: Valitut sanat Game
--------------------------------------------------------------------------------

Tasks:
- Create route and page structure
- Implement teaching phase components
- Implement quiz phase (uses stepwise reveal)
- Add spaced repetition recommendations
- Integrate with knowledge tracking


--------------------------------------------------------------------------------
  7.7 Phase 7: Version Update and Polish
--------------------------------------------------------------------------------

Tasks:
- Update application version in package.json
- Update version display in settings/about pages
- Final testing of all migration paths
- Update README if needed


================================================================================
  PART 8: FILE STRUCTURE AFTER V5
================================================================================

```
svelte/src/lib/
  components/
    shared/
      StepwiseReveal.svelte          <- NEW
      
    kids/
      TokenDelayAnimation.svelte            <- NEW
      TokenDelaySelector.svelte      <- NEW
      
  config/
    dataModelVersion.ts              <- UPDATED: bump to 5.0.0
      
  services/
    sentenceLoader.ts                <- NEW: Tatoeba sentence management
    lessonService.ts                 <- NEW: Lesson definitions and progress
    
  stores/
    wordKnowledge.ts                 <- UPDATED: word ID keying, V4→V5 migration
    wordKnowledge.migration.test.ts  <- NEW: migration tests with fixtures
    lessonProgress.ts                <- NEW: lesson completion tracking
    
  data/
    words.ts                         <- UPDATED: polysemous word entries
    licenses.ts                      <- UPDATED: Tatoeba attribution
    
  utils/
    wordId.ts                        <- NEW: getWordId helper

svelte/src/routes/
  mita-sa-sanoit/
    +page.svelte                     <- NEW
    +layout.ts                       <- NEW
    
  valitut-sanat/
    +page.svelte                     <- NEW
    +layout.ts                       <- NEW

svelte/static/
  sentences/                         <- NEW
    index.json                       <- Sentence group manifest
    themes/
      greetings.json
      food.json
      travel.json
      ...
      
  lessons/                           <- NEW
    index.json                       <- Lesson manifest
    pronouns-1.json
    colors-1.json
    verbs-1.json
    verbs-2.json
    ...

scripts/data_story_pipeline/
  download_tatoeba.py                <- UPDATED: add filtering and grouping
```


================================================================================
  SUMMARY
================================================================================

V5 Goals:

1. DATA MODEL REFACTORING
   - Sense-aware word IDs for polysemous words
   - Knowledge tracking by word-sense pairs
   - V4→V5 localStorage migration with tests
   - Bump DATA_MODEL_VERSION to 5.0.0
   - Estimated tasks: 6-8

2. STEPWISE REVEAL COMPONENTS
   - Create StepwiseReveal, TokenDelayAnimation, TokenDelaySelector components
   - Delay settings infrastructure
   - Estimated tasks: 3-4

3. EXISTING GAME REFACTORING
   - Integrate stepwise reveal into Yhdistäsanat
   - Integrate stepwise reveal into Pipsan maailma
   - Integrate stepwise reveal into Pipsan ystävät
   - Add delay selectors to kids game home pages
   - Estimated tasks: 4-6

4. TATOEBA DATA PIPELINE AND LICENSING
   - Update download_tatoeba.py with filtering and grouping
   - Generate static JSON files for sentences and lessons
   - Add Tatoeba license attribution (CC-BY 2.0 FR)
   - Estimated tasks: 5-6

5. NEW GAME: MITÄ SÄ SANOIT
   - Listening/reading comprehension game
   - Sentence-level translation matching
   - Audio and silent modes
   - Progressive difficulty by sentence length
   - Estimated tasks: 5-7

6. NEW GAME: VALITUT SANAT
   - Structured vocabulary lessons
   - Teaching phases (word list + example phrases)
   - Quiz phase with stepwise reveal
   - Spaced repetition recommendations on home page
   - Estimated tasks: 6-8

7. VERSION UPDATE AND POLISH
   - Update application version in package.json
   - Update version display in UI
   - Final migration testing
   - Estimated tasks: 2-3

Total estimated tasks: 31-42


================================================================================

Document created: January 2026
Based on v5-draft-roadmap.md and language learning research
References: PRINCIPLES.md, v4-roadmap.md, kielten-oppiminen page
