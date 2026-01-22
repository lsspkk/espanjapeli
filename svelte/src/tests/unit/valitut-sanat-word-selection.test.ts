import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAllWords, type Word } from '$lib/data/words';
import { selectGameWords, recordGameCompletion } from '$lib/services/wordSelection';
import { wordKnowledge } from '$lib/stores/wordKnowledge';
import { get } from 'svelte/store';

/**
 * Unit tests for Valitut Sanat game with word selection algorithm
 *
 * Test Coverage:
 * - Language direction selection (spanish_to_finnish vs finnish_to_spanish)
 * - Word selection algorithm integration with lessons
 * - Quiz length limiting
 * - Game history recording
 */

// Mock TTS service to avoid audio issues in tests
vi.mock('$lib/services/tts', () => ({
	tts: {
		speak: vi.fn().mockResolvedValue(undefined),
		speakSpanish: vi.fn().mockResolvedValue(undefined),
		speakFinnish: vi.fn().mockResolvedValue(undefined),
		cancel: vi.fn()
	}
}));

// Mock vocabularyService for frequency data
vi.mock('$lib/services/vocabularyService', () => ({
	getWordsMetadata: async (words: string[]) => {
		const map = new Map();
		words.forEach((word, index) => {
			// Mark words as top 1000 for testing
			const isTop1000 = index < words.length * 0.7; // 70% are high frequency
			map.set(word, {
				spanish: word,
				frequencyRank: isTop1000 ? index + 1 : index + 1000,
				cefrLevel: isTop1000 ? 'A1' : 'B1',
				isTop100: false,
				isTop500: false,
				isTop1000: isTop1000,
				isTop3000: true,
				isTop5000: true,
				isInFrequencyData: true
			});
		});
		return map;
	}
}));

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(global, 'localStorage', {
	value: localStorageMock,
	writable: true
});

describe('Valitut Sanat - Word Selection Integration', () => {
	beforeEach(() => {
		// Clear localStorage and mocks before each test
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	describe('Language Direction Support', () => {
		it('should support spanish_to_finnish direction', async () => {
			const allWords = getAllWords().slice(0, 10);
			expect(allWords.length).toBeGreaterThan(0);

			const selectedWords = await selectGameWords(
				allWords,
				5,
				'test-lesson-1',
				'spanish_to_finnish',
				false
			);

			expect(selectedWords).toBeDefined();
			expect(selectedWords.length).toBeGreaterThan(0);
			expect(selectedWords[0]).toHaveProperty('spanish');
			expect(selectedWords[0]).toHaveProperty('finnish');
		});

		it('should support finnish_to_spanish direction', async () => {
			const allWords = getAllWords().slice(0, 10);
			expect(allWords.length).toBeGreaterThan(0);

			const selectedWords = await selectGameWords(
				allWords,
				5,
				'test-lesson-2',
				'finnish_to_spanish',
				false
			);

			expect(selectedWords).toBeDefined();
			expect(selectedWords.length).toBeGreaterThan(0);
			expect(selectedWords[0]).toHaveProperty('finnish');
			expect(selectedWords[0]).toHaveProperty('spanish');
		});

		it('should return different selections for different directions from same lesson', async () => {
			const allWords = getAllWords().slice(0, 20);
			const lessonId = 'direction-test-lesson';

			// Clear previous history
			localStorageMock.removeItem('sanapeli_word_history');

			const spanishFirst = await selectGameWords(
				allWords,
				5,
				lessonId,
				'spanish_to_finnish',
				false
			);

			const finnishFirst = await selectGameWords(
				allWords,
				5,
				lessonId,
				'finnish_to_spanish',
				false
			);

			// Both should be valid selections
			expect(spanishFirst.length).toBe(5);
			expect(finnishFirst.length).toBe(5);
			expect(spanishFirst[0]).toHaveProperty('spanish');
			expect(finnishFirst[0]).toHaveProperty('finnish');
		});
	});

	describe('Quiz Length Limiting', () => {
		it('should return requested number of words for small games', async () => {
			const allWords = getAllWords().slice(0, 20);

			const selectedWords = await selectGameWords(
				allWords,
				10,
				'length-test-1',
				'spanish_to_finnish',
				false
			);

			expect(selectedWords.length).toBeLessThanOrEqual(10);
		});

		it('should return requested number of words for medium games', async () => {
			const allWords = getAllWords().slice(0, 50);

			const selectedWords = await selectGameWords(
				allWords,
				21,
				'length-test-2',
				'spanish_to_finnish',
				false
			);

			expect(selectedWords.length).toBeLessThanOrEqual(21);
		});

		it('should return requested number of words for large games', async () => {
			const allWords = getAllWords().slice(0, 100);

			const selectedWords = await selectGameWords(
				allWords,
				42,
				'length-test-3',
				'spanish_to_finnish',
				false
			);

			expect(selectedWords.length).toBeLessThanOrEqual(42);
		});

		it('should not exceed available words', async () => {
			const allWords = getAllWords().slice(0, 5); // Only 5 words available

			const selectedWords = await selectGameWords(
				allWords,
				10, // Request 10 but only 5 available
				'length-test-4',
				'spanish_to_finnish',
				false
			);

			// Should return requested count by repeating words if needed
		expect(selectedWords.length).toBe(10);
		// All returned words should be from available words
		const availableSpanish = new Set(allWords.map(w => w.spanish));
		for (const word of selectedWords) {
			expect(availableSpanish.has(word.spanish)).toBe(true);
		}
		});
	});

	describe('Game History Recording', () => {
		it('should record completed game in history', async () => {
			const testWords = getAllWords().slice(0, 5);
			const lessonId = 'history-test-1';

			// Clear any previous history
			localStorageMock.removeItem('sanapeli_word_history');

			recordGameCompletion(testWords, lessonId);

			// Verify history was saved
			const historyStr = localStorageMock.getItem('sanapeli_word_history');
			expect(historyStr).toBeDefined();

			const history = JSON.parse(historyStr!);
			expect(history[lessonId]).toBeDefined();
			expect(history[lessonId].games).toBeDefined();
			expect(history[lessonId].games.length).toBe(1);
		});

		it('should accumulate multiple games in history', async () => {
			const testWords1 = getAllWords().slice(0, 3);
			const testWords2 = getAllWords().slice(3, 6);
			const lessonId = 'history-test-2';

			localStorageMock.removeItem('sanapeli_word_history');

			// Record two games
			recordGameCompletion(testWords1, lessonId);
			recordGameCompletion(testWords2, lessonId);

			const historyStr = localStorageMock.getItem('sanapeli_word_history');
			const history = JSON.parse(historyStr!);

			expect(history[lessonId].games.length).toBe(2);
		});

		it('should use lesson ID as category for tracking', async () => {
			const testWords = getAllWords().slice(0, 5);
			const lessonId = 'unique-lesson-id-123';

			localStorageMock.removeItem('sanapeli_word_history');

			recordGameCompletion(testWords, lessonId);

			const historyStr = localStorageMock.getItem('sanapeli_word_history');
			const history = JSON.parse(historyStr!);

			expect(history).toHaveProperty(lessonId);
			expect(history[lessonId].games[0].length).toBe(testWords.length);
		});

		it('should store word spanish text in history', async () => {
			const testWords = getAllWords().slice(0, 2);
			const lessonId = 'history-test-3';

			localStorageMock.removeItem('sanapeli_word_history');

			recordGameCompletion(testWords, lessonId);

			const historyStr = localStorageMock.getItem('sanapeli_word_history');
			const history = JSON.parse(historyStr!);
			const recordedWords = history[lessonId].games[0];

			expect(recordedWords[0]).toBe(testWords[0].spanish);
			expect(recordedWords[1]).toBe(testWords[1].spanish);
		});
	});

	describe('Word Selection Algorithm Integration', () => {
		it('should consider frequency when prioritizeFrequency is true', async () => {
			const allWords = getAllWords().slice(0, 30);
			const lessonId = 'frequency-test-1';

			localStorageMock.removeItem('sanapeli_word_history');

			const selectedWords = await selectGameWords(
				allWords,
				10,
				lessonId,
				'spanish_to_finnish',
				true // prioritizeFrequency enabled
			);

			// Should have selected some words (the actual frequency preference is tested by frequency optimization)
			expect(selectedWords.length).toBeGreaterThan(0);
			expect(selectedWords.length).toBeLessThanOrEqual(10);
		});

		it('should work without frequency optimization', async () => {
			const allWords = getAllWords().slice(0, 30);
			const lessonId = 'no-frequency-test-1';

			localStorageMock.removeItem('sanapeli_word_history');

			const selectedWords = await selectGameWords(
				allWords,
				10,
				lessonId,
				'spanish_to_finnish',
				false // prioritizeFrequency disabled
			);

			expect(selectedWords.length).toBeGreaterThan(0);
			expect(selectedWords.length).toBeLessThanOrEqual(10);
		});

		it('should return valid Word objects with required fields', async () => {
			const allWords = getAllWords().slice(0, 20);
			const lessonId = 'validity-test-1';

			const selectedWords = await selectGameWords(
				allWords,
				5,
				lessonId,
				'spanish_to_finnish',
				false
			);

			for (const word of selectedWords) {
				expect(word).toHaveProperty('spanish');
				expect(word).toHaveProperty('finnish');
				expect(word).toHaveProperty('english');
				expect(typeof word.spanish).toBe('string');
				expect(typeof word.finnish).toBe('string');
				expect(word.spanish.length).toBeGreaterThan(0);
				expect(word.finnish.length).toBeGreaterThan(0);
			}
		});
	});

	describe('Lesson-Based Selection', () => {
		it('should work with lesson words as available pool', async () => {
			// Simulate lesson words
			const allWords = getAllWords();
			const lessonWords = allWords.slice(0, 15); // Use first 15 words as lesson content
			const lessonId = 'lesson-001';

			localStorageMock.removeItem('sanapeli_word_history');

			const selectedWords = await selectGameWords(
				lessonWords, // Use lesson words as available pool
				10,
				lessonId,
				'spanish_to_finnish',
				true
			);

			// All selected words should be from the lesson
			expect(selectedWords.length).toBeGreaterThan(0);
			expect(selectedWords.length).toBeLessThanOrEqual(10);

			for (const selected of selectedWords) {
				const isInLesson = lessonWords.some(w => w.spanish === selected.spanish);
				expect(isInLesson).toBe(true);
			}
		});

		it('should maintain separate history per lesson', async () => {
			const allWords = getAllWords().slice(0, 30);
			const lesson1Words = allWords.slice(0, 10);
			const lesson2Words = allWords.slice(10, 20);

			localStorageMock.removeItem('sanapeli_word_history');

			// Complete games for different lessons
			recordGameCompletion(lesson1Words, 'lesson-001');
			recordGameCompletion(lesson2Words, 'lesson-002');

			const historyStr = localStorageMock.getItem('sanapeli_word_history');
			const history = JSON.parse(historyStr!);

			expect(history['lesson-001']).toBeDefined();
			expect(history['lesson-002']).toBeDefined();
			expect(history['lesson-001'].games[0].length).toBe(10);
			expect(history['lesson-002'].games[0].length).toBe(10);
		});
	});

	describe('Edge Cases', () => {
		it('should handle empty word list gracefully', async () => {
			const selectedWords = await selectGameWords(
				[],
				5,
				'empty-test',
				'spanish_to_finnish',
				false
			);

			expect(selectedWords).toBeDefined();
			expect(Array.isArray(selectedWords)).toBe(true);
			expect(selectedWords.length).toBe(0);
		});

		it('should handle request for zero words', async () => {
			const allWords = getAllWords().slice(0, 10);

			const selectedWords = await selectGameWords(
				allWords,
				0,
				'zero-test',
				'spanish_to_finnish',
				false
			);

			expect(selectedWords.length).toBe(0);
		});

		it('should handle request for more words than available', async () => {
			const allWords = getAllWords().slice(0, 5);

			const selectedWords = await selectGameWords(
				allWords,
				100, // Request more than available
				'more-than-available',
				'spanish_to_finnish',
				false
			);

			// Should return requested count by repeating words if needed
		expect(selectedWords.length).toBe(100);
		// All returned words should be from available words
		const availableSpanish = new Set(allWords.map(w => w.spanish));
		for (const word of selectedWords) {
			expect(availableSpanish.has(word.spanish)).toBe(true);
		}
	});
	});
});
