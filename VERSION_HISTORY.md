# Version History

This document summarizes the major version milestones and provides concise best practices for continued development and maintenance.

## V4.0.0 - 2026-01-14

### Focus: Frequency-Based Learning & Story Expansion

Version 4 transforms Espanjapeli into a comprehensive Spanish learning platform with frequency-based vocabulary prioritization and extensive story content.

### Major Features

**Frequency-Based Learning System**
- Integrated Spanish word frequency data (top 5000 words)
- Smart word selection prioritizing high-frequency vocabulary
- Frequency badges in game UI (Top 100, 500, 1000, etc.)
- Post-game frequency summaries showing word importance
- CEFR level estimation based on vocabulary knowledge

**Story Mode Expansion**
- Expanded from 8 to 38 stories across CEFR levels (A1, A2, B1)
- Mobile-optimized reading experience with stacked layouts
- Story vocabulary integration with main word knowledge system
- Word-to-story index for tracking vocabulary encounters
- Enhanced story reader with progress indicators

**Progress Tracking & Statistics**
- Comprehensive vocabulary statistics page (`/sanasto`)
- Milestone celebrations for learning achievements
- Shareable progress reports
- Data export/import for backup and restore
- Detailed word knowledge tracking across all game modes

**User Experience Improvements**
- New navigation bar with hamburger menu
- Settings page with TTS controls and theme selection
- Licenses and attribution page (`/tietoja`)
- Game settings for frequency prioritization
- Mobile-first design throughout

### Technical Improvements

**Data Pipeline**
- Python scripts for frequency data processing
- Story generation and translation automation
- Vocabulary enrichment with frequency metadata
- Comprehensive test coverage (573 tests passing)

**Architecture**
- Enhanced service layer (vocabularyService, statisticsService, shareService)
- New stores (gameSettings, ttsSettings)
- Improved component organization
- localStorage persistence with validation

**Testing**
- Integration tests for localStorage persistence
- Data export/import test coverage
- Component tests for new features
- All tests passing (48 test files, 573 tests)

### Data Sources

- Spanish frequency data: Hermit Dave's Word Frequency Lists (CC-BY 4.0)
- Finnish frequency data: Institute for the Languages of Finland (CC-BY 4.0)
- Story content: Original and adapted from open sources

### Breaking Changes

None - V4 is fully backward compatible with V3 data.

### Migration Notes

- Existing word knowledge data is automatically migrated
- Story difficulty levels mapped to CEFR (beginner → A2, intermediate → B1)
- No user action required for upgrade

### Statistics

- 38 total stories (10 A1, 18 A2, 10 B1)
- 5000 frequency-ranked Spanish words
- 573 passing tests
- 48 test files
- ~50KB initial bundle size (optimized with lazy loading)

---

## V3 2026-01-12
- Focus: architecture, features, and UX.
- Implementation: full SvelteKit migration, componentization, Svelte stores for state, TypeScript types, new game modes (`Yhdistä sanat`, `Tarinat`), unified knowledge tracking, progress cards, and adaptive selection logic.
- Result: modular codebase suitable for further refactors and testing.

### V2 2026-01-09
- Focus: kids' image/emoji games and richer visual assets.
- Implementation: added dedicated children modes; more static assets (images/animations).
- Caveat: some graphics were AI-generated and of low quality; review for copyright risks before reuse.


### V1 2026-01-07
- Focus: core vocabulary practice via `Sanapeli`.
- Implementation: plain HTML/CSS/JS, monolithic pages.
- Notes: minimal testing, no unified state store.
