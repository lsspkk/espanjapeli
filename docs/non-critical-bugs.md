# Non-Critical Bugs

## Test Isolation Issues (2026-01-22)

When running the full test suite with `npm test`, some tests fail due to test isolation issues:

1. **sanapeli-compact-mode.test.ts** - Fixed by updating button query
2. **TokenDelaySelector.test.ts** - "persists value to localStorage via store" - Passes individually, fails in parallel run
3. **StoryReader.test.ts** - "renders vocabulary with examples" - Passes individually, fails in parallel run

**Root Cause**: Shared state between tests when running in parallel. All tests pass when run individually.

**Workaround**: Run tests individually or sequentially: `npm test -- --run <test-file>`

**Impact**: Low - Does not affect production code. Tests verify functionality correctly when run in isolation.

**Future Fix**: Consider adding test isolation improvements or running tests sequentially in CI.
