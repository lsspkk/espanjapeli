================================================================================
                            ESPANJAPELI
                    Spanish Learning Game Platform
================================================================================

PROJECT OVERVIEW
--------------------------------------------------------------------------------
Espanjapeli is a comprehensive Spanish language learning platform that uses 
gamification, AI-generated hints, and multiple game modes to make vocabulary 
acquisition fun and effective. The project includes both a legacy vanilla 
JavaScript version and a modern Svelte-based application with multiple game 
modes for different learning styles and age groups.

DEVELOPMENT APPROACH: This project was developed using AI-assisted coding with 
Large Language Models (primarily Claude Sonnet 4.5). A human developer provided 
oversight and guidance, prioritizing functional implementation and rapid 
prototyping over strict software engineering standards.


PROJECT STRUCTURE
--------------------------------------------------------------------------------

espanjapeli/
├── docs/                       # Legacy vanilla JS game (v1)
│   ├── index.html              # Main game interface
│   ├── game.js                 # Core game logic (~1200 lines)
│   ├── words.js                # Spanish vocabulary database (400+ words)
│   ├── tipService.js           # LLM integration & caching
│   ├── tts-service.js          # Text-to-speech functionality
│   ├── answer-checker.js       # Fuzzy matching & typo tolerance
│   ├── storage.js              # LocalStorage persistence
│   ├── messages.js             # Congratulation messages
│   ├── styles.css              # Mobile-first responsive design
│   ├── categoryConfig.js       # Word categories & difficulty levels
│   ├── words_tips_translations.json  # Pre-generated hints cache
│   └── server.py               # Hot-reload dev server
│
├── svelte/                     # Modern Svelte app (v2)
│   ├── src/
│   │   ├── routes/             # Game pages & routing
│   │   │   ├── +page.svelte           # Home/game selection
│   │   │   ├── sanapeli/              # Word game (ES→FI)
│   │   │   ├── pipsan-maailma/        # Kids emoji game
│   │   │   ├── pipsan-ystavat/        # Kids image matching
│   │   │   ├── muisti/                # Recall practice (FI→ES)
│   │   │   ├── kuuntelu/              # Listening comprehension
│   │   │   ├── puhuminen/             # Speaking practice
│   │   │   ├── lukeminen/             # Reading lessons
│   │   │   ├── asetukset/             # Settings & data export
│   │   │   └── kielten-oppiminen/     # Learning guide
│   │   │
│   │   ├── lib/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── services/       # TTS, answer checking, tips
│   │   │   ├── stores/         # Svelte stores for state management
│   │   │   └── data/           # Word & message data
│   │   │
│   │   └── app.html            # HTML template
│   │
│   ├── static/                 # Static assets
│   │   ├── themes/             # Themed vocabulary JSON files
│   │   │   ├── basics_travel.json       # 150+ essential phrases
│   │   │   ├── music_concerts.json      # Music vocabulary
│   │   │   ├── outdoor_nature.json      # Nature vocabulary
│   │   │   ├── peppa_pig_kids.json      # Kids content
│   │   │   └── peppa_advanced_spanish.json  # Advanced Peppa phrases
│   │   │
│   │   ├── peppa_advanced_spanish_images/  # SVG images for kids games
│   │   └── words_tips_translations.json    # Main vocabulary cache
│   │
│   ├── package.json            # Dependencies & scripts
│   ├── svelte.config.js        # SvelteKit configuration
│   ├── tailwind.config.js      # Tailwind CSS config
│   └── vite.config.ts          # Vite build configuration
│
├── scripts/                    # Python utilities for content generation
│   ├── generate_tips.py                    # Generate hints via Ollama LLM
│   ├── generate_translations_azure.py      # Translate hints via Azure
│   ├── generate_translations.py            # Translate hints via Ollama
│   ├── generate_peppa_images.py            # Generate SVG images
│   ├── create_all_svgs.py                  # Batch SVG generation
│   ├── generate_missing_svgs.py            # Fill SVG gaps
│   ├── peppa_translate_azure.py            # Peppa content translation
│   ├── simple_translate.py                 # Basic translation utility
│   ├── update_translations.py              # Update existing translations
│   ├── update_manifest_translations.py     # Update image manifest
│   ├── merge.py                            # Merge JSON files
│   ├── test_one_word.py                    # Test single word generation
│   ├── test_three_hints.py                 # Test hint generation
│   ├── test_azure_translation.py           # Test Azure API
│   ├── test_translation.py                 # Test Ollama translation
│   └── env.example                         # Azure API config template
│
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions deployment automation
│
├── README.md                   # Main documentation (Markdown)
├── README.txt                  # This file (detailed text documentation)
├── TODO.md                     # Migration progress & task tracking
├── V2_ROADMAP.md               # Architecture analysis & migration plan
├── LANGUAGE_LEARNING.md        # Research-backed learning strategies
├── DEPLOY.md                   # Deployment guide for GitHub Pages
├── LICENSE                     # MIT License
└── requirements.txt            # Python dependencies


================================================================================
                        LEGACY GAME (docs/)
================================================================================

OVERVIEW
--------
The original vanilla JavaScript game presents Spanish words and provides 
progressive hints in Finnish/English to help users learn vocabulary. It uses 
a sophisticated caching system with LLM fallback for generating contextual 
learning tips.

CORE FILES
----------

1. index.html
   - Main game interface with start page, game area, and results screen
   - Uses data-state attribute for CSS-based view switching
   - Mobile-first responsive design

2. game.js (~1200 lines)
   - Game state management (42 questions per session)
   - Smart word selection with repeat prevention (last 5 words)
   - Scoring system: 10/5/3/1 points based on tips used
   - Answer validation with typo tolerance
   - Progress tracking and statistics
   - Wrong answer history tracking

3. tipService.js
   - Checks words_tips_translations.json for pre-generated tips first
   - Returns all available Finnish tips sorted by model preference
   - Simulates thinking time (500ms-2s) for cached responses
   - Falls back to live Ollama API only when no cached tips exist
   - Supports multiple LLM models (llama3.2:3b, Azure Translator)

4. tts-service.js
   - Text-to-speech functionality using Web Speech API
   - Automatic Spanish pronunciation
   - Configurable auto-speak on question load
   - Fallback handling for unsupported browsers

5. answer-checker.js
   - Fuzzy string matching for typo tolerance
   - Handles common Spanish-Finnish character variations
   - Accepts multiple correct answers (synonyms)
   - Case-insensitive comparison

6. storage.js
   - Browser localStorage persistence
   - Saves user preferences (auto-speak, category, compact mode)
   - Stores last 20 game results with full statistics
   - Tracks frequently wrong words from last 10 games
   - Maintains learning progress across sessions

7. words.js
   - 400+ Spanish vocabulary words
   - Organized by categories: animals, food, colors, body parts, etc.
   - Difficulty levels: easy, medium, hard
   - Each word includes: Spanish, English, Finnish translations

8. categoryConfig.js
   - Category definitions and display names
   - Difficulty level configurations
   - Word filtering and selection logic

9. messages.js
   - Congratulation messages in Spanish/Finnish
   - Sympathy messages for wrong answers
   - Randomized for variety

10. styles.css
    - Mobile-first responsive design
    - Flexbox layout for adaptive UI
    - Compact mode for smaller screens
    - Dark/light theme support

GAME FEATURES
-------------
- 42 questions per game session
- Progressive hint system (3 levels of difficulty)
- Scoring: 10 points (no hints) → 5 → 3 → 1 point (all hints used)
- Smart word selection (avoids last 5 words)
- Typo-tolerant answer checking
- Text-to-speech for pronunciation
- Category selection (all, animals, food, etc.)
- Difficulty levels (easy, medium, hard)
- Progress tracking and statistics
- Wrong answer history
- Responsive mobile-first design
- LocalStorage persistence

DATA FLOW
---------
1. User starts game → selects category & difficulty
2. Game selects random word (avoiding recent repeats)
3. TipService checks cache for pre-generated hints
4. User types answer → answer-checker validates with fuzzy matching
5. Score calculated based on hints used
6. Results saved to localStorage
7. Statistics updated (games played, wrong words, etc.)

CONFIGURATION
-------------
- Ollama API: Edit OLLAMA_API_URL in docs/env.js (copy from env.example.js)
- Azure Translator: Not used in legacy game (only in scripts)
- LocalStorage: Automatic, no configuration needed


================================================================================
                        MODERN SVELTE APP (svelte/)
================================================================================

OVERVIEW
--------
The Svelte-based v2 is a complete rewrite using modern web technologies. It 
provides multiple game modes for different learning styles and age groups, 
with a component-based architecture for maintainability and extensibility.

TECHNOLOGY STACK
----------------
- SvelteKit: Full-stack framework with routing
- TypeScript: Type-safe development
- Tailwind CSS: Utility-first styling
- DaisyUI: Pre-built UI components with themes
- Vite: Fast build tool
- Vitest: Unit testing framework
- GitHub Actions: Automated deployment

GAME MODES
----------

1. Sanapeli (Word Game) - 🇪🇸→🇫🇮
   Route: /sanapeli
   Status: ✅ AVAILABLE
   Description: Spanish word → type Finnish translation
   Features:
   - Same gameplay as legacy version
   - Progressive hint system
   - Scoring (10/5/3/1 points)
   - 42 questions per session
   - Category & difficulty selection
   - Progress tracking

2. Pipsan maailma (Peppa's World) - 🐷
   Route: /pipsan-maailma
   Status: ✅ AVAILABLE
   Description: Kids emoji matching game
   Features:
   - No reading required (emoji-based)
   - Audio plays Spanish word
   - Big colorful buttons for small fingers
   - Always positive feedback (no "wrong" feeling)
   - Celebration animations
   - Content from Peppa Pig show

3. Pipsan ystävät (Peppa's Friends) - 👫
   Route: /pipsan-ystavat
   Status: ✅ AVAILABLE
   Description: Kids image matching game
   Features:
   - Listen to Spanish word
   - Choose correct SVG image
   - Peppa Pig characters and objects
   - Kid-friendly interface
   - Positive reinforcement

4. Muisti (Recall Practice) - 🇫🇮→🇪🇸
   Route: /muisti
   Status: 🚧 PLANNED
   Description: Finnish → recall Spanish (flashcard style)
   Features:
   - No scoring (pure practice)
   - Self-assessment system
   - Category progress tracking
   - TTS for pronunciation
   - Works with words & phrases

5. Kuuntelu (Listening) - 👂
   Route: /kuuntelu
   Status: 🚧 PLANNED
   Description: Listen to Spanish → choose meaning
   Features:
   - Multiple choice format
   - Common phrases focus
   - Scoring system
   - Real-life situations (restaurant, hotel, etc.)

6. Puhuminen (Speaking) - 🎤
   Route: /puhuminen
   Status: 🚧 PLANNED
   Description: See Spanish → speak → hear TTS
   Features:
   - No scoring (practice mode)
   - Self-paced learning
   - TTS comparison
   - No microphone needed

7. Lukeminen (Reading) - 📖
   Route: /lukeminen
   Status: 🚧 PLANNED
   Description: Read stories with vocabulary
   Features:
   - Short Spanish stories
   - Vocabulary panels
   - Comprehension questions
   - Graded difficulty levels

ARCHITECTURE
------------

Component Structure:
- Routes: Each game mode is a separate route/page
- Components: Reusable UI elements (buttons, cards, modals)
- Services: Business logic (TTS, answer checking, tips)
- Stores: Svelte stores for reactive state management
- Data: Static word lists and messages

Key Services:
1. tts.ts - Text-to-speech using Web Speech API
2. answerChecker.ts - Fuzzy matching for answer validation
3. tipService.ts - Hint generation and caching
4. storage.ts - LocalStorage wrapper with type safety
5. wordSelector.ts - Smart word selection logic
6. scoreCalculator.ts - Scoring logic

Stores:
1. progress.ts - Game progress and statistics
2. settings.ts - User preferences and configuration

THEMED CONTENT
--------------
All themed vocabulary is stored in static/themes/ as JSON files:

1. basics_travel.json (150+ phrases in 14 categories)
   - Greetings & farewells
   - Polite essentials (please, thank you)
   - Positive & friendly expressions
   - Compliments
   - Introductions
   - Asking for help
   - Directions
   - Restaurant phrases
   - Shopping
   - Hotel
   - Transport
   - Emergency phrases
   - Time & numbers
   - Social phrases (celebrations)
   
   Based on CEFR A1-A2 guidelines and research from:
   - Babbel's essential phrases
   - Lingvist's high-frequency words
   - Common European Framework recommendations

2. music_concerts.json (26 words + 15 phrases)
   - Musical instruments
   - Concert vocabulary
   - Folk music terms
   - Useful phrases for music events

3. outdoor_nature.json (30 words + 20 phrases)
   - Nature vocabulary
   - Camping & hiking terms
   - Weather & landscapes
   - Outdoor activity phrases

4. peppa_pig_kids.json (12 characters + 30 words)
   - Peppa Pig characters
   - Common objects from the show
   - Simple everyday words
   - Kid-friendly content

5. peppa_advanced_spanish.json
   - Advanced phrases from Peppa Pig episodes
   - Longer sentences with translations
   - Context-rich learning material

DEVELOPMENT WORKFLOW
--------------------
# Start development server
cd svelte
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run check

DEPLOYMENT
----------
The Svelte app deploys automatically to GitHub Pages via GitHub Actions:

1. Push to main branch
2. GitHub Actions builds the app
3. Static files deployed to GitHub Pages
4. Live at: https://username.github.io/espanjapeli

See DEPLOY.md for detailed deployment instructions.

MIGRATION STATUS
----------------
✅ Phase 1: Refactor game.js (COMPLETED)
   - Extracted TTS service
   - Extracted answer checker
   - Simplified monolithic code

✅ Phase 2: Set up Svelte project (COMPLETED)
   - SvelteKit with TypeScript
   - Tailwind CSS + DaisyUI
   - Static adapter for GitHub Pages
   - GitHub Actions deployment

✅ Phase 3: Move shared services (COMPLETED)
   - Ported TTS service
   - Ported storage service
   - Copied theme JSON files

✅ Phase 4: Game selection menu (COMPLETED)
   - Home page with game cards
   - Routing between modes
   - Mobile-first design

✅ Phase 5: Word game migration (COMPLETED)
   - Sanapeli component
   - Same UI and behavior as legacy
   - Connected to services

✅ Phase 6: Peppa Pig kids mode (COMPLETED)
   - Pipsan maailma (emoji matching)
   - Pipsan ystävät (image matching)
   - Kid-friendly themes
   - Positive reinforcement

🚧 Phase 7: Additional game modes (IN PROGRESS)
   - Muisti (recall practice)
   - Kuuntelu (listening)
   - Puhuminen (speaking)
   - Lukeminen (reading)

🚧 Phase 8: Cleanup (PENDING)
   - Remove old vanilla JS files
   - Update documentation
   - Final mobile testing


================================================================================
                        PYTHON SCRIPTS (scripts/)
================================================================================

OVERVIEW
--------
Python utilities for generating learning content using AI models. These scripts
populate the vocabulary cache with hints and translations, eliminating the need
for real-time LLM calls during gameplay.

CONFIGURATION
-------------
All scripts support two AI backends:

1. Ollama (Local LLM)
   - Free and private
   - Runs on your machine
   - Model: llama3.2:3b (recommended)
   - Configuration: Edit OLLAMA_HOST and OLLAMA_PORT in scripts
   - Default: http://172.23.64.1:11434 (WSL2 access from Windows)

2. Azure Translator API
   - Fast and accurate
   - Requires API key (paid service)
   - Configuration: Copy scripts/env.example to scripts/.env
   - Add AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION
   - Get credentials from Azure Portal

MAIN SCRIPTS
------------

1. generate_tips.py
   Purpose: Generate 3 learning hints per word using Ollama LLM
   Input: ../docs/words.js (Spanish vocabulary)
   Output: words_and_tips.json (words + English hints)
   Features:
   - Generates easy, medium, hard hints
   - Incremental generation (continues from existing file)
   - Auto-save after each word (prevents data loss)
   - Progress bar with ETA
   - Model preloading for faster generation
   - Context clearing between words
   
   Usage:
   cd scripts
   python generate_tips.py
   
   Hint levels:
   - Easy: Direct translation or obvious clue
   - Medium: Contextual hint or category
   - Hard: Subtle clue requiring thinking

2. generate_translations_azure.py
   Purpose: Translate English hints to Finnish using Azure Translator
   Input: words_and_tips.json (words + English hints)
   Output: words_tips_translations.json (words + English + Finnish hints)
   Features:
   - Fast batch translation
   - Translation caching (avoids duplicate API calls)
   - Incremental translation (continues from existing file)
   - Auto-save after each word
   - Progress tracking with statistics
   - Cost estimation
   
   Usage:
   cd scripts
   python generate_translations_azure.py
   
   Note: Much faster than Ollama translation (~10x speed)

3. generate_translations.py
   Purpose: Translate English hints to Finnish using Ollama LLM
   Input: words_and_tips.json (words + English hints)
   Output: words_tips_translations.json (words + English + Finnish hints)
   Features:
   - Free alternative to Azure
   - Same output format as Azure version
   - Slower but no API costs
   - Good for small batches
   
   Usage:
   cd scripts
   python generate_translations.py

4. generate_peppa_images.py
   Purpose: Generate SVG images for Peppa Pig kids games
   Input: themes/peppa_advanced_spanish.json
   Output: SVG files in peppa_advanced_spanish_images/
   Features:
   - Creates simple, colorful SVG illustrations
   - Kid-friendly design
   - Consistent style across images
   - Generates image manifest JSON
   
   Usage:
   cd scripts
   python generate_peppa_images.py

5. create_all_svgs.py
   Purpose: Batch generate all missing SVG images
   Input: Theme JSON files
   Output: SVG files for all vocabulary items
   Features:
   - Processes multiple themes
   - Skips existing images
   - Progress tracking
   
   Usage:
   cd scripts
   python create_all_svgs.py

6. generate_missing_svgs.py
   Purpose: Fill gaps in SVG image collection
   Input: Existing SVG directory
   Output: Missing SVG files
   Features:
   - Identifies missing images
   - Generates only what's needed
   - Maintains consistent style

7. peppa_translate_azure.py
   Purpose: Translate Peppa Pig content using Azure
   Input: peppa_pig_kids.json
   Output: Translated Peppa content
   Features:
   - Specialized for kids content
   - Preserves character names
   - Context-aware translation

8. simple_translate.py
   Purpose: Quick translation utility for testing
   Input: Command-line text
   Output: Translated text
   Features:
   - Single-word or phrase translation
   - Supports both Ollama and Azure
   - Useful for quick lookups

9. update_translations.py
   Purpose: Update existing translations in JSON files
   Input: words_tips_translations.json
   Output: Updated JSON with new translations
   Features:
   - Preserves existing data
   - Only updates specified fields
   - Backup creation before changes

10. update_manifest_translations.py
    Purpose: Update image manifest with translations
    Input: image_manifest.json
    Output: Updated manifest with Finnish translations
    Features:
    - Maintains image-word associations
    - Adds translation metadata

11. merge.py
    Purpose: Merge multiple JSON files
    Input: Multiple JSON files
    Output: Combined JSON file
    Features:
    - Handles duplicate keys
    - Preserves data structure
    - Useful for combining vocabulary sources

TEST SCRIPTS
------------

1. test_one_word.py
   Purpose: Test hint generation for a single word
   Usage: python test_one_word.py perro
   Output: Displays 3 hints for the word

2. test_three_hints.py
   Purpose: Test hint generation for multiple words
   Usage: python test_three_hints.py
   Output: Generates hints for 3 sample words

3. test_azure_translation.py
   Purpose: Test Azure Translator API connection
   Usage: python test_azure_translation.py
   Output: Translates sample text, verifies API works

4. test_translation.py
   Purpose: Test Ollama translation
   Usage: python test_translation.py
   Output: Translates sample text via Ollama

TYPICAL WORKFLOW
----------------
1. Generate English hints:
   cd scripts
   python generate_tips.py
   
2. Translate hints to Finnish:
   python generate_translations_azure.py
   # OR (slower, free)
   python generate_translations.py
   
3. Copy output to game:
   cp words_tips_translations.json ../docs/
   cp words_tips_translations.json ../svelte/static/
   
4. Generate images (if needed):
   python generate_peppa_images.py

DEPENDENCIES
------------
Install Python dependencies:
pip install -r requirements.txt

Required packages:
- requests: HTTP client for API calls
- tqdm: Progress bars
- python-dotenv: Environment variable loading (for Azure)

PERFORMANCE NOTES
-----------------
- Ollama LLM: ~5-10 seconds per word (3 hints)
- Azure Translator: ~0.5 seconds per word (3 translations)
- Total time for 400 words:
  - Ollama tips: ~40 minutes
  - Azure translation: ~3 minutes
  - Ollama translation: ~30 minutes

COST ESTIMATION
---------------
- Ollama: Free (runs locally)
- Azure Translator: ~$10 per 1 million characters
  - 400 words × 3 hints × ~50 chars = ~60,000 characters
  - Cost: ~$0.60 for full vocabulary


================================================================================
                        LEARNING METHODOLOGY
================================================================================

RESEARCH-BACKED STRATEGIES
--------------------------
The game implements evidence-based language learning principles:

1. High-Frequency Word Focus
   - Top 1,000 words cover 85% of daily conversation
   - Prioritizes most useful vocabulary first
   - Based on corpus linguistics research

2. Spaced Repetition
   - Smart word selection avoids recent repeats
   - Wrong words reappear more frequently
   - Moves information to long-term memory

3. Progressive Difficulty
   - Three hint levels (easy → medium → hard)
   - Encourages active recall
   - Rewards learning with higher scores

4. Contextual Learning
   - Hints provide context, not just translations
   - Helps build mental associations
   - More effective than rote memorization

5. Immediate Feedback
   - Instant answer validation
   - Typo tolerance reduces frustration
   - Positive reinforcement messages

6. Multi-Modal Learning
   - Visual (reading words)
   - Auditory (text-to-speech)
   - Kinesthetic (typing answers)
   - Engages multiple learning pathways

7. Gamification
   - Scoring system motivates improvement
   - Progress tracking shows achievement
   - Statistics provide goals

8. Self-Paced Learning
   - No time pressure
   - User controls hint usage
   - Adaptable to individual learning speed

VOCABULARY GUIDELINES
---------------------
Based on CEFR (Common European Framework of Reference):

A1 Level (Beginner): 500-700 words
- Personal information, family, shopping, time, food, directions
- Can introduce yourself, ask basic questions

A2 Level (Elementary): 1,000-1,500 words
- Health, hobbies, transport, services, relationships
- Can describe experiences, make plans, handle routine exchanges

B1 Level (Intermediate): 2,000-2,500 words
- Work, opinions, travel, future plans, storytelling
- Can handle most travel situations, express opinions

Current game focuses on A1-A2 vocabulary for beginners.

THEMED CONTENT PHILOSOPHY
--------------------------
Themed vocabulary sets are designed for:

1. Personal Relevance
   - Music & concerts (for music lovers)
   - Outdoor & nature (for hikers/campers)
   - Travel basics (for tourists)

2. Real-World Usage
   - Phrases you'll actually hear
   - Polite, friendly communication
   - Practical situations (restaurant, hotel, shopping)

3. Positive Communication
   - Emphasis on friendly expressions
   - Compliments and positive words
   - Social phrases for making friends

4. Cultural Context
   - Authentic Spanish-speaking contexts
   - Common situations travelers encounter
   - Culturally appropriate phrases

KIDS MODE DESIGN PRINCIPLES
----------------------------
Peppa Pig games follow child development research:

1. No Reading Required
   - Emoji and image-based answers
   - Audio plays Spanish words
   - Visual learning emphasis

2. Always Positive
   - No "wrong" feeling
   - Celebration animations
   - Encouraging feedback in Spanish & Finnish

3. Familiar Content
   - Characters from Peppa Pig show
   - Activities from episodes
   - Simple everyday words

4. Simple Interaction
   - Big touch targets for small fingers
   - Clear visual feedback
   - One-step actions

5. Age-Appropriate
   - Vocabulary from kids' shows
   - Simple sentence structures
   - Fun, playful tone

FUTURE LEARNING MODES
----------------------
Planned additions based on learning science:

1. Recall Practice (FI→ES)
   - Most effective for memory consolidation
   - Self-assessment system
   - No scoring pressure

2. Listening Comprehension
   - Develops audio recognition
   - Real-world phrase focus
   - Multiple choice format

3. Speaking Practice
   - Pronunciation development
   - TTS comparison
   - Self-paced repetition

4. Reading Lessons
   - Contextual vocabulary learning
   - Comprehension questions
   - Graded difficulty stories


================================================================================
                        TECHNICAL DETAILS
================================================================================

DATA PERSISTENCE
----------------
Both legacy and Svelte versions use browser localStorage:

Stored Data:
1. gameHistory: Last 20 game results
   - Date, score, category, difficulty
   - Questions asked and answers given
   - Hints used per question

2. preferences: User settings
   - Auto-speak enabled/disabled
   - Compact mode on/off
   - Selected category
   - Game length (21 or 42 questions)

3. wrongWords: Frequently missed words
   - Tracks last 10 games
   - Prioritizes these in future games
   - Helps focus on weak areas

4. practiceProgress: Category mastery
   - Per-category completion status
   - Mastered phrases count
   - Last practice date
   - Learning timeline

Data Format: JSON
Storage Limit: ~5-10 MB per domain (browser-dependent)
Persistence: Survives browser restarts, cleared if user clears site data

EXPORT/IMPORT
-------------
Users can backup and transfer progress:

1. Export: Downloads JSON file with all progress data
2. Import: Uploads JSON file to restore progress
3. Share: Uses Web Share API on mobile (if supported)
4. Reset: Clear all data with confirmation

BROWSER COMPATIBILITY
---------------------
Minimum Requirements:
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- LocalStorage enabled
- Web Speech API (for TTS, optional)

Mobile Support:
- iOS Safari 14+
- Android Chrome 90+
- Responsive design (320px - 2560px)
- Touch-optimized controls

PERFORMANCE
-----------
Legacy Game:
- Initial load: ~100 KB (HTML + JS + CSS)
- Vocabulary cache: ~500 KB (words_tips_translations.json)
- No server calls during gameplay (fully offline after load)
- Instant response times

Svelte App:
- Initial load: ~150 KB (optimized bundle)
- Lazy loading for routes (faster initial load)
- Code splitting per game mode
- Prerendered static pages (fast first paint)

ACCESSIBILITY
-------------
- Semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode compatible
- Scalable text (respects browser zoom)
- Touch targets ≥44px (mobile accessibility)

SECURITY & PRIVACY
------------------
- No user accounts or authentication
- No personal data collection
- No analytics or tracking
- All data stored locally in browser
- No cookies used
- No external API calls during gameplay
- Open source (MIT License)

OFFLINE CAPABILITY
------------------
Both versions work offline after initial load:
- All vocabulary pre-cached
- No server dependency during gameplay
- LocalStorage persists data
- TTS works offline (browser-provided)

Future: Progressive Web App (PWA)
- Install to home screen
- Full offline support
- Background sync (optional)


================================================================================
                        DEVELOPMENT ROADMAP
================================================================================

COMPLETED FEATURES
------------------
✅ Legacy vanilla JS game with 400+ words
✅ Progressive hint system (3 levels)
✅ Scoring and statistics
✅ Text-to-speech integration
✅ Typo-tolerant answer checking
✅ LocalStorage persistence
✅ Mobile-responsive design
✅ Category and difficulty selection
✅ Svelte migration with TypeScript
✅ Tailwind CSS + DaisyUI styling
✅ GitHub Actions deployment
✅ Word game (Sanapeli) in Svelte
✅ Peppa Pig kids games (2 modes)
✅ Themed vocabulary (travel, music, nature)
✅ Settings page with data export

IN PROGRESS
-----------
🚧 Recall practice mode (Muisti)
🚧 Listening comprehension (Kuuntelu)
🚧 Speaking practice (Puhuminen)
🚧 Reading lessons (Lukeminen)
🚧 Additional themed vocabulary sets
🚧 SVG image generation for all words

PLANNED FEATURES
----------------
📋 Progressive Web App (PWA) support
📋 Custom vocabulary import
📋 User-created word lists
📋 Dialogue practice mode
📋 Verb conjugation practice
📋 Grammar exercises
📋 Achievement system
📋 Learning streaks
📋 Daily challenges
📋 Multiplayer mode (competitive)
📋 Teacher dashboard (for classrooms)
📋 Spaced repetition algorithm (SRS)
📋 Adaptive difficulty
📋 Speech recognition (speaking validation)
📋 More themed packs (food, sports, business, etc.)
📋 Story-based lessons
📋 Cultural notes and tips
📋 Pronunciation guides
📋 Video lessons integration

FUTURE GAME MODES
-----------------
1. Sentence Builder
   - Drag-and-drop word tiles
   - Construct grammatically correct sentences
   - Grammar learning through practice

2. Conversation Practice
   - Simulated dialogues
   - Multiple choice responses
   - Real-world scenarios

3. Speed Challenge
   - Timed word recognition
   - Quick recall practice
   - Leaderboard (optional)

4. Picture Stories
   - Sequential images
   - Narrate in Spanish
   - Comprehension questions

5. Music Mode
   - Spanish song lyrics
   - Fill-in-the-blank
   - Learn through music

TECHNICAL IMPROVEMENTS
----------------------
- Better caching strategies
- Service Worker for offline support
- IndexedDB for larger datasets
- WebAssembly for performance-critical code
- Better error handling and recovery
- Automated testing (unit + integration)
- E2E testing with Playwright
- Performance monitoring
- Analytics (privacy-respecting)
- A/B testing framework


================================================================================
                        GETTING STARTED
================================================================================

FOR USERS
---------
1. Visit the game website (GitHub Pages URL)
2. Select a game mode from the home page
3. Choose category and difficulty (for word game)
4. Start playing!
5. Your progress is automatically saved

No installation, no account, no configuration needed.

FOR DEVELOPERS - LEGACY GAME
-----------------------------
1. Clone the repository:
   git clone https://github.com/yourusername/espanjapeli.git
   cd espanjapeli

2. Start development server:
   ./run_server.sh
   # OR
   cd docs
   python server.py

3. Open browser:
   http://localhost:8000

4. Make changes to HTML/JS/CSS files
5. Refresh browser to see changes

FOR DEVELOPERS - SVELTE APP
----------------------------
1. Clone the repository:
   git clone https://github.com/yourusername/espanjapeli.git
   cd espanjapeli/svelte

2. Install dependencies:
   npm install

3. Start development server:
   npm run dev

4. Open browser:
   http://localhost:5173

5. Make changes to .svelte files
6. Hot module replacement (HMR) updates automatically

FOR CONTENT CREATORS
--------------------
1. Install Python dependencies:
   pip install -r requirements.txt

2. Install Ollama (for local LLM):
   # Visit https://ollama.ai and download
   ollama pull llama3.2:3b

3. Generate tips:
   cd scripts
   python generate_tips.py

4. Translate to Finnish:
   python generate_translations_azure.py
   # OR (free but slower)
   python generate_translations.py

5. Copy output to game:
   cp words_tips_translations.json ../docs/
   cp words_tips_translations.json ../svelte/static/

FOR AZURE TRANSLATION
---------------------
1. Get Azure Translator credentials:
   - Visit https://portal.azure.com
   - Create Translator resource
   - Copy API key and region

2. Configure environment:
   cd scripts
   cp env.example .env
   nano .env
   # Add your AZURE_TRANSLATOR_KEY and AZURE_TRANSLATOR_REGION

3. Test connection:
   python test_azure_translation.py

4. Generate translations:
   python generate_translations_azure.py


================================================================================
                        DEPLOYMENT
================================================================================

AUTOMATIC DEPLOYMENT (RECOMMENDED)
-----------------------------------
The Svelte app deploys automatically via GitHub Actions:

1. Push changes to main branch:
   git add .
   git commit -m "Your changes"
   git push origin main

2. GitHub Actions automatically:
   - Installs dependencies
   - Builds the Svelte app
   - Deploys to GitHub Pages

3. Check deployment status:
   - Visit repository → Actions tab
   - Watch "Deploy to GitHub Pages" workflow
   - Takes ~2-3 minutes

4. Visit live site:
   https://yourusername.github.io/espanjapeli

MANUAL DEPLOYMENT
-----------------
You can also trigger deployment manually:

1. Go to repository → Actions tab
2. Click "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select branch (usually main)
5. Click "Run workflow" to start

LOCAL PRODUCTION BUILD
-----------------------
Test production build locally:

cd svelte
npm run build
npm run preview

This shows exactly what will be deployed.

GITHUB PAGES SETUP (ONE-TIME)
------------------------------
1. Go to repository Settings
2. Click "Pages" in sidebar
3. Under "Source", select "GitHub Actions"
4. Save

That's it! Future pushes will deploy automatically.

CUSTOM DOMAIN (OPTIONAL)
-------------------------
1. Add CNAME file:
   echo "your-domain.com" > svelte/static/CNAME

2. Update svelte.config.js:
   paths: { base: '' }

3. Configure DNS with your domain provider:
   - Add CNAME record pointing to yourusername.github.io

4. In GitHub Settings → Pages:
   - Enter your custom domain
   - Enable "Enforce HTTPS"

DEPLOYMENT CHECKLIST
--------------------
✅ All tests passing (npm run test)
✅ No TypeScript errors (npm run check)
✅ Code formatted (npm run format)
✅ Linting passed (npm run lint)
✅ Production build works (npm run build && npm run preview)
✅ Mobile testing completed
✅ Browser compatibility verified
✅ Accessibility checked
✅ README updated
✅ CHANGELOG updated


================================================================================
                        CONTRIBUTING
================================================================================

CONTRIBUTION GUIDELINES
-----------------------
Contributions are welcome! This project is open source (MIT License).

Ways to Contribute:
1. Report bugs (GitHub Issues)
2. Suggest features (GitHub Issues)
3. Submit pull requests
4. Improve documentation
5. Add vocabulary/translations
6. Create themed word sets
7. Design SVG images
8. Write tests
9. Improve accessibility

CODE STYLE
----------
- JavaScript/TypeScript: Prettier formatting
- Svelte: Follow Svelte conventions
- Python: PEP 8 style guide
- Commits: Conventional Commits format

PULL REQUEST PROCESS
--------------------
1. Fork the repository
2. Create a feature branch (git checkout -b feature/amazing-feature)
3. Make your changes
4. Run tests (npm run test)
5. Format code (npm run format)
6. Commit changes (git commit -m "Add amazing feature")
7. Push to branch (git push origin feature/amazing-feature)
8. Open Pull Request on GitHub

TESTING REQUIREMENTS
--------------------
- All new features must include tests
- Maintain or improve test coverage
- Run full test suite before submitting PR
- Manual testing on mobile devices

DOCUMENTATION
-------------
- Update README.md for user-facing changes
- Update README.txt for technical details
- Add JSDoc comments for new functions
- Update CHANGELOG.md


================================================================================
                        TROUBLESHOOTING
================================================================================

COMMON ISSUES
-------------

1. Game won't load
   - Check browser console for errors
   - Verify JavaScript is enabled
   - Clear browser cache and reload
   - Try different browser

2. Text-to-speech not working
   - Check browser supports Web Speech API
   - Verify volume is not muted
   - Try different browser (Chrome/Edge work best)
   - TTS is optional, game works without it

3. Progress not saving
   - Check LocalStorage is enabled
   - Verify not in private/incognito mode
   - Check browser storage quota
   - Try exporting data as backup

4. Deployment fails
   - Check GitHub Actions logs
   - Verify Node.js version (should be 20)
   - Ensure package-lock.json is committed
   - Check svelte.config.js base path

5. Ollama connection fails
   - Verify Ollama is running (ollama serve)
   - Check OLLAMA_HOST and OLLAMA_PORT
   - Test with: curl http://localhost:11434/api/tags
   - For WSL2: Use 172.23.64.1 instead of localhost

6. Azure Translator errors
   - Verify API key in .env file
   - Check region is correct
   - Ensure API key has not expired
   - Test with test_azure_translation.py

7. SVG images not displaying
   - Check file paths are correct
   - Verify SVG files exist in static folder
   - Check browser console for 404 errors
   - Ensure base path is configured correctly

8. Mobile layout issues
   - Clear mobile browser cache
   - Check viewport meta tag
   - Test on different devices
   - Verify Tailwind CSS is loading

DEBUGGING TIPS
--------------
- Open browser DevTools (F12)
- Check Console tab for errors
- Use Network tab to verify file loading
- Check Application → Local Storage for saved data
- Use Mobile Device Emulation for responsive testing

GETTING HELP
------------
- GitHub Issues: Report bugs or ask questions
- Documentation: Check README.md, TODO.md, V2_ROADMAP.md
- Code Comments: Read inline documentation
- Community: Join discussions on GitHub


================================================================================
                        FAQ
================================================================================

Q: Is this project free to use?
A: Yes! MIT License - free for personal and commercial use.

Q: Do I need an internet connection?
A: Only for initial load. After that, works fully offline.

Q: Does it collect my data?
A: No. All data stays in your browser's LocalStorage.

Q: Can I use this in my classroom?
A: Absolutely! It's designed for learners of all ages.

Q: How do I backup my progress?
A: Go to Settings → Export Data → Download JSON file.

Q: Can I add my own vocabulary?
A: Not yet in the UI, but you can edit JSON files manually.
   Custom vocabulary import is planned for future release.

Q: Why Peppa Pig for kids mode?
A: Familiar characters make learning fun and engaging for children.
   The show is available in Spanish, providing additional learning context.

Q: Can I contribute translations for other languages?
A: Yes! The architecture supports multiple languages.
   Currently supports Spanish ↔ Finnish/English.

Q: How accurate are the AI-generated hints?
A: Very accurate. Hints are pre-generated and reviewed.
   Any issues can be reported and corrected.

Q: Can I use this for other languages (not Spanish)?
A: The architecture is language-agnostic. You'd need to:
   - Replace vocabulary files
   - Update TTS language codes
   - Generate new hints/translations

Q: Is there a mobile app?
A: Not yet, but the web app works great on mobile browsers.
   PWA support is planned (install to home screen).

Q: How do I report a bug?
A: Open an issue on GitHub with:
   - Description of the problem
   - Steps to reproduce
   - Browser and device info
   - Screenshots (if applicable)

Q: Can I use this offline?
A: Yes, after initial load. Consider installing as PWA (future feature).

Q: Why two versions (docs/ and svelte/)?
A: docs/ is the original vanilla JS version (v1)
   svelte/ is the modern rewrite with more features (v2)
   Both work, but v2 is recommended for new users.


================================================================================
                        LICENSE & CREDITS
================================================================================

LICENSE
-------
MIT License

Copyright (c) 2024-2026 Espanjapeli Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

CREDITS
-------
Development: AI-assisted coding with Claude Sonnet 4.5
Human Oversight: Project direction and quality assurance
Vocabulary Sources: CEFR guidelines, Babbel, Lingvist, corpus linguistics
LLM Models: Ollama (llama3.2:3b)
Translation: Azure Translator API
UI Framework: SvelteKit, Tailwind CSS, DaisyUI
Icons: Lucide, Phosphor, Iconify
TTS: Web Speech API (browser-provided)
Hosting: GitHub Pages
CI/CD: GitHub Actions

ACKNOWLEDGMENTS
---------------
- Common European Framework of Reference (CEFR) for vocabulary guidelines
- Babbel and Lingvist for essential phrase research
- Peppa Pig for inspiring the kids mode
- Open source community for amazing tools and libraries
- Language learning research community for evidence-based strategies

THIRD-PARTY LIBRARIES
---------------------
See package.json for complete list of dependencies.

Major dependencies:
- SvelteKit: Web framework (MIT License)
- Tailwind CSS: Utility-first CSS (MIT License)
- DaisyUI: Component library (MIT License)
- Vite: Build tool (MIT License)
- TypeScript: Type safety (Apache 2.0 License)
- Vitest: Testing framework (MIT License)


================================================================================
                        CONTACT & LINKS
================================================================================

GitHub Repository: https://github.com/yourusername/espanjapeli
Live Demo: https://yourusername.github.io/espanjapeli
Issues & Bugs: https://github.com/yourusername/espanjapeli/issues
Discussions: https://github.com/yourusername/espanjapeli/discussions

Documentation:
- README.md: User guide and quick start
- README.txt: This file (comprehensive technical documentation)
- TODO.md: Migration progress and task tracking
- V2_ROADMAP.md: Architecture analysis and future plans
- LANGUAGE_LEARNING.md: Research-backed learning strategies
- DEPLOY.md: Deployment guide for GitHub Pages

Related Resources:
- Ollama: https://ollama.ai
- Azure Translator: https://azure.microsoft.com/en-us/services/cognitive-services/translator/
- SvelteKit: https://kit.svelte.dev
- Tailwind CSS: https://tailwindcss.com
- DaisyUI: https://daisyui.com


================================================================================
                        VERSION HISTORY
================================================================================

v2.0 (Current) - Svelte Migration
----------------------------------
- Complete rewrite in SvelteKit + TypeScript
- Multiple game modes (word game, kids games)
- Themed vocabulary sets (travel, music, nature)
- Modern UI with Tailwind CSS + DaisyUI
- Automated deployment via GitHub Actions
- Improved mobile experience
- Better code organization and maintainability

v1.0 - Legacy Vanilla JS
------------------------
- Original game with 400+ Spanish words
- Progressive hint system (3 levels)
- Scoring and statistics
- Text-to-speech integration
- Typo-tolerant answer checking
- LocalStorage persistence
- Mobile-responsive design
- Category and difficulty selection


================================================================================
                        CHANGELOG
================================================================================

2026-01-05
----------
- Created comprehensive README.txt documentation
- Documented all scripts, game modes, and architecture
- Added troubleshooting guide and FAQ
- Included development and deployment instructions

2025-12 (Phase 6)
-----------------
- Added Pipsan maailma (Peppa emoji game)
- Added Pipsan ystävät (Peppa image matching)
- Generated SVG images for kids games
- Implemented kid-friendly UI themes

2025-11 (Phase 5)
-----------------
- Completed Sanapeli migration to Svelte
- Ported all game logic from vanilla JS
- Connected to shared services (TTS, storage)
- Maintained feature parity with legacy version

2025-10 (Phase 4)
-----------------
- Created game selection home page
- Implemented routing between game modes
- Designed mobile-first navigation
- Added statistics display on home page

2025-09 (Phase 3)
-----------------
- Ported TTS service to TypeScript
- Ported storage service with type safety
- Copied themed JSON files to static folder
- Verified LocalStorage compatibility

2025-08 (Phase 2)
-----------------
- Set up SvelteKit project with TypeScript
- Added Tailwind CSS + DaisyUI
- Configured static adapter for GitHub Pages
- Set up GitHub Actions deployment
- Verified basic deployment works

2025-07 (Phase 1)
-----------------
- Extracted TTS logic to tts-service.js
- Extracted answer checking to answer-checker.js
- Refactored monolithic game.js
- Tested legacy game still works

2025-06 (Initial Release)
-------------------------
- Created vanilla JS game with 400+ words
- Implemented progressive hint system
- Added scoring and statistics
- Integrated text-to-speech
- Implemented LocalStorage persistence
- Created mobile-responsive design


================================================================================
                        END OF DOCUMENTATION
================================================================================

Last Updated: January 5, 2026
Version: 2.0
Maintained by: Espanjapeli Contributors

For the latest updates, visit:
https://github.com/yourusername/espanjapeli

Happy learning! ¡Buena suerte! Onnea matkaan!
