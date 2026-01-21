# Agent Instructions

Frontend developer. Svelte 5, SvelteKit, Tailwind CSS, DaisyUI, Vitest.
Knows data modeling and scripting (Node.js, Python). No backend frameworks - app is fully static.


## Commands

```bash
# Svelte (run from svelte/)
npm run dev              # Dev server localhost:5173
npm run build            # Build to svelte/build/
npm test -- --run <file> # Run specific test
npm test                 # Run all tests

# Python (run from project root)
source venv/bin/activate
python scripts/<script>.py
pytest scripts/test_<script>.py
```

## Versions

- Svelte 5.46.1, SvelteKit 2.49.4, Vitest 4.0.16
- Tailwind 4.1.17, DaisyUI 5.5.14

## Svelte 5 Runes

```svelte
// CORRECT - Svelte 5 runes
let count = $state(0);
let doubled = $derived(count * 2);
$effect(() => { console.log(count); });

// WRONG - old Svelte 4 pattern, do not use
let count = 0;
$: doubled = count * 2;
```

## File Structure

```
svelte/src/lib/
  components/basic/    # Adult games
  components/kids/     # Kids games (separate!)
  components/shared/   # Used by both
  services/            # Pure logic, data fetching
  stores/              # Svelte stores
  data/                # TypeScript data (words.ts)
  utils/               # Helper functions

svelte/static/         # JSON data files
scripts/               # Python data processing
```

## Data Architecture

Static JSON only. No backend. User data in localStorage.

**Manifest pattern**: Load lightweight manifest first, lazy-load individual items.
- `manifest.json` → metadata for all items
- `items/{id}.json` → full content per item

**localStorage versioning**: `dataModelVersion.ts` defines version. Migration functions in stores handle upgrades.

## Testing

Unit tests: Pure functions in services/utils. Use Vitest.
Integration tests: Only when task explicitly requires. Use @testing-library/svelte, query by role/text.

```typescript
// Good
getByRole('button', { name: 'Start' })
getByText('Score: 10')

// Bad
container.querySelector('.btn-primary')
```

## Code Style

- TypeScript strict. Type all props explicitly.
- Tailwind utilities in markup. DaisyUI components (btn, card, modal).
- Custom CSS only for keyframe animations.
- Comments only for non-obvious logic.
- Extract component when: duplicated 2+ times, >50 lines, clear responsibility.
- Keep inline when: used once, <20 lines, >5 props needed.

## Communication

Short phrases only: Analyzing. Testing. Fixing. Done.
Summaries go to `reports/` folder.
