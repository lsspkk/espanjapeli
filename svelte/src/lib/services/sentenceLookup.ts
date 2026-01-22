/**
 * Sentence lookup service for Valitut sanat game
 *
 * Provides fast lookup of example sentences for Spanish words using
 * pre-computed word-to-sentence mappings from Tatoeba corpus.
 *
 * This avoids runtime searching and loading of all ~20k sentences.
 */

import { base } from '$app/paths';
import {
	loadSentenceIndex,
	loadSentenceGroup,
	type Sentence
} from './sentenceLoader';

interface WordSentencesMapping {
	metadata: {
		generatedAt: string;
		totalWords: number;
		totalSentences: number;
		wordsWithSentences: number;
		totalMappings: number;
		description: string;
	};
	wordToSentences: Record<string, string[]>;
}

// Cache for the mapping file
let cachedMapping: WordSentencesMapping | null = null;

// Cache for loaded sentences
const cachedSentences: Map<string, Sentence> = new Map();

/**
 * Load the word-to-sentences mapping file
 */
async function loadWordSentencesMapping(): Promise<WordSentencesMapping> {
	if (cachedMapping) {
		return cachedMapping;
	}

	try {
		const response = await fetch(`${base}/sentences/word-sentences.json`);
		if (!response.ok) {
			throw new Error(`Failed to load word-sentences mapping: ${response.status}`);
		}
		cachedMapping = await response.json();
		console.log(
			`📊 Loaded word-sentences mapping: ${cachedMapping.metadata.wordsWithSentences} words with ${cachedMapping.metadata.totalMappings} sentence mappings`
		);
		return cachedMapping;
	} catch (error) {
		console.error('Error loading word-sentences mapping:', error);
		throw error;
	}
}

/**
 * Load a sentence by ID from the Tatoeba corpus
 * This requires knowing which category file contains the sentence
 */
async function loadSentenceById(sentenceId: string): Promise<Sentence | null> {
	// Check cache first
	if (cachedSentences.has(sentenceId)) {
		return cachedSentences.get(sentenceId) || null;
	}

	try {
		// Load sentence index to find which category contains this sentence
		const manifest = await loadSentenceIndex();

		// Try to find and load the sentence from each category
		for (const categoryInfo of manifest.categories) {
			try {
				const group = await loadSentenceGroup(categoryInfo.id);
				const sentence = group.sentences.find((s) => s.id === sentenceId);

				if (sentence) {
					cachedSentences.set(sentenceId, sentence);
					return sentence;
				}
			} catch (error) {
				// Continue to next category if this one fails
				continue;
			}
		}

		console.warn(`Sentence not found: ${sentenceId}`);
		return null;
	} catch (error) {
		console.error(`Error loading sentence ${sentenceId}:`, error);
		return null;
	}
}

/**
 * Get example sentences for a Spanish word
 * Returns up to 5 example sentences with context
 */
export async function getExampleSentencesForWord(spanishWord: string): Promise<Sentence[]> {
	try {
		const mapping = await loadWordSentencesMapping();
		const sentenceIds = mapping.wordToSentences[spanishWord];

		if (!sentenceIds || sentenceIds.length === 0) {
			console.log(`No example sentences found for: ${spanishWord}`);
			return [];
		}

		// Load sentences in parallel
		const sentences = await Promise.all(
			sentenceIds.map((id) => loadSentenceById(id))
		);

		// Filter out null results and return
		return sentences.filter((s): s is Sentence => s !== null);
	} catch (error) {
		console.error(`Error getting example sentences for "${spanishWord}":`, error);
		return [];
	}
}

/**
 * Get example sentences for multiple words (batch operation)
 * Returns a map of word -> sentences array
 */
export async function getExampleSentencesForWords(
	spanishWords: string[]
): Promise<Map<string, Sentence[]>> {
	const result = new Map<string, Sentence[]>();

	try {
		const mapping = await loadWordSentencesMapping();

		// Build set of unique sentence IDs to load
		const sentenceIdsToLoad = new Set<string>();
		const wordToSentenceIds = new Map<string, string[]>();

		for (const word of spanishWords) {
			const sentenceIds = mapping.wordToSentences[word] || [];
			if (sentenceIds.length > 0) {
				wordToSentenceIds.set(word, sentenceIds);
				sentenceIds.forEach((id) => sentenceIdsToLoad.add(id));
			}
		}

		// Load all unique sentences
		const sentencesMap = new Map<string, Sentence>();
		await Promise.all(
			Array.from(sentenceIdsToLoad).map(async (id) => {
				const sentence = await loadSentenceById(id);
				if (sentence) {
					sentencesMap.set(id, sentence);
				}
			})
		);

		// Build result map
		for (const word of spanishWords) {
			const sentenceIds = wordToSentenceIds.get(word) || [];
			const sentences = sentenceIds
				.map((id) => sentencesMap.get(id))
				.filter((s): s is Sentence => s !== null);
			result.set(word, sentences);
		}

		return result;
	} catch (error) {
		console.error('Error getting example sentences for batch:', error);
		return new Map();
	}
}

/**
 * Clear all caches
 */
export function clearSentenceLookupCache(): void {
	cachedMapping = null;
	cachedSentences.clear();
	console.log('✓ Sentence lookup cache cleared');
}
