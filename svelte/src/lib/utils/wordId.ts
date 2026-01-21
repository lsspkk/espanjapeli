import type { Word } from '$lib/data/words';

/**
 * Returns the unique identifier for a word.
 * - If word.id is defined, returns word.id
 * - Otherwise, falls back to word.spanish
 * 
 * This enables tracking polysemous words (same Spanish word, different meanings)
 * as separate entries when they have distinct IDs.
 * 
 * @param word - The word object
 * @returns The unique identifier for the word
 */
export function getWordId(word: Word): string {
	return word.id ?? word.spanish;
}

/**
 * Creates a polysemous word ID in the format: spanish#sense
 * 
 * Example: createPolysemousId("tiempo", "time") → "tiempo#time"
 * 
 * @param spanish - The Spanish word
 * @param sense - The sense disambiguator (e.g., "time", "weather", "finance")
 * @returns The polysemous ID in format: {spanish}#{sense}
 */
export function createPolysemousId(spanish: string, sense: string): string {
	return `${spanish}#${sense}`;
}
