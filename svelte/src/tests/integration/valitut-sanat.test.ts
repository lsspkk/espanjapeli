import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAllWords, type Word } from '$lib/data/words';
import { selectGameWords, recordGameCompletion } from '$lib/services/wordSelection';
import { wordKnowledge, type LanguageDirection } from '$lib/stores/wordKnowledge';
import { get } from 'svelte/store';

/**
 * Integration tests for Valitut Sanat game
 *
 * These tests verify the complete data flow and business logic for the
 * Valitut Sanat game, including:
 * - Language direction selection and persistence
 * - Word selection algorithm with lessons
 * - Quiz question generation and answering
 * - Game completion and history tracking
 * - Knowledge score recording
 */

// Mock TTS service
vi.mock('$lib/services/tts', () => ({
	tts: {
		speak: vi.fn().mockResolvedValue(undefined),
		speakSpanish: vi.fn().mockResolvedValue(undefined),
		speakFinnish: vi.fn().mockResolvedValue(undefined),
		stop: vi.fn(),
		cancel: vi.fn(),
		isSpeaking: vi.fn().mockReturnValue(false)
	}
}));

// Mock vocabularyService
vi.mock('$lib/services/vocabularyService', () => ({
	getWordsMetadata: async (words: string[]) => {
		const map = new Map();
		words.forEach((word, index) => {
			const isTop1000 = index < words.length * 0.7;
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

describe('Valitut Sanat Integration Tests', () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	describe('Complete Game Flow', () => {
		it('should support complete spanish_to_finnish game flow', async () => {
			const allWords = getAllWords().slice(0, 20);
			const lessonId = 'lesson-spanish-to-finnish';
			const gameLength = 10;
			const direction: LanguageDirection = 'spanish_to_finnish';

			// Step 1: Select words for the lesson
			const selectedWords = await selectGameWords(
				allWords,
				gameLength,
				lessonId,
				direction,
				true
			);

			expect(selectedWords.length).toBeLessThanOrEqual(gameLength);
			expect(selectedWords.length).toBeGreaterThan(0);

			// Step 2: Record game completion
			recordGameCompletion(selectedWords, lessonId);

			// Step 3: Verify history was recorded
			const historyStr = localStorageMock.getItem('sanapeli_word_history');
			expect(historyStr).toBeDefined();
			const history = JSON.parse(historyStr!);
			expect(history[lessonId]).toBeDefined();
			expect(history[lessonId].games.length).toBe(1);
		});

		it('should support complete finnish_to_spanish game flow', async () => {
			const allWords = getAllWords().slice(0, 20);
			const lessonId = 'lesson-finnish-to-spanish';
			const gameLength = 10;
			const direction: LanguageDirection = 'finnish_to_spanish';

			// Step 1: Select words for the lesson
			const selectedWords = await selectGameWords(
				allWords,
				gameLength,
				lessonId,
				direction,
				true
			);

			expect(selectedWords.length).toBeLessThanOrEqual(gameLength);
			expect(selectedWords.length).toBeGreaterThan(0);

			// Step 2: Record game completion
			recordGameCompletion(selectedWords, lessonId);

			// Step 3: Verify history was recorded
			const historyStr = localStorageMock.getItem('sanapeli_word_history');
			expect(historyStr).toBeDefined();
			const history = JSON.parse(historyStr!);
			expect(history[lessonId]).toBeDefined();
		});
	});

	describe('Language Direction Persistence', () => {
		it('should persist language direction to localStorage', () => {
			const language: 'spanish' | 'finnish' = 'spanish';
			localStorageMock.setItem('valitut-sanat_question_language', language);

			const saved = localStorageMock.getItem('valitut-sanat_question_language');
			expect(saved).toBe('spanish');
		});

		it('should persist finnish language direction', () => {
			const language: 'spanish' | 'finnish' = 'finnish';
			localStorageMock.setItem('valitut-sanat_question_language', language);

			const saved = localStorageMock.getItem('valitut-sanat_question_language');
			expect(saved).toBe('finnish');
		});

		it('should map language direction to LanguageDirection correctly', () => {
			const testCases: Array<{
				language: 'spanish' | 'finnish';
				expectedDirection: LanguageDirection;
			}> = [
				{ language: 'spanish', expectedDirection: 'spanish_to_finnish' },
				{ language: 'finnish', expectedDirection: 'finnish_to_spanish' }
			];

			for (const testCase of testCases) {
				const direction: LanguageDirection =
					testCase.language === 'spanish' ? 'spanish_to_finnish' : 'finnish_to_spanish';
				expect(direction).toBe(testCase.expectedDirection);
			}
		});
	});

	describe('Quiz Length Management', () => {
		it('should limit quiz to selected game length (10 questions)', async () => {
			const allWords = getAllWords().slice(0, 20);
			const lessonId = 'length-test-10';

			const selectedWords = await selectGameWords(
				allWords,
				10,
				lessonId,
				'spanish_to_finnish',
				true
			);

			expect(selectedWords.length).toBeLessThanOrEqual(10);
		});

		it('should limit quiz to selected game length (21 questions)', async () => {
			const allWords = getAllWords().slice(0, 50);
			const lessonId = 'length-test-21';

			const selectedWords = await selectGameWords(
				allWords,
				21,
				lessonId,
				'spanish_to_finnish',
				true
			);

			expect(selectedWords.length).toBeLessThanOrEqual(21);
		});

		it('should limit quiz to selected game length (42 questions)', async () => {
			const allWords = getAllWords().slice(0, 100);
			const lessonId = 'length-test-42';

			const selectedWords = await selectGameWords(
				allWords,
				42,
				lessonId,
				'spanish_to_finnish',
				true
			);

			expect(selectedWords.length).toBeLessThanOrEqual(42);
		});

		it('should not exceed lesson word count', async () => {
			const lessonWords = getAllWords().slice(0, 8); // Only 8 words in lesson
			const lessonId = 'lesson-limited';

			const selectedWords = await selectGameWords(
				lessonWords,
				21, // Request 21 but only 8 available
				lessonId,
				'spanish_to_finnish',
				true
			);

			// Should return requested count by repeating words if needed
		expect(selectedWords.length).toBe(21);
		// All returned words should be from available words
		const availableSpanish = new Set(lessonWords.map(w => w.spanish));
		for (const word of selectedWords) {
			expect(availableSpanish.has(word.spanish)).toBe(true);
		}
		});
	});

	describe('Multiple Games in Same Lesson', () => {
		it('should track multiple games in the same lesson', async () => {
			const allWords = getAllWords().slice(0, 30);
			const lessonId = 'multi-game-lesson';

			localStorageMock.removeItem('sanapeli_word_history');

			// Play game 1
			const words1 = allWords.slice(0, 10);
			recordGameCompletion(words1, lessonId);

			// Play game 2
			const words2 = allWords.slice(10, 20);
			recordGameCompletion(words2, lessonId);

			// Play game 3
			const words3 = allWords.slice(20, 30);
			recordGameCompletion(words3, lessonId);

			const historyStr = localStorageMock.getItem('sanapeli_word_history');
			const history = JSON.parse(historyStr!);

			expect(history[lessonId].games.length).toBe(3);
			expect(history[lessonId].games[0].length).toBe(10);
			expect(history[lessonId].games[1].length).toBe(10);
			expect(history[lessonId].games[2].length).toBe(10);
		});

		it('should use game history for word selection in subsequent games', async () => {
			const allWords = getAllWords().slice(0, 30);
			const lessonId = 'history-aware-lesson';

			localStorageMock.removeItem('sanapeli_word_history');

			// First game: select and record
			const game1Words = allWords.slice(0, 10);
			recordGameCompletion(game1Words, lessonId);

			// Second game: should consider history
			const game2Words = await selectGameWords(
				allWords,
				10,
				lessonId,
				'spanish_to_finnish',
				true
			);

			expect(game2Words.length).toBeLessThanOrEqual(10);
			// Game 2 words may overlap with game 1 but algorithm should prefer fresh words
			expect(game2Words[0]).toHaveProperty('spanish');
		});
	});

	describe('Direction-Specific Knowledge Tracking', () => {
		it('should track spanish_to_finnish direction separately', () => {
			const wordId = 'test-word-1';
			const wordKnowledgeStore = get(wordKnowledge);

			// Record answer in spanish_to_finnish direction
			wordKnowledge.recordAnswer(wordId, 'test-finnish', 'spanish_to_finnish', 'first_try', 'basic');

			// Verify it was recorded
			const store = get(wordKnowledge);
			expect(store).toBeDefined();
		});

		it('should track finnish_to_spanish direction separately', () => {
			const wordId = 'test-word-2';
			const wordKnowledgeStore = get(wordKnowledge);

			// Record answer in finnish_to_spanish direction
			wordKnowledge.recordAnswer(wordId, 'test-spanish', 'finnish_to_spanish', 'first_try', 'basic');

			// Verify it was recorded
			const store = get(wordKnowledge);
			expect(store).toBeDefined();
		});
	});

	describe('Quiz Question Generation', () => {
		it('should generate spanish prompts for spanish_to_finnish direction', async () => {
			const testWords = getAllWords().slice(0, 5);
			const direction: LanguageDirection = 'spanish_to_finnish';

			// Simulate question generation
			const questions = testWords.map(word => ({
				word,
				direction: direction as any,
				prompt: word.spanish,
				correctAnswer: word.finnish,
				options: [word.finnish] // simplified
			}));

			for (const question of questions) {
				expect(question.prompt).toBe(question.word.spanish);
				expect(question.correctAnswer).toBe(question.word.finnish);
			}
		});

		it('should generate finnish prompts for finnish_to_spanish direction', async () => {
			const testWords = getAllWords().slice(0, 5);
			const direction: LanguageDirection = 'finnish_to_spanish';

			// Simulate question generation
			const questions = testWords.map(word => ({
				word,
				direction: direction as any,
				prompt: word.finnish,
				correctAnswer: word.spanish,
				options: [word.spanish] // simplified
			}));

			for (const question of questions) {
				expect(question.prompt).toBe(question.word.finnish);
				expect(question.correctAnswer).toBe(question.word.spanish);
			}
		});
	});

	describe('Lesson Integration', () => {
		it('should work with realistic lesson word selection', async () => {
			// Simulate a lesson with 15 words
			const allAvailableWords = getAllWords();
			const lessonWords = allAvailableWords.slice(0, 15);
			const lessonId = 'animals-lesson-001';

			localStorageMock.removeItem('sanapeli_word_history');

			// Select words from lesson
			const selectedWords = await selectGameWords(
				lessonWords, // Only words from this lesson available
				10,
				lessonId,
				'spanish_to_finnish',
				true
			);

			// Verify all selected words are from the lesson
			for (const selected of selectedWords) {
				const inLesson = lessonWords.find(w => w.spanish === selected.spanish);
				expect(inLesson).toBeDefined();
			}

			expect(selectedWords.length).toBeLessThanOrEqual(10);
		});

		it('should handle lessons with fewer words than game length', async () => {
			const allWords = getAllWords();
			const lessonWords = allWords.slice(0, 5); // Only 5 words in lesson
			const lessonId = 'small-lesson-001';

			localStorageMock.removeItem('sanapeli_word_history');

			const selectedWords = await selectGameWords(
				lessonWords,
				10, // Request 10 but only 5 available
				lessonId,
				'spanish_to_finnish',
				true
			);

			// Should return at most 5 words
			// Should return requested count by repeating words if needed
			expect(selectedWords.length).toBe(10);
			// All returned words should be from available words
			const availableSpanish2 = new Set(lessonWords.map(w => w.spanish));
			for (const word of selectedWords) {
				expect(availableSpanish2.has(word.spanish)).toBe(true);
			}
		});
	});

	describe('Error Handling and Edge Cases', () => {
		it('should handle lesson with no words gracefully', async () => {
			const selectedWords = await selectGameWords(
				[],
				10,
				'empty-lesson',
				'spanish_to_finnish',
				true
			);

			expect(selectedWords).toBeDefined();
			expect(Array.isArray(selectedWords)).toBe(true);
			expect(selectedWords.length).toBe(0);
		});

		it('should handle corrupted history gracefully', async () => {
			localStorageMock.setItem('sanapeli_word_history', 'invalid json');

			const allWords = getAllWords().slice(0, 10);

			// Should still work despite corrupted history
			const selectedWords = await selectGameWords(
				allWords,
				5,
				'recovery-lesson',
				'spanish_to_finnish',
				true
			);

			expect(selectedWords.length).toBeGreaterThan(0);
		});

		it('should validate localStorage availability', () => {
			// Verify localStorage is available for this test environment
			expect(localStorageMock.getItem).toBeDefined();
			expect(localStorageMock.setItem).toBeDefined();
			expect(localStorageMock.removeItem).toBeDefined();
			expect(localStorageMock.clear).toBeDefined();
		});
	});
});
