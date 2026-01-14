/**
 * Common mock factories for test performance optimization
 * 
 * This module provides reusable mock data factories and helper functions
 * to reduce recreation overhead across test files.
 * 
 * NOTE: These factories create data objects, not vi.mock() calls.
 * vi.mock() calls must be inline in test files due to hoisting.
 * Use these factories to generate consistent mock data.
 */

import { vi, type Mock } from 'vitest';
import type { Story, StoryMetadata, StoryManifest } from '$lib/types/story';
import type { Word } from '$lib/data/words';
import type { WordKnowledgeData } from '$lib/stores/wordKnowledge';
import type { VocabularyStatistics, KidsVocabularyStatistics } from '$lib/services/statisticsService';

// ============================================================================
// SvelteKit Mock Data
// ============================================================================
// Note: These are data factories, not vi.mock() calls
// Use these to generate consistent mock data in your tests

// ============================================================================
// Word Data Mocks
// ============================================================================

/**
 * Create a mock word
 */
export const createMockWord = (overrides?: Partial<Word>): Word => ({
	spanish: 'hola',
	finnish: 'hei',
	english: 'hello',
	...overrides
});

/**
 * Create multiple mock words
 */
export const createMockWords = (count: number = 3): Word[] => [
	{ spanish: 'hola', finnish: 'hei', english: 'hello' },
	{ spanish: 'adiós', finnish: 'näkemiin', english: 'goodbye' },
	{ spanish: 'gracias', finnish: 'kiitos', english: 'thanks' }
].slice(0, count);


// ============================================================================
// Word Knowledge Store Mocks
// ============================================================================

/**
 * Create mock word knowledge data
 */
export const createMockWordKnowledge = (overrides?: Partial<WordKnowledgeData>): WordKnowledgeData => ({
	version: 2,
	words: {
		hola: {
			spanish_to_finnish: {
				basic: { score: 85, practiceCount: 5, firstTryCount: 4, secondTryCount: 1, thirdTryCount: 0, failedCount: 0, lastPracticed: '2024-01-01' }
			},
			finnish_to_spanish: {
				basic: { score: 75, practiceCount: 3, firstTryCount: 2, secondTryCount: 1, thirdTryCount: 0, failedCount: 0, lastPracticed: '2024-01-01' }
			}
		},
		adiós: {
			spanish_to_finnish: {
				basic: { score: 65, practiceCount: 4, firstTryCount: 2, secondTryCount: 2, thirdTryCount: 0, failedCount: 0, lastPracticed: '2024-01-01' }
			},
			finnish_to_spanish: {
				basic: { score: 55, practiceCount: 2, firstTryCount: 1, secondTryCount: 1, thirdTryCount: 0, failedCount: 0, lastPracticed: '2024-01-01' }
			}
		},
		gracias: {
			spanish_to_finnish: {
				basic: { score: 45, practiceCount: 2, firstTryCount: 0, secondTryCount: 2, thirdTryCount: 0, failedCount: 0, lastPracticed: '2024-01-01' }
			},
			finnish_to_spanish: {
				basic: { score: 35, practiceCount: 1, firstTryCount: 0, secondTryCount: 1, thirdTryCount: 0, failedCount: 0, lastPracticed: '2024-01-01' }
			}
		}
	},
	gameHistory: [],
	meta: {
		createdAt: '2024-01-01',
		updatedAt: '2024-01-01',
		totalGamesPlayed: 0,
		basicGamesPlayed: 0,
		kidsGamesPlayed: 0
	},
	...overrides
});


// ============================================================================
// Story Mocks
// ============================================================================

/**
 * Create a mock story metadata
 */
export const createMockStoryMetadata = (overrides?: Partial<StoryMetadata>): StoryMetadata => ({
	id: 'story-1',
	title: 'Kahvilassa',
	titleSpanish: 'En la cafetería',
	description: 'Tilaa kahvia ja leivonnaisia',
	level: 'A1',
	category: 'food',
	icon: '☕',
	wordCount: 100,
	estimatedMinutes: 3,
	vocabularyCount: 10,
	questionCount: 5,
	...overrides
});

/**
 * Create a mock full story
 */
export const createMockStory = (overrides?: Partial<Story>): Story => ({
	id: 'story-1',
	title: 'Kahvilassa',
	titleSpanish: 'En la cafetería',
	description: 'Tilaa kahvia ja leivonnaisia',
	level: 'A1',
	category: 'food',
	icon: '☕',
	dialogue: [
		{ speaker: 'María', spanish: 'Buenos días', finnish: 'Hyvää huomenta' }
	],
	vocabulary: [
		{ spanish: 'café', finnish: 'kahvi', english: 'coffee' }
	],
	questions: [
		{
			id: 'q1',
			question: 'Mitä María tilaa?',
			options: ['Kahvi', 'Tee', 'Mehu', 'Vesi'],
			correctIndex: 0
		}
	],
	...overrides
});

/**
 * Create multiple mock stories
 */
export const createMockStories = (count: number = 5): Story[] => [
	createMockStory({
		id: 'story-1',
		title: 'Kahvilassa',
		titleSpanish: 'En la cafetería',
		level: 'A1',
		category: 'food',
		icon: '☕'
	}),
	createMockStory({
		id: 'story-2',
		title: 'Ruokakaupassa',
		titleSpanish: 'En el supermercado',
		level: 'A2',
		category: 'shopping',
		icon: '🛒'
	}),
	createMockStory({
		id: 'story-3',
		title: 'Asemalla',
		titleSpanish: 'En la estación',
		level: 'B1',
		category: 'travel',
		icon: '🚂'
	}),
	createMockStory({
		id: 'story-4',
		title: 'Aamu',
		titleSpanish: 'La mañana',
		level: 'A1',
		category: 'everyday',
		icon: '☀️'
	}),
	createMockStory({
		id: 'story-5',
		title: 'Museo',
		titleSpanish: 'El museo',
		level: 'B2',
		category: 'culture',
		icon: '🏛️'
	})
].slice(0, count);

/**
 * Create mock story manifest
 */
export const createMockManifest = (stories: StoryMetadata[] = []): StoryManifest => ({
	version: '4.0.0',
	lastUpdated: '2026-01-14',
	stories: stories.length > 0 ? stories : [
		createMockStoryMetadata({ id: 'test-story-1', level: 'A2' }),
		createMockStoryMetadata({ id: 'test-story-2', level: 'B1', title: 'Test Story 2', titleSpanish: 'Historia de Prueba 2' })
	]
});

/**
 * Category names for story loader
 */
export const mockCategoryNames = {
	travel: 'Matkailu',
	food: 'Ruoka',
	shopping: 'Ostokset',
	everyday: 'Arkipäivä',
	culture: 'Kulttuuri'
};

/**
 * Get level color for story badges
 */
export const getLevelColor = (level: string): string => {
	const colors: Record<string, string> = {
		A1: 'badge-success',
		A2: 'badge-info',
		B1: 'badge-warning',
		B2: 'badge-error'
	};
	return colors[level] || 'badge-neutral';
};

// ============================================================================
// Statistics Service Mocks
// ============================================================================

/**
 * Create mock vocabulary statistics
 */
export const createMockVocabularyStats = (overrides?: Partial<VocabularyStatistics>): VocabularyStatistics => ({
	totalPracticed: 50,
	wordsKnown: 35,
	wordsMastered: 20,
	wordsWeak: 5,
	topNProgress: {
		top100: { known: 25, total: 100, percentage: 25 },
		top500: { known: 50, total: 500, percentage: 10 },
		top1000: { known: 75, total: 1000, percentage: 7 },
		top5000: { known: 100, total: 5000, percentage: 2 }
	},
	estimatedLevel: 'A2',
	averageScore: 65,
	totalGamesPlayed: 15,
	vocabularyCoverage: {
		inFrequencyData: 450,
		total: 500,
		percentage: 90
	},
	...overrides
});

/**
 * Create mock kids vocabulary statistics
 */
export const createMockKidsVocabularyStats = (overrides?: Partial<KidsVocabularyStatistics>): KidsVocabularyStatistics => ({
	totalWordsPracticed: 25,
	wordsKnown: 15,
	wordsMastered: 8,
	totalGamesPlayed: 12,
	averageScore: 72,
	recentProgress: {
		last7Days: 5,
		last30Days: 18
	},
	encouragementMessage: 'Olet oppimassa nopeasti!',
	nextMilestone: {
		description: 'Opettele 30 sanaa',
		current: 25,
		target: 30,
		percentage: 83.33
	},
	...overrides
});

/**
 * Mock next milestone data
 */
export const createMockNextMilestone = () => ({
	type: 'top100',
	current: 25,
	target: 50,
	description: 'Opi 50 sanaa 100 yleisimmästä'
});

// ============================================================================
// Vocabulary Service Mocks
// ============================================================================

/**
 * Get CEFR level description
 */
export const getCEFRDescription = (level: string): string => {
	const descriptions: Record<string, string> = {
		A1: 'Alkeet',
		A2: 'Beginner',
		B1: 'Intermediate',
		B2: 'Upper Intermediate',
		C1: 'Advanced'
	};
	return descriptions[level] || level;
};

// ============================================================================
// Fetch Mocks
// ============================================================================

/**
 * Create a mock fetch response
 */
export const createMockFetchResponse = <T>(data: T, ok: boolean = true): Response => ({
	ok,
	status: ok ? 200 : 404,
	json: async () => data,
	text: async () => JSON.stringify(data),
	headers: new Headers(),
	redirected: false,
	statusText: ok ? 'OK' : 'Not Found',
	type: 'basic',
	url: '',
	clone: function() { return this; },
	body: null,
	bodyUsed: false,
	arrayBuffer: async () => new ArrayBuffer(0),
	blob: async () => new Blob(),
	formData: async () => new FormData()
} as Response);

/**
 * Setup global fetch mock
 */
export const setupFetchMock = () => {
	global.fetch = vi.fn();
	return global.fetch as Mock;
};

// ============================================================================
// Usage Examples
// ============================================================================
/**
 * Example usage in a test file:
 * 
 * ```typescript
 * import { createMockWords, createMockWordKnowledge } from '$tests/mocks/commonMocks';
 * 
 * vi.mock('$lib/data/words', () => ({
 *   getAllWords: vi.fn(() => createMockWords())
 * }));
 * 
 * vi.mock('$lib/stores/wordKnowledge', () => {
 *   const data = createMockWordKnowledge();
 *   return {
 *     wordKnowledge: {
 *       subscribe: vi.fn((callback) => {
 *         callback(data);
 *         return () => {};
 *       })
 *     }
 *   };
 * });
 * ```
 */
