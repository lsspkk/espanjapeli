# V3 Implementation Agent Prompt

You are implementing V3 features a Spanish-Finnish learning game built with SvelteKit. Follow these instructions precisely.
Do the next incomplete task listed in `v3-todo.md` - Checkbox is marked `[ ]`

---

## BEFORE EVERY TASK

**Read these files first:**
1. `v3-roadmap.md` - Understand the overall architecture and design decisions
2. `v3-todo.md` - Find your specific task with source line references
3. Relevant source files referenced in the task (e.g., `yhdistasanat/+page.svelte` lines 1336-1359)

**Never improvise or add features not specified.** Each task has a clear scope - complete only that scope.

---

## TASK EXECUTION RULES

### What to do:
- Extract code exactly from source lines specified in v3-todo.md
- Follow existing code style (see similar files in `lib/components/`, `lib/services/`)
- Use TypeScript with proper types
- Keep component props minimal - only what's needed
- Preserve existing functionality exactly

### What NOT to do:
- Do not refactor code beyond the task scope
- Do not add "nice to have" features
- Do not change existing behavior
- Do not create new patterns - follow existing ones
- Do not add comments explaining obvious code

---

## VERIFICATION CHECKLIST

After completing a task, verify it works:

### For directory creation tasks:
```bash
ls -la svelte/src/lib/components/basic/core/  # Verify directory exists
```

### For type definition tasks:
```bash
cd svelte && npx tsc --noEmit  # Verify no TypeScript errors
```

### For utility function tasks:
- Create test file alongside (e.g., `array.test.ts` for `array.ts`)
- Run: `cd svelte && npm test -- --run`

### For component extraction tasks:
1. Import component into source page
2. Replace original code with component
3. Run dev server: `cd svelte && npm run dev`
4. Manually test the feature works identically

### For service tasks:
- Create test file with basic cases
- Run: `cd svelte && npm test -- --run`

---

## TEST FILE REQUIREMENTS

Create tests for:
- Utility functions (array.ts, etc.)
- Services (storyLoader.ts, progressCalculator.ts, etc.)
- Complex component logic

Skip tests for:
- Simple presentational components
- Directory creation tasks
- Type-only files

**Test file location:** Same directory as source, suffix `.test.ts`

**Test pattern example:**
```typescript
import { describe, it, expect } from 'vitest';
import { shuffleArray } from './array';

describe('shuffleArray', () => {
  it('returns array of same length', () => {
    const arr = [1, 2, 3];
    expect(shuffleArray(arr)).toHaveLength(3);
  });
  
  it('contains all original elements', () => {
    const arr = [1, 2, 3];
    expect(shuffleArray(arr).sort()).toEqual([1, 2, 3]);
  });
});
```

---

## COMPONENT EXTRACTION PATTERN

When extracting components from monolithic pages:

### Read source lines
Open the source file and read the exact lines specified in v3-todo.md.

### Create component file
```svelte
<script lang="ts">
  // Props - only what's needed
  export let currentQuestion: number;
  export let totalQuestions: number;
  
  // Callbacks for parent communication
  export let onQuit: () => void;
</script>

<!-- Template from source lines -->

<style>
  /* Only component-specific styles */
</style>
```

### Integrate into source page
```svelte
<script lang="ts">
  import GameHeader from '$lib/components/basic/core/GameHeader.svelte';
</script>

<GameHeader
  {currentQuestion}
  {totalQuestions}
  onQuit={handleQuit}
/>
```

### Verify identical behavior
Test the page works exactly as before.

---

## FILE STRUCTURE REFERENCE

```
svelte/src/lib/
  components/
    basic/           <- Adult game components
      core/          <- Layout, header, question display
      feedback/      <- Correct/wrong animations
      input/         <- Text input, option buttons
      modals/        <- Category picker, sanakirja
      report/        <- Game summary, wrong answers
    kids/            <- Kids game components (separate!)
      core/
      feedback/
      input/f
    stories/         <- Story reader components
    shared/          <- Used by both (ProgressBar, etc.)
  services/          <- Business logic
  stores/            <- State management
  types/             <- TypeScript interfaces
  data/              <- Static data (words, categories)
```

---

## KEY PRINCIPLES

1. **Kids components are separate** - Never share styling between basic/ and kids/
2. **Extract, don't rewrite** - Keep original logic, just move it
3. **One task at a time** - Complete current task before starting next
4. **Preserve behavior** - If it worked before, it must work after
5. **Small changes** - Each task should be completable in 10-30 minutes

---


---

## DEFINITION OF DONE

A task is complete when:
- [ ] Code matches the specification in v3-todo.md
- [ ] TypeScript compiles without errors
- [ ] Tests pass (if applicable)
- [ ] Feature works in browser (if applicable)
- [ ] No console errors
- [ ] Checkbox in v3-todo.md is marked `[x]`

---

## ASKING FOR CLARIFICATION

If the task is unclear:
1. Re-read v3-roadmap.md section for context
2. Check similar existing code for patterns
3. If still unclear, ask before implementing

Do not guess. Do not improvise. Ask.
