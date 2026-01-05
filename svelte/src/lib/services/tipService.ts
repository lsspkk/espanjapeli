/**
 * Tip Service - Manages tip generation for word learning
 * 
 * This service provides three levels of tips with decreasing difficulty:
 * 1. Vaikea (Hard) - Most vague hints
 * 2. Keskivaikea (Medium) - More descriptive hints  
 * 3. Helppo (Easy) - Most revealing hints
 * 
 * Tips are loaded from cached data when available, otherwise generates fallback tips.
 */

export type TipDifficulty = 'Vaikea' | 'Keskivaikea' | 'Helppo';

export interface Tip {
	text: string;
	difficulty: TipDifficulty;
	difficultyIndex: number; // 0, 1, 2
	fromCache?: boolean;
	tipModel?: string | null;
	translationModel?: string | null;
}

interface CachedTip {
	language: string;
	difficulty: string; // 'easy', 'medium', 'hard'
	text: string;
	tipModel?: string;
	translationModel?: string;
}

interface WordData {
	spanish: string;
	english: string;
	finnish: string;
	learningTips?: CachedTip[];
}

interface CategoryData {
	name: string;
	words: WordData[];
}

interface TipsDatabase {
	[categoryKey: string]: CategoryData;
}

// Cache for loaded tips data
let tipsData: TipsDatabase | null = null;

// Difficulty mapping: our names -> JSON names
const DIFFICULTY_MAP: Record<TipDifficulty, string> = {
	'Vaikea': 'hard',
	'Keskivaikea': 'medium',
	'Helppo': 'easy'
};

import { base } from '$app/paths';

/**
 * Load tips data from JSON file
 */
async function loadTipsData(): Promise<TipsDatabase> {
	if (tipsData) {
		return tipsData;
	}

	try {
		console.log('📚 Loading tips data from words_tips_translations.json...');
		const response = await fetch(`${base}/words_tips_translations.json`);
		if (!response.ok) {
			throw new Error(`Failed to load tips: ${response.status}`);
		}
		tipsData = await response.json();
		console.log('✅ Tips data loaded successfully');
		return tipsData!;
	} catch (error) {
		console.error('❌ Error loading tips data:', error);
		console.warn('⚠️ Will use fallback tips instead');
		return {};
	}
}

/**
 * Find all cached tips for a specific word and difficulty
 */
async function findCachedTips(spanishWord: string, difficulty: TipDifficulty): Promise<CachedTip[]> {
	try {
		const data = await loadTipsData();
		const difficultyKey = DIFFICULTY_MAP[difficulty];
		
		// Search through all categories
		for (const categoryKey in data) {
			const category = data[categoryKey];
			if (!category.words) continue;
			
			// Find the word
			const word = category.words.find(w => w.spanish === spanishWord);
			if (!word || !word.learningTips) continue;
			
			// Find all Finnish tips matching difficulty
			const tips = word.learningTips.filter(t => 
				t.language === 'finnish' && 
				t.difficulty === difficultyKey &&
				t.text && t.text.trim().length > 0
			);
			
			if (tips.length > 0) {
				console.log(`✅ Found ${tips.length} cached ${difficulty} tip(s) for "${spanishWord}"`);
				return tips;
			}
		}
		
		console.log(`ℹ️ No cached tips found for "${spanishWord}" (${difficulty})`);
		return [];
	} catch (error) {
		console.error('❌ Error finding cached tips:', error);
		return [];
	}
}

/**
 * Generate fallback tip based on Finnish word
 */
function generateFallbackTip(finnishWord: string, difficulty: TipDifficulty): string {
	const firstLetter = finnishWord.charAt(0).toUpperCase();
	const length = finnishWord.length;

	switch (difficulty) {
		case 'Vaikea':
			// Hard - most vague
			return `Se alkaa kirjaimella ${firstLetter}.`;

		case 'Keskivaikea':
			// Medium - more information
			return `Sana alkaa ${firstLetter}-kirjaimella ja siinä on ${length} kirjainta.`;

		case 'Helppo':
			// Easy - most revealing
			const hint = finnishWord.substring(0, Math.ceil(finnishWord.length / 2));
			return `Sana alkaa näin: ${hint}...`;

		default:
			return `Vihje ei saatavilla.`;
	}
}

/**
 * Generate tips for a Finnish word based on difficulty level
 * Tries to use cached tips first, falls back to generated tips
 * Returns multiple tips when available
 * 
 * @param finnishWord - The Finnish word to generate a tip for
 * @param difficulty - The difficulty level
 * @param spanishWord - Optional Spanish word to look up cached tips
 * @returns Array of tip objects with text and metadata
 */
export async function generateTip(
	finnishWord: string, 
	difficulty: TipDifficulty,
	spanishWord?: string
): Promise<Tip[]> {
	const difficultyIndex = difficulty === 'Vaikea' ? 0 : difficulty === 'Keskivaikea' ? 1 : 2;

	// Try to get cached tips if Spanish word is provided
	if (spanishWord) {
		const cachedTips = await findCachedTips(spanishWord, difficulty);
		if (cachedTips.length > 0) {
			// Return up to 2 tips (easy/medium as mentioned)
			return cachedTips.slice(0, 2).map(cached => ({
				text: cached.text,
				difficulty,
				difficultyIndex,
				fromCache: true,
				tipModel: cached.tipModel || null,
				translationModel: cached.translationModel || null
			}));
		}
	}

	// Fallback to generated tip
	const text = generateFallbackTip(finnishWord, difficulty);
	return [{
		text,
		difficulty,
		difficultyIndex,
		fromCache: false,
		tipModel: null,
		translationModel: null
	}];
}

/**
 * Get all three tips for a word at once
 * @param finnishWord - The Finnish word to generate tips for
 * @param spanishWord - Optional Spanish word to look up cached tips
 * @returns Array of all three tip levels
 */
export async function getAllTips(finnishWord: string, spanishWord?: string): Promise<Tip[]> {
	const difficulties: TipDifficulty[] = ['Vaikea', 'Keskivaikea', 'Helppo'];
	const tipsArrays = await Promise.all(
		difficulties.map(diff => generateTip(finnishWord, diff, spanishWord))
	);
	// Flatten the array of arrays into a single array
	return tipsArrays.flat();
}

/**
 * Get the point value for a given number of tips shown
 * Point mapping: 0 tips = 10 points, 1 tip = 5 points, 2 tips = 1 point, 3 tips = 1 point
 * @param tipsShown - Number of tips that have been shown (0-3)
 * @returns The point value
 */
export function getPointsForTips(tipsShown: number): number {
	const pointsMap = [10, 5, 1, 1];
	return pointsMap[Math.min(tipsShown, 3)];
}

/**
 * Get the difficulty name for a given tip index
 * @param tipIndex - The index of the tip (0-2)
 * @returns The difficulty name
 */
export function getTipDifficultyName(tipIndex: number): TipDifficulty {
	const difficulties: TipDifficulty[] = ['Vaikea', 'Keskivaikea', 'Helppo'];
	return difficulties[tipIndex];
}

