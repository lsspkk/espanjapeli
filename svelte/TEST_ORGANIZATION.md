# Test Organization

This document explains how tests are organized in the Espanjapeli project for optimal performance and maintainability.

## Test Categories

Tests are organized into three categories based on their speed and complexity:

### 1. Unit Tests (Fast)
**Location:** `src/lib/services/`, `src/lib/utils/`, `src/lib/stores/`, `src/lib/config/`, `src/lib/types/`  
**Characteristics:**
- Pure function tests with minimal or no DOM rendering
- Test business logic, data transformations, and state management
- Fastest to run (~5-15ms per test)
- No component rendering overhead

**Examples:**
- `src/lib/services/answerChecker.test.ts` - Answer validation logic
- `src/lib/services/wordSelection.test.ts` - Word selection algorithms
- `src/lib/utils/array.test.ts` - Array utility functions
- `src/lib/stores/wordKnowledge.test.ts` - Store logic

**Run command:** `npm run test:unit`

### 2. Component Tests (Medium)
**Location:** `src/lib/components/`  
**Characteristics:**
- UI component rendering tests
- Test component behavior and user interactions
- Medium speed (~15-40ms per test)
- Light DOM rendering with @testing-library/svelte

**Examples:**
- `src/lib/components/shared/Navbar.test.ts` - Navigation component
- `src/lib/components/basic/stories/StoryCard.test.ts` - Story card rendering
- `src/lib/components/kids/KidsVocabularyWidget.test.ts` - Kids widget

**Run command:** `npm run test:component`

### 3. Integration Tests (Slow)
**Location:** `src/routes/`, `src/tests/integration/`  
**Characteristics:**
- Full page flow tests with complete component trees
- Test user journeys and feature integration
- Slowest to run (~30-100ms per test)
- Heavy DOM rendering and data loading

**Examples:**
- `src/routes/sanasto/sanasto.test.ts` - Full vocabulary page
- `src/routes/tarinat/tarinat.test.ts` - Story list page
- `src/tests/integration/yhdistasanat.test.ts` - Complete game flow

**Run command:** `npm run test:integration`

## Test Structure Philosophy

### Co-location
Tests are co-located with their source files for maintainability:
```
src/lib/services/
  answerChecker.ts
  answerChecker.test.ts  ← Test next to source
```

This follows the project's "simple is better" principle (see `ai-control/PRINCIPLES.md`).

### Naming Convention
All test files use the `.test.ts` suffix:
- `*.test.ts` - Standard test file
- No special suffixes needed (categorization is by directory)

## Running Tests

### All Tests
```bash
npm test              # Run all tests (interactive mode)
npm test -- --run     # Run all tests once (CI mode)
```

### By Category
```bash
npm run test:unit         # Fast unit tests only (~15 files, <2s)
npm run test:component    # Component tests only (~27 files, ~5s)
npm run test:integration  # Integration tests only (~17 files, ~8s)
```

### Individual Files
```bash
npm test -- --run src/lib/services/answerChecker.test.ts
npm test -- --run src/routes/sanasto/sanasto.test.ts
```

### Watch Mode
```bash
npm run test:watch    # Watch all tests
npm test -- --watch src/lib/services/  # Watch specific directory
```

### UI Mode
```bash
npm run test:ui       # Visual test runner
```

## Performance Optimization

### Current Configuration
- **Environment:** happy-dom (faster than jsdom)
- **Pool:** threads (parallel execution)
- **Threads:** 2-4 threads
- **Isolation:** false (shared environment for speed)
- **Max Concurrency:** 5 tests per thread

### Why Categorization Helps
1. **Parallel Execution:** Different categories can run in parallel
2. **Faster Feedback:** Run fast unit tests first during development
3. **CI Optimization:** Run categories in separate jobs
4. **Debugging:** Isolate slow tests for optimization

### Test Count by Category
- **Unit Tests:** ~15 files, ~150 tests
- **Component Tests:** ~27 files, ~250 tests  
- **Integration Tests:** ~17 files, ~340 tests
- **Total:** ~59 files, ~740 tests

## Best Practices

### When Writing Tests

1. **Unit Tests**
   - Test pure functions without DOM
   - Mock external dependencies
   - Focus on business logic
   - Keep tests fast (<10ms)

2. **Component Tests**
   - Test user-facing behavior, not implementation
   - Use @testing-library queries (getByRole, getByText)
   - Avoid testing internal state
   - Keep rendering minimal

3. **Integration Tests**
   - Test complete user flows
   - Test feature interactions
   - Use realistic data
   - Accept slower execution

### Performance Tips

1. **Reduce Rendering:** Only render what you need to test
2. **Mock Heavy Dependencies:** Mock story data, frequency data
3. **Reuse Test Data:** Create shared fixtures
4. **Avoid Unnecessary Waits:** Use `waitFor` only when needed
5. **Group Related Tests:** Use `describe` blocks for setup sharing

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run Unit Tests
  run: npm run test:unit

- name: Run Component Tests
  run: npm run test:component

- name: Run Integration Tests
  run: npm run test:integration
```

### Parallel Jobs
```yaml
strategy:
  matrix:
    test-type: [unit, component, integration]
steps:
  - run: npm run test:${{ matrix.test-type }}
```

## Troubleshooting

### Slow Tests
1. Check test file with `npm test -- --run <file>`
2. Profile with `npm run test:ui`
3. Look for heavy rendering or large data imports
4. Consider mocking or reducing test scope

### Flaky Tests
1. Check for race conditions with async operations
2. Ensure proper cleanup in `afterEach`
3. Avoid relying on timing (use `waitFor`)
4. Check for shared state between tests

**Known Issue:** Some tests may fail when run with the full suite but pass individually. This is due to `isolate: false` in vitest.config.ts (performance optimization). If you encounter this:
- Run the failing test individually to verify it works: `npm test -- --run <file>`
- If it passes individually, it's a test isolation issue
- Consider adding proper cleanup in `afterEach` hooks
- As a workaround, run test categories separately (unit, component, integration)

### Memory Issues
1. Reduce `maxConcurrency` in vitest.config.ts
2. Run tests in smaller batches
3. Check for memory leaks in components

## Related Documentation

- `vitest.config.ts` - Test configuration
- `src/setupTests.ts` - Global test setup
- `ai-control/PRINCIPLES.md` - Development principles
- `reports/test-performance-analysis.md` - Performance baseline

---

**Last Updated:** 2026-01-14  
**Task:** 26.4 - Organize Test Structure
