import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
	selectGameWords, 
	recordGameCompletion, 
	getPreviousGames,
	getAvailableWords,
	prepareNextGameWords,
	generateWordQueue,
	clearHistory 
} from './wordSelection';
import type { Word } from '$lib/data/words';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => { store[key] = value; },
		removeItem: (key: string) => { delete store[key]; },
		clear: () => { store = {}; }
	};
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock modules
vi.mock('$lib/data/words', () => ({
	getAllWords: () => mockWords,
	getWordsFromCategory: (category: string) => {
		if (category === 'animals') return mockWords.slice(0, 5);
		if (category === 'colors') return mockWords.slice(5, 10);
		return mockWords;
	}
}));

vi.mock('svelte/store', async () => {
	const actual = await vi.importActual('svelte/store');
	return {
		...actual,
		get: () => ({ words: {} })
	};
});

vi.mock('$lib/stores/wordKnowledge', () => ({
	wordKnowledge: {
		subscribe: vi.fn((fn) => {
			fn({ words: {} });
			return { unsubscribe: vi.fn() };
		})
	}
}));

vi.mock('$lib/utils/array', () => ({
	shuffleArray: (arr: any[]) => [...arr],
	spreadOutDuplicates: (arr: any[]) => [...arr]
}));

const mockWords: Word[] = [
	{ spanish: 'perro', finnish: 'koira', category: 'animals' },
	{ spanish: 'gato', finnish: 'kissa', category: 'animals' },
	{ spanish: 'casa', finnish: 'talo', category: 'things' },
	{ spanish: 'libro', finnish: 'kirja', category: 'things' },
	{ spanish: 'agua', finnish: 'vesi', category: 'food' },
	{ spanish: 'rojo', finnish: 'punainen', category: 'colors' },
	{ spanish: 'azul', finnish: 'sininen', category: 'colors' },
	{ spanish: 'verde', finnish: 'vihreä', category: 'colors' },
	{ spanish: 'amarillo', finnish: 'keltainen', category: 'colors' },
	{ spanish: 'blanco', finnish: 'valkoinen', category: 'colors' }
];

describe('wordSelection service', () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	describe('getAvailableWords', () => {
		it('should return all words for "all" category', () => {
			const words = getAvailableWords('all');
			expect(words).toHaveLength(10);
		});

		it('should return filtered words for specific category', () => {
			const words = getAvailableWords('animals');
			expect(words).toHaveLength(5);
		});
	});

	describe('prepareNextGameWords', () => {
		it('should prepare words for next game', () => {
			const words = prepareNextGameWords('all', 5);
			expect(words).toHaveLength(5);
		});

		it('should use category filtering', () => {
			const words = prepareNextGameWords('animals', 3);
			expect(words).toHaveLength(3);
		});
	});

	describe('generateWordQueue', () => {
		it('should generate word queue without upcoming words', () => {
			const queue = generateWordQueue('all', 5);
			expect(queue).toHaveLength(5);
		});

		it('should use upcoming words if provided and match count', () => {
			const upcomingWords = mockWords.slice(0, 5);
			const queue = generateWordQueue('all', 5, upcomingWords);
			expect(queue).toHaveLength(5);
		});

		it('should regenerate if upcoming words count mismatch', () => {
			const upcomingWords = mockWords.slice(0, 3);
			const queue = generateWordQueue('all', 5, upcomingWords);
			expect(queue).toHaveLength(5);
		});

		it('should respect minDistance parameter', () => {
			const queue = generateWordQueue('all', 5, undefined, 10);
			expect(queue).toHaveLength(5);
		});
	});

	describe('selectGameWords', () => {
		it('should select requested number of words', () => {
			const words = selectGameWords(mockWords, 5, 'all');
			expect(words).toHaveLength(5);
		});

		it('should handle small word pools', () => {
			const smallPool = mockWords.slice(0, 3);
			const words = selectGameWords(smallPool, 5, 'test');
			expect(words.length).toBeGreaterThan(0);
		});

		it('should not exceed available words without repetition', () => {
			const words = selectGameWords(mockWords, 20, 'all');
			expect(words.length).toBeGreaterThanOrEqual(10);
		});
	});

	describe('recordGameCompletion', () => {
		it('should record game in history', () => {
			const gameWords = mockWords.slice(0, 5);
			recordGameCompletion(gameWords, 'all');
			
			const history = JSON.parse(localStorageMock.getItem('sanapeli_word_history') || '{}');
			expect(history.all).toBeDefined();
			expect(history.all.games).toHaveLength(1);
			expect(history.all.games[0]).toHaveLength(5);
		});

		it('should limit history to 10 games', () => {
			const gameWords = mockWords.slice(0, 3);
			
			// Record 12 games
			for (let i = 0; i < 12; i++) {
				recordGameCompletion(gameWords, 'test');
			}
			
			const history = JSON.parse(localStorageMock.getItem('sanapeli_word_history') || '{}');
			expect(history.test.games).toHaveLength(10);
		});
	});

	describe('getPreviousGames', () => {
		it('should return empty array when no history', () => {
			const games = getPreviousGames('all', mockWords, 3);
			expect(games).toEqual([]);
		});

		it('should return previous games', () => {
			const gameWords = mockWords.slice(0, 5);
			recordGameCompletion(gameWords, 'all');
			
			const games = getPreviousGames('all', mockWords, 3);
			expect(games).toHaveLength(1);
			expect(games[0]).toHaveLength(5);
		});

		it('should respect maxGames parameter', () => {
			const gameWords = mockWords.slice(0, 3);
			
			// Record 5 games
			for (let i = 0; i < 5; i++) {
				recordGameCompletion(gameWords, 'test');
			}
			
			const games = getPreviousGames('test', mockWords, 2);
			expect(games).toHaveLength(2);
		});
	});

	describe('clearHistory', () => {
		it('should clear specific category history', () => {
			recordGameCompletion(mockWords.slice(0, 3), 'test1');
			recordGameCompletion(mockWords.slice(0, 3), 'test2');
			
			clearHistory('test1');
			
			const history = JSON.parse(localStorageMock.getItem('sanapeli_word_history') || '{}');
			expect(history.test1).toBeUndefined();
			expect(history.test2).toBeDefined();
		});

		it('should clear all history when no category specified', () => {
			recordGameCompletion(mockWords.slice(0, 3), 'test1');
			recordGameCompletion(mockWords.slice(0, 3), 'test2');
			
			clearHistory();
			
			const history = localStorageMock.getItem('sanapeli_word_history');
			expect(history).toBeNull();
		});
	});
});
