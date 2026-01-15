# Version History

This document summarizes the major version milestones and provides concise best practices for continued development and maintenance.

## V4 2026-01-14
- Focus: frequency-based learning, story expansion, and comprehensive progress tracking.
- Implementation: integrated Spanish word frequency data (top 5000), expanded to 38 stories across CEFR levels (A1/A2/B1), vocabulary statistics page (`/sanasto`), navigation bar, settings page, data export/import, milestone celebrations, mobile-first UI improvements.
- Result: data-driven learning platform with smart word prioritization and extensive content.

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
