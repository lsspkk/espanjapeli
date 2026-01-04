// Local Storage Management for Espanjapeli
// Ported from vanilla JS to TypeScript with Svelte stores
// Version 1.0.0

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Constants
export const GAME_VERSION = '1.0.0';
export const STORAGE_VERSION = 1; // Increment this when storage schema changes

export const STORAGE_KEYS = {
	AUTO_SPEAK: 'espanjapeli_auto_speak',
	COMPACT_MODE: 'espanjapeli_compact_mode',
	CATEGORY: 'espanjapeli_category',
	GAME_LENGTH: 'espanjapeli_game_length',
	GAME_HISTORY: 'espanjapeli_game_history',
	STORAGE_META: 'espanjapeli_storage_meta'
} as const;

const MAX_HISTORY_RECORDS = 20;
const WRONG_WORDS_HISTORY_COUNT = 10;

// Game types for future extensibility
export const GAME_TYPES = {
	SPANISH_TO_FINNISH: 'spanish-to-finnish'
	// Future: FINNISH_TO_SPANISH: 'finnish-to-spanish',
	// Future: LISTENING: 'listening',
	// Future: MULTIPLE_CHOICE: 'multiple-choice'
} as const;

// Types
export interface StorageMeta {
	version: number;
	gameVersion: string;
	updatedAt: string;
}

export interface QuestionResult {
	questionNumber: number;
	spanish: string;
	finnish: string;
	english?: string;
	userAnswer: string;
	isCorrect: boolean;
	pointsEarned: number;
	maxPoints: number;
	tipsRequested: number;
	tipsShown: string[];
}

export interface GameSummary {
	correctCount: number;
	incorrectCount: number;
	accuracy: number;
}

export interface GameResult {
	id: string;
	version: number;
	timestamp: number;
	date: string;
	gameType: string;
	category: string;
	categoryName: string;
	gameLength: number;
	totalScore: number;
	maxPossibleScore: number;
	summary: GameSummary;
	questions: QuestionResult[];
}

export interface WrongWord {
	spanish: string;
	finnish: string;
	english: string;
	count: number;
	userAnswers: string[];
	tipsUsed: number[];
}

export interface GameStatistics {
	totalGames: number;
	totalQuestions: number;
	totalCorrect: number;
	totalScore: number;
	averageAccuracy: number;
}

// Helper: Check if we're in the browser
function isBrowser(): boolean {
	return browser && typeof localStorage !== 'undefined';
}

/**
 * Check storage version and clear if incompatible
 */
function checkStorageVersion(): boolean {
	if (!isBrowser()) return false;

	try {
		const meta = localStorage.getItem(STORAGE_KEYS.STORAGE_META);
		if (meta) {
			const parsed: StorageMeta = JSON.parse(meta);
			if (parsed.version === STORAGE_VERSION) {
				console.log(`✅ Storage version ${STORAGE_VERSION} matches`);
				return true;
			}
			console.log(
				`⚠️ Storage version mismatch: found ${parsed.version}, expected ${STORAGE_VERSION}`
			);
		} else {
			console.log('ℹ️ No storage metadata found');
		}

		// Clear old game history (incompatible format)
		console.log('🗑️ Clearing old game history due to version mismatch');
		localStorage.removeItem(STORAGE_KEYS.GAME_HISTORY);

		// Save new version
		saveStorageMeta();
		return false;
	} catch (error) {
		console.error('❌ Error checking storage version:', error);
		saveStorageMeta();
		return false;
	}
}

/**
 * Save storage metadata
 */
function saveStorageMeta(): void {
	if (!isBrowser()) return;

	try {
		const meta: StorageMeta = {
			version: STORAGE_VERSION,
			gameVersion: GAME_VERSION,
			updatedAt: new Date().toISOString()
		};
		localStorage.setItem(STORAGE_KEYS.STORAGE_META, JSON.stringify(meta));
		console.log('💾 Storage metadata saved:', meta);
	} catch (error) {
		console.error('❌ Error saving storage metadata:', error);
	}
}

/**
 * Generate a unique game ID
 */
export function generateGameId(): string {
	return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Svelte Stores

// Auto-speak preference store
function createAutoSpeakStore() {
	const defaultValue = true;
	const initialValue = isBrowser()
		? JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTO_SPEAK) ?? 'true')
		: defaultValue;

	const { subscribe, set } = writable<boolean>(initialValue);

	return {
		subscribe,
		set: (value: boolean) => {
			if (isBrowser()) {
				localStorage.setItem(STORAGE_KEYS.AUTO_SPEAK, JSON.stringify(value));
				console.log('💾 Auto-speak preference saved:', value);
			}
			set(value);
		}
	};
}

// Compact mode preference store
function createCompactModeStore() {
	const defaultValue = true;
	const initialValue = isBrowser()
		? JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPACT_MODE) ?? 'true')
		: defaultValue;

	const { subscribe, set } = writable<boolean>(initialValue);

	return {
		subscribe,
		set: (value: boolean) => {
			if (isBrowser()) {
				localStorage.setItem(STORAGE_KEYS.COMPACT_MODE, JSON.stringify(value));
				console.log('💾 Compact mode preference saved:', value);
			}
			set(value);
		}
	};
}

// Category preference store
function createCategoryStore() {
	const defaultValue = 'all';
	const initialValue = isBrowser()
		? (localStorage.getItem(STORAGE_KEYS.CATEGORY) ?? defaultValue)
		: defaultValue;

	const { subscribe, set } = writable<string>(initialValue);

	return {
		subscribe,
		set: (value: string) => {
			if (isBrowser()) {
				localStorage.setItem(STORAGE_KEYS.CATEGORY, value);
				console.log('💾 Category saved:', value);
			}
			set(value);
		}
	};
}

// Game length preference store
function createGameLengthStore() {
	const defaultValue = 10;
	const initialValue = isBrowser()
		? parseInt(localStorage.getItem(STORAGE_KEYS.GAME_LENGTH) ?? '10', 10)
		: defaultValue;

	const { subscribe, set } = writable<number>(initialValue);

	return {
		subscribe,
		set: (value: number) => {
			if (isBrowser()) {
				localStorage.setItem(STORAGE_KEYS.GAME_LENGTH, value.toString());
				console.log('💾 Game length saved:', value);
			}
			set(value);
		}
	};
}

// Game history store
function createGameHistoryStore() {
	const loadHistory = (): GameResult[] => {
		if (!isBrowser()) return [];

		try {
			const saved = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
			if (saved) {
				const history: GameResult[] = JSON.parse(saved);
				// Filter out any records without version (old format)
				const validHistory = history.filter((record) => record.version === STORAGE_VERSION);
				if (validHistory.length !== history.length) {
					console.log(`⚠️ Filtered out ${history.length - validHistory.length} old format records`);
				}
				console.log('📂 Game history loaded:', validHistory.length, 'records');
				return validHistory;
			}
		} catch (error) {
			console.error('❌ Error loading game history:', error);
		}
		return [];
	};

	const { subscribe, set, update } = writable<GameResult[]>(loadHistory());

	return {
		subscribe,
		add: (gameResult: Omit<GameResult, 'id' | 'version' | 'timestamp' | 'date'>) => {
			update((history) => {
				const result: GameResult = {
					id: generateGameId(),
					version: STORAGE_VERSION,
					timestamp: Date.now(),
					date: new Date().toISOString(),
					...gameResult
				};

				const newHistory = [result, ...history];

				// Keep only last MAX_HISTORY_RECORDS
				if (newHistory.length > MAX_HISTORY_RECORDS) {
					newHistory.splice(MAX_HISTORY_RECORDS);
				}

				if (isBrowser()) {
					localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(newHistory));
					console.log('💾 Game result saved to history:', result.id);
				}

				return newHistory;
			});
		},
		clear: () => {
			if (isBrowser()) {
				localStorage.removeItem(STORAGE_KEYS.GAME_HISTORY);
				console.log('🗑️ Game history cleared');
			}
			set([]);
		}
	};
}

// Export store instances
export const autoSpeak = createAutoSpeakStore();
export const compactMode = createCompactModeStore();
export const category = createCategoryStore();
export const gameLength = createGameLengthStore();
export const gameHistory = createGameHistoryStore();

// Derived stores

/**
 * Get wrong words from recent games
 */
export const wrongWords = derived(gameHistory, ($gameHistory) => {
	const recentGames = $gameHistory.slice(0, WRONG_WORDS_HISTORY_COUNT);
	const wrongWordsMap: Record<string, WrongWord> = {};

	recentGames.forEach((game) => {
		const questions = game.questions || [];

		questions.forEach((q) => {
			if (!q.isCorrect) {
				const key = `${q.spanish}|||${q.finnish}`;
				if (!wrongWordsMap[key]) {
					wrongWordsMap[key] = {
						spanish: q.spanish,
						finnish: q.finnish,
						english: q.english || '',
						count: 0,
						userAnswers: [],
						tipsUsed: []
					};
				}
				wrongWordsMap[key].count++;
				if (q.userAnswer) {
					wrongWordsMap[key].userAnswers.push(q.userAnswer);
				}
				if (q.tipsRequested > 0) {
					wrongWordsMap[key].tipsUsed.push(q.tipsRequested);
				}
			}
		});
	});

	// Convert to array and sort by count (descending)
	const wrongWordsArray = Object.values(wrongWordsMap);
	wrongWordsArray.sort((a, b) => b.count - a.count);

	return wrongWordsArray;
});

/**
 * Get game statistics summary
 */
export const statistics = derived(gameHistory, ($gameHistory): GameStatistics => {
	if ($gameHistory.length === 0) {
		return {
			totalGames: 0,
			totalQuestions: 0,
			totalCorrect: 0,
			totalScore: 0,
			averageAccuracy: 0
		};
	}

	let totalQuestions = 0;
	let totalCorrect = 0;
	let totalScore = 0;

	$gameHistory.forEach((game) => {
		const summary = game.summary || { correctCount: 0, incorrectCount: 0, accuracy: 0 };
		totalQuestions += game.gameLength || summary.correctCount + summary.incorrectCount || 0;
		totalCorrect += summary.correctCount || 0;
		totalScore += game.totalScore || 0;
	});

	return {
		totalGames: $gameHistory.length,
		totalQuestions,
		totalCorrect,
		totalScore,
		averageAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
	};
});

// Utility functions

/**
 * Format date as DD.MM.YYYY
 */
export function formatDate(date: Date): string {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	return `${day}.${month}.${year}`;
}

/**
 * Format time as HH:MM
 */
export function formatTime(date: Date): string {
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${hours}:${minutes}`;
}

/**
 * Clear all storage (full reset)
 */
export function clearAllStorage(): void {
	if (!isBrowser()) return;

	try {
		Object.values(STORAGE_KEYS).forEach((key) => {
			localStorage.removeItem(key);
		});
		console.log('🗑️ All storage cleared');

		// Reset all stores to defaults
		autoSpeak.set(true);
		compactMode.set(true);
		category.set('all');
		gameLength.set(10);
		gameHistory.clear();
	} catch (error) {
		console.error('❌ Error clearing all storage:', error);
	}
}

// Initialize storage on load
if (isBrowser()) {
	checkStorageVersion();
}
