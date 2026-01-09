/**
 * Word Selection Service for Sanapeli
 * 
 * Manages intelligent word selection with localStorage tracking.
 * - Tracks last 10 games per category in localStorage
 * - Uses smart randomization for variety with strategic repetition
 * - Ensures words from recent games appear less frequently
 * - Integrates with word knowledge tracking to prioritize weaker words
 */

import type { Word } from '$lib/data/words';
import { get } from 'svelte/store';
import { wordKnowledge, type LanguageDirection } from '$lib/stores/wordKnowledge';

interface GameHistory {
	games: string[][]; // Array of arrays of word IDs (spanish text)
	lastUpdated: string;
}

interface CategoryHistories {
	[category: string]: GameHistory;
}

const STORAGE_KEY = 'sanapeli_word_history';
const MAX_HISTORY_GAMES = 10;

/**
 * Get all category histories from localStorage
 */
function getAllHistories(): CategoryHistories {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.error('Error reading word history:', error);
	}
	return {};
}

/**
 * Get game history for a specific category
 */
function getHistory(category: string): GameHistory {
	const histories = getAllHistories();
	return histories[category] || {
		games: [],
		lastUpdated: new Date().toISOString()
	};
}

/**
 * Save game history for a specific category
 */
function saveHistory(category: string, history: GameHistory): void {
	try {
		const histories = getAllHistories();
		history.lastUpdated = new Date().toISOString();
		histories[category] = history;
		localStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
	} catch (error) {
		console.error('Error saving word history:', error);
	}
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffle<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * Select words for a new game with intelligent randomization
 * 
 * Algorithm:
 * - Majority of words haven't been in last 5 games (fresh content)
 * - 1-2 words from previous game (recent reinforcement)
 * - 1-2 words from games 2-5 ago (spaced repetition)
 * - Fills remaining slots with least recently used words
 * - Final optimization: replaces well-known words with weaker/unpracticed words
 * 
 * @param availableWords All words available for selection
 * @param questionsNeeded Number of words needed for the game
 * @param category Category key for history tracking
 * @param direction Language direction for knowledge tracking (optional)
 * @returns Array of selected words
 */
export function selectGameWords(
	availableWords: Word[], 
	questionsNeeded: number, 
	category: string,
	direction: LanguageDirection = 'spanish_to_finnish'
): Word[] {
	const history = getHistory(category);
	
	// Build sets of words from different time periods
	const last1Game = history.games.slice(-1);
	const last5Games = history.games.slice(-5);
	const games2to5 = history.games.slice(-5, -1);
	
	const wordsFromLast1 = new Set<string>();
	const wordsFromLast5 = new Set<string>();
	const wordsFrom2to5 = new Set<string>();
	
	// Collect words from last game
	if (last1Game.length > 0) {
		for (const word of last1Game[0]) {
			wordsFromLast1.add(word);
		}
	}
	
	// Collect words from last 5 games
	for (const game of last5Games) {
		for (const word of game) {
			wordsFromLast5.add(word);
		}
	}
	
	// Collect words from games 2-5 (excluding most recent)
	for (const game of games2to5) {
		for (const word of game) {
			if (!wordsFromLast1.has(word)) {
				wordsFrom2to5.add(word);
			}
		}
	}
	
	// Categorize available words
	const notRecentWords: Word[] = [];
	const fromLast1Words: Word[] = [];
	const from2to5Words: Word[] = [];
	
	for (const word of availableWords) {
		const wordId = word.spanish;
		
		if (wordsFromLast1.has(wordId)) {
			fromLast1Words.push(word);
		} else if (wordsFrom2to5.has(wordId)) {
			from2to5Words.push(word);
		} else if (!wordsFromLast5.has(wordId)) {
			notRecentWords.push(word);
		}
	}
	
	// Shuffle all arrays
	const shuffledNotRecent = shuffle(notRecentWords);
	const shuffledLast1 = shuffle(fromLast1Words);
	const shuffled2to5 = shuffle(from2to5Words);
	
	const selectedWords: Word[] = [];
	
	// Calculate how many words to take from each pool
	// For larger games, include more repetition words
	const repetitionCount = Math.min(2, Math.floor(questionsNeeded / 10));
	
	// 1. Add words from previous game (for reinforcement)
	const fromLast1Count = Math.min(repetitionCount, shuffledLast1.length);
	selectedWords.push(...shuffledLast1.slice(0, fromLast1Count));
	
	// 2. Add words from games 2-5 (for spaced repetition)
	const from2to5Count = Math.min(repetitionCount, shuffled2to5.length);
	selectedWords.push(...shuffled2to5.slice(0, from2to5Count));
	
	// 3. Fill remaining with not-recent words
	const remaining = questionsNeeded - selectedWords.length;
	
	if (shuffledNotRecent.length >= remaining) {
		selectedWords.push(...shuffledNotRecent.slice(0, remaining));
	} else {
		// Add all not-recent words
		selectedWords.push(...shuffledNotRecent);
		
		let stillNeeded = questionsNeeded - selectedWords.length;
		
		// Fill from games 2-5
		const available2to5 = shuffled2to5.slice(from2to5Count);
		if (available2to5.length >= stillNeeded) {
			selectedWords.push(...available2to5.slice(0, stillNeeded));
		} else {
			selectedWords.push(...available2to5);
			stillNeeded = questionsNeeded - selectedWords.length;
			
			// Fill from last game
			const availableLast1 = shuffledLast1.slice(fromLast1Count);
			if (availableLast1.length >= stillNeeded) {
				selectedWords.push(...availableLast1.slice(0, stillNeeded));
			} else {
				selectedWords.push(...availableLast1);
				
				// If still not enough, repeat words from the pool
				while (selectedWords.length < questionsNeeded && availableWords.length > 0) {
					const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
					selectedWords.push(randomWord);
				}
			}
		}
	}
	
	// KNOWLEDGE-BASED OPTIMIZATION LAYER
	// Replace well-known words with weaker/unpracticed words
	const optimizedWords = optimizeWordSelectionByKnowledge(
		selectedWords,
		availableWords,
		direction
	);
	
	// Final shuffle to randomize order
	return shuffle(optimizedWords.slice(0, questionsNeeded));
}

/**
 * Optimize word selection by replacing well-known words with weaker ones
 * 
 * Strategy:
 * - Identify words with high knowledge scores (>= 80) in the selection
 * - Find words with low scores (< 40) or unpracticed words not in selection
 * - Replace 20-30% of well-known words with weaker words
 * 
 * @param selectedWords Currently selected words
 * @param availableWords All available words
 * @param direction Language direction for knowledge lookup
 * @returns Optimized word selection
 */
function optimizeWordSelectionByKnowledge(
	selectedWords: Word[],
	availableWords: Word[],
	direction: LanguageDirection
): Word[] {
	try {
		// Get knowledge data
		const knowledgeData = get(wordKnowledge);
		
		// Categorize selected words by knowledge level
		const wellKnownWords: Word[] = [];
		const otherWords: Word[] = [];
		const selectedSpanishSet = new Set(selectedWords.map(w => w.spanish));
		
		for (const word of selectedWords) {
			const wordData = knowledgeData.words[word.spanish];
			if (wordData && wordData[direction].practiceCount > 0) {
				const score = wordData[direction].score;
				if (score >= 80) {
					wellKnownWords.push(word);
				} else {
					otherWords.push(word);
				}
			} else {
				// Unpracticed words stay in selection
				otherWords.push(word);
			}
		}
		
		// If no well-known words, return as-is
		if (wellKnownWords.length === 0) {
			return selectedWords;
		}
		
		// Find weak/unpracticed words not in selection
		const weakWords: Word[] = [];
		const unpracticedWords: Word[] = [];
		
		for (const word of availableWords) {
			// Skip if already selected
			if (selectedSpanishSet.has(word.spanish)) continue;
			
			const wordData = knowledgeData.words[word.spanish];
			if (!wordData || wordData[direction].practiceCount === 0) {
				unpracticedWords.push(word);
			} else {
				const score = wordData[direction].score;
				if (score < 40) {
					weakWords.push(word);
				}
			}
		}
		
		// Combine weak and unpracticed, prioritize weak words
		const replacementCandidates = shuffle([...weakWords, ...unpracticedWords]);
		
		// If no replacement candidates, return as-is
		if (replacementCandidates.length === 0) {
			return selectedWords;
		}
		
		// Calculate how many to replace (20-30% of well-known words, at least 1)
		const replaceCount = Math.max(
			1, 
			Math.min(
				Math.ceil(wellKnownWords.length * 0.25),
				replacementCandidates.length
			)
		);
		
		// Shuffle well-known words to randomly select which to replace
		const shuffledWellKnown = shuffle(wellKnownWords);
		const toReplace = new Set(
			shuffledWellKnown.slice(0, replaceCount).map(w => w.spanish)
		);
		
		// Build final selection
		const finalWords: Word[] = [];
		let replacementIndex = 0;
		
		for (const word of selectedWords) {
			if (toReplace.has(word.spanish) && replacementIndex < replacementCandidates.length) {
				finalWords.push(replacementCandidates[replacementIndex]);
				replacementIndex++;
			} else {
				finalWords.push(word);
			}
		}
		
		console.log(`📚 Knowledge optimization: Replaced ${replaceCount} well-known words with weaker ones`);
		
		return finalWords;
	} catch (error) {
		console.error('Error in knowledge optimization:', error);
		// Return original selection if optimization fails
		return selectedWords;
	}
}

/**
 * Record a completed game in history
 * @param words The words that were used in the game
 * @param category Category key for history tracking
 */
export function recordGameCompletion(words: Word[], category: string): void {
	const history = getHistory(category);
	
	// Add new game to history
	const wordIds = words.map(w => w.spanish);
	history.games.push(wordIds);
	
	// Keep only last MAX_HISTORY_GAMES
	if (history.games.length > MAX_HISTORY_GAMES) {
		history.games = history.games.slice(-MAX_HISTORY_GAMES);
	}
	
	saveHistory(category, history);
}

/**
 * Get previous games for display in Sanakirja
 * @param category Category key
 * @param availableWords All available words (to look up full word data)
 * @param maxGames Maximum number of games to return
 * @returns Array of game word arrays
 */
export function getPreviousGames(
	category: string, 
	availableWords: Word[], 
	maxGames: number = 3
): Word[][] {
	const history = getHistory(category);
	const previousGames: Word[][] = [];
	
	// Get last N games in reverse order (most recent first)
	const recentGames = history.games.slice(-maxGames).reverse();
	
	for (const gameWordIds of recentGames) {
		const gameWords: Word[] = [];
		for (const wordId of gameWordIds) {
			const word = availableWords.find(w => w.spanish === wordId);
			if (word) {
				gameWords.push(word);
			}
		}
		if (gameWords.length > 0) {
			previousGames.push(gameWords);
		}
	}
	
	return previousGames;
}

/**
 * Get statistics about word usage
 */
export function getWordStats(category: string, availableWords: Word[]): {
	totalWords: number;
	recentlyUsed: number;
	notRecentlyUsed: number;
	gamesInHistory: number;
} {
	const history = getHistory(category);
	const last5Games = history.games.slice(-5);
	const recentWords = new Set<string>();
	
	for (const game of last5Games) {
		for (const word of game) {
			recentWords.add(word);
		}
	}
	
	return {
		totalWords: availableWords.length,
		recentlyUsed: recentWords.size,
		notRecentlyUsed: availableWords.length - recentWords.size,
		gamesInHistory: history.games.length
	};
}

/**
 * Clear game history for a specific category or all categories
 */
export function clearHistory(category?: string): void {
	try {
		if (category) {
			const histories = getAllHistories();
			delete histories[category];
			localStorage.setItem(STORAGE_KEY, JSON.stringify(histories));
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	} catch (error) {
		console.error('Error clearing history:', error);
	}
}
