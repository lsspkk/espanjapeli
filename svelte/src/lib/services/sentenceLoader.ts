/**
 * Sentence loader service for loading and managing Tatoeba sentence content
 * 
 * Data source: Tatoeba (https://tatoeba.org)
 * License: CC-BY 2.0 FR (https://creativecommons.org/licenses/by/2.0/fr/)
 * Attribution: Sentences from Tatoeba.org contributors
 */

import { base } from '$app/paths';

/**
 * Sentence from Tatoeba corpus
 */
export interface Sentence {
	id: string;
	spanish: string;
	finnish: string;
	english: string;
	wordCount: number;
	themes: string[];
}

/**
 * Theme group metadata from manifest
 */
export interface ThemeGroupInfo {
	id: string;
	name: string;
	part?: number;
	count: number;
	filename: string;
}

/**
 * Sentence index manifest
 */
export interface SentenceGroupManifest {
	themes: ThemeGroupInfo[];
}

/**
 * Group of sentences by theme
 */
export interface SentenceGroup {
	theme: string;
	sentences: Sentence[];
}

/**
 * CEFR level type
 */
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Cache for loaded data
let cachedManifest: SentenceGroupManifest | null = null;
const cachedGroups: Map<string, Sentence[]> = new Map();

/**
 * Load sentence index manifest (lightweight metadata for all sentence groups)
 */
export async function loadSentenceIndex(): Promise<SentenceGroupManifest> {
	if (cachedManifest) {
		return cachedManifest;
	}

	try {
		const response = await fetch(`${base}/sentences/index.json`);
		if (!response.ok) {
			throw new Error(`Failed to load sentence index: ${response.status}`);
		}
		cachedManifest = await response.json();
		return cachedManifest;
	} catch (error) {
		console.error('Error loading sentence index:', error);
		throw error;
	}
}

/**
 * Load a sentence group by group ID (e.g., "greetings", "general-1")
 */
export async function loadSentenceGroup(groupId: string): Promise<SentenceGroup> {
	// Check cache first
	if (cachedGroups.has(groupId)) {
		const sentences = cachedGroups.get(groupId)!;
		// Extract theme name from groupId (remove part number if present)
		const theme = groupId.split('-')[0];
		return { theme, sentences };
	}

	// Get group metadata from manifest
	const manifest = await loadSentenceIndex();
	const groupInfo = manifest.themes.find((t) => t.id === groupId);

	if (!groupInfo) {
		throw new Error(`Sentence group not found in manifest: ${groupId}`);
	}

	// Load sentence file
	const sentencePath = `${base}/sentences/${groupInfo.filename}`;

	try {
		const response = await fetch(sentencePath);
		if (!response.ok) {
			throw new Error(`Failed to load sentence group: ${response.status}`);
		}
		const sentences: Sentence[] = await response.json();

		// Cache the loaded sentences
		cachedGroups.set(groupId, sentences);

		return {
			theme: groupInfo.name,
			sentences
		};
	} catch (error) {
		console.error(`Error loading sentence group ${groupId}:`, error);
		throw error;
	}
}

/**
 * Get sentences by theme name (loads all parts if theme is split)
 */
export async function getSentencesByTheme(theme: string): Promise<Sentence[]> {
	const manifest = await loadSentenceIndex();
	
	// Find all groups for this theme
	const themeGroups = manifest.themes.filter((t) => t.name === theme);
	
	if (themeGroups.length === 0) {
		console.warn(`No sentence groups found for theme: ${theme}`);
		return [];
	}

	// Load all groups for this theme
	const allSentences: Sentence[] = [];
	for (const groupInfo of themeGroups) {
		const group = await loadSentenceGroup(groupInfo.id);
		allSentences.push(...group.sentences);
	}

	return allSentences;
}

/**
 * Get sentences filtered by CEFR level (based on word count)
 * This is an approximate filter since we don't have explicit CEFR levels for sentences
 */
export async function getSentencesByLevel(level: CEFRLevel): Promise<Sentence[]> {
	// Map CEFR levels to approximate word count ranges
	const wordCountMap: Record<CEFRLevel, { min: number; max: number }> = {
		A1: { min: 1, max: 6 },
		A2: { min: 1, max: 8 },
		B1: { min: 1, max: 10 },
		B2: { min: 1, max: 12 },
		C1: { min: 1, max: 15 },
		C2: { min: 1, max: 20 }
	};

	const range = wordCountMap[level];
	const manifest = await loadSentenceIndex();

	// Load all sentences and filter by word count
	const allSentences: Sentence[] = [];
	for (const groupInfo of manifest.themes) {
		const group = await loadSentenceGroup(groupInfo.id);
		const filtered = group.sentences.filter(
			(s) => s.wordCount >= range.min && s.wordCount <= range.max
		);
		allSentences.push(...filtered);
	}

	return allSentences;
}

/**
 * Clear the sentence cache (useful for development)
 */
export function clearSentenceCache(): void {
	cachedManifest = null;
	cachedGroups.clear();
}
