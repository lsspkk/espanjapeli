# V3 TODO - Espanjapeli Refactoring & New Features

This is the implementation checklist extracted from V3_ROADMAP.md.
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
- [ ] Create `lib/components/basic/` directory
- [ ] Create `lib/components/basic/core/` subdirectory
- [ ] Create `lib/components/basic/feedback/` subdirectory
- [ ] Create `lib/components/basic/input/` subdirectory
- [ ] Create `lib/components/basic/modals/` subdirectory
- [ ] Create `lib/components/basic/report/` subdirectory
- [ ] Create `lib/components/basic/home/` subdirectory
- [ ] Create `lib/components/kids/` directory
- [ ] Create `lib/components/kids/core/` subdirectory
- [ ] Create `lib/components/kids/feedback/` subdirectory
- [ ] Create `lib/components/kids/input/` subdirectory
- [ ] Create `lib/components/kids/home/` subdirectory
- [ ] Create `lib/components/shared/` directory
- [ ] Create `lib/types/` directory

--------------------------------------------------------------------------------
1.2 Create Type Definitions
- [ ] Create `lib/types/game.ts`
- [ ] Add GameState type: `'home' | 'playing' | 'feedback' | 'report'`
- [ ] Add GameConfig interface (gameType, questionCount, category, direction, timed)
- [ ] Add QuestionDisplay interface (id, displayText, audioText, audioLanguage)
- [ ] Add AnswerResult interface (correct, userAnswer, correctAnswer, pointsEarned, feedback)
- [ ] Add GameType type: `'sanapeli' | 'yhdistasanat' | 'tarinat' | 'peppa'`

--------------------------------------------------------------------------------
1.3 Extract Shared Utilities
- [ ] Create `lib/utils/array.ts`
- [ ] Move `shuffleArray<T>()` function (duplicated in 4+ files)
- [ ] Move `spreadOutDuplicates()` function (duplicated in 3+ files)
- [ ] Add unit tests for utility functions

--------------------------------------------------------------------------------
1.4 Extract Shared Animation CSS
- [ ] Create `lib/styles/animations.css` or add to `layout.css`
- [ ] Extract keyframe animations from yhdistasanat:
  - [ ] `popIn` / `popOut`
  - [ ] `slideDown` / `slideUp` / `slideDownOut` / `slideUpOut`
  - [ ] `fadeIn` / `fadeOut`
  - [ ] `rotateIn` / `rotateOut`
  - [ ] `drawLine` (for SVG line animation)
- [ ] Extract animation classes (`animate-pop-in`, `animate-slide-down`, etc.)
- [ ] Import in components that need animations

================================================================================

PHASE 1A: BASIC COMPONENTS (from yhdistasanat)

--------------------------------------------------------------------------------
1.5 Extract GameHeader Component
Source: yhdistasanat lines 1336-1359
- [ ] Create `lib/components/basic/core/GameHeader.svelte`
- [ ] Props:
  - `currentQuestion: number`
  - `totalQuestions: number`
  - `score: number`
  - `onQuit: () => void`
  - `triesRemaining?: number` (optional, for yhdistasanat)
  - `maxTries?: number` (default 3)
- [ ] Display: "3/10 | 45 p"
- [ ] Tries indicator: 3 colored dots (green=remaining, gray=used)
- [ ] Quit button (✕) with confirmation optional

--------------------------------------------------------------------------------
1.6 Extract TriesIndicator Component
Source: yhdistasanat lines 1344-1352
- [ ] Create `lib/components/basic/core/TriesIndicator.svelte`
- [ ] Props: `remaining: number`, `max: number = 3`
- [ ] Display colored dots (success when remaining, base-300 when used)
- [ ] Smooth transition animations

--------------------------------------------------------------------------------
1.7 Extract QuestionCard Component
Source: yhdistasanat lines 1403-1419
- [ ] Create `lib/components/basic/core/QuestionCard.svelte`
- [ ] Props:
  - `text: string`
  - `onSpeak?: () => void`
  - `showSpeaker?: boolean`
- [ ] Primary colored card with centered text
- [ ] Speaker button (🔊) below card
- [ ] Responsive text sizing

--------------------------------------------------------------------------------
1.8 Extract PossiblePoints Component
Source: yhdistasanat lines 1386-1400
- [ ] Create `lib/components/basic/core/PossiblePoints.svelte`
- [ ] Props: `points: number`, `triesRemaining: number`
- [ ] Large "+10" / "+3" / "+1" / "0" display
- [ ] Color coding: success/warning/error based on tries

--------------------------------------------------------------------------------
1.9 Extract OptionButtons Component
Source: yhdistasanat lines 1424-1438
- [ ] Create `lib/components/basic/input/OptionButtons.svelte`
- [ ] Props:
  - `options: Array<{ id: string; text: string }>`
  - `disabledIds: Set<string>`
  - `onSelect: (id: string, event: MouseEvent) => void`
  - `disabled: boolean`
- [ ] Grid layout (1-col mobile, 2-col desktop)
- [ ] Button states: outline, disabled+error, opacity

--------------------------------------------------------------------------------
1.10 Extract LineAnimation Component
Source: yhdistasanat lines 1363-1376
- [ ] Create `lib/components/basic/feedback/LineAnimation.svelte`
- [ ] Props:
  - `start: { x: number; y: number } | null`
  - `end: { x: number; y: number } | null`
  - `visible: boolean`
  - `color: 'success' | 'error'`
- [ ] SVG overlay with animated line drawing
- [ ] Include drawLine animation CSS

--------------------------------------------------------------------------------
1.11 Extract FeedbackOverlay Component
Source: yhdistasanat lines 1443-1497
- [ ] Create `lib/components/basic/feedback/FeedbackOverlay.svelte`
- [ ] Props:
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
- [ ] Dark backdrop (bg-black/60)
- [ ] Animated card with word pair display
- [ ] Continue button for wrong answers
- [ ] Auto-close support for correct answers

--------------------------------------------------------------------------------
1.12 Extract CategoryPicker Component
Source: yhdistasanat lines 1195-1326
- [ ] Create `lib/components/basic/modals/CategoryPicker.svelte`
- [ ] Props:
  - `isOpen: boolean`
  - `selectedCategory: string`
  - `categories: Array<{ key, name, tier }>`
  - `onSelect: (key: string) => void`
  - `onClose: () => void`
- [ ] Full-screen on mobile, centered modal on desktop
- [ ] "All words" option at top
- [ ] Tier grouping with colored left borders:
  - Tier 1: red (Perusta)
  - Tier 2: yellow (Perusasiat)
  - Tier 3: green (Arkiaiheet)
  - Tier 4: blue (Käytäntö)
  - Tier 5: purple (Erikois)
- [ ] 2-column grid within each tier
- [ ] Selected state highlighting

--------------------------------------------------------------------------------
1.13 Extract Sanakirja Component
Source: yhdistasanat lines 1114-1192
- [ ] Create `lib/components/basic/modals/Sanakirja.svelte`
- [ ] Props:
  - `isOpen: boolean`
  - `upcomingWords: Word[]`
  - `previousGames: Word[][]`
  - `onClose: () => void`
  - `onSpeak: (spanish: string, finnish: string) => void`
- [ ] Header with title and close button
- [ ] Sections:
  - "Seuraavan pelin sanat" with secondary highlight
  - Previous games with neutral styling
- [ ] Word rows: Spanish | Finnish | 🔊 button
- [ ] Scrollable content area
- [ ] Fixed close button at bottom

--------------------------------------------------------------------------------
1.14 Extract LanguageDirectionSwitch Component
Source: yhdistasanat lines 963-990
- [ ] Create `lib/components/basic/input/LanguageDirectionSwitch.svelte`
- [ ] Props:
  - `direction: 'spanish' | 'finnish'`
  - `onChange: (direction) => void`
- [ ] Two buttons with flags (🇪🇸, 🇫🇮)
- [ ] Arrow divider between buttons
- [ ] Helper text below explaining current mode

--------------------------------------------------------------------------------
1.15 Extract GameLengthSelector Component
Source: yhdistasanat lines 1009-1049
- [ ] Create `lib/components/basic/input/GameLengthSelector.svelte`
- [ ] Props:
  - `value: number`
  - `options: number[]` (default [10, 21, 42])
  - `onChange: (length: number) => void`
- [ ] Radio button group
- [ ] Horizontal layout with labels

--------------------------------------------------------------------------------
1.16 Extract GameReport Component
Source: yhdistasanat lines 1503-1575
- [ ] Create `lib/components/basic/report/GameReport.svelte`
- [ ] Props:
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
- [ ] Time display
- [ ] 2x2 grid with try counts (colored boxes)
- [ ] Score summary with percentage
- [ ] Wrong answers list
- [ ] Action buttons

--------------------------------------------------------------------------------
1.17 Extract WrongAnswersList Component
Source: yhdistasanat lines 1549-1564
- [ ] Create `lib/components/basic/report/WrongAnswersList.svelte`
- [ ] Props: `answers: Array<{ spanish, finnish, userAnswer? }>`
- [ ] Error-bordered cards
- [ ] "Spanish = Finnish" format
- [ ] Optional user answer display

--------------------------------------------------------------------------------
1.18 Extract TTSButton Component
Source: yhdistasanat lines 1412-1418, 1148-1154
- [ ] Create `lib/components/shared/TTSButton.svelte`
- [ ] Props:
  - `text: string`
  - `language: 'spanish' | 'finnish'`
  - `size: 'xs' | 'sm' | 'md' | 'lg'`
  - `variant: 'ghost' | 'circle' | 'plain'`
- [ ] Uses tts service
- [ ] Speaker emoji (🔊)

--------------------------------------------------------------------------------
1.19 Test & Integrate Basic Components
- [ ] Create test file for GameHeader
- [ ] Create test file for FeedbackOverlay
- [ ] Create test file for CategoryPicker
- [ ] Integrate components into yhdistasanat
- [ ] Verify all functionality works
- [ ] Check mobile responsiveness
- [ ] Compare line count before/after

================================================================================

PHASE 1B: KIDS COMPONENTS (from pipsan-ystavat)

--------------------------------------------------------------------------------
1.20 Extract KidsGameHeader Component
Source: pipsan-ystavat lines 741-758
- [ ] Create `lib/components/kids/core/KidsGameHeader.svelte`
- [ ] Props:
  - `currentQuestion: number`
  - `totalQuestions: number`
  - `correctCount: number`
  - `onClose: () => void`
- [ ] Simpler display: "Kysymys 3/10" + "✅ 2"
- [ ] Progress bar (not dots)
- [ ] Small close button (✕)

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
- [ ] Create `lib/components/kids/input/KidsImageOptions.svelte`
- [ ] Props:
  - `options: Array<{ id, file, emojiDisplay, isCorrect }>`
  - `selectedAnswer: string | null`
  - `displayMode: 'svg' | 'emoji'`
  - `onSelect: (id: string) => void`
- [ ] 2x2 grid of large buttons
- [ ] Aspect-square sizing
- [ ] Selection states:
  - Correct: green border + ring + scale
  - Wrong: red border + ring + opacity
  - Reveal correct: green + animate-pulse
- [ ] SVG image or emoji display based on mode

--------------------------------------------------------------------------------
1.23 Extract KidsCelebration Component
Source: pipsan-ystavat lines 876-906
- [ ] Create `lib/components/kids/feedback/KidsCelebration.svelte`
- [ ] Props:
  - `emoji: string` (celebration emoji)
  - `spanishPhrase: string`
  - `finnishPhrase: string`
  - `imageFile?: string`
  - `emojiDisplay?: string`
  - `displayMode: 'svg' | 'emoji'`
- [ ] Large bouncing emoji (🎉, ⭐, 🌟, 🏆, 🎊)
- [ ] "¡Muy bien!" text
- [ ] Image or emoji of correct answer
- [ ] Spanish = Finnish display

--------------------------------------------------------------------------------
1.24 Extract KidsWrongFeedback Component
Source: pipsan-ystavat lines 817-844
- [ ] Create `lib/components/kids/feedback/KidsWrongFeedback.svelte`
- [ ] Props:
  - `wrongImageId: string`
  - `wrongText: string`
  - `imageFile?: string`
  - `emojiDisplay: string`
  - `displayMode: 'svg' | 'emoji'`
- [ ] Large ❌ emoji
- [ ] Wrong answer image/emoji
- [ ] Explanation text in Finnish
- [ ] Gentle, non-discouraging styling

### 1.25 Extract KidsCorrectReveal Component
Source: pipsan-ystavat lines 845-874
- [ ] Create `lib/components/kids/feedback/KidsCorrectReveal.svelte`
- [ ] Props:
  - `spanishPhrase: string`
  - `finnishPhrase: string`
  - `imageFile: string`
  - `emojiDisplay: string`
  - `displayMode: 'svg' | 'emoji'`
- [ ] Large ✅ emoji
- [ ] Correct answer image with green border
- [ ] Spanish = Finnish display
- [ ] fade-in animation

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
- [ ] Create `lib/components/kids/home/KidsStartScreen.svelte`
- [ ] Props:
  - `title: string`
  - `subtitle: string`
  - `subtitleSpanish: string`
  - `previewImages: string[]`
  - `autoPlayAudio: boolean`
  - `onToggleAudio: (enabled: boolean) => void`
  - `onStart: () => void`
  - `onOpenSanakirja: () => void`
- [ ] Large emoji header (🐷👫🇪🇸)
- [ ] Gradient title
- [ ] Preview grid showing SVG vs Emoji modes
- [ ] Audio toggle
- [ ] Start and Sanakirja buttons

### 1.28 Extract KidsEndScreen Component
Source: pipsan-ystavat lines 959-1015
- [ ] Create `lib/components/kids/home/KidsEndScreen.svelte`
- [ ] Props:
  - `correctCount: number`
  - `totalQuestions: number`
  - `onPlayAgain: () => void`
  - `onHome: () => void`
- [ ] Performance-based emoji (🏆 ≥80%, ⭐ ≥50%, 💪 <50%)
- [ ] Performance-based message
- [ ] Large score display "7 / 10"
- [ ] Decorative bouncing emojis (🐷🌈🎨⭐)
- [ ] Play again + Home buttons

### 1.29 Extract KidsSanakirja Component
Source: pipsan-ystavat lines 1018-1109
- [ ] Create `lib/components/kids/modals/KidsSanakirja.svelte`
- [ ] Props:
  - `isOpen: boolean`
  - `upcomingPhrases: GameQuestion[]`
  - `previousGames: GameQuestion[][]`
  - `onClose: () => void`
  - `onSpeak: (spanish: string, finnish: string) => void`
- [ ] Pink/purple gradient header
- [ ] Phrase cards with rounded corners
- [ ] Pink-themed upcoming section
- [ ] Neutral previous games section
- [ ] Small TTS buttons
- [ ] Close button at bottom

### 1.30 Test & Integrate Kids Components
- [ ] Create test file for KidsGameHeader
- [ ] Create test file for KidsCelebration
- [ ] Create test file for KidsImageOptions
- [ ] Integrate components into pipsan-ystavat
- [ ] Verify all functionality works
- [ ] Test on mobile devices
- [ ] Compare line count before/after

---

## Phase 2: Story Game Foundation

Build the new story-based reading comprehension game.

### 2.1 Story Type Definitions
- [ ] Create `lib/types/story.ts`
- [ ] Define Story interface (id, title, level, topic, paragraphs, vocabulary, questions)
- [ ] Define StoryParagraph interface (spanish, finnish, audioFile)
- [ ] Define VocabularyItem interface (spanish, finnish, english, partOfSpeech)
- [ ] Define ComprehensionQuestion interface (questionFinnish, correctAnswer, wrongAnswers)

### 2.2 Create Story Data Files
- [ ] Create `static/stories/` directory
- [ ] Create `static/stories/index.json` with story metadata list
- [ ] Create `static/stories/cafe-01.json` (En el café)
- [ ] Create `static/stories/mercado-01.json` (En el mercado)
- [ ] Create `static/stories/playa-01.json` (En la playa)

### 2.3 Create Story Service
- [ ] Create `lib/services/storyLoader.ts`
- [ ] Implement loadStoryList() function
- [ ] Implement loadStory(storyId) function
- [ ] Add story progress tracking (read paragraphs, completed)
- [ ] Add caching for loaded stories

### 2.4 Create Story Components Directory
- [ ] Create `lib/components/stories/` directory

### 2.5 Create StoryList Component
- [ ] Create `lib/components/stories/StoryList.svelte`
- [ ] Display available stories with level badge (A1, A2, B1)
- [ ] Show reading time estimate
- [ ] Show progress indicator (not started, in progress, completed)

### 2.6 Create StoryCard Component
- [ ] Create `lib/components/stories/StoryCard.svelte`
- [ ] Props: story metadata (title, level, topic, estimatedMinutes, progress)
- [ ] Visual progress bar
- [ ] Start/Continue button

### 2.7 Create StoryReader Component
- [ ] Create `lib/components/stories/StoryReader.svelte`
- [ ] Props: story data
- [ ] Display current paragraph
- [ ] Previous/Next navigation
- [ ] Progress indicator (e.g., "3/6 paragraphs")
- [ ] Toggle Finnish translation visibility

### 2.8 Create ParagraphView Component
- [ ] Create `lib/components/stories/ParagraphView.svelte`
- [ ] Props: paragraph (spanish, finnish), showTranslation
- [ ] Spanish text display (large, readable)
- [ ] Finnish translation (toggleable)
- [ ] TTS button for Spanish text

### 2.9 Create VocabularyPanel Component
- [ ] Create `lib/components/stories/VocabularyPanel.svelte`
- [ ] Props: vocabulary items array
- [ ] Sliding sidebar or modal display
- [ ] Spanish + Finnish for each word
- [ ] TTS button per word
- [ ] Part of speech indicator (optional)

### 2.10 Create VocabularyItem Component
- [ ] Create `lib/components/stories/VocabularyItem.svelte`
- [ ] Props: word data (spanish, finnish, partOfSpeech)
- [ ] Compact display with TTS button

### 2.11 Create QuestionView Component
- [ ] Create `lib/components/stories/QuestionView.svelte`
- [ ] Props: question data, onAnswer callback
- [ ] Display question in Finnish
- [ ] Multiple choice answers in Spanish
- [ ] Highlight correct/wrong on selection
- [ ] Show explanation (optional)

### 2.12 Create StoryCompletion Component
- [ ] Create `lib/components/stories/StoryCompletion.svelte`
- [ ] Props: correctCount, totalQuestions, newWordsCount
- [ ] Completion celebration
- [ ] Score display
- [ ] "Read again" and "Back to stories" buttons

### 2.13 Create Tarinat Route
- [ ] Create `routes/tarinat/` directory
- [ ] Create `routes/tarinat/+page.svelte` (story list page)
- [ ] Create `routes/tarinat/+layout.ts` for client-side rendering
- [ ] Implement story selection UI

### 2.14 Create Individual Story Route
- [ ] Create `routes/tarinat/[storyId]/` directory
- [ ] Create `routes/tarinat/[storyId]/+page.svelte`
- [ ] Create `routes/tarinat/[storyId]/+page.ts` for story loading
- [ ] Implement reading flow (paragraphs → vocabulary → questions → completion)

### 2.15 Add Stories to Main Menu
- [ ] Add story game card to main page (+page.svelte)
- [ ] Include story icon/emoji
- [ ] Show progress summary (e.g., "3/10 stories read")

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
| Phase 1: Directory & Types | 17 tasks | ⬜ Not started |
| Phase 1A: Basic Components | 15 tasks | ⬜ Not started |
| Phase 1B: Kids Components | 11 tasks | ⬜ Not started |
| Phase 2: Story Game | 15 tasks | ⬜ Not started |
| Phase 3: Knowledge System | 9 tasks | ⬜ Not started |
| Phase 4: Full Refactoring | 9 tasks | ⬜ Not started |
| Phase 5: Content Expansion | 5 tasks | ⬜ Not started |

**Total: ~81 tasks**

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
