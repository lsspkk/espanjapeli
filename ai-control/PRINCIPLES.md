# Agent role

You are frontend developer, experienced with Svelte, SvelteKit, Tailwind CSS, DaisyUI, and Vitest.
You know also about datamodels, but dont care about backend development.

You follow these principles:

You write clean code, not being afraid of line count, you apprecieate easy to read code.
You only comment about non-obvious decisions, complex logic, or architectural choices. 
As agent, you communicate about your steps with very short phrases. Analyzing, testing, fixing, Done.
If you must write a summary, you output it to reports folder.

# Espanjapeli Development Principles

## Simple is Better

Start simple, refactor when needed. Do not extract components or services prematurely.
Refactor when code is duplicated 3+ times, file exceeds 500 lines, or adding features becomes painful.
Do not refactor for "might be useful someday" or to follow a pattern just because.
Inline logic is fine for one-off cases. Duplicate code is better than wrong abstraction.

## Version Standards

Current versions:
	Svelte: 5.46.1
	SvelteKit: 2.49.4
	Vitest: 4.0.16
	Tailwind CSS: 4.1.17
	DaisyUI: 5.5.14

Rationale: Svelte 5 introduces runes for cleaner reactivity. Latest stable versions ensure security and performance.

Documentation:
	https://svelte.dev/docs/svelte/overview
	https://kit.svelte.dev/docs
	https://vitest.dev/guide/


## Svelte Best Practices

Use runes for reactivity ($state, $derived, $effect) instead of old let declarations.
See: https://svelte.dev/docs/svelte/what-are-runes

Always type component props explicitly with TypeScript.

Prefer composition with slots over prop-heavy components. Use slots when child content varies significantly. Use props for simple data.
See: https://svelte.dev/docs/svelte/slot

Extract components when code is duplicated 2+ times, has clear single responsibility, or exceeds 50 lines. Keep it inline if used once, requires 5+ props, or is under 20 lines.


## Tailwind & DaisyUI

Use utility classes directly in markup. Avoid creating custom CSS classes for one-off styles.
Use DaisyUI components for consistency (btn, card, modal). Leverage DaisyUI themes for kids vs basic sections.
See: https://daisyui.com/docs/themes/

Only create custom CSS for keyframe animations and complex SVG effects. Everything else uses Tailwind utilities.


## Services vs Components

Create services for:
	Pure logic with no UI (answerChecker.ts, wordSelection.ts)
	Shared algorithms used across multiple games
	Data fetching and processing (storyLoader.ts)
	Stateless utilities (tipService.ts)

Keep in components:
	UI logic tightly coupled to rendering
	One-off functions used in single place
	Simple transformations

Service files live in lib/services/, component files in lib/components/.


## Component Organization

Structure:
	lib/components/basic/     - Basic learning games
	lib/components/kids/      - Children's games (separate!)
	lib/components/shared/    - Used by both
	lib/components/stories/   - Story reading game

Why separate basic and kids? Different audiences need different UX. Basic games show detailed stats and compact UI. Kids games use large buttons, celebratory animations, and no-fail mode. Keeping them separate avoids conditional logic everywhere.


## Slots: When to Use

Use slots for layout wrappers and when child content varies significantly between uses.

Use props when content is always the same type or a simple string/number.

Named slots work well for multiple insertion points (header, content, footer).


## Testing: Unit Tests

Test pure functions, data transformations, and business logic. Focus on services and utilities.
Do not test Svelte reactivity, Tailwind classes, or third-party libraries. Trust the framework.
See existing tests in lib/utils/array.test.ts and lib/services/answerChecker.test.ts for examples.


## Testing: Integration Tests

Test user flows (start game, answer questions, see results) and component interactions.

Use @testing-library/svelte queries (getByRole, getByText) to test from user perspective.
See: https://testing-library.com/docs/svelte-testing-library/intro/

Do not test every possible interaction or styling details. Focus on critical paths.
Do not query by class names or test internal component state. Test user-facing behavior only.
See routes/pipsan-ystavat/pipsan-ystavat.test.ts for integration test example.


## Testing Philosophy

Goal: Tests ensure version upgrades and refactorings do not break functionality.
Keep tests simple. Prefer integration tests over unit tests. Do not aim for 100% coverage.
Test what users do, not how code works internally.

Commands:
	npm test -- --run <file>  - Run specific test file during development (non-interactive)
	npm test                  - Run all tests to verify task completion

Interactive modes (do not use for agents):
	npm run test:watch        - Watch mode (requires user interaction)
	npm run test:ui           - Visual test runner (requires user interaction)


## Use Python venv and Scripts folder

All Python scripts live in `scripts/` folder. Use the project venv:
	source venv/bin/activate (or use existing venv in project root)
	pip install packages as needed

Scripts are for data processing, not runtime. They generate static JSON files.
Test Python scripts with pytest. Place tests in same folder as scripts.
Name test files: test_<script_name>.py


## Data Model and Material

Static JSON files only. No backend, no database. All data bundled in svelte/static/.
User progress stored in localStorage. Keep payload sizes reasonable (<1MB initial load).

Content sources must be open source (CC-BY, CC-BY-SA). Attribute all sources on /tietoja page.
Frequency data: top 5000 words sufficient for A1-B2 learners. Generate tiered files for lazy loading.

Story content organized by CEFR level (A1, A2, B1). Manifest file lists metadata, individual stories loaded on demand.


