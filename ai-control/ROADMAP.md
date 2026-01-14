# Espanjapeli V4 Roadmap

First prompt for Claude Sonnet:

     i want you to do web searches for new open source material, a lot more stories to the tarinat game mode, there should really │
 │   be absolute beginner and beginner and intermediate discussions and vocabulary according to the                              │
 │   @svelte/src/routes/kielten-oppiminen/+page.svelte and i want you to write V4_material.txt about your findings, and then i    │
 │   want you to do a very long analyze of how you would improve the stories gamemode, and this should be focus in V4_ROADMAP.md  │
 │   that you will also create. You can check @V3_ROADMAP.md to see the format that new roadmap could have. not much pseudocode,  │
 │   but lot of top level planning for improvements of this gamemode and keeping usability nice for mobile phones, also somewhat  │
 │   ok for desktop, you can also write about new common components, or improvements about database system, because you have this │
 │    role @PRINCIPLES.md file mentions. Dont worry about doing long think and many web searches, do the best work you can for    │
 │   the next version of this game. Get lots of material, too much even, like 20-50 stories, if you find nice sources. It can be  │
 │   in spanish or in english or both, Dont worry about Finnish language.   

Then Sonnet created todo list, then I asked it to consider datamodel and write V4_DATAMODEL_IDEAS.md. 
Then I was not happy with that so I asked Opus to improve it and write V4_DATAMODEL_IDEAS_improved.md.
Then I realized that V4_ROADMAP.md must be rewritten, so I asked Opus to do that:

Prompt for Claude Opus:

     You are right, this file that you created is the key. You must use the new knowledge from @V4_DATAMODEL_IDEAS_improved.md    │
 │   and rewrite V4_TODO.txt so that the first tasks will be about downloading datasets and creating the new datamodel. And the   │
 │   later tasks must be reviewed and updated so that datamodel can be used. Also because there is so much data available and we  │
 │   just do svelte with online json you need to make it so that all this data is usable in mobile browser, so that the static    │
 │   files are reasonably constructed, you mentioned manifests etc. I think we should use some intermediate solutions there,      │
 │   perhaps even the most simple but still reasonable solutions, because this project is for one developer only and should in    │
 │   the end be quite simple to have this software maintainded for many years wihtout too much hours put into version upgrades    │
 │   etc. Lets say that there will be many game modes, and the learning level, and vocabulary knowledge measurement and word      │
 │   importance, occurrance are things that we want to know and save the user progress to localstorage. Also we will want to      │
 │   produce reports perhaps with email or whatsapp message that let user boast about their learning of language. Also we need    │
 │   some kind of licences database, and a svelte page for showing that data, and all other licence related data bout this game,  │
 │   that is one task, it needs to be in the new navbar and menu that will be implemented in version 4. So... with these          │
 │   thoughts, and remembering the @PRINCIPLES.md, please rewrite the V4_TODO.txt   


**Focus: Story Mode Excellence**

Version 4 focuses on transforming the Tarinat (Stories) game mode into a comprehensive reading comprehension experience. This version prioritizes:
- Massive content expansion with 40+ new stories
- Enhanced reading experience with progressive difficulty
- Improved mobile-first UX
- Better integration with vocabulary learning
- Performance optimizations and database improvements


================================================================================
  PART 1: CURRENT STATE ANALYSIS
================================================================================

--------------------------------------------------------------------------------
  1.1 Existing Tarinat Implementation (V3)
--------------------------------------------------------------------------------

What we have:
- 8 stories covering travel, shopping, food, nature, and everyday situations
- Dialogue-based stories with Spanish text and Finnish translations
- Per-story vocabulary lists with TTS support
- Multiple choice comprehension questions (4-5 per story)
- Three difficulty levels: beginner, intermediate, advanced
- Category-based organization

Current file structure:
```
svelte/static/stories/
  stories.json              <- All stories in one file

svelte/src/routes/tarinat/
  +page.svelte              <- Story list with filters
  [storyId]/
    +page.svelte            <- Individual story view

svelte/src/lib/components/basic/stories/
  StoryCard.svelte          <- Story preview card
  StoryReader.svelte        <- Dialogue display with TTS
  StoryQuestion.svelte      <- Question interface
  StoryReport.svelte        <- Results summary

svelte/src/lib/types/
  story.ts                  <- Story interfaces

svelte/src/lib/services/
  storyLoader.ts            <- Story loading and caching
```


--------------------------------------------------------------------------------
  1.2 Identified Limitations and Improvement Areas
--------------------------------------------------------------------------------

CONTENT LIMITATIONS:

1. Limited Story Count
   - Only 8 stories across all levels
   - Users exhaust content quickly
   - No absolute beginner (A1) level stories
   
2. Inconsistent Difficulty Progression
   - Jump from beginner to intermediate is steep
   - No gradual vocabulary complexity increase
   - Missing CEFR alignment (A1, A2, B1)

3. No Story Interconnection
   - Stories are standalone
   - No recurring characters or themes
   - No narrative progression to keep users engaged

UX/UI LIMITATIONS:

1. Mobile Reading Experience
   - Side-by-side translation on mobile is cramped
   - Small text sizes on compact displays
   - Fixed bottom bar overlaps content on scroll
   - No reading progress indicator

2. Limited Interactivity
   - Passive reading with no inline interaction
   - Can't tap words to see definitions
   - No inline vocabulary highlighting
   - No audio for individual sentences while reading

3. Navigation Friction
   - Must finish story before questions
   - Can't skip to vocabulary review
   - No bookmark/resume functionality
   - No "continue where you left off"

LEARNING LIMITATIONS:

1. No Knowledge Integration
   - Story vocabulary not synced with word games
   - No spaced repetition for story words
   - Progress not reflected in main screen stats

2. Limited Question Types
   - Only multiple choice comprehension
   - No fill-in-the-blank
   - No vocabulary matching from story context
   - No listening comprehension questions

3. No Difficulty Customization
   - Users can't control translation visibility
   - No option to hide translations completely
   - No vocabulary pre-teaching before reading


================================================================================
  PART 2: V4 STORY CONTENT EXPANSION
================================================================================

--------------------------------------------------------------------------------
  2.1 New CEFR-Aligned Difficulty System
--------------------------------------------------------------------------------

Replace current difficulty levels with CEFR framework:

```
ABSOLUTE BEGINNER (A1):
├── Very short dialogues (6-8 lines)
├── Basic vocabulary (500-700 word range)
├── Present tense only
├── Simple sentence structures
├── Topics: Greetings, Colors, Numbers, Family, Food basics
└── 10 stories planned

BEGINNER (A2):
├── Medium dialogues (8-12 lines)
├── Expanded vocabulary (1000-1500 word range)
├── Past and future tense introduction
├── More complex sentences
├── Topics: Travel, Shopping, Health, Work, Hobbies
└── 10 stories planned

INTERMEDIATE (B1):
├── Longer dialogues (10-14 lines)
├── Rich vocabulary (2000-2500 word range)
├── All major tenses including subjunctive intro
├── Complex sentence structures
├── Topics: Culture, Environment, Technology, Current events
└── 10 stories planned
```

Migration from current levels:
- "beginner" → "A2" (mostly)
- "intermediate" → "B1"
- "advanced" → "B1+" (future B2 category)


--------------------------------------------------------------------------------
  2.2 Story Collection Themes
--------------------------------------------------------------------------------

ABSOLUTE BEGINNER (A1) - 10 Stories:

1. Meeting Someone New (Greetings)
2. What Time Is It? (Time, Numbers)
3. I'm Hungry (Food, Wants)
4. My Family (Family vocabulary)
5. Colors I See (Colors, Descriptions)
6. Days of the Week (Calendar)
7. How Are You? (Feelings, Wellbeing)
8. In the Classroom (School, Instructions)
9. At the Market (Shopping basics)
10. My Room (Home, Furniture)

BEGINNER (A2) - 10 Stories:

1. Weekend Plans (Future plans)
2. At the Doctor (Health, Body)
3. Looking for an Apartment (Housing)
4. Job Interview (Work vocabulary)
5. Ordering Food Delivery (Technology + Food)
6. At the Train Station (Travel)
7. At the Pharmacy (Health continued)
8. Birthday Party (Social, Celebrations)
9. Public Transport (City navigation)
10. Learning Spanish (Meta-learning)

INTERMEDIATE (B1) - 10 Stories:

1. Climate Change Discussion (Environment)
2. Work-Life Balance (Abstract concepts)
3. Technology in Daily Life (Generational)
4. Healthy Eating Habits (Health + Habits)
5. Cultural Differences (Spain vs Finland)
6. Online Shopping Experience (Consumer)
7. Environmental Volunteering (Community)
8. Discussing a Book (Literature, Opinions)
9. Planning a Trip (Complex travel)
10. Remote Work Discussion (Modern work)


--------------------------------------------------------------------------------
  2.3 Story Data Structure Updates
--------------------------------------------------------------------------------

Current Story interface:
```typescript
interface Story {
  id: string;
  title: string;
  titleSpanish: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  icon: string;
  dialogue: DialogueLine[];
  vocabulary: VocabularyWord[];
  questions: StoryQuestion[];
}
```

Proposed V4 Story interface:
```typescript
interface Story {
  // Existing fields
  id: string;
  title: string;
  titleSpanish: string;
  description: string;
  icon: string;
  dialogue: DialogueLine[];
  vocabulary: VocabularyWord[];
  questions: StoryQuestion[];

  // Updated difficulty with CEFR
  level: 'A1' | 'A2' | 'B1' | 'B2';
  
  // New fields for better organization
  category: StoryCategory;
  estimatedMinutes: number;
  wordCount: number;
  
  // New fields for learning progression
  prerequisiteStories?: string[];  // Story IDs that should be read first
  relatedStories?: string[];       // Similar difficulty/topic stories
  keyGrammar?: string[];           // Grammar concepts introduced
  
  // New fields for UX
  thumbnailEmoji?: string;         // Larger visual for cards
  culturalNotes?: CulturalNote[];  // Spain/LatAm context
  
  // Metadata
  version: number;                 // For content updates
  createdAt: string;
  updatedAt: string;
}

// Category with better typing
type StoryCategory = 
  | 'greetings' | 'food' | 'shopping' | 'travel' 
  | 'health' | 'work' | 'home' | 'social'
  | 'education' | 'nature' | 'culture' | 'technology'
  | 'environment' | 'entertainment';

// Cultural notes for context
interface CulturalNote {
  topic: string;
  note: string;
  region?: 'spain' | 'latin-america' | 'all';
}

// Enhanced vocabulary with grammar hints
interface VocabularyWord {
  spanish: string;
  finnish: string;
  english?: string;              // For international users
  example?: string;
  partOfSpeech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase';
  gender?: 'masculine' | 'feminine';
  verbForm?: string;             // e.g., "present tense, first person"
  relatedWords?: string[];       // Word family connections
}
```


--------------------------------------------------------------------------------
  2.4 Story File Organization (V4)
--------------------------------------------------------------------------------

Current: Single stories.json file with all stories

Proposed: Split by level for better maintenance and lazy loading:

```
svelte/static/stories/
  index.json                  <- Manifest with story metadata only
  
  a1/
    meeting-new-person.json
    what-time.json
    hungry.json
    my-family.json
    colors.json
    days-week.json
    how-are-you.json
    classroom.json
    market-fruits.json
    my-room.json
    
  a2/
    weekend-plans.json
    doctor-visit.json
    apartment-search.json
    job-interview.json
    food-delivery.json
    train-station.json
    pharmacy.json
    birthday-party.json
    public-transport.json
    learning-spanish.json
    
  b1/
    climate-change.json
    work-life-balance.json
    technology-life.json
    healthy-eating.json
    cultural-differences.json
    online-shopping.json
    environmental-volunteering.json
    discussing-book.json
    trip-planning.json
    remote-work.json
```

Benefits:
- Lazy load stories on demand (better performance)
- Easier to add new stories to specific levels
- Smaller initial payload
- Independent story versioning


--------------------------------------------------------------------------------
  2.5 Story Content Pipeline
--------------------------------------------------------------------------------

Process for adding new stories:

1. CONTENT CREATION
   - Write dialogue in Spanish with English translations
   - Use V4_material.txt as source (30 complete stories ready)
   - Keep dialogue natural and conversational

2. TRANSLATION
   - Run translation scripts for Finnish
   - Use Azure/OpenAI translation API
   - Manual review for quality

3. VOCABULARY EXTRACTION
   - Identify 8-15 key words per story
   - Include part of speech and examples
   - Link to existing words.ts entries where possible

4. QUESTION CREATION
   - Write 4-5 comprehension questions per story
   - Include explanation for each answer
   - Mix difficulty within question set

5. REVIEW & TESTING
   - Test on mobile devices
   - Verify TTS pronunciation
   - Check translation accuracy


================================================================================
  PART 3: ENHANCED STORY READER UX
================================================================================

--------------------------------------------------------------------------------
  3.1 Mobile-First Reading Experience
--------------------------------------------------------------------------------

CURRENT PROBLEMS:

1. Side-by-side translations cramped on mobile
2. Fixed bottom bar overlaps content
3. No visual reading progress
4. Small touch targets for TTS buttons

PROPOSED SOLUTIONS:

1. Stacked Layout for Mobile
   
   Current (side-by-side):
   ```
   ┌─────────────────────────────────────┐
   │ Spanish    │  Finnish              │
   └─────────────────────────────────────┘
   ```
   
   Proposed (stacked, expandable):
   ```
   ┌─────────────────────────────────────┐
   │  María: Buenos días, señora.       │
   │  ▼ Näytä käännös                   │
   └─────────────────────────────────────┘
   ```
   
   When expanded:
   ```
   ┌─────────────────────────────────────┐
   │  María: Buenos días, señora.       │
   │  ─────────────────────────────────  │
   │  María: Hyvää huomenta, rouva.     │
   │  ▲ Piilota käännös                 │
   └─────────────────────────────────────┘
   ```

2. Floating Action Button for TTS
   
   Instead of inline buttons on every line:
   ```
   ┌─────────────────────────────────────┐
   │  [Story content scrollable area]   │
   │                                     │
   │                              ┌────┐ │
   │                              │ 🔊 │ │
   │                              └────┘ │
   └─────────────────────────────────────┘
   ```
   
   FAB options:
   - Single tap: Read current paragraph
   - Long press: Read entire story
   - Double tap: Open speed controls

3. Reading Progress Indicator
   
   Top bar shows progress through story:
   ```
   ┌─────────────────────────────────────┐
   │ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░  45%  [×]    │
   └─────────────────────────────────────┘
   ```

4. Improved Bottom Bar
   
   Current (always visible):
   ```
   ┌─────────────────────────────────────┐
   │ [Käännös] [Sanasto]    [Kysymyksiin]│
   └─────────────────────────────────────┘
   ```
   
   Proposed (hide on scroll, show on tap):
   - Auto-hide after 3 seconds of scrolling
   - Tap screen or scroll up to show
   - More room for story content


--------------------------------------------------------------------------------
  3.2 Interactive Word Features
--------------------------------------------------------------------------------

TAP-TO-DEFINE FUNCTIONALITY:

When user taps a word in the story:
```
┌─────────────────────────────────────────────────┐
│  María entra en el [supermercado].              │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  supermercado                            │    │
│  │  ruokakauppa / supermarket              │    │
│  │                                          │    │
│  │  🔊 Kuuntele  ⭐ Lisää sanastoon         │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

Implementation approach:
1. Parse story text and identify vocabulary words
2. Wrap vocabulary words in tappable spans
3. On tap, show tooltip/modal with definition
4. Option to add to personal word list

VOCABULARY HIGHLIGHTING:

Show known vs unknown words:
```
Known words:    normal text
Unknown words:  underlined text  
New words:      bold underlined text
```

Settings:
- Enable/disable vocabulary highlighting
- Choose highlight style (underline, color, bold)
- Show all words or only unknown


--------------------------------------------------------------------------------
  3.3 Enhanced Vocabulary Panel
--------------------------------------------------------------------------------

CURRENT:
- Simple list of Spanish-Finnish pairs
- TTS button per word
- Example sentence shown if available

PROPOSED ENHANCEMENTS:

1. Categorized Vocabulary
   ```
   ┌─────────────────────────────────────┐
   │ 📚 Sanasto                          │
   │                                      │
   │ ▼ Substantiivit (Nouns)             │
   │   el supermercado = ruokakauppa     │
   │   las frutas = hedelmät             │
   │                                      │
   │ ▼ Verbit (Verbs)                    │
   │   pagar = maksaa                    │
   │   buscar = etsiä                    │
   │                                      │
   │ ▼ Ilmaukset (Expressions)           │
   │   cuánto cuesta = paljonko maksaa   │
   └─────────────────────────────────────┘
   ```

2. Flash Card Mode
   - After reading vocabulary, quick flashcard review
   - Spanish shown, tap to reveal Finnish
   - Mark as "knew it" or "need practice"
   - Links to word knowledge system

3. Audio Playlist
   - "Play all words" button
   - Speaks each vocabulary word with pause
   - Good for passive review


--------------------------------------------------------------------------------
  3.4 Question Phase Improvements
--------------------------------------------------------------------------------

CURRENT QUESTION TYPES:
- Multiple choice comprehension only

PROPOSED NEW QUESTION TYPES:

1. Fill-in-the-Blank
   ```
   Complete the sentence from the story:
   
   María entra en el _________.
   
   [supermercado] [restaurante] [banco] [hotel]
   ```

2. Vocabulary in Context
   ```
   What does "las frutas" mean in this story?
   
   [hedelmät] [vihannekset] [maitotuotteet] [liha]
   ```

3. Listening Question
   ```
   🔊 [Play audio]
   
   What did the vendor say about the apples?
   
   [They arrived this morning]
   [They are expensive]
   [They are sold out]
   [They are imported]
   ```

4. True/False
   ```
   María asks about the price of oranges.
   
   [True] [False]
   ```

5. Order Events
   ```
   Put these events in order:
   
   [ ] María pays at the register
   [ ] María asks about apples
   [ ] María enters the supermarket
   [ ] The vendor gives directions
   ```


================================================================================
  PART 4: LEARNING INTEGRATION
================================================================================

--------------------------------------------------------------------------------
  4.1 Story-Word Knowledge Sync
--------------------------------------------------------------------------------

Connect story vocabulary to the main word knowledge system:

WHEN USER READS A STORY:
1. Mark story vocabulary as "encountered in context"
2. Boost familiarity score for story words
3. Track which stories contain which words

INTEGRATION WITH WORD GAMES:
```typescript
// When selecting words for games, prioritize story vocabulary
interface WordSource {
  word: Word;
  source: 'vocabulary' | 'story';
  storyId?: string;
  encounterCount: number;
}

// Word selection considers story exposure
function selectWordsForGame(
  availableWords: WordSource[],
  includeStoryWords: boolean = true
): Word[] {
  // Prioritize words user has seen in stories
  // They have context, making recall easier
}
```


--------------------------------------------------------------------------------
  4.2 Story Progress Tracking
--------------------------------------------------------------------------------

Track detailed progress per story:

```typescript
interface StoryProgress {
  storyId: string;
  
  // Reading progress
  readCount: number;
  lastReadAt: string;
  readCompletely: boolean;
  readingTimeSeconds: number;
  
  // Question performance
  questionAttempts: QuestionAttempt[];
  bestScore: number;
  averageScore: number;
  
  // Vocabulary mastery
  vocabularyEncountered: string[];
  vocabularyMastered: string[];
  
  // User preferences
  favorited: boolean;
  notes?: string;
}
```


--------------------------------------------------------------------------------
  4.3 Main Screen Story Integration
--------------------------------------------------------------------------------

Show story progress on home page:

```
┌─────────────────────────────────────────────────┐
│  📖 Tarinat                                      │
│  Lue tarinoita ja opiskele sanastoa             │
│                                                  │
│  ┌─────────────────────────────────────────────┐│
│  │ ████████░░░░  30/40 tarinaa luettu           ││
│  │                                              ││
│  │ Seuraava suositus:                           ││
│  │ 🛒 En el supermercado (A2)                   ││
│  │ Sopii sanastoosi perustuen                   ││
│  │                                              ││
│  │ Viimeksi luettu:                             ││
│  │ ☕ En la cafetería - 2 päivää sitten         ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```


--------------------------------------------------------------------------------
  4.4 Story Recommendations
--------------------------------------------------------------------------------

Smart story suggestions based on user data:

RECOMMENDATION FACTORS:
1. Vocabulary overlap with known words (70-80% ideal)
2. CEFR level appropriate for user progress
3. Topics user has shown interest in
4. Stories not yet completed
5. Time since last read of similar topic

RECOMMENDATION DISPLAY:
```
┌─────────────────────────────────────────────────┐
│  Suositellut tarinat                             │
│                                                  │
│  🎯 "En el supermercado" - A2                    │
│     Tunnet 78% sanoista                          │
│     Aihe: Ruokaostokset                          │
│                                                  │
│  📈 "En el médico" - A2                          │
│     Uusi aihe: Terveys                           │
│     Laajenna sanastoasi                          │
│                                                  │
│  ⭐ "En el hotel" - A2                           │
│     Suosittu: 95% käyttäjistä pitää              │
└─────────────────────────────────────────────────┘
```


================================================================================
  PART 5: COMPONENT REFACTORING
================================================================================

--------------------------------------------------------------------------------
  5.1 Current Component Structure
--------------------------------------------------------------------------------

```
lib/components/basic/stories/
  StoryCard.svelte          <- 70 lines
  StoryReader.svelte        <- 158 lines
  StoryQuestion.svelte      <- ~100 lines
  StoryReport.svelte        <- ~80 lines
```

Issues:
- StoryReader handles too many concerns
- No shared dialogue line component
- Question feedback embedded in question component
- Limited reusability


--------------------------------------------------------------------------------
  5.2 Proposed V4 Component Structure
--------------------------------------------------------------------------------

```
lib/components/stories/
  
  # Cards and Lists
  StoryCard.svelte              <- Story preview card
  StoryGrid.svelte              <- Grid layout for story cards
  StoryFilters.svelte           <- Difficulty/category filters
  
  # Reading Experience
  StoryReader.svelte            <- Main container (orchestration)
  DialogueLine.svelte           <- Single dialogue line
  DialogueView.svelte           <- Scrollable dialogue list
  TranslationToggle.svelte      <- Translation visibility control
  ReadingProgress.svelte        <- Progress indicator
  
  # Vocabulary
  VocabularyPanel.svelte        <- Vocabulary sidebar/modal
  VocabularyItem.svelte         <- Single vocabulary entry
  VocabularyFlashcard.svelte    <- Flashcard review mode
  TapToDefine.svelte            <- Inline word definition popup
  
  # Questions
  QuestionContainer.svelte      <- Question phase wrapper
  MultipleChoice.svelte         <- MC question type
  FillBlank.svelte              <- Fill in blank question type
  TrueFalse.svelte              <- True/false question type
  QuestionFeedback.svelte       <- Answer feedback overlay
  
  # Results
  StoryReport.svelte            <- Results summary
  StoryProgress.svelte          <- Progress visualization
  
  # Audio
  StorySpeaker.svelte           <- Story TTS controls
  LineSpeaker.svelte            <- Per-line TTS button
  VocabAudioPlayer.svelte       <- Vocabulary audio playlist
  
  # Navigation
  StoryNav.svelte               <- Header with back/close
  StoryBottomBar.svelte         <- Bottom action buttons
```


--------------------------------------------------------------------------------
  5.3 Shared Components for V4
--------------------------------------------------------------------------------

Create/enhance shared components used across stories:

```
lib/components/shared/
  
  # Already exists - enhance
  TTSPlayer.svelte              <- Audio controls
  ProgressBar.svelte            <- Progress indicator
  GameContainer.svelte          <- Layout wrapper
  
  # New for V4
  FloatingActionButton.svelte   <- FAB for mobile actions
  BottomSheet.svelte            <- Sliding panel for vocabulary
  WordPopup.svelte              <- Tap-to-define popup
  SwipeNavigation.svelte        <- Swipe between stories/questions
```


================================================================================
  PART 6: DATABASE & STORAGE IMPROVEMENTS
================================================================================

--------------------------------------------------------------------------------
  6.1 Current Storage Architecture
--------------------------------------------------------------------------------

Current approach:
- localStorage for user progress
- Static JSON files for content
- No server-side storage

Limitations:
- 5MB localStorage limit
- No cross-device sync
- Lost data on browser clear
- Large JSON files loaded entirely


--------------------------------------------------------------------------------
  6.2 Proposed V4 Storage Improvements
--------------------------------------------------------------------------------

PHASE 1: OPTIMIZED CLIENT-SIDE (V4.0)

1. Story Manifest + Lazy Loading
   ```typescript
   // Load only story metadata initially
   interface StoryManifest {
     stories: StoryMetadata[];
     lastUpdated: string;
     version: string;
   }
   
   interface StoryMetadata {
     id: string;
     title: string;
     titleSpanish: string;
     level: 'A1' | 'A2' | 'B1';
     category: string;
     icon: string;
     wordCount: number;
     estimatedMinutes: number;
   }
   
   // Load full story only when selected
   async function loadFullStory(id: string): Promise<Story> {
     const response = await fetch(`/stories/${level}/${id}.json`);
     return response.json();
   }
   ```

2. Story Caching with Service Worker
   ```typescript
   // Cache stories after first load
   // Update only when version changes
   const STORY_CACHE = 'espanjapeli-stories-v4';
   
   // In service worker
   self.addEventListener('fetch', (event) => {
     if (event.request.url.includes('/stories/')) {
       event.respondWith(
         caches.match(event.request).then((cached) => {
           return cached || fetch(event.request).then((response) => {
             caches.open(STORY_CACHE).then((cache) => {
               cache.put(event.request, response.clone());
             });
             return response;
           });
         })
       );
     }
   });
   ```

3. Compressed Progress Storage
   ```typescript
   // Instead of storing full progress objects
   // Use compact format for localStorage
   
   // Current (verbose):
   {
     "story-cafe-01": {
       "readCount": 3,
       "lastReadAt": "2024-01-15T10:30:00Z",
       "bestScore": 5,
       "questionsTotal": 5
     }
   }
   
   // Optimized (compact):
   {
     "s": {
       "cafe-01": [3, 1705315800, 5, 5]  // [reads, timestamp, best, total]
     }
   }
   ```


PHASE 2: OPTIONAL SERVER SYNC (V4.1+)

Future consideration for cross-device sync:
- Optional account creation
- Cloud backup of progress
- Sync between devices
- Still fully functional offline


--------------------------------------------------------------------------------
  6.3 Performance Optimizations
--------------------------------------------------------------------------------

1. INITIAL LOAD OPTIMIZATION
   
   Current: Load all stories upfront
   Target: Load manifest only, lazy load stories
   
   Expected improvement:
   - Initial bundle: 200KB → 50KB
   - Time to interactive: 40% faster

2. VOCABULARY INDEXING
   
   Create word index for fast lookup:
   ```typescript
   // Build index of all vocabulary across stories
   interface VocabularyIndex {
     [spanishWord: string]: {
       stories: string[];      // Story IDs containing this word
       definitions: string[];  // Finnish translations
       examples: string[];     // Usage examples
     };
   }
   
   // Pre-build during development
   // Load from static JSON file
   ```

3. STORY PRELOADING
   
   Predict next story and preload:
   ```typescript
   // When user reads a story, preload likely next stories
   function preloadNextStories(currentStoryId: string): void {
     const predictions = getNextStoryPredictions(currentStoryId);
     predictions.slice(0, 2).forEach((storyId) => {
       const link = document.createElement('link');
       link.rel = 'prefetch';
       link.href = `/stories/${getLevel(storyId)}/${storyId}.json`;
       document.head.appendChild(link);
     });
   }
   ```


================================================================================
  PART 7: MOBILE UX PATTERNS
================================================================================

--------------------------------------------------------------------------------
  7.1 Touch Gesture Support
--------------------------------------------------------------------------------

SWIPE NAVIGATION:
- Swipe right: Previous story/dialogue line
- Swipe left: Next story/dialogue line  
- Swipe down: Close story/return to list
- Swipe up: Open vocabulary panel

Implementation using existing Svelte patterns:
```svelte
<script>
  let touchStartX = 0;
  let touchStartY = 0;
  
  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
  
  function handleTouchEnd(e: TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) previousItem();
      else nextItem();
    }
  }
</script>
```


--------------------------------------------------------------------------------
  7.2 Mobile Reading Modes
--------------------------------------------------------------------------------

MODE 1: FOCUS MODE
- Full screen story content
- No chrome except progress bar
- Tap edges to navigate
- Tap center to show controls

MODE 2: STUDY MODE
- Split view available on tablets
- Story on left, vocabulary on right
- Side-by-side translations

MODE 3: LISTEN MODE
- Auto-play story TTS
- Follow-along highlighting
- Pause on tap
- Speed controls visible


--------------------------------------------------------------------------------
  7.3 Responsive Breakpoints
--------------------------------------------------------------------------------

Current breakpoints (already in use):
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

V4 story-specific adjustments:

MOBILE (< 640px):
- Stacked translation layout
- Floating TTS button
- Full-screen vocabulary panel
- Bottom sheet for actions
- Larger touch targets (44px minimum)

TABLET (640px - 1024px):
- Optional side-by-side translations
- Slide-out vocabulary panel
- Visible TTS controls
- Grid story selection

DESKTOP (> 1024px):
- Side-by-side layout preferred
- Persistent vocabulary sidebar
- Keyboard shortcuts (← → for navigation)
- Larger text options


--------------------------------------------------------------------------------
  7.4 Accessibility Improvements
--------------------------------------------------------------------------------

1. SCREEN READER SUPPORT
   - Proper ARIA labels for all controls
   - Reading progress announcements
   - Question feedback announcements
   - Vocabulary list navigation

2. KEYBOARD NAVIGATION
   - Tab through dialogue lines
   - Enter to play TTS
   - Arrow keys for questions
   - Escape to close modals

3. VISUAL ACCESSIBILITY
   - High contrast mode option
   - Adjustable text size
   - Dyslexia-friendly font option
   - Reduced motion settings


================================================================================
  PART 8: IMPLEMENTATION PHASES
================================================================================

--------------------------------------------------------------------------------
  8.1 Phase 1: Content Expansion (Weeks 1-2)
--------------------------------------------------------------------------------

GOAL: Add 30 new stories from V4_material.txt

TASKS:
□ Convert V4_material.txt stories to JSON format
□ Run Finnish translation scripts
□ Create story manifest structure
□ Split stories into level folders (a1/, a2/, b1/)
□ Update storyLoader.ts for new structure
□ Review and quality check all content

DELIVERABLES:
- 40 total stories (8 existing + 32 new)
- stories/index.json manifest
- Individual story JSON files per level

ESTIMATION: 4-5 coding sessions


--------------------------------------------------------------------------------
  8.2 Phase 2: Reader UX Overhaul (Weeks 3-4)
--------------------------------------------------------------------------------

GOAL: Mobile-optimized reading experience

TASKS:
□ Implement stacked translation layout for mobile
□ Add floating TTS action button
□ Create reading progress indicator
□ Implement tap-to-define for vocabulary
□ Add auto-hiding bottom bar
□ Create vocabulary bottom sheet

DELIVERABLES:
- Redesigned StoryReader.svelte
- New DialogueLine.svelte component
- New TapToDefine.svelte component
- New FloatingActionButton.svelte

ESTIMATION: 3-4 coding sessions


--------------------------------------------------------------------------------
  8.3 Phase 3: Question Expansion (Week 5)
--------------------------------------------------------------------------------

GOAL: New question types and better feedback

TASKS:
□ Create FillBlank question component
□ Create TrueFalse question component
□ Update question JSON structure
□ Add questions to new stories
□ Enhance feedback animations

DELIVERABLES:
- New question type components
- Updated StoryQuestion structure
- Enhanced QuestionFeedback component

ESTIMATION: 2-3 coding sessions


--------------------------------------------------------------------------------
  8.4 Phase 4: Learning Integration (Week 6)
--------------------------------------------------------------------------------

GOAL: Connect stories to word knowledge system

TASKS:
□ Add story vocabulary to word knowledge
□ Track story progress in localStorage
□ Create story recommendation logic
□ Add story progress to home screen
□ Sync story words with game selection

DELIVERABLES:
- Extended wordKnowledge.ts
- New storyProgress.ts store
- Updated home page with story stats

ESTIMATION: 2-3 coding sessions


--------------------------------------------------------------------------------
  8.5 Phase 5: Performance & Polish (Week 7)
--------------------------------------------------------------------------------

GOAL: Optimize and finalize

TASKS:
□ Implement lazy loading for stories
□ Add service worker story caching
□ Optimize manifest loading
□ Add gesture navigation
□ Test on various devices
□ Fix accessibility issues

DELIVERABLES:
- Optimized story loading
- PWA improvements
- Gesture support
- Accessibility compliance

ESTIMATION: 2-3 coding sessions


================================================================================
  PART 9: V4 FILE STRUCTURE
================================================================================

```
svelte/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── basic/
│   │   │   │   └── stories/          <- REFACTORED
│   │   │   │       ├── StoryCard.svelte
│   │   │   │       ├── StoryGrid.svelte
│   │   │   │       ├── StoryFilters.svelte
│   │   │   │       ├── StoryReader.svelte
│   │   │   │       ├── DialogueLine.svelte
│   │   │   │       ├── DialogueView.svelte
│   │   │   │       ├── TranslationToggle.svelte
│   │   │   │       ├── ReadingProgress.svelte
│   │   │   │       ├── VocabularyPanel.svelte
│   │   │   │       ├── VocabularyItem.svelte
│   │   │   │       ├── VocabularyFlashcard.svelte
│   │   │   │       ├── TapToDefine.svelte
│   │   │   │       ├── QuestionContainer.svelte
│   │   │   │       ├── MultipleChoice.svelte
│   │   │   │       ├── FillBlank.svelte
│   │   │   │       ├── TrueFalse.svelte
│   │   │   │       ├── QuestionFeedback.svelte
│   │   │   │       ├── StoryReport.svelte
│   │   │   │       ├── StoryProgress.svelte
│   │   │   │       ├── StorySpeaker.svelte
│   │   │   │       ├── LineSpeaker.svelte
│   │   │   │       ├── StoryNav.svelte
│   │   │   │       └── StoryBottomBar.svelte
│   │   │   │
│   │   │   └── shared/
│   │   │       ├── FloatingActionButton.svelte  <- NEW
│   │   │       ├── BottomSheet.svelte           <- NEW
│   │   │       ├── WordPopup.svelte             <- NEW
│   │   │       └── SwipeNavigation.svelte       <- NEW
│   │   │
│   │   ├── services/
│   │   │   ├── storyLoader.ts       <- UPDATED (lazy loading)
│   │   │   └── storyRecommender.ts  <- NEW (recommendations)
│   │   │
│   │   ├── stores/
│   │   │   ├── storyProgress.ts     <- NEW (progress tracking)
│   │   │   └── wordKnowledge.ts     <- UPDATED (story integration)
│   │   │
│   │   └── types/
│   │       └── story.ts             <- UPDATED (new interfaces)
│   │
│   └── routes/
│       └── tarinat/
│           ├── +page.svelte         <- UPDATED
│           └── [storyId]/
│               └── +page.svelte     <- UPDATED
│
└── static/
    └── stories/                     <- RESTRUCTURED
        ├── index.json               <- Story manifest
        ├── vocabulary-index.json    <- Word lookup index
        ├── a1/
        │   ├── meeting-new-person.json
        │   ├── what-time.json
        │   └── ... (10 stories)
        ├── a2/
        │   ├── weekend-plans.json
        │   ├── doctor-visit.json
        │   └── ... (10 stories)
        └── b1/
            ├── climate-change.json
            ├── work-life-balance.json
            └── ... (10 stories)
```


================================================================================
  PART 10: FUTURE IDEAS (V5 AND BEYOND)
================================================================================

Ideas collected during V4 planning but not scoped for this version:


--------------------------------------------------------------------------------
  10.1 Advanced Story Features
--------------------------------------------------------------------------------

INTERACTIVE STORIES:
- Branching narratives with user choices
- Different endings based on vocabulary knowledge
- Gamified story progression

STORY SERIES:
- Multi-part stories with recurring characters
- Cliffhangers to encourage daily return
- Character development across stories

COMMUNITY STORIES:
- User-submitted story translations
- Upvoting/rating system
- Featured community content


--------------------------------------------------------------------------------
  10.2 Audio Enhancements
--------------------------------------------------------------------------------

NATIVE SPEAKER RECORDINGS:
- Pre-recorded audio for stories
- Different accents (Spain, Mexico, Argentina)
- Male and female voices

PRONUNCIATION PRACTICE:
- Record yourself reading
- Compare to native audio
- AI feedback on pronunciation

LISTENING COMPREHENSION MODE:
- Audio-only first pass
- No text visible initially
- Progressive text reveal


--------------------------------------------------------------------------------
  10.3 Social Features
--------------------------------------------------------------------------------

READING STREAKS:
- Daily story reading goals
- Streak visualization
- Streak protection mechanics

READING CLUBS:
- Share stories with friends
- Discuss comprehension questions
- Compete on vocabulary mastery

LEADERBOARDS:
- Stories read per week
- Question accuracy
- Vocabulary learned from stories


--------------------------------------------------------------------------------
  10.4 Content Expansion
--------------------------------------------------------------------------------

B2 LEVEL STORIES:
- Complex narratives
- Abstract topics
- Advanced grammar

SPECIALIZED TOPICS:
- Business Spanish stories
- Travel phrase stories
- Cultural deep-dives

REGIONAL VARIATIONS:
- Stories highlighting Spain vs Latin America
- Regional vocabulary differences
- Cultural context stories


================================================================================
  SUMMARY
================================================================================

V4 Goals:

1. CONTENT EXPANSION
   - Add 30+ new stories across A1, A2, B1 levels
   - CEFR-aligned difficulty progression
   - Diverse topics covering daily life and travel

2. ENHANCED READING UX
   - Mobile-optimized stacked layout
   - Tap-to-define vocabulary feature
   - Progressive disclosure of translations
   - Floating action buttons for TTS

3. NEW QUESTION TYPES
   - Fill-in-the-blank questions
   - True/false questions
   - Vocabulary in context questions

4. LEARNING INTEGRATION
   - Story vocabulary synced with word knowledge
   - Story progress on home screen
   - Smart story recommendations

5. PERFORMANCE IMPROVEMENTS
   - Lazy loading stories by level
   - Service worker caching
   - Optimized manifest system

6. MOBILE EXCELLENCE
   - Gesture navigation (swipe)
   - Auto-hiding chrome
   - Focus reading mode
   - Accessibility compliance


Timeline Estimate: 7 weeks (14-20 coding sessions)


================================================================================

Document created: January 2026
Based on V4_material.txt story collection
References: V3_ROADMAP.md, PRINCIPLES.md, current Tarinat implementation
