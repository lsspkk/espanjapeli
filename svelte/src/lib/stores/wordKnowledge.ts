/**
 * Word Knowledge Store for Yhdistä sanat game
 * 
 * Tracks user's proficiency with individual words across categories.
 * Uses a modified SM-2 (SuperMemo 2) algorithm adapted for language learning games.
 * 
 * Key concepts:
 * - Each word has a knowledge score (0-100%)
 * - Score is based on performance across multiple game sessions
 * - First try = perfect recall, 2nd = good, 3rd = acceptable, fail = needs practice
 * - Category proficiency = average of word proficiencies in that category
 * - Separate tracking for Spanish→Finnish and Finnish→Spanish directions
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// Storage key
const STORAGE_KEY = 'yhdistasanat_word_knowledge';
const STORAGE_VERSION = 1;

// Types

/** Direction of language practice */
export type LanguageDirection = 'spanish_to_finnish' | 'finnish_to_spanish';

/** Performance rating for a single word answer */
export type AnswerQuality = 'first_try' | 'second_try' | 'third_try' | 'failed';

/** Knowledge data for a single word */
export interface WordKnowledge {
	/** Current knowledge score (0-100) */
	score: number;
	/** Number of times this word has been practiced */
	practiceCount: number;
	/** Number of times answered correctly on first try */
	firstTryCount: number;
	/** Number of times answered correctly on second try */
	secondTryCount: number;
	/** Number of times answered correctly on third try */
	thirdTryCount: number;
	/** Number of times failed */
	failedCount: number;
	/** Timestamp of last practice */
	lastPracticed: string;
	/** Timestamp of first practice */
	firstPracticed: string;
}

/** Knowledge data for a single word in both directions */
export interface WordKnowledgeBidirectional {
	spanish_to_finnish: WordKnowledge;
	finnish_to_spanish: WordKnowledge;
}

/** Category knowledge summary */
export interface CategoryKnowledge {
	/** Category key */
	categoryKey: string;
	/** Average knowledge score for Spanish→Finnish */
	spanishToFinnishScore: number;
	/** Average knowledge score for Finnish→Spanish */
	finnishToSpanishScore: number;
	/** Combined average score */
	combinedScore: number;
	/** Total words in category that have been practiced */
	practicedWords: number;
	/** Total words in category */
	totalWords: number;
	/** Last practiced timestamp */
	lastPracticed: string | null;
}

/** Record of a single game for export */
export interface GameRecord {
	/** Game ID */
	id: string;
	/** Timestamp */
	timestamp: string;
	/** Category played */
	category: string;
	/** Language direction */
	direction: LanguageDirection;
	/** Number of questions */
	questionsCount: number;
	/** Score breakdown */
	results: {
		firstTry: number;
		secondTry: number;
		thirdTry: number;
		failed: number;
	};
	/** Individual word results */
	words: Array<{
		spanish: string;
		finnish: string;
		quality: AnswerQuality;
	}>;
}

/** Full knowledge store data structure */
export interface WordKnowledgeData {
	version: number;
	/** Word knowledge indexed by Spanish word */
	words: Record<string, WordKnowledgeBidirectional>;
	/** Game history for export (last 100 games) */
	gameHistory: GameRecord[];
	/** Metadata */
	meta: {
		createdAt: string;
		updatedAt: string;
		totalGamesPlayed: number;
	};
}

// Helper functions

function isBrowser(): boolean {
	return browser && typeof localStorage !== 'undefined';
}

function createDefaultWordKnowledge(): WordKnowledge {
	const now = new Date().toISOString();
	return {
		score: 0,
		practiceCount: 0,
		firstTryCount: 0,
		secondTryCount: 0,
		thirdTryCount: 0,
		failedCount: 0,
		lastPracticed: now,
		firstPracticed: now
	};
}

function createDefaultBidirectional(): WordKnowledgeBidirectional {
	return {
		spanish_to_finnish: createDefaultWordKnowledge(),
		finnish_to_spanish: createDefaultWordKnowledge()
	};
}

function createDefaultData(): WordKnowledgeData {
	const now = new Date().toISOString();
	return {
		version: STORAGE_VERSION,
		words: {},
		gameHistory: [],
		meta: {
			createdAt: now,
			updatedAt: now,
			totalGamesPlayed: 0
		}
	};
}

/**
 * Calculate new knowledge score based on answer quality
 * 
 * Algorithm (modified SM-2):
 * - First try: +15 points (capped at 100)
 * - Second try: +8 points (capped at 100)
 * - Third try: +3 points (capped at 100)
 * - Failed: -10 points (min 0)
 * 
 * The algorithm weighs recent performance more heavily:
 * - newScore = oldScore * 0.7 + performanceScore * 0.3
 */
function calculateNewScore(currentScore: number, quality: AnswerQuality): number {
	const qualityScores: Record<AnswerQuality, number> = {
		'first_try': 100,
		'second_try': 70,
		'third_try': 40,
		'failed': 0
	};
	
	const targetScore = qualityScores[quality];
	
	// Weighted average: 70% old score, 30% new performance
	// This creates smooth transitions and accounts for consistency
	const newScore = currentScore * 0.7 + targetScore * 0.3;
	
	// Round to 2 decimal places
	return Math.round(newScore * 100) / 100;
}

/**
 * Load knowledge data from localStorage
 */
function loadData(): WordKnowledgeData {
	if (!isBrowser()) return createDefaultData();
	
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored) as WordKnowledgeData;
			if (parsed.version === STORAGE_VERSION) {
				return parsed;
			}
			console.log('⚠️ Knowledge data version mismatch, resetting');
		}
	} catch (error) {
		console.error('Error loading word knowledge:', error);
	}
	
	return createDefaultData();
}

/**
 * Save knowledge data to localStorage
 */
function saveData(data: WordKnowledgeData): void {
	if (!isBrowser()) return;
	
	try {
		data.meta.updatedAt = new Date().toISOString();
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (error) {
		console.error('Error saving word knowledge:', error);
	}
}

// Create the store

function createWordKnowledgeStore() {
	const { subscribe, set, update } = writable<WordKnowledgeData>(loadData());
	
	return {
		subscribe,
		
		/**
		 * Record a word answer from a game
		 */
		recordAnswer(
			spanish: string, 
			finnish: string, 
			direction: LanguageDirection, 
			quality: AnswerQuality
		): void {
			update(data => {
				// Initialize word if not exists
				if (!data.words[spanish]) {
					data.words[spanish] = createDefaultBidirectional();
				}
				
				const wordData = data.words[spanish][direction];
				const now = new Date().toISOString();
				
				// Update counters
				wordData.practiceCount++;
				switch (quality) {
					case 'first_try':
						wordData.firstTryCount++;
						break;
					case 'second_try':
						wordData.secondTryCount++;
						break;
					case 'third_try':
						wordData.thirdTryCount++;
						break;
					case 'failed':
						wordData.failedCount++;
						break;
				}
				
				// Calculate new score
				wordData.score = calculateNewScore(wordData.score, quality);
				wordData.lastPracticed = now;
				
				saveData(data);
				return data;
			});
		},
		
		/**
		 * Record a complete game
		 */
		recordGame(
			category: string,
			direction: LanguageDirection,
			words: Array<{ spanish: string; finnish: string; quality: AnswerQuality }>
		): void {
			update(data => {
				const now = new Date().toISOString();
				
				// Create game record
				const gameRecord: GameRecord = {
					id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					timestamp: now,
					category,
					direction,
					questionsCount: words.length,
					results: {
						firstTry: words.filter(w => w.quality === 'first_try').length,
						secondTry: words.filter(w => w.quality === 'second_try').length,
						thirdTry: words.filter(w => w.quality === 'third_try').length,
						failed: words.filter(w => w.quality === 'failed').length
					},
					words: words.map(w => ({
						spanish: w.spanish,
						finnish: w.finnish,
						quality: w.quality
					}))
				};
				
				// Add to history (keep last 100)
				data.gameHistory.unshift(gameRecord);
				if (data.gameHistory.length > 100) {
					data.gameHistory = data.gameHistory.slice(0, 100);
				}
				
				// Update metadata
				data.meta.totalGamesPlayed++;
				data.meta.updatedAt = now;
				
				saveData(data);
				return data;
			});
		},
		
		/**
		 * Get knowledge score for a specific word
		 */
		getWordScore(spanish: string, direction: LanguageDirection): number {
			const data = get({ subscribe });
			const wordData = data.words[spanish];
			if (!wordData) return 0;
			return wordData[direction].score;
		},
		
		/**
		 * Get category knowledge summary
		 */
		getCategoryKnowledge(
			categoryKey: string, 
			categoryWords: Array<{ spanish: string }>
		): CategoryKnowledge {
			const data = get({ subscribe });
			
			let spanishToFinnishTotal = 0;
			let finnishToSpanishTotal = 0;
			let practicedCount = 0;
			let lastPracticed: string | null = null;
			
			for (const word of categoryWords) {
				const wordData = data.words[word.spanish];
				if (wordData) {
					const stfPracticed = wordData.spanish_to_finnish.practiceCount > 0;
					const ftsPracticed = wordData.finnish_to_spanish.practiceCount > 0;
					
					if (stfPracticed || ftsPracticed) {
						practicedCount++;
					}
					
					if (stfPracticed) {
						spanishToFinnishTotal += wordData.spanish_to_finnish.score;
						if (!lastPracticed || wordData.spanish_to_finnish.lastPracticed > lastPracticed) {
							lastPracticed = wordData.spanish_to_finnish.lastPracticed;
						}
					}
					
					if (ftsPracticed) {
						finnishToSpanishTotal += wordData.finnish_to_spanish.score;
						if (!lastPracticed || wordData.finnish_to_spanish.lastPracticed > lastPracticed) {
							lastPracticed = wordData.finnish_to_spanish.lastPracticed;
						}
					}
				}
			}
			
			const totalWords = categoryWords.length;
			const spanishToFinnishScore = totalWords > 0 ? spanishToFinnishTotal / totalWords : 0;
			const finnishToSpanishScore = totalWords > 0 ? finnishToSpanishTotal / totalWords : 0;
			const combinedScore = (spanishToFinnishScore + finnishToSpanishScore) / 2;
			
			return {
				categoryKey,
				spanishToFinnishScore: Math.round(spanishToFinnishScore * 10) / 10,
				finnishToSpanishScore: Math.round(finnishToSpanishScore * 10) / 10,
				combinedScore: Math.round(combinedScore * 10) / 10,
				practicedWords: practicedCount,
				totalWords,
				lastPracticed
			};
		},
		
		/**
		 * Export all knowledge data as JSON
		 */
		exportData(): string {
			const data = get({ subscribe });
			return JSON.stringify(data, null, 2);
		},
		
		/**
		 * Import knowledge data from JSON
		 */
		importData(jsonString: string): { success: boolean; error?: string } {
			try {
				const imported = JSON.parse(jsonString) as WordKnowledgeData;
				
				// Validate structure
				if (!imported.version || !imported.words || !imported.meta) {
					return { success: false, error: 'Invalid data format' };
				}
				
				if (imported.version !== STORAGE_VERSION) {
					return { success: false, error: `Incompatible version: ${imported.version}` };
				}
				
				// Merge with existing data (imported data wins for conflicts)
				update(existing => {
					const merged: WordKnowledgeData = {
						version: STORAGE_VERSION,
						words: { ...existing.words, ...imported.words },
						gameHistory: [...imported.gameHistory, ...existing.gameHistory].slice(0, 100),
						meta: {
							createdAt: existing.meta.createdAt < imported.meta.createdAt 
								? existing.meta.createdAt 
								: imported.meta.createdAt,
							updatedAt: new Date().toISOString(),
							totalGamesPlayed: existing.meta.totalGamesPlayed + imported.meta.totalGamesPlayed
						}
					};
					
					saveData(merged);
					return merged;
				});
				
				return { success: true };
			} catch (error) {
				return { success: false, error: `Parse error: ${error}` };
			}
		},
		
		/**
		 * Reset all knowledge data
		 */
		reset(): void {
			const freshData = createDefaultData();
			saveData(freshData);
			set(freshData);
		},
		
		/**
		 * Get statistics summary
		 */
		getStatistics(): {
			totalWordsLearned: number;
			totalGamesPlayed: number;
			averageScore: number;
			strongWords: number;
			weakWords: number;
		} {
			const data = get({ subscribe });
			
			let totalScore = 0;
			let wordCount = 0;
			let strongWords = 0;
			let weakWords = 0;
			
			for (const word of Object.values(data.words)) {
				// Consider Spanish→Finnish direction for stats
				if (word.spanish_to_finnish.practiceCount > 0) {
					totalScore += word.spanish_to_finnish.score;
					wordCount++;
					
					if (word.spanish_to_finnish.score >= 80) {
						strongWords++;
					} else if (word.spanish_to_finnish.score < 40) {
						weakWords++;
					}
				}
			}
			
			return {
				totalWordsLearned: wordCount,
				totalGamesPlayed: data.meta.totalGamesPlayed,
				averageScore: wordCount > 0 ? Math.round(totalScore / wordCount) : 0,
				strongWords,
				weakWords
			};
		}
	};
}

// Export store instance
export const wordKnowledge = createWordKnowledgeStore();

// Derived store for category summaries
export const allCategoryKnowledge = derived(wordKnowledge, ($data) => {
	return $data;
});
