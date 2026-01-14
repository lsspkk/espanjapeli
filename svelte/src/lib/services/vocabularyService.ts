/**
 * Vocabulary Service for Espanjapeli V4
 * 
 * Provides frequency-based vocabulary lookups and metadata.
 * Loads frequency data lazily on first use.
 * 
 * Key features:
 * - Frequency rank lookup for any Spanish word
 * - CEFR level inference based on frequency
 * - Top-N membership checks (top 100, 500, 1000, etc.)
 * - Word metadata retrieval
 */

import { browser } from '$app/environment';

/** Frequency data for a single word */
export interface FrequencyEntry {
	rank: number;
	count: number;
	cefr: string;
	isTop100: boolean;
	isTop500: boolean;
	isTop1000: boolean;
	isTop3000: boolean;
	isTop5000: boolean;
}

/** Full frequency data structure */
interface FrequencyData {
	version: string;
	source: string;
	sourceUrl: string;
	license: string;
	attribution: string;
	language: string;
	range: string;
	wordCount: number;
	generatedAt: string;
	words: Record<string, FrequencyEntry>;
}

/** Word metadata combining frequency and other data */
export interface WordMetadata {
	spanish: string;
	frequencyRank: number | null;
	cefrLevel: string | null;
	isTop100: boolean;
	isTop500: boolean;
	isTop1000: boolean;
	isTop3000: boolean;
	isTop5000: boolean;
	isInFrequencyData: boolean;
}

// Module-level cache for frequency data
let frequencyCache: FrequencyData | null = null;
let loadingPromise: Promise<FrequencyData | null> | null = null;

/**
 * Load frequency data from static JSON file
 * Uses lazy loading - only fetches on first use
 */
async function loadFrequencyData(): Promise<FrequencyData | null> {
	// Return cached data if available
	if (frequencyCache) {
		return frequencyCache;
	}
	
	// If already loading, wait for that promise
	if (loadingPromise) {
		return loadingPromise;
	}
	
	// Only load in browser
	if (!browser) {
		return null;
	}
	
	// Start loading
	loadingPromise = (async () => {
		try {
			const response = await fetch('/data/frequency-spanish-top5000.json');
			if (!response.ok) {
				console.error('Failed to load frequency data:', response.status);
				return null;
			}
			
			const data = await response.json() as FrequencyData;
			frequencyCache = data;
			console.log(`📚 Loaded frequency data: ${data.wordCount} words`);
			return data;
		} catch (error) {
			console.error('Error loading frequency data:', error);
			return null;
		} finally {
			loadingPromise = null;
		}
	})();
	
	return loadingPromise;
}

/**
 * Get frequency entry for a Spanish word
 * Returns null if word not found or data not loaded
 */
export async function getFrequencyEntry(spanish: string): Promise<FrequencyEntry | null> {
	const data = await loadFrequencyData();
	if (!data) return null;
	
	// Try exact match first
	const entry = data.words[spanish.toLowerCase()];
	if (entry) return entry;
	
	// No match found
	return null;
}

/**
 * Get frequency rank for a Spanish word
 * Returns null if word not in frequency data
 */
export async function getFrequencyRank(spanish: string): Promise<number | null> {
	const entry = await getFrequencyEntry(spanish);
	return entry?.rank ?? null;
}

/**
 * Get CEFR level for a Spanish word based on frequency
 * Returns null if word not in frequency data
 */
export async function getCEFRLevel(spanish: string): Promise<string | null> {
	const entry = await getFrequencyEntry(spanish);
	return entry?.cefr ?? null;
}

/**
 * Check if a word is in the top N most frequent words
 */
export async function isInTopN(spanish: string, n: number): Promise<boolean> {
	const entry = await getFrequencyEntry(spanish);
	if (!entry) return false;
	
	switch (n) {
		case 100: return entry.isTop100;
		case 500: return entry.isTop500;
		case 1000: return entry.isTop1000;
		case 3000: return entry.isTop3000;
		case 5000: return entry.isTop5000;
		default: return entry.rank <= n;
	}
}

/**
 * Get full metadata for a Spanish word
 */
export async function getWordMetadata(spanish: string): Promise<WordMetadata> {
	const entry = await getFrequencyEntry(spanish);
	
	if (!entry) {
		return {
			spanish,
			frequencyRank: null,
			cefrLevel: null,
			isTop100: false,
			isTop500: false,
			isTop1000: false,
			isTop3000: false,
			isTop5000: false,
			isInFrequencyData: false
		};
	}
	
	return {
		spanish,
		frequencyRank: entry.rank,
		cefrLevel: entry.cefr,
		isTop100: entry.isTop100,
		isTop500: entry.isTop500,
		isTop1000: entry.isTop1000,
		isTop3000: entry.isTop3000,
		isTop5000: entry.isTop5000,
		isInFrequencyData: true
	};
}

/**
 * Get metadata for multiple words at once (more efficient)
 */
export async function getWordsMetadata(spanishWords: string[]): Promise<Map<string, WordMetadata>> {
	const data = await loadFrequencyData();
	const result = new Map<string, WordMetadata>();
	
	for (const spanish of spanishWords) {
		const entry = data?.words[spanish.toLowerCase()];
		
		if (entry) {
			result.set(spanish, {
				spanish,
				frequencyRank: entry.rank,
				cefrLevel: entry.cefr,
				isTop100: entry.isTop100,
				isTop500: entry.isTop500,
				isTop1000: entry.isTop1000,
				isTop3000: entry.isTop3000,
				isTop5000: entry.isTop5000,
				isInFrequencyData: true
			});
		} else {
			result.set(spanish, {
				spanish,
				frequencyRank: null,
				cefrLevel: null,
				isTop100: false,
				isTop500: false,
				isTop1000: false,
				isTop3000: false,
				isTop5000: false,
				isInFrequencyData: false
			});
		}
	}
	
	return result;
}

/**
 * Preload frequency data (call early in app lifecycle)
 */
export async function preloadFrequencyData(): Promise<void> {
	await loadFrequencyData();
}

/**
 * Get the frequency data source attribution
 */
export async function getAttribution(): Promise<{ source: string; license: string; url: string } | null> {
	const data = await loadFrequencyData();
	if (!data) return null;
	
	return {
		source: data.attribution,
		license: data.license,
		url: data.sourceUrl
	};
}

/**
 * Get count of words in frequency data
 */
export async function getFrequencyDataStats(): Promise<{ wordCount: number; range: string } | null> {
	const data = await loadFrequencyData();
	if (!data) return null;
	
	return {
		wordCount: data.wordCount,
		range: data.range
	};
}

/**
 * Synchronous check if frequency data is loaded
 */
export function isFrequencyDataLoaded(): boolean {
	return frequencyCache !== null;
}

/**
 * Get CEFR level description
 */
export function getCEFRDescription(level: string): string {
	const descriptions: Record<string, string> = {
		'A1': 'Aloittelija',
		'A2': 'Perustaso',
		'B1': 'Keskitaso',
		'B2': 'Hyvä keskitaso',
		'C1': 'Edistynyt',
		'C2': 'Taitava'
	};
	return descriptions[level] || level;
}
