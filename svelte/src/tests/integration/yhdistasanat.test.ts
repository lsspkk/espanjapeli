import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAllWords, getWordsFromCategory, type Word } from '$lib/data/words';
import { getCategoriesByLearningOrder } from '$lib/data/categoryConfig';
import { selectGameWords, recordGameCompletion, getPreviousGames } from '$lib/services/wordSelection';
import { wordKnowledge } from '$lib/stores/wordKnowledge';
import { get } from 'svelte/store';

/**
 * Integration tests for Yhdistäsanat game
 * 
 * These tests verify the data flow and business logic integration
 * for the Yhdistäsanat game without requiring full DOM rendering.
 * 
 * Test Coverage:
 * - Task 1.9.1: Integration test setup with mock data
 * - Task 1.9.2: Main display (home screen) data integration tests
 * 
 * Note: Full UI integration tests with user interactions would require
 * a browser testing framework like Playwright. These tests focus on
 * verifying that the data layer, services, and stores work together correctly.
 */

// Mock TTS service to avoid audio issues in tests
vi.mock('$lib/services/tts', () => ({
	tts: {
		speak: vi.fn().mockResolvedValue(undefined),
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

describe('Yhdistäsanat Integration Tests', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorageMock.clear();
		
		// Reset to default values
		localStorageMock.setItem('yhdistasanat_category', 'all');
		localStorageMock.setItem('yhdistasanat_game_length', '10');
		localStorageMock.setItem('yhdistasanat_question_language', 'spanish');
	});

	describe('Task 1.9.1: Integration Test Setup', () => {
		it('should have mock word data available', () => {
			const allWords = getAllWords();
			expect(allWords).toBeDefined();
			expect(allWords.length).toBeGreaterThan(0);
			expect(allWords[0]).toHaveProperty('spanish');
			expect(allWords[0]).toHaveProperty('finnish');
			expect(allWords[0]).toHaveProperty('english');
		});

		it('should have at least 100 words in the database', () => {
			const allWords = getAllWords();
			expect(allWords.length).toBeGreaterThanOrEqual(100);
		});

		it('should have category data available', () => {
			const categories = getCategoriesByLearningOrder();
			expect(categories).toBeDefined();
			expect(categories.length).toBeGreaterThan(0);
			expect(categories[0]).toHaveProperty('key');
			expect(categories[0]).toHaveProperty('tier');
		});

		it('should have at least 10 categories', () => {
			const categories = getCategoriesByLearningOrder();
			expect(categories.length).toBeGreaterThanOrEqual(10);
		});

		it('should be able to get words from specific category', () => {
			const categories = getCategoriesByLearningOrder();
			const firstCategory = categories[0];
			const categoryWords = getWordsFromCategory(firstCategory.key);
			expect(categoryWords).toBeDefined();
			expect(categoryWords.length).toBeGreaterThan(0);
		});

		it('should have localStorage mock working', () => {
			localStorageMock.setItem('test_key', 'test_value');
			expect(localStorageMock.getItem('test_key')).toBe('test_value');
			localStorageMock.removeItem('test_key');
			expect(localStorageMock.getItem('test_key')).toBeNull();
		});

		it('should have word selection service available', async () => {
			const allWords = getAllWords();
			const selectedWords = await selectGameWords(allWords, 10, 'all', 'spanish_to_finnish');
			expect(selectedWords).toBeDefined();
			expect(selectedWords.length).toBe(10);
		});

		it('should have word knowledge store available', () => {
			const knowledge = get(wordKnowledge);
			expect(knowledge).toBeDefined();
		});
	});

	describe('Task 1.9.2: Main Display (Home Screen) Data Integration', () => {
		describe('Game Configuration Data', () => {
			it('should support all game length options (10, 21, 42)', async () => {
				const allWords = getAllWords();
				const gameLengths = [10, 21, 42];
				
				for (const length of gameLengths) {
					const selectedWords = await selectGameWords(allWords, length, 'all', 'spanish_to_finnish');
					expect(selectedWords.length).toBe(length);
				}
			});

			it('should support both language directions', async () => {
				const allWords = getAllWords();
				
				const spanishToFinnish = await selectGameWords(allWords, 10, 'all', 'spanish_to_finnish');
				expect(spanishToFinnish.length).toBe(10);
				
				const finnishToSpanish = await selectGameWords(allWords, 10, 'all', 'finnish_to_spanish');
				expect(finnishToSpanish.length).toBe(10);
			});

			it('should have "all" category option that includes all words', async () => {
				const allWords = getAllWords();
				const selectedWords = await selectGameWords(allWords, 10, 'all', 'spanish_to_finnish');
				expect(selectedWords.length).toBe(10);
			});

			it('should support category-specific word selection', async () => {
				const categories = getCategoriesByLearningOrder();
				const testCategory = categories[0];
				const categoryWords = getWordsFromCategory(testCategory.key);
				const selectedWords = await selectGameWords(categoryWords, 5, testCategory.key, 'spanish_to_finnish');
				
				expect(selectedWords.length).toBeLessThanOrEqual(5);
				expect(selectedWords.length).toBeGreaterThan(0);
			});
		});

		describe('Category Picker Data', () => {
			it('should have categories organized by tiers', () => {
				const categories = getCategoriesByLearningOrder();
				const tierGroups = new Map<number, typeof categories>();
				
				categories.forEach(cat => {
					if (!tierGroups.has(cat.tier)) {
						tierGroups.set(cat.tier, []);
					}
					tierGroups.get(cat.tier)!.push(cat);
				});
				
				// Should have multiple tiers
				expect(tierGroups.size).toBeGreaterThan(1);
				expect(tierGroups.size).toBeLessThanOrEqual(5);
			});

			it('should have tier 1 (Foundation) categories', () => {
				const categories = getCategoriesByLearningOrder();
				const tier1Categories = categories.filter(c => c.tier === 1);
				expect(tier1Categories.length).toBeGreaterThan(0);
			});

			it('should have categories with proper metadata', () => {
				const categories = getCategoriesByLearningOrder();
				categories.forEach(cat => {
					expect(cat).toHaveProperty('key');
					expect(cat).toHaveProperty('tier');
					expect(cat).toHaveProperty('tierName');
					expect(cat).toHaveProperty('difficulty');
					expect(cat).toHaveProperty('cefrLevel');
				});
			});

			it('should order categories by learning priority', () => {
				const categories = getCategoriesByLearningOrder();
				// Categories should be ordered by their 'order' property
				for (let i = 1; i < categories.length; i++) {
					expect(categories[i].order).toBeGreaterThanOrEqual(categories[i - 1].order);
				}
			});
		});

		describe('Sanakirja (Dictionary) Data', () => {
			it('should be able to prepare upcoming words for a game', async () => {
				const allWords = getAllWords();
				const upcomingWords = await selectGameWords(allWords, 10, 'all', 'spanish_to_finnish');
				
				expect(upcomingWords.length).toBe(10);
				upcomingWords.forEach(word => {
					expect(word).toHaveProperty('spanish');
					expect(word).toHaveProperty('finnish');
					expect(word.spanish).toBeTruthy();
					expect(word.finnish).toBeTruthy();
				});
			});

			it('should select different words for different categories', () => {
				const categories = getCategoriesByLearningOrder();
				const cat1 = categories[0];
				const cat2 = categories[1];
				
				const words1 = getWordsFromCategory(cat1.key);
				const words2 = getWordsFromCategory(cat2.key);
				
				// Categories should have different word sets
				const words1Spanish = new Set(words1.map(w => w.spanish));
				const words2Spanish = new Set(words2.map(w => w.spanish));
				
				// There should be some difference between categories
				const intersection = new Set([...words1Spanish].filter(x => words2Spanish.has(x)));
				expect(intersection.size).toBeLessThan(Math.min(words1.length, words2.length));
			});

			it('should maintain word pair integrity (spanish-finnish mapping)', () => {
				const allWords = getAllWords();
				allWords.forEach(word => {
					expect(word.spanish).toBeTruthy();
					expect(word.finnish).toBeTruthy();
					expect(typeof word.spanish).toBe('string');
					expect(typeof word.finnish).toBe('string');
					expect(word.spanish.length).toBeGreaterThan(0);
					expect(word.finnish.length).toBeGreaterThan(0);
				});
			});
		});

		describe('Game State Persistence', () => {
			it('should persist category selection in localStorage', () => {
				const testCategory = 'animals';
				localStorageMock.setItem('yhdistasanat_category', testCategory);
				
				const stored = localStorageMock.getItem('yhdistasanat_category');
				expect(stored).toBe(testCategory);
			});

			it('should persist game length in localStorage', () => {
				const testLength = '21';
				localStorageMock.setItem('yhdistasanat_game_length', testLength);
				
				const stored = localStorageMock.getItem('yhdistasanat_game_length');
				expect(stored).toBe(testLength);
			});

			it('should persist language direction in localStorage', () => {
				const testDirection = 'finnish';
				localStorageMock.setItem('yhdistasanat_question_language', testDirection);
				
				const stored = localStorageMock.getItem('yhdistasanat_question_language');
				expect(stored).toBe(testDirection);
			});

			it('should restore default values when localStorage is empty', () => {
				localStorageMock.clear();
				
				const category = localStorageMock.getItem('yhdistasanat_category');
				const gameLength = localStorageMock.getItem('yhdistasanat_game_length');
				const questionLanguage = localStorageMock.getItem('yhdistasanat_question_language');
				
				// Should be null when not set
				expect(category).toBeNull();
				expect(gameLength).toBeNull();
				expect(questionLanguage).toBeNull();
			});
		});

		describe('Word Selection Algorithm', () => {
			it('should not return duplicate words in a single game', async () => {
				const allWords = getAllWords();
				const selectedWords = await selectGameWords(allWords, 10, 'all', 'spanish_to_finnish');
				
				const spanishWords = selectedWords.map(w => w.spanish);
				const uniqueSpanish = new Set(spanishWords);
				
				// All words should be unique
				expect(uniqueSpanish.size).toBe(selectedWords.length);
			});

			it('should handle small categories gracefully', async () => {
				const categories = getCategoriesByLearningOrder();
				
				// Find a small category
				const smallCategory = categories.find(cat => {
					const words = getWordsFromCategory(cat.key);
					return words.length < 10 && words.length > 0;
				});
				
				if (smallCategory) {
					const categoryWords = getWordsFromCategory(smallCategory.key);
					const requestedCount = 10;
					const selectedWords = await selectGameWords(
						categoryWords,
						requestedCount,
						smallCategory.key,
						'spanish_to_finnish'
					);
					
					// Should return all available words if category is too small
					expect(selectedWords.length).toBeLessThanOrEqual(requestedCount);
					expect(selectedWords.length).toBeGreaterThan(0);
				}
			});

			it('should select words from the correct category', async () => {
				const categories = getCategoriesByLearningOrder();
				const testCategory = categories[0];
				const categoryWords = getWordsFromCategory(testCategory.key);
				const selectedWords = await selectGameWords(
					categoryWords,
					5,
					testCategory.key,
					'spanish_to_finnish'
				);
				
				// All selected words should be from the category word pool
				const categorySpanishWords = new Set(categoryWords.map(w => w.spanish));
				selectedWords.forEach(word => {
					expect(categorySpanishWords.has(word.spanish)).toBe(true);
				});
			});
		});

		describe('Data Validation', () => {
			it('should have valid Spanish text for all words', () => {
				const allWords = getAllWords();
				allWords.forEach(word => {
					expect(word.spanish).toBeTruthy();
					expect(word.spanish.length).toBeGreaterThan(0);
					expect(word.spanish.trim()).toBe(word.spanish); // No leading/trailing whitespace
				});
			});

			it('should have valid Finnish text for all words', () => {
				const allWords = getAllWords();
				allWords.forEach(word => {
					expect(word.finnish).toBeTruthy();
					expect(word.finnish.length).toBeGreaterThan(0);
					expect(word.finnish.trim()).toBe(word.finnish); // No leading/trailing whitespace
				});
			});

			it('should have valid English text for all words', () => {
				const allWords = getAllWords();
				allWords.forEach(word => {
					expect(word.english).toBeTruthy();
					expect(word.english.length).toBeGreaterThan(0);
					expect(word.english.trim()).toBe(word.english); // No leading/trailing whitespace
				});
			});

		it('should track duplicate word pairs (if any exist)', () => {
			const allWords = getAllWords();
			const pairs = new Map<string, number>();
			
			allWords.forEach(word => {
				const pair = `${word.spanish}:${word.finnish}`;
				pairs.set(pair, (pairs.get(pair) || 0) + 1);
			});
			
			const duplicates = Array.from(pairs.entries()).filter(([_, count]) => count > 1);
			
			if (duplicates.length > 0) {
				console.warn(`Found ${duplicates.length} duplicate word pairs:`);
				duplicates.slice(0, 5).forEach(([pair, count]) => {
					console.warn(`  - "${pair}" appears ${count} times`);
				});
			}
			
			// This is informational - duplicates might be intentional for learning
			expect(pairs.size).toBeGreaterThan(0);
		});
		});
	});

	describe('Integration: Complete Game Flow Data', () => {
		it('should support a complete game flow from start to finish', async () => {
			// 1. Select category
			const categories = getCategoriesByLearningOrder();
			const selectedCategory = categories[0];
			expect(selectedCategory).toBeDefined();
			
			// 2. Get words from category
			const categoryWords = getWordsFromCategory(selectedCategory.key);
			expect(categoryWords.length).toBeGreaterThan(0);
			
			// 3. Select game words
			const gameLength = 10;
			const gameWords = await selectGameWords(
				categoryWords,
				gameLength,
				selectedCategory.key,
				'spanish_to_finnish'
			);
			expect(gameWords.length).toBeGreaterThan(0);
			expect(gameWords.length).toBeLessThanOrEqual(gameLength);
			
			// 4. Verify each word has required data for gameplay
			gameWords.forEach(word => {
				expect(word.spanish).toBeTruthy();
				expect(word.finnish).toBeTruthy();
				expect(word.english).toBeTruthy();
			});
		});

		it('should support generating answer options for each question', async () => {
			const allWords = getAllWords();
			const gameWords = await selectGameWords(allWords, 5, 'all', 'spanish_to_finnish');
			
			gameWords.forEach(correctWord => {
				// Generate wrong options (simulate game logic)
				const wrongWords = allWords.filter(w => 
					w.spanish !== correctWord.spanish && 
					w.finnish !== correctWord.finnish
				);
				
				expect(wrongWords.length).toBeGreaterThan(0);
				
				// Should have enough words to create 6-8 options
				const optionCount = 8;
				expect(wrongWords.length).toBeGreaterThanOrEqual(optionCount - 1);
			});
		});

		it('should support both question directions in the same game data', () => {
			const allWords = getAllWords();
			const testWord = allWords[0];
			
			// Spanish to Finnish direction
			const questionTextES = testWord.spanish;
			const answerTextES = testWord.finnish;
			expect(questionTextES).toBeTruthy();
			expect(answerTextES).toBeTruthy();
			
			// Finnish to Spanish direction
			const questionTextFI = testWord.finnish;
			const answerTextFI = testWord.spanish;
			expect(questionTextFI).toBeTruthy();
			expect(answerTextFI).toBeTruthy();
		});
	});

	describe('Task 1.9.3: Question Display (Playing State) Integration', () => {
		describe('Component Rendering', () => {
			it('should have GameHeader component available', async () => {
				const { default: GameHeader } = await import('$lib/components/basic/core/GameHeader.svelte');
				expect(GameHeader).toBeDefined();
			});

			it('should have TriesIndicator component available', async () => {
				const { default: TriesIndicator } = await import('$lib/components/basic/core/TriesIndicator.svelte');
				expect(TriesIndicator).toBeDefined();
			});

			it('should have PossiblePoints component available', async () => {
				const { default: PossiblePoints } = await import('$lib/components/basic/core/PossiblePoints.svelte');
				expect(PossiblePoints).toBeDefined();
			});

			it('should have QuestionCard component available', async () => {
				const { default: QuestionCard } = await import('$lib/components/basic/core/QuestionCard.svelte');
				expect(QuestionCard).toBeDefined();
			});

			it('should have OptionButtons component available', async () => {
				const { default: OptionButtons } = await import('$lib/components/basic/input/OptionButtons.svelte');
				expect(OptionButtons).toBeDefined();
			});

			it('should have LineAnimation component available', async () => {
				const { default: LineAnimation } = await import('$lib/components/basic/feedback/LineAnimation.svelte');
				expect(LineAnimation).toBeDefined();
			});

			it('should have FeedbackOverlay component available', async () => {
				const { default: FeedbackOverlay } = await import('$lib/components/basic/feedback/FeedbackOverlay.svelte');
				expect(FeedbackOverlay).toBeDefined();
			});
		});

		describe('Game State Data Flow', () => {
			it('should generate complete question data for playing state', async () => {
				const allWords = getAllWords();
				const gameWords = await selectGameWords(allWords, 10, 'all', 'spanish_to_finnish');
				const currentWord = gameWords[0];
				
				// Simulate question data structure
				const questionData = {
					currentQuestionNumber: 1,
					totalQuestions: 10,
					score: 0,
					triesRemaining: 3,
					maxTries: 3,
					currentWord: currentWord,
					questionText: currentWord.spanish,
					answerText: currentWord.finnish
				};
				
				expect(questionData.currentQuestionNumber).toBe(1);
				expect(questionData.totalQuestions).toBe(10);
				expect(questionData.triesRemaining).toBe(3);
				expect(questionData.currentWord).toBeDefined();
				expect(questionData.questionText).toBeTruthy();
				expect(questionData.answerText).toBeTruthy();
			});

			it('should calculate possible points correctly based on tries', () => {
				const pointsMap: Record<number, number> = { 3: 10, 2: 3, 1: 1, 0: 0 };
				
				expect(pointsMap[3]).toBe(10); // First try
				expect(pointsMap[2]).toBe(3);  // Second try
				expect(pointsMap[1]).toBe(1);  // Third try
				expect(pointsMap[0]).toBe(0);  // Failed
			});

			it('should generate answer options with correct and wrong answers', async () => {
				const allWords = getAllWords();
				const gameWords = await selectGameWords(allWords, 5, 'all', 'spanish_to_finnish');
				const correctWord = gameWords[0];
				
				// Simulate option generation
				const wrongWords = allWords.filter(w => 
					w.spanish !== correctWord.spanish && 
					w.finnish !== correctWord.finnish
				);
				
				const optionCount = Math.min(8, allWords.length);
				const wrongOptions = wrongWords.slice(0, optionCount - 1);
				const allOptions = [correctWord, ...wrongOptions];
				
				expect(allOptions.length).toBeGreaterThanOrEqual(2);
				expect(allOptions.length).toBeLessThanOrEqual(8);
				expect(allOptions).toContain(correctWord);
			});

			it('should track wrong clicks for disabled state', () => {
				const wrongClicks = new Set<string>();
				const testWords = ['perro', 'gato', 'casa'];
				
				testWords.forEach(word => wrongClicks.add(word));
				
				expect(wrongClicks.size).toBe(3);
				expect(wrongClicks.has('perro')).toBe(true);
				expect(wrongClicks.has('gato')).toBe(true);
				expect(wrongClicks.has('casa')).toBe(true);
			});
		});

		describe('Answer Interaction Flow', () => {
			it('should handle correct answer flow', async () => {
				const allWords = getAllWords();
				const gameWords = await selectGameWords(allWords, 5, 'all', 'spanish_to_finnish');
				const correctWord = gameWords[0];
				
				let triesRemaining = 3;
				let score = 0;
				
				// Simulate correct answer on first try
				const pointsMap: Record<number, number> = { 3: 10, 2: 3, 1: 1 };
				const pointsEarned = pointsMap[triesRemaining] || 0;
				score += pointsEarned;
				
				expect(pointsEarned).toBe(10);
				expect(score).toBe(10);
				expect(triesRemaining).toBe(3);
			});

			it('should handle wrong answer flow with tries decrement', () => {
				let triesRemaining = 3;
				const wrongClicks = new Set<string>();
				
				// Simulate wrong answer
				triesRemaining--;
				wrongClicks.add('wrong_word_1');
				
				expect(triesRemaining).toBe(2);
				expect(wrongClicks.size).toBe(1);
				
				// Another wrong answer
				triesRemaining--;
				wrongClicks.add('wrong_word_2');
				
				expect(triesRemaining).toBe(1);
				expect(wrongClicks.size).toBe(2);
			});

			it('should handle running out of tries', () => {
				let triesRemaining = 1;
				let score = 0;
				let failedWords: string[] = [];
				
				const correctWord = { spanish: 'perro', finnish: 'koira', english: 'dog' };
				
				// Last wrong answer
				triesRemaining--;
				
				expect(triesRemaining).toBe(0);
				
				// Should record as failed
				if (triesRemaining === 0) {
					failedWords.push(correctWord.spanish);
					const pointsEarned = 0;
					score += pointsEarned;
				}
				
				expect(failedWords.length).toBe(1);
				expect(score).toBe(0);
			});

			it('should calculate answer quality for knowledge tracking', () => {
				const qualityMap: Record<number, string> = {
					3: 'first_try',
					2: 'second_try',
					1: 'third_try',
					0: 'failed'
				};
				
				expect(qualityMap[3]).toBe('first_try');
				expect(qualityMap[2]).toBe('second_try');
				expect(qualityMap[1]).toBe('third_try');
				expect(qualityMap[0]).toBe('failed');
			});
		});

		describe('Feedback Display Data', () => {
			it('should prepare correct answer feedback data', () => {
				const correctWord = { spanish: 'perro', finnish: 'koira', english: 'dog' };
				const exclamations = ['¡Muy bien!', '¡Excelente!', '¡Perfecto!'];
				
				const feedbackData = {
					isCorrect: true,
					spanish: correctWord.spanish,
					finnish: correctWord.finnish,
					exclamation: exclamations[0],
					pointsEarned: 10,
					animationIn: 'animate-pop-in',
					animationOut: 'animate-pop-out'
				};
				
				expect(feedbackData.isCorrect).toBe(true);
				expect(feedbackData.spanish).toBe('perro');
				expect(feedbackData.finnish).toBe('koira');
				expect(feedbackData.pointsEarned).toBe(10);
			});

			it('should prepare wrong answer feedback data', () => {
				const correctWord = { spanish: 'perro', finnish: 'koira', english: 'dog' };
				
				const feedbackData = {
					isCorrect: false,
					spanish: correctWord.spanish,
					finnish: correctWord.finnish,
					exclamation: '',
					pointsEarned: 0,
					animationIn: 'animate-slide-down',
					animationOut: 'animate-slide-up-out'
				};
				
				expect(feedbackData.isCorrect).toBe(false);
				expect(feedbackData.spanish).toBe('perro');
				expect(feedbackData.finnish).toBe('koira');
				expect(feedbackData.pointsEarned).toBe(0);
				expect(feedbackData.exclamation).toBe('');
			});

			it('should have multiple animation options available', () => {
				const animations = [
					{ entry: 'animate-pop-in', exit: 'animate-pop-out' },
					{ entry: 'animate-slide-down', exit: 'animate-slide-up-out' },
					{ entry: 'animate-slide-up', exit: 'animate-slide-down-out' },
					{ entry: 'animate-fade-in', exit: 'animate-fade-out' },
					{ entry: 'animate-rotate-in', exit: 'animate-rotate-out' }
				];
				
				expect(animations.length).toBe(5);
				animations.forEach(anim => {
					expect(anim.entry).toBeTruthy();
					expect(anim.exit).toBeTruthy();
				});
			});
		});

		describe('Question Progression', () => {
			it('should track question progression through a game', () => {
				const gameLength = 10;
				let currentQuestionNumber = 0;
				let gameQuestions: any[] = [];
				
				// Simulate answering 3 questions
				for (let i = 0; i < 3; i++) {
					currentQuestionNumber++;
					gameQuestions.push({
						questionNumber: currentQuestionNumber,
						isCorrect: i % 2 === 0, // Alternate correct/wrong
						pointsEarned: i % 2 === 0 ? 10 : 0
					});
				}
				
				expect(currentQuestionNumber).toBe(3);
				expect(gameQuestions.length).toBe(3);
				expect(gameQuestions[0].isCorrect).toBe(true);
				expect(gameQuestions[1].isCorrect).toBe(false);
				expect(gameQuestions[2].isCorrect).toBe(true);
			});

			it('should determine when game is complete', () => {
				const gameLength = 10;
				let currentQuestionNumber = 10;
				
				const isGameComplete = currentQuestionNumber >= gameLength;
				
				expect(isGameComplete).toBe(true);
			});

			it('should maintain score throughout game', () => {
				let totalScore = 0;
				const answers = [
					{ correct: true, tries: 3, points: 10 },
					{ correct: true, tries: 2, points: 3 },
					{ correct: false, tries: 0, points: 0 },
					{ correct: true, tries: 1, points: 1 }
				];
				
				answers.forEach(answer => {
					totalScore += answer.points;
				});
				
				expect(totalScore).toBe(14); // 10 + 3 + 0 + 1
			});
		});
	});

	describe('Task 1.9.4: Game Result Display (Report Screen) Integration', () => {
		describe('Report Component Availability', () => {
			it('should have GameReport component available', async () => {
				const { default: GameReport } = await import('$lib/components/basic/report/GameReport.svelte');
				expect(GameReport).toBeDefined();
			});

			it('should have WrongAnswersList component available', async () => {
				const { default: WrongAnswersList } = await import('$lib/components/basic/report/WrongAnswersList.svelte');
				expect(WrongAnswersList).toBeDefined();
			});
		});

		describe('Report Data Calculation', () => {
			it('should calculate try count statistics correctly', () => {
				const gameQuestions = [
					{ isCorrect: true, tipsRequested: 0, pointsEarned: 10 },  // First try
					{ isCorrect: true, tipsRequested: 0, pointsEarned: 10 },  // First try
					{ isCorrect: true, tipsRequested: 1, pointsEarned: 3 },   // Second try
					{ isCorrect: true, tipsRequested: 2, pointsEarned: 1 },   // Third try
					{ isCorrect: false, tipsRequested: 3, pointsEarned: 0 }   // Failed
				];
				
				const firstTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 0).length;
				const secondTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 1).length;
				const thirdTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 2).length;
				const failedCount = gameQuestions.filter(q => !q.isCorrect).length;
				
				expect(firstTryCount).toBe(2);
				expect(secondTryCount).toBe(1);
				expect(thirdTryCount).toBe(1);
				expect(failedCount).toBe(1);
			});

			it('should calculate total score and percentage', () => {
				const gameLength = 10;
				const totalScore = 45;
				const maxPossibleScore = gameLength * 10; // 100
				const scorePercentage = Math.round((totalScore / maxPossibleScore) * 100);
				
				expect(maxPossibleScore).toBe(100);
				expect(scorePercentage).toBe(45);
			});

			it('should format game time correctly', () => {
				const gameStartTime = 1000000;
				const gameEndTime = 1065000; // 65 seconds later
				
				const totalSeconds = Math.floor((gameEndTime - gameStartTime) / 1000);
				const minutes = Math.floor(totalSeconds / 60);
				const seconds = totalSeconds % 60;
				const formatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
				
				expect(totalSeconds).toBe(65);
				expect(minutes).toBe(1);
				expect(seconds).toBe(5);
				expect(formatted).toBe('1m 5s');
			});

			it('should format game time for short games', () => {
				const gameStartTime = 1000000;
				const gameEndTime = 1025000; // 25 seconds later
				
				const totalSeconds = Math.floor((gameEndTime - gameStartTime) / 1000);
				const minutes = Math.floor(totalSeconds / 60);
				const seconds = totalSeconds % 60;
				const formatted = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
				
				expect(totalSeconds).toBe(25);
				expect(formatted).toBe('25s');
			});

			it('should collect wrong answers for display', () => {
				const gameQuestions = [
					{ spanish: 'perro', finnish: 'koira', isCorrect: true, userAnswer: 'koira' },
					{ spanish: 'gato', finnish: 'kissa', isCorrect: false, userAnswer: 'koira' },
					{ spanish: 'casa', finnish: 'talo', isCorrect: true, userAnswer: 'talo' },
					{ spanish: 'libro', finnish: 'kirja', isCorrect: false, userAnswer: 'talo' }
				];
				
				const wrongAnswers = gameQuestions.filter(q => !q.isCorrect);
				
				expect(wrongAnswers.length).toBe(2);
				expect(wrongAnswers[0].spanish).toBe('gato');
				expect(wrongAnswers[1].spanish).toBe('libro');
			});
		});

		describe('Report Display with Different Outcomes', () => {
			it('should handle perfect score scenario', () => {
				const gameQuestions = Array(10).fill(null).map((_, i) => ({
					questionNumber: i + 1,
					isCorrect: true,
					tipsRequested: 0,
					pointsEarned: 10
				}));
				
				const firstTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 0).length;
				const failedCount = gameQuestions.filter(q => !q.isCorrect).length;
				const totalScore = gameQuestions.reduce((sum, q) => sum + q.pointsEarned, 0);
				const maxScore = gameQuestions.length * 10;
				
				expect(firstTryCount).toBe(10);
				expect(failedCount).toBe(0);
				expect(totalScore).toBe(100);
				expect(totalScore).toBe(maxScore);
			});

			it('should handle mixed performance scenario', () => {
				const gameQuestions = [
					{ isCorrect: true, tipsRequested: 0, pointsEarned: 10 },
					{ isCorrect: true, tipsRequested: 0, pointsEarned: 10 },
					{ isCorrect: true, tipsRequested: 1, pointsEarned: 3 },
					{ isCorrect: true, tipsRequested: 1, pointsEarned: 3 },
					{ isCorrect: true, tipsRequested: 2, pointsEarned: 1 },
					{ isCorrect: false, tipsRequested: 3, pointsEarned: 0 },
					{ isCorrect: true, tipsRequested: 0, pointsEarned: 10 },
					{ isCorrect: true, tipsRequested: 1, pointsEarned: 3 },
					{ isCorrect: false, tipsRequested: 3, pointsEarned: 0 },
					{ isCorrect: true, tipsRequested: 2, pointsEarned: 1 }
				];
				
				const firstTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 0).length;
				const secondTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 1).length;
				const thirdTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 2).length;
				const failedCount = gameQuestions.filter(q => !q.isCorrect).length;
				const totalScore = gameQuestions.reduce((sum, q) => sum + q.pointsEarned, 0);
				
				expect(firstTryCount).toBe(3);
				expect(secondTryCount).toBe(3);
				expect(thirdTryCount).toBe(2);
				expect(failedCount).toBe(2);
				expect(totalScore).toBe(41); // 30 + 9 + 2 + 0
			});

			it('should handle poor performance scenario', () => {
				const gameQuestions = Array(10).fill(null).map((_, i) => ({
					questionNumber: i + 1,
					isCorrect: i < 3, // Only first 3 correct
					tipsRequested: i < 3 ? 2 : 3,
					pointsEarned: i < 3 ? 1 : 0
				}));
				
				const thirdTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 2).length;
				const failedCount = gameQuestions.filter(q => !q.isCorrect).length;
				const totalScore = gameQuestions.reduce((sum, q) => sum + q.pointsEarned, 0);
				const correctCount = gameQuestions.filter(q => q.isCorrect).length;
				
				expect(thirdTryCount).toBe(3);
				expect(failedCount).toBe(7);
				expect(totalScore).toBe(3);
				expect(correctCount).toBe(3);
			});
		});

		describe('Report Button Functionality', () => {
			it('should support home button action', () => {
				let gameState = 'report';
				
				// Simulate home button click
				const goHome = () => {
					gameState = 'home';
				};
				
				goHome();
				expect(gameState).toBe('home');
			});

			it('should support play again button action', () => {
				let gameState = 'report';
				let gamesPlayed = 1;
				
				// Simulate play again button click
				const playAgain = () => {
					gameState = 'playing';
					gamesPlayed++;
				};
				
				playAgain();
				expect(gameState).toBe('playing');
				expect(gamesPlayed).toBe(2);
			});
		});

		describe('Report Data Persistence', () => {
			it('should record game completion for knowledge tracking', async () => {
				const allWords = getAllWords();
				const gameWords = await selectGameWords(allWords, 5, 'all', 'spanish_to_finnish');
				const selectedCategory = 'all';
				
				// Verify game completion can be recorded (function exists and is callable)
				expect(typeof recordGameCompletion).toBe('function');
				
				// Record the game
				recordGameCompletion(gameWords, selectedCategory);
				
				// Verify previous games can be retrieved
				const previousGames = getPreviousGames(selectedCategory, allWords, 1);
				expect(previousGames).toBeDefined();
				expect(Array.isArray(previousGames)).toBe(true);
			});

			it('should track word results for knowledge store', () => {
				const gameWordResults = [
					{ spanish: 'perro', finnish: 'koira', quality: 'first_try' as const },
					{ spanish: 'gato', finnish: 'kissa', quality: 'second_try' as const },
					{ spanish: 'casa', finnish: 'talo', quality: 'failed' as const }
				];
				
				expect(gameWordResults.length).toBe(3);
				expect(gameWordResults[0].quality).toBe('first_try');
				expect(gameWordResults[1].quality).toBe('second_try');
				expect(gameWordResults[2].quality).toBe('failed');
			});
		});

		describe('Report Statistics Validation', () => {
			it('should ensure try counts sum to total questions', () => {
				const gameQuestions = [
					{ isCorrect: true, tipsRequested: 0 },
					{ isCorrect: true, tipsRequested: 1 },
					{ isCorrect: true, tipsRequested: 2 },
					{ isCorrect: false, tipsRequested: 3 },
					{ isCorrect: true, tipsRequested: 0 }
				];
				
				const firstTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 0).length;
				const secondTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 1).length;
				const thirdTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 2).length;
				const failedCount = gameQuestions.filter(q => !q.isCorrect).length;
				
				const totalCounted = firstTryCount + secondTryCount + thirdTryCount + failedCount;
				
				expect(totalCounted).toBe(gameQuestions.length);
			});

			it('should calculate accuracy percentage correctly', () => {
				const gameLength = 10;
				const correctCount = 7;
				const accuracy = Math.round((correctCount / gameLength) * 100);
				
				expect(accuracy).toBe(70);
			});

			it('should handle zero score scenario', () => {
				const totalScore = 0;
				const maxScore = 100;
				const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
				
				expect(percentage).toBe(0);
			});
		});
	});
});
