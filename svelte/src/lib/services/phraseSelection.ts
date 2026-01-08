/**
 * Phrase Selection Service
 * 
 * Manages intelligent phrase selection for the Pipsan ystävät game.
 * - Tracks last 10 games in localStorage
 * - Selects 10 phrases per game with smart randomization
 * - Ensures variety while including strategic repetition
 */

interface GameQuestion {
	spanish: string;
	finnish?: string;
	english?: string;
	correctImage: string;
	distractors: string[];
	difficulty: string;
	category: string;
}

interface GameHistory {
	games: string[][]; // Array of arrays of phrase IDs (spanish text)
	lastUpdated: string;
}

const STORAGE_KEY = 'pipsan_ystavat_history';
const MAX_HISTORY_GAMES = 10;
const PHRASES_PER_GAME = 10;

/**
 * Get game history from localStorage
 */
function getHistory(): GameHistory {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.error('Error reading game history:', error);
	}
	
	return {
		games: [],
		lastUpdated: new Date().toISOString()
	};
}

/**
 * Save game history to localStorage
 */
function saveHistory(history: GameHistory): void {
	try {
		history.lastUpdated = new Date().toISOString();
		localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
	} catch (error) {
		console.error('Error saving game history:', error);
	}
}

/**
 * Get phrases used in recent games
 * @param lookbackGames Number of recent games to check
 */
function getRecentPhrases(history: GameHistory, lookbackGames: number): Set<string> {
	const recentPhrases = new Set<string>();
	const recentGames = history.games.slice(-lookbackGames);
	
	for (const game of recentGames) {
		for (const phrase of game) {
			recentPhrases.add(phrase);
		}
	}
	
	return recentPhrases;
}

/**
 * Select phrases for a new game with intelligent randomization
 * 
 * Algorithm:
 * - Select 8 phrases that haven't been in the last 5 games
 * - Select 1 phrase from the previous game (if available)
 * - Select 1 phrase from games 2-5 ago (if available)
 * 
 * @param allPhrases All available phrases
 * @returns Array of 10 selected phrases
 */
export function selectGamePhrases(allPhrases: GameQuestion[]): GameQuestion[] {
	const history = getHistory();
	
	// Get phrases from different time periods
	const last1Game = history.games.slice(-1);
	const last5Games = history.games.slice(-5);
	
	const phrasesFromLast1 = new Set<string>();
	const phrasesFromLast5 = new Set<string>();
	
	// Collect phrases from last game
	if (last1Game.length > 0) {
		for (const phrase of last1Game[0]) {
			phrasesFromLast1.add(phrase);
		}
	}
	
	// Collect phrases from last 5 games
	for (const game of last5Games) {
		for (const phrase of game) {
			phrasesFromLast5.add(phrase);
		}
	}
	
	// Collect phrases from games 2-5 (excluding the most recent)
	const phrasesFrom2to5 = new Set<string>();
	const games2to5 = history.games.slice(-5, -1);
	for (const game of games2to5) {
		for (const phrase of game) {
			if (!phrasesFromLast1.has(phrase)) {
				phrasesFrom2to5.add(phrase);
			}
		}
	}
	
	// Categorize all phrases
	const notRecentPhrases: GameQuestion[] = [];
	const fromLast1Phrases: GameQuestion[] = [];
	const from2to5Phrases: GameQuestion[] = [];
	
	for (const phrase of allPhrases) {
		const phraseId = phrase.spanish;
		
		if (phrasesFromLast1.has(phraseId)) {
			fromLast1Phrases.push(phrase);
		} else if (phrasesFrom2to5.has(phraseId)) {
			from2to5Phrases.push(phrase);
		} else if (!phrasesFromLast5.has(phraseId)) {
			notRecentPhrases.push(phrase);
		}
	}
	
	// Shuffle arrays
	shuffle(notRecentPhrases);
	shuffle(fromLast1Phrases);
	shuffle(from2to5Phrases);
	
	const selectedPhrases: GameQuestion[] = [];
	
	// Strategy: Select 8 not-recent, 1 from last game, 1 from games 2-5
	
	// 1. Try to add 1 from last game
	if (fromLast1Phrases.length > 0) {
		selectedPhrases.push(fromLast1Phrases[0]);
	}
	
	// 2. Try to add 1 from games 2-5
	if (from2to5Phrases.length > 0) {
		selectedPhrases.push(from2to5Phrases[0]);
	}
	
	// 3. Fill the rest with not-recent phrases
	const remaining = PHRASES_PER_GAME - selectedPhrases.length;
	
	if (notRecentPhrases.length >= remaining) {
		// We have enough not-recent phrases
		selectedPhrases.push(...notRecentPhrases.slice(0, remaining));
	} else {
		// Not enough not-recent phrases, add all and fill from other pools
		selectedPhrases.push(...notRecentPhrases);
		
		const stillNeeded = PHRASES_PER_GAME - selectedPhrases.length;
		
		// Try to fill from games 2-5 first
		const availableFrom2to5 = from2to5Phrases.slice(1); // Skip the one we already added
		if (availableFrom2to5.length >= stillNeeded) {
			selectedPhrases.push(...availableFrom2to5.slice(0, stillNeeded));
		} else {
			selectedPhrases.push(...availableFrom2to5);
			
			// Still need more? Add from last game
			const finalNeeded = PHRASES_PER_GAME - selectedPhrases.length;
			const availableFromLast1 = fromLast1Phrases.slice(1); // Skip the one we already added
			selectedPhrases.push(...availableFromLast1.slice(0, finalNeeded));
		}
	}
	
	// Final shuffle to randomize order
	shuffle(selectedPhrases);
	
	return selectedPhrases.slice(0, PHRASES_PER_GAME);
}

/**
 * Record a completed game in history
 * @param phrases The phrases that were used in the game
 */
export function recordGameCompletion(phrases: GameQuestion[]): void {
	const history = getHistory();
	
	// Add new game to history
	const phraseIds = phrases.map(p => p.spanish);
	history.games.push(phraseIds);
	
	// Keep only last MAX_HISTORY_GAMES
	if (history.games.length > MAX_HISTORY_GAMES) {
		history.games = history.games.slice(-MAX_HISTORY_GAMES);
	}
	
	saveHistory(history);
}

/**
 * Get statistics about phrase usage
 */
export function getPhraseStats(allPhrases: GameQuestion[]): {
	totalPhrases: number;
	recentlyUsed: number;
	notRecentlyUsed: number;
	gamesInHistory: number;
} {
	const history = getHistory();
	const recentPhrases = getRecentPhrases(history, 5);
	
	return {
		totalPhrases: allPhrases.length,
		recentlyUsed: recentPhrases.size,
		notRecentlyUsed: allPhrases.length - recentPhrases.size,
		gamesInHistory: history.games.length
	};
}

/**
 * Clear game history (for testing or reset)
 */
export function clearHistory(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch (error) {
		console.error('Error clearing history:', error);
	}
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffle<T>(array: T[]): void {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
}
