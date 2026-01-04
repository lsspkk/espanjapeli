# TODO - Espanjapeli v2 Migration


## Phase 1: Refactor game.js monolith (vanilla JS)

Before migrating to Svelte, simplify the current code:

- [x] Extract TTS logic into separate tts-service.js
- [x] Extract answer checking into answer-checker.js (fuzzy matching, typo tolerance)
- [x] ~~Extract UI state management into game-state.js~~ (SKIPPED - see note below)
- [x] Test that everything still works after each extraction

Notes:
- Scoring logic stays in game.js — it's specific to the word game (tip penalties,
  point calculation). Other games have different or no scoring (practice modes, kids mode).
- UI state management (game-state.js) was skipped because:
  1. The core function is just one line: `container.setAttribute('data-state', state)`
  2. Each game has different states (word game: home/playing/answered/report,
     practice modes: home/practice/revealed, kids mode: home/playing/celebration)
  3. The pattern is good but the states are game-specific, not shareable

## Phase 2: Set up Svelte project

Choose simplest approach:

- [x] Create new SvelteKit project in /svelte or similar folder
- [x] Add Tailwind CSS
- [x] Add DaisyUI (has 30+ themes, kid-friendly colors, ready components)
- [x] Configure for static build (GitHub Pages deployment)
- [x] Set up GitHub Actions to build and deploy
- [x] Verify basic "hello world" deploys correctly

## Phase 3: Move shared services to Svelte

- [x] Port tts-service.js to src/lib/services/tts.ts
- [x] Port storage.js to src/lib/stores/progress.ts
- [x] Copy theme JSON files to static/themes/
- [x] Verify localStorage format stays compatible

## Phase 4: Game selection menu

- [x] Create home page with game mode selection
- [x] Design simple navigation (cards/buttons for each game)
- [x] Style for mobile first
- [x] Add routing between game modes

## Phase 5: Convert word game to Svelte component

- [x] Create WordGame.svelte component
- [x] Keep same UI and behavior as current game
- [x] Connect to ported services (TTS, storage)
- [ ] Test on mobile
- [ ] Verify progress data carries over from old version

## Phase 6: Add Peppa Pig kids mode ✅

- [x] Create PeppaPig.svelte component
- [x] Picture-based answers (no reading required)
- [x] Big colorful buttons for small fingers
- [x] Audio plays Spanish word
- [x] Fun celebrations when correct
- [x] Use kid-friendly DaisyUI theme
- [x] Load content from themes/peppa_pig_kids.json

## Phase 7: Cleanup

- [ ] Remove old vanilla JS files from docs/
- [ ] Update README
- [ ] Final testing on mobile devices

---

Notes:
- Current game.js is about 1200 lines
- LocalStorage format should not change (no data loss)
- DaisyUI chosen for ready-made components and theming
- Kids mode needs big touch targets and positive feedback only

