# Test Mocks

This directory contains common mock data factories to reduce test overhead and improve consistency across test files.

## Purpose

- **Reduce recreation overhead**: Reusable factory functions create consistent mock data
- **Improve test performance**: Shared mock data reduces memory allocation and setup time
- **Maintain consistency**: All tests use the same mock data structures
- **Simplify test writing**: Import factories instead of creating mocks from scratch

## Usage

### Important: vi.mock() Hoisting

Due to Vitest's hoisting behavior, you **cannot** use imported functions directly in `vi.mock()` calls. Instead:

1. Import the factory functions
2. Use them OUTSIDE of `vi.mock()` calls
3. Reference the created data in your mocks

### Example: Story Mocks

```typescript
import { createMockStories, mockCategoryNames, getLevelColor } from '$tests/mocks/commonMocks';

// Create mock data AFTER vi.mock() calls
const mockStories = createMockStories();

// Mock the module with inline functions
vi.mock('$lib/services/storyLoader', () => ({
  loadStories: vi.fn().mockResolvedValue(mockStories),
  categoryNames: mockCategoryNames,
  getLevelColor: vi.fn((level: string) => getLevelColor(level))
}));
```

### Example: Word Knowledge Mocks

```typescript
import { createMockWordKnowledge } from '$tests/mocks/commonMocks';

const mockData = createMockWordKnowledge();

vi.mock('$lib/stores/wordKnowledge', () => ({
  wordKnowledge: {
    subscribe: vi.fn((callback) => {
      callback(mockData);
      return () => {};
    })
  }
}));
```

### Example: Statistics Mocks

```typescript
import { createMockVocabularyStats, createMockKidsVocabularyStats } from '$tests/mocks/commonMocks';

const stats = createMockVocabularyStats();
const kidsStats = createMockKidsVocabularyStats();

vi.mock('$lib/services/statisticsService', () => ({
  calculateVocabularyStats: vi.fn().mockResolvedValue(stats),
  calculateKidsVocabularyStats: vi.fn().mockResolvedValue(kidsStats)
}));
```

## Available Factories

### Word Data

- `createMockWord(overrides?)` - Single word with defaults
- `createMockWords(count?)` - Array of words (default: 3)

### Word Knowledge

- `createMockWordKnowledge(overrides?)` - Complete word knowledge data structure

### Stories

- `createMockStory(overrides?)` - Full story with dialogue, vocabulary, questions
- `createMockStories(count?)` - Array of stories (default: 5)
- `createMockStoryMetadata(overrides?)` - Story metadata only
- `createMockManifest(stories?)` - Story manifest

### Statistics

- `createMockVocabularyStats(overrides?)` - Basic mode vocabulary statistics
- `createMockKidsVocabularyStats(overrides?)` - Kids mode vocabulary statistics
- `createMockNextMilestone()` - Next milestone data

### Utilities

- `mockCategoryNames` - Story category name mappings
- `getLevelColor(level)` - Get badge color for CEFR level
- `getCEFRDescription(level)` - Get Finnish description for CEFR level
- `setupFetchMock()` - Setup global fetch mock
- `createMockFetchResponse(data, ok?)` - Create mock fetch response

## Benefits

### Before (Inline Mocks)

```typescript
// 50+ lines of mock setup repeated in every test file
const mockStories: Story[] = [
  {
    id: 'story-1',
    title: 'Kahvilassa',
    titleSpanish: 'En la cafetería',
    // ... 20 more lines
  },
  // ... repeat for each story
];
```

### After (Factory Functions)

```typescript
// 1 line to get consistent mock data
const mockStories = createMockStories();
```

## Performance Impact

- **Reduced memory allocation**: Shared factory functions instead of inline object creation
- **Faster test execution**: Less time spent creating mock data
- **Better parallelization**: Consistent mocks work better with Vitest's thread pool
- **Easier maintenance**: Update mock structure in one place

## Customization

All factory functions accept an `overrides` parameter for customization:

```typescript
const customStory = createMockStory({
  level: 'B2',
  category: 'travel',
  dialogue: [
    { speaker: 'Ana', spanish: 'Hola', finnish: 'Hei' }
  ]
});
```

## Migration Guide

To migrate an existing test file:

1. Import the relevant factory functions from `$tests/mocks/commonMocks`
2. Replace inline mock data with factory function calls
3. Keep `vi.mock()` calls inline (hoisting requirement)
4. Use factory-created data in your test assertions

## See Also

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- Project test organization: `svelte/vitest.config.ts`
