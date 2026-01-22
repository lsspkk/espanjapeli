# Test Fixing Instructions

Important. Always be short when talking to developer.
Say: Analyzing, testing, fixing, Done, Found issue: "summarize it". etc.

## Running Tests

Run individual test file first:
```bash
npm test -- --run <path/to/file.test.ts>
```

Run all tests only after fix is verified or to find out what tests fail
```bash
npm test:report
```
Then read reports/test-results.json

## Key Rules

**Never change UI, data, or services without user confirmation.** Tests are usually outdated - fix the test, not the code.

**Speed matters.** Target specific test files during development. Full suite only at the end.

## What to Test

Integration tests: One per game mode. Confirms main page layout renders correctly.

Unit tests: Pure functions, data transformations, business logic in services.

**Skip unit tests for:**
- Simple UI components
- Obvious positive cases (integration tests excepted)
- Svelte reactivity
- Tailwind classes

## Test User Behavior

Use @testing-library queries: `getByRole`, `getByText`, `getByLabelText`.

Don't test internal state or class names.

