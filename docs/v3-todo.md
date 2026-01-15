# V3 TODO - Espanjapeli Refactoring & New Features

This is the implementation checklist extracted from v3-roadmap.md.
Check off items as they are completed.

Source Games:
- Basic Components: Extract from yhdistasanat/+page.svelte (1576 lines)
- Kids Components: Extract from pipsan-ystavat/+page.svelte (1127 lines)

================================================================================

PHASE 1: COMPONENT EXTRACTION (FOUNDATION)

The goal is to extract reusable components from existing monolithic pages 
without breaking functionality.

--------------------------------------------------------------------------------
1.1 Create Directory Structure
- [x] Create `lib/components/basic/` directory
- [x] Create `lib/components/basic/core/` subdirectory
- [x] Create `lib/components/basic/feedback/` subdirectory
- [x] Create `lib/components/basic/input/` subdirectory
- [x] Create `lib/components/basic/modals/` subdirectory
- [x] Create `lib/components/basic/report/` subdirectory
- [x] Create `lib/components/basic/home/` subdirectory
- [x] Create `lib/components/kids/` directory
- [x] Create `lib/components/kids/core/` subdirectory
- [x] Create `lib/components/kids/feedback/` subdirectory
- [x] Create `lib/components/kids/input/` subdirectory
- [x] Create `lib/components/kids/home/` subdirectory
- [x] Create `lib/components/shared/` directory
- [x] Create `lib/types/` directory

--------------------------------------------------------------------------------
1.2 Create Type Definitions
- [x] Create `lib/types/game.ts`
- [x] Add GameState type: `'home' | 'playing' | 'feedback' | 'report'`
- [x] Add GameConfig interface (gameType, questionCount, category, direction, timed)
- [x] Add QuestionDisplay interface (id, displayText, audioText, audioLanguage)
- [x] Add AnswerResult interface (correct, userAnswer, correctAnswer, pointsEarned, feedback)
- [x] Add GameType type: `'sanapeli' | 'yhdistasanat' | 'tarinat' | 'peppa'`

--------------------------------------------------------------------------------
1.3 Extract Shared Utilities
- [x] Create `lib/utils/array.ts`
- [x] Move `shuffleArray<T>()` function (duplicated in 4+ files)
- [x] Move `spreadOutDuplicates()` function (duplicated in 3+ files)
- [x] Add unit tests for utility functions

--------------------------------------------------------------------------------
1.4 Extract Shared Animation CSS
- [x] Create `lib/styles/animations.css` or add to `layout.css`
- [x] Extract keyframe animations from yhdistasanat:
  - [x] `popIn` / `popOut`
  - [x] `slideDown` / `slideUp` / `slideDownOut` / `slideUpOut`
  - [x] `fadeIn` / `fadeOut`
  - [x] `rotateIn` / `rotateOut`
  - [x] `drawLine` (for SVG line animation)
- [x] Extract animation classes (`animate-pop-in`, `animate-slide-down`, etc.)
- [x] Import in components that need animations

================================================================================

PHASE 1A: BASIC COMPONENTS (from yhdistasanat)

--------------------------------------------------------------------------------
1.5 Extract GameHeader Component
Source: yhdistasanat lines 1336-1359
- [x] Create `lib/components/basic/core/GameHeader.svelte`
- [x] Props:
  - `currentQuestion: number`
  - `totalQuestions: number`
  - `score: number`
  - `onQuit: () => void`
  - `triesRemaining?: number` (optional, for yhdistasanat)
  - `maxTries?: number` (default 3)
- [x] Display: "3/10 | 45 p"
- [x] Tries indicator: 3 colored dots (green=remaining, gray=used)
- [x] Quit button (✕) with confirmation optional

--------------------------------------------------------------------------------
1.6 Extract TriesIndicator Component
Source: yhdistasanat lines 1344-1352
- [x] Create `lib/components/basic/core/TriesIndicator.svelte`
- [x] Props: `remaining: number`, `max: number = 3`
- [x] Display colored dots (success when remaining, base-300 when used)
- [x] Smooth transition animations

--------------------------------------------------------------------------------
1.7 Extract QuestionCard Component
Source: yhdistasanat lines 1403-1419
- [x] Create `lib/components/basic/core/QuestionCard.svelte`
- [x] Props:
  - `text: string`
  - `onSpeak?: () => void`
  - `showSpeaker?: boolean`
- [x] Primary colored card with centered text
- [x] Speaker button (🔊) below card
- [x] Responsive text sizing

--------------------------------------------------------------------------------
1.8 Extract PossiblePoints Component
Source: yhdistasanat lines 1386-1400
- [x] Create `lib/components/basic/core/PossiblePoints.svelte`
- [x] Props: `points: number`, `triesRemaining: number`
- [x] Large "+10" / "+3" / "+1" / "0" display
- [x] Color coding: success/warning/error based on tries

--------------------------------------------------------------------------------
1.9 Extract OptionButtons Component
Source: yhdistasanat lines 1424-1438
- [x] Create `lib/components/basic/input/OptionButtons.svelte`
- [x] Props:
  - `options: Array<{ id: string; text: string }>`
  - `disabledIds: Set<string>`
  - `onSelect: (id: string, event: MouseEvent) => void`
  - `disabled: boolean`
- [x] Grid layout (1-col mobile, 2-col desktop)
- [x] Button states: outline, disabled+error, opacity

--------------------------------------------------------------------------------
1.9.1 Create Integration Test Setup for Yhdistäsanat
- [x] Create `tests/integration/` directory structure
- [x] Create `tests/integration/yhdistasanat.test.ts`
- [x] Set up test utilities for mocking user knowledge data
- [x] Create mock word data fixtures from actual game data
- [x] Configure test environment with proper Svelte testing library setup
- [x] Add helper functions for simulating user interactions

--------------------------------------------------------------------------------
1.9.2 Integration Test: Main Display (Home Screen)
- [x] Test that home screen data integration works correctly:
  - [x] Game configuration data (length options, directions)
  - [x] Language direction switch (ES→FI / FI→ES)
  - [x] Game length selector (10, 21, 42 questions)
  - [x] Category picker data structure
  - [x] Word selection and validation
  - [x] Sanakirja data preparation
- [x] Test category picker data:
  - [x] "All words" option support
  - [x] Tier-grouped categories with metadata
  - [x] Category ordering by learning priority
  - [x] Category-specific word selection
- [x] Test Sanakirja data preparation:
  - [x] Upcoming words section data
  - [x] Word pair integrity (spanish-finnish mapping)
  - [x] Multiple category support
- [x] Test state persistence (selected category, direction, length)

--------------------------------------------------------------------------------
1.9.3 Integration Test: Question Display (Playing State)
- [x] Test that question display renders all expected UX blocks:
  - [x] GameHeader with current question number, score, and tries
  - [x] TriesIndicator with colored dots
  - [x] PossiblePoints display (+10, +3, +1, or 0)
  - [x] QuestionCard with the question text
  - [x] TTS speaker button (if applicable)
  - [x] OptionButtons grid with all answer options
  - [x] Quit button functionality
- [x] Test interaction flow:
  - [x] Selecting correct answer shows success feedback
  - [x] Selecting wrong answer shows error feedback and LineAnimation
  - [x] Disabled options after wrong answers
  - [x] Tries decrement correctly
  - [x] Score updates based on tries remaining
- [x] Test FeedbackOverlay displays:
  - [x] Correct answer celebration with word pair
  - [x] Wrong answer feedback with continue button
  - [x] Proper animations (popIn, slideDown, etc.)
  - [x] Auto-close for correct answers
- [x] Test progression to next question after feedback

--------------------------------------------------------------------------------
1.9.4 Integration Test: Game Result Display (Report Screen)
- [x] Test that game report renders all expected UX blocks:
  - [x] Report title ("🎉 Peli päättyi!")
  - [x] Game time display
  - [x] 2x2 grid with try counts:
    - [x] First try count (green)
    - [x] Second try count (yellow)
    - [x] Third try count (orange)
    - [x] Failed count (red)
  - [x] Total score and max score with percentage
  - [x] WrongAnswersList component with all failed words
  - [x] "Takaisin alkuun" (Home) button
  - [x] "Pelaa uudelleen" (Play again) button (if applicable)
- [x] Test button functionality:
  - [x] Home button returns to main display
  - [x] Play again button starts new game with same settings
- [x] Test with different game outcomes:
  - [x] Perfect score (all first try)
  - [x] Mixed performance
  - [x] Poor performance with multiple wrong answers

1.10 Extract LineAnimation Component
Source: yhdistasanat lines 1363-1376
- [x] Create `lib/components/basic/feedback/LineAnimation.svelte`
- [x] Props:
  - `start: { x: number; y: number } | null`
  - `end: { x: number; y: number } | null`
  - `visible: boolean`
  - `color: 'success' | 'error'`
- [x] SVG overlay with animated line drawing
- [x] Include drawLine animation CSS

--------------------------------------------------------------------------------
1.11 Extract FeedbackOverlay Component
Source: yhdistasanat lines 1443-1497
- [x] Create `lib/components/basic/feedback/FeedbackOverlay.svelte`
- [x] Props:
  - `visible: boolean`
  - `isCorrect: boolean`
  - `exclamation: string` (e.g., "¡Muy bien!")
  - `primaryWord: string`
  - `secondaryWord: string`
  - `pointsEarned: number`
  - `animationIn: string`
  - `animationOut: string`
  - `closing: boolean`
  - `onContinue: () => void`
- [x] Dark backdrop (bg-black/60)
- [x] Animated card with word pair display
- [x] Continue button for wrong answers
- [x] Auto-close support for correct answers

--------------------------------------------------------------------------------
1.12 Extract CategoryPicker Component
Source: yhdistasanat lines 1195-1326
- [x] Create `lib/components/basic/modals/CategoryPicker.svelte`
- [x] Props:
  - `isOpen: boolean`
  - `selectedCategory: string`
  - `categories: Array<{ key, name, tier }>`
  - `onSelect: (key: string) => void`
  - `onClose: () => void`
- [x] Full-screen on mobile, centered modal on desktop
- [x] "All words" option at top
- [x] Tier grouping with colored left borders:
  - Tier 1: red (Perusta)
  - Tier 2: yellow (Perusasiat)
  - Tier 3: green (Arkiaiheet)
  - Tier 4: blue (Käytäntö)
  - Tier 5: purple (Erikois)
- [x] 2-column grid within each tier
- [x] Selected state highlighting

--------------------------------------------------------------------------------
1.13 Extract Sanakirja Component
Source: yhdistasanat lines 1114-1192
- [x] Create `lib/components/basic/modals/Sanakirja.svelte`
- [x] Props:
  - `isOpen: boolean`
  - `upcomingWords: Word[]`
  - `previousGames: Word[][]`
  - `onClose: () => void`
  - `onSpeak: (spanish: string, finnish: string) => void`
- [x] Header with title and close button
- [x] Sections:
  - "Seuraavan pelin sanat" with secondary highlight
  - Previous games with neutral styling
- [x] Word rows: Spanish | Finnish | 🔊 button
- [x] Scrollable content area
- [x] Fixed close button at bottom

--------------------------------------------------------------------------------
1.14 Extract LanguageDirectionSwitch Component
Source: yhdistasanat lines 963-990
- [x] Create `lib/components/basic/input/LanguageDirectionSwitch.svelte`
- [x] Props:
  - `direction: 'spanish' | 'finnish'`
  - `onChange: (direction) => void`
- [x] Two buttons with flags (🇪🇸, 🇫🇮)
- [x] Arrow divider between buttons
- [x] Helper text below explaining current mode

--------------------------------------------------------------------------------
1.15 Extract GameLengthSelector Component
Source: yhdistasanat lines 1009-1049
- [x] Create `lib/components/basic/input/GameLengthSelector.svelte`
- [x] Props:
  - `value: number`
  - `options: number[]` (default [10, 21, 42])
  - `onChange: (length: number) => void`
- [x] Radio button group
- [x] Horizontal layout with labels

--------------------------------------------------------------------------------
1.16 Extract GameReport Component
Source: yhdistasanat lines 1503-1575
- [x] Create `lib/components/basic/report/GameReport.svelte`
- [x] Props:
  - `title: string` (default "🎉 Peli päättyi!")
  - `gameTime: string`
  - `firstTryCount: number`
  - `secondTryCount: number`
  - `thirdTryCount: number`
  - `failedCount: number`
  - `totalScore: number`
  - `maxScore: number`
  - `wrongAnswers: QuestionResult[]`
  - `onHome: () => void`
  - `onPlayAgain?: () => void`
- [x] Time display
- [x] 2x2 grid with try counts (colored boxes)
- [x] Score summary with percentage
- [x] Wrong answers list
- [x] Action buttons

--------------------------------------------------------------------------------
1.17 Extract WrongAnswersList Component
Source: yhdistasanat lines 1549-1564
- [x] Create `lib/components/basic/report/WrongAnswersList.svelte`
- [x] Props: `answers: Array<{ spanish, finnish, userAnswer? }>`
- [x] Error-bordered cards
- [x] "Spanish = Finnish" format
- [x] Optional user answer display

--------------------------------------------------------------------------------
1.18 Extract TTSButton Component
Source: yhdistasanat lines 1412-1418, 1148-1154
- [x] Create `lib/components/shared/TTSButton.svelte`
- [x] Props:
  - `text: string`
  - `language: 'spanish' | 'finnish'`
  - `size: 'xs' | 'sm' | 'md' | 'lg'`
  - `variant: 'ghost' | 'circle' | 'plain'`
- [x] Uses tts service
- [x] Speaker emoji (🔊)

--------------------------------------------------------------------------------
1.19 Test & Integrate Basic Components
- [x] Create test file for GameHeader
- [x] Create test file for FeedbackOverlay
- [x] Create test file for CategoryPicker
- [x] Integrate components into yhdistasanat
- [x] Verify all functionality works
- [x] Check mobile responsiveness
- [x] Compare line count before/after

================================================================================

PHASE 1B: KIDS COMPONENTS (from pipsan-ystavat)

--------------------------------------------------------------------------------
1.20 Extract KidsGameHeader Component
Source: pipsan-ystavat lines 741-758
- [x] Create `lib/components/kids/core/KidsGameHeader.svelte`
- [x] Props:
  - `currentQuestion: number`
  - `totalQuestions: number`
  - `correctCount: number`
  - `onClose: () => void`
- [x] Simpler display: "Kysymys 3/10" + "✅ 2"
- [x] Progress bar (not dots)
- [x] Small close button (✕)

--------------------------------------------------------------------------------
1.21 Extract KidsAudioControl Component
Source: pipsan-ystavat lines 762-809
- [ ] Create `lib/components/kids/core/KidsAudioControl.svelte`
- [ ] Props:
  - `autoPlayAudio: boolean`
  - `displayMode: 'svg' | 'emoji'`
  - `togglesRemaining: number`
  - `onReplayAudio: () => void`
  - `onToggleDisplayMode: () => void`
  - `spanishText?: string` (shown when audio off)
- [ ] 2-column grid layout
- [ ] Audio replay button with pulse animation
- [ ] Display mode toggle (SVG/Emoji) with remaining count
- [ ] Yellow/orange gradient background

--------------------------------------------------------------------------------
1.22 Extract KidsImageOptions Component
Source: pipsan-ystavat lines 912-943
- [x] Create `lib/components/kids/input/KidsImageOptions.svelte`
- [x] Props:
  - `options: Array<{ id, file, emojiDisplay, isCorrect }>`
  - `selectedAnswer: string | null`
  - `displayMode: 'svg' | 'emoji'`
  - `onSelect: (id: string) => void`
- [x] 2x2 grid of large buttons
- [x] Aspect-square sizing
- [x] Selection states:
  - Correct: green border + ring + scale
  - Wrong: red border + ring + opacity
  - Reveal correct: green + animate-pulse
- [x] SVG image or emoji display based on mode

--------------------------------------------------------------------------------
1.23 Extract KidsCelebration Component
Source: pipsan-ystavat lines 876-906
- [x] Create `lib/components/kids/feedback/KidsCelebration.svelte`
- [x] Props:
  - `emoji: string` (celebration emoji)
  - `spanishPhrase: string`
  - `finnishPhrase: string`
  - `imageFile?: string`
  - `emojiDisplay?: string`
  - `displayMode: 'svg' | 'emoji'`
- [x] Large bouncing emoji (🎉, ⭐, 🌟, 🏆, 🎊)
- [x] "¡Muy bien!" text
- [x] Image or emoji of correct answer
- [x] Spanish = Finnish display

--------------------------------------------------------------------------------
1.24 Extract KidsWrongFeedback Component
Source: pipsan-ystavat lines 817-844
- [x] Create `lib/components/kids/feedback/KidsWrongFeedback.svelte`
- [x] Props:
  - `wrongImageId: string`
  - `wrongText: string`
  - `imageFile?: string`
  - `emojiDisplay: string`
  - `displayMode: 'svg' | 'emoji'`
- [x] Large ❌ emoji
- [x] Wrong answer image/emoji
- [x] Explanation text in Finnish
- [x] Gentle, non-discouraging styling

### 1.25 Extract KidsCorrectReveal Component
Source: pipsan-ystavat lines 845-874
- [x] Create `lib/components/kids/feedback/KidsCorrectReveal.svelte`
- [x] Props:
  - `spanishPhrase: string`
  - `finnishPhrase: string`
  - `imageFile: string`
  - `emojiDisplay: string`
  - `displayMode: 'svg' | 'emoji'`
- [x] Large ✅ emoji
- [x] Correct answer image with green border
- [x] Spanish = Finnish display
- [x] fade-in animation

### 1.26 Extract KidsToggleBonus Component
Source: pipsan-ystavat lines 949-957
- [ ] Create `lib/components/kids/feedback/KidsToggleBonus.svelte`
- [ ] Props:
  - `visible: boolean`
  - `amount: number`
- [ ] Fixed position overlay (top-center)
- [ ] Bouncing animation
- [ ] Gradient background (blue to purple)
- [ ] "🔄 +1 vaihtoa!" display

### 1.27 Extract KidsStartScreen Component
Source: pipsan-ystavat lines 655-736
- [x] Create `lib/components/kids/home/KidsStartScreen.svelte`
- [x] Props:
  - `title: string`
  - `subtitle: string`
  - `subtitleSpanish: string`
  - `previewImages: string[]`
  - `autoPlayAudio: boolean`
  - `onToggleAudio: (enabled: boolean) => void`
  - `onStart: () => void`
  - `onOpenSanakirja: () => void`
- [x] Large emoji header (🐷👫🇪🇸)
- [x] Gradient title
- [x] Preview grid showing SVG vs Emoji modes
- [x] Audio toggle
- [x] Start and Sanakirja buttons

### 1.28 Extract KidsEndScreen Component
Source: pipsan-ystavat lines 959-1015
- [x] Create `lib/components/kids/home/KidsEndScreen.svelte`
- [x] Props:
  - `correctCount: number`
  - `totalQuestions: number`
  - `onPlayAgain: () => void`
  - `onHome: () => void`
- [x] Performance-based emoji (🏆 ≥80%, ⭐ ≥50%, 💪 <50%)
- [x] Performance-based message
- [x] Large score display "7 / 10"
- [x] Decorative bouncing emojis (🐷🌈🎨⭐)
- [x] Play again + Home buttons

### 1.29 Extract KidsSanakirja Component
Source: pipsan-ystavat lines 1018-1109
- [x] Create `lib/components/kids/modals/KidsSanakirja.svelte`
- [x] Props:
  - `isOpen: boolean`
  - `upcomingPhrases: GameQuestion[]`
  - `previousGames: GameQuestion[][]`
  - `onClose: () => void`
  - `onSpeak: (spanish: string, finnish: string) => void`
- [x] Pink/purple gradient header
- [x] Phrase cards with rounded corners
- [x] Pink-themed upcoming section
- [x] Neutral previous games section
- [x] Small TTS buttons
- [x] Close button at bottom

### 1.30 Test & Integrate Kids Components
Look at existing similar tests for guidance.
- [x] Create integration test for pipsan-ystavat game main display
- [x] Create integration test for pipsan-ystavat question display
- [x] Create integration test for pipsan-ystavat game result display
- [x] Integrate components into pipsan-ystavat
- [x] Compare line count before/after (1128 → 980 lines, -148 lines)
- [ ] Verify all functionality works (user does this manually)
- [ ] Test on mobile devices (user does this manually)

---

## Phase 2: Story Game Foundation ✅ COMPLETED

Build the new story-based reading comprehension game.

### 2.1 Story Type Definitions
- [x] Create `lib/types/story.ts`
- [x] Define Story interface (id, title, level, topic, paragraphs, vocabulary, questions)
- [x] Define StoryParagraph interface (spanish, finnish, audioFile) - Using DialogueLine
- [x] Define VocabularyItem interface (spanish, finnish, english, partOfSpeech) - Using VocabularyWord
- [x] Define ComprehensionQuestion interface (questionFinnish, correctAnswer, wrongAnswers) - Using StoryQuestion

### 2.2 Create Story Data Files
- [x] Create `static/stories/` directory
- [x] Create `static/stories/stories.json` with story data (8 stories: grocery-shopping, cafe-visit, bicycle-rental, cheap-hotel, nature-park, camping-area, weather-talk, restaurant-recommendation)

### 2.3 Create Story Service
- [x] Create `lib/services/storyLoader.ts`
- [x] Implement loadStories() function
- [x] Implement getStoryById(storyId) function
- [x] Add caching for loaded stories
- [x] Add category and difficulty filtering

### 2.4 Create Story Components Directory
- [x] Create `lib/components/basic/stories/` directory

### 2.5 Create StoryList Component
- [x] Implemented as filtered list on tarinat/+page.svelte with StoryCard
- [x] Display available stories with level badge (beginner, intermediate, advanced)
- [x] Filter by difficulty and category
- [x] Show dialogue count and question count

### 2.6 Create StoryCard Component
- [x] Create `lib/components/basic/stories/StoryCard.svelte`
- [x] Props: story metadata (title, difficulty, category, icon)
- [x] Displays dialogue count and question count
- [x] Supports both button callback and link mode (useLink prop)

### 2.7 Create StoryReader Component
- [x] Create `lib/components/basic/stories/StoryReader.svelte`
- [x] Props: dialogue, vocabulary, title, titleSpanish, onContinue
- [x] Display dialogues with speaker names
- [x] Toggle Finnish translation visibility
- [x] Integrated vocabulary panel view

### 2.8 Create ParagraphView Component
- [x] Integrated in StoryReader.svelte
- [x] Spanish text display (large, readable)
- [x] Finnish translation (toggleable, side-by-side view)
- [x] TTS button for Spanish text

### 2.9 Create VocabularyPanel Component
- [x] Integrated in StoryReader.svelte (toggle view)
- [x] Spanish + Finnish for each word
- [x] TTS button per word
- [x] Clean card-based layout

### 2.10 Create VocabularyItem Component
- [x] Integrated in StoryReader.svelte vocabulary view
- [x] Compact display with TTS button
- [x] Optional example sentences

### 2.11 Create QuestionView Component
- [x] Create `lib/components/basic/stories/StoryQuestion.svelte`
- [x] Props: question data, questionNumber, totalQuestions, onAnswer callback
- [x] Display question in Finnish
- [x] Multiple choice answers with A/B/C/D badges
- [x] Highlight correct/wrong on selection
- [x] Show explanation after answering

### 2.12 Create StoryCompletion Component
- [x] Create `lib/components/basic/stories/StoryReport.svelte`
- [x] Props: story, results, onHome, onPlayAgain, onNextStory
- [x] Completion celebration with performance-based emoji
- [x] Score display with progress bar
- [x] Full question review with explanations
- [x] "Play again", "Next story" and "Back to stories" buttons

### 2.13 Create Tarinat Route
- [x] Create `routes/tarinat/` directory
- [x] Create `routes/tarinat/+page.svelte` (story list page with filters)
- [x] Create `routes/tarinat/+layout.ts` for prerender/ssr settings
- [x] Implement story selection UI with difficulty and category filters

### 2.14 Create Individual Story Route
- [x] Create `routes/tarinat/[storyId]/` directory
- [x] Create `routes/tarinat/[storyId]/+page.svelte`
- [x] Create `routes/tarinat/[storyId]/+page.ts` for story loading with entries generator
- [x] Implement reading flow (dialogue → vocabulary → questions → completion)
- [x] Deep linking support for all 8 stories

### 2.15 Add Stories to Main Menu
- [x] Add story game card to main page (+page.svelte)
- [x] Include story icon/emoji (📖)
- [x] Show as "scored" game mode

---

## Phase 3: Knowledge System Expansion

Extend knowledge tracking across all games and show progress on main screen.

### 3.1 Extend wordKnowledge Store
- [ ] Add gameTypeStats field to WordKnowledge interface
- [ ] Track stats per game type (sanapeli, yhdistasanat, tarinat, peppa)
- [ ] Add attempts, correct, lastPlayed, averageScore per game type
- [ ] Update recordAnswer to accept gameType parameter

### 3.2 Add Category-Level Knowledge
- [ ] Create CategoryKnowledge interface with wordsTotal, wordsPracticed, etc.
- [ ] Add sanapeliScore, yhdistasanatScore, tarinatCompleted fields
- [ ] Add streak tracking (days in a row)
- [ ] Implement getCategoryKnowledgeExtended() function

### 3.3 Create Progress Calculation Service
- [ ] Create `lib/services/progressCalculator.ts`
- [ ] Implement calculateGameProgress(gameType) function
- [ ] Implement calculateOverallProgress() function
- [ ] Implement getWeakWords(count) function
- [ ] Implement getStreak() function
- [ ] Implement getRecommendedWords(gameType, count) function

### 3.4 Create GameProgressCard Component
- [ ] Create `lib/components/basic/home/GameProgressCard.svelte`
- [ ] Props: gameType, title, description, icon, progress data
- [ ] Progress bar with percentage
- [ ] Words learned / words needing review count
- [ ] Last played timestamp
- [ ] Motivational message

### 3.5 Update Main Page with Progress Cards
- [ ] Import GameProgressCard component
- [ ] Replace simple game links with progress cards
- [ ] Show progress for sanapeli
- [ ] Show progress for yhdistasanat
- [ ] Show progress for tarinat (stories)
- [ ] Add separator for kids games

### 3.6 Connect sanapeli to Knowledge Store
- [ ] Import wordKnowledge store in sanapeli
- [ ] Call recordAnswer after each question
- [ ] Call recordGame at end of game
- [ ] Pass 'sanapeli' as gameType

### 3.7 Connect Story Game to Knowledge Store
- [ ] Import wordKnowledge store in tarinat
- [ ] Record vocabulary words as learned when story completed
- [ ] Track comprehension question results
- [ ] Update story progress in store

### 3.8 Update Word Selection with Knowledge
- [ ] Modify selectGameWords to accept gameType
- [ ] Prioritize weak words in selection
- [ ] Implement configurable known/unknown word weighting
- [ ] Test cross-game word prioritization

### 3.9 Create Motivation Messages Service
- [ ] Create `lib/services/motivationMessages.ts`
- [ ] Implement getMotivationMessage(gameType, userData) function
- [ ] Messages for consistent players (streak, weekly progress)
- [ ] Messages for returning players (welcome back, words need review)
- [ ] Messages for new players (getting started tips)
- [ ] Messages for completed categories

---

## Phase 4: Full Game Refactoring

Refactor all game pages to use the new component architecture.

### 4.1 Create GameShell Wrapper Component
- [ ] Create `lib/components/basic/core/GameShell.svelte`
- [ ] Props: gameState, children slots
- [ ] Common layout for all games
- [ ] Handle keyboard shortcuts (Escape to quit)
- [ ] Manage screen state transitions

### 4.2 Create GameSession Store
- [ ] Create `lib/stores/gameSession.ts`
- [ ] Define GameSession interface (state, currentQuestion, totalQuestions, score, questions)
- [ ] Implement createGameSession() factory function
- [ ] Methods: start(), answer(), nextQuestion(), end(), reset()

### 4.3 Create Settings Store
- [ ] Create `lib/stores/settings.ts` (or extend existing)
- [ ] Define BasicSettings interface (theme, compactMode, autoSpeak, ttsSpeed, etc.)
- [ ] Define KidsSettings interface (kidsTheme, celebrationSounds, noFailMode, etc.)
- [ ] Separate localStorage keys for basic and kids settings

### 4.4 Refactor pipsan-maailma (Smallest First)
- [ ] Analyze current structure and identify extractable parts
- [ ] Import and use appropriate kids components
- [ ] Reduce page from ~800 lines to <200 lines
- [ ] Test all functionality

### 4.5 Refactor yhdistasanat (Already pilot from Phase 1)
- [ ] Verify all extracted components integrated
- [ ] Connect to GameSession store
- [ ] Move state management to store
- [ ] Reduce prop drilling
- [ ] Clean up unused code
- [ ] Target: <300 lines

### 4.6 Refactor sanapeli
- [ ] Import GameHeader component
- [ ] Import FeedbackOverlay component
- [ ] Import CategoryPicker component
- [ ] Import Sanakirja component
- [ ] Import GameReport component
- [ ] Create TextInput component for answer input if needed
- [ ] Handle compact mode with shared component
- [ ] Reduce page from ~1412 lines to <300 lines
- [ ] Test all functionality

### 4.7 Refactor pipsan-ystavat
- [ ] Verify all extracted kids components integrated
- [ ] Connect to knowledge tracking
- [ ] Reduce code duplication
- [ ] Target: <300 lines
- [ ] Test all functionality

### 4.8 Clean Up Duplicate Code
- [ ] Remove duplicate shuffleArray from all files (use shared util)
- [ ] Remove duplicate spreadOutDuplicates from all files
- [ ] Remove duplicate animation CSS from page files
- [ ] Remove unused imports and variables
- [ ] Run linter and fix issues

### 4.9 Update Tests
- [ ] Update existing tests for new component structure
- [ ] Add integration tests for refactored games
- [ ] Ensure all games complete without errors
- [ ] Test mobile responsiveness

---

## Phase 5: Content Expansion (Ongoing)

Expand story content and add polish.

### 5.1 Create Additional Stories
- [ ] Create hotel-01.json (En el hotel)
- [ ] Create direcciones-01.json (Pidiendo direcciones)
- [ ] Create restaurante-01.json (En el restaurante)
- [ ] Create compras-01.json (De compras)
- [ ] Create transporte-01.json (En el transporte)
- [ ] Create medico-01.json (En el médico)
- [ ] Create conociendo-01.json (Conociendo gente)

### 5.2 Add Story Difficulty Progression
- [ ] Ensure stories are ordered by difficulty
- [ ] Add level badges (A1, A2, B1)
- [ ] Track user's reading level
- [ ] Recommend appropriate next story

### 5.3 Add Cultural Notes
- [ ] Add culturalNotes field to story data
- [ ] Display cultural context during reading
- [ ] Regional variations notes

### 5.4 Consider Audio Recordings
- [ ] Evaluate TTS quality vs recorded audio
- [ ] Plan recording workflow if needed
- [ ] Add audioFile support to paragraphs

### 5.5 Story-Specific Vocabulary Exercises
- [ ] After story completion, offer vocabulary quiz
- [ ] Practice story words in yhdistasanat format
- [ ] Track vocabulary mastery per story

---

## Checklist Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Directory & Types | 17 tasks | ✅ Completed |
| Phase 1A: Basic Components | 15 tasks | ✅ Completed |
| Phase 1B: Kids Components | 11 tasks | ✅ Completed |
| Phase 2: Story Game | 15 tasks | ✅ Completed |
| Phase 3: Knowledge System | 9 tasks | ⬜ Not started |
| Phase 4: Full Refactoring | 9 tasks | ⬜ Not started |
| Phase 5: Content Expansion | 5 tasks | ⬜ Not started |

**Total: ~81 tasks**


## Extra test tasks

--------------------------------------------------------------------------------
6.1 Integration Test: Full Game Flow for Yhdistäsanat
- [ ] Test complete game flow from start to finish:
  - [ ] Start from home screen
  - [ ] Configure game settings (category, direction, length)
  - [ ] Start game and verify transition to playing state
  - [ ] Answer all questions (mix of correct/wrong)
  - [ ] Verify knowledge tracking updates
  - [ ] Complete game and verify report screen
  - [ ] Return to home and verify state reset
- [ ] Test edge cases:
  - [ ] Quitting mid-game
  - [ ] Running out of tries on a question
  - [ ] Completing game with all correct answers
  - [ ] Completing game with all wrong answers
- [ ] Test with mocked user knowledge data:
  - [ ] New user (no previous knowledge)
  - [ ] Experienced user (some words known)
  - [ ] Expert user (most words known)

--------------------------------------------------------------------------------



---

## Notes

### Estimation
- Phase 1 (all): 3-4 coding sessions
- Phase 2: 3-4 coding sessions
- Phase 3: 2-3 coding sessions
- Phase 4: 4-5 coding sessions
- Phase 5: Ongoing

### Key Principles
1. **Don't break existing functionality** - Always test after changes
2. **Extract incrementally** - One component at a time
3. **Keep kids games separate** - Different visual style and behavior
4. **Document as you go** - Add JSDoc comments and types

### Current Code Sizes for Reference
```
yhdistasanat/+page.svelte    1576 lines  ← Basic components source
pipsan-ystavat/+page.svelte  1127 lines  ← Kids components source
sanapeli/+page.svelte        1412 lines
kielten-oppiminen/+page.svelte 1020 lines
pipsan-maailma/+page.svelte   800 lines
asetukset/+page.svelte        319 lines
```

Target after refactoring: <200-300 lines per page

### Component Extraction Reference

**From yhdistasanat (Basic):**
| Component | Source Lines | Purpose |
|-----------|--------------|---------|
| GameHeader | 1336-1359 | Progress, score, tries, quit |
| FeedbackOverlay | 1443-1497 | Correct/wrong animation |
| CategoryPicker | 1195-1326 | Tier-based category modal |
| Sanakirja | 1114-1192 | Word list modal |
| GameReport | 1503-1575 | End game summary |
| OptionButtons | 1424-1438 | Answer button grid |
| QuestionCard | 1403-1419 | Word display card |
| LineAnimation | 1363-1376 | SVG line drawing |
| LanguageDirectionSwitch | 963-990 | ES↔FI toggle |
| Animations CSS | 778-943 | Keyframe animations |

**From pipsan-ystavat (Kids):**
| Component | Source Lines | Purpose |
|-----------|--------------|---------|
| KidsGameHeader | 741-758 | Simple progress bar |
| KidsAudioControl | 762-809 | Audio + display mode |
| KidsImageOptions | 912-943 | 2x2 image grid |
| KidsCelebration | 876-906 | Correct celebration |
| KidsWrongFeedback | 817-844 | Wrong answer display |
| KidsCorrectReveal | 845-874 | Reveal correct answer |
| KidsStartScreen | 655-736 | Game start UI |
| KidsEndScreen | 959-1015 | Game over UI |
| KidsSanakirja | 1018-1109 | Phrase preview modal |
