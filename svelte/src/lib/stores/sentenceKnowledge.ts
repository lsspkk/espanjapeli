/**
 * Sentence Knowledge Store for Mitä sä sanoit game
 *
 * Tracks user's comprehension of individual sentences.
 * Separate from wordKnowledge (words = recall, sentences = comprehension).
 *
 * Key concepts:
 * - Each sentence has correctCount and wrongCount
 * - Mastered = correctCount >= 3 && correctCount > wrongCount * 2
 * - Tracks last seen timestamp for spaced repetition
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

// Storage key
const STORAGE_KEY = 'espanjapeli_sentence_knowledge';

// Types

/** Knowledge data for a single sentence */
export interface SentenceKnowledge {
	/** Sentence ID from Tatoeba */
	id: string;
	/** Number of times answered correctly */
	correctCount: number;
	/** Number of times answered incorrectly */
	wrongCount: number;
	/** Timestamp of last practice (ISO date) */
	lastSeenAt: string;
}

/** Full sentence knowledge store data structure */
export interface SentenceKnowledgeData {
	/** Sentence knowledge indexed by sentence ID */
	sentences: Record<string, SentenceKnowledge>;
	/** Metadata */
	meta: {
		createdAt: string;
		updatedAt: string;
	};
}

// Helper functions

function isBrowser(): boolean {
	return browser && typeof localStorage !== 'undefined';
}

function createDefaultData(): SentenceKnowledgeData {
	const now = new Date().toISOString();
	return {
		sentences: {},
		meta: {
			createdAt: now,
			updatedAt: now
		}
	};
}

/**
 * Load sentence knowledge data from localStorage
 */
function loadData(): SentenceKnowledgeData {
	if (!isBrowser()) return createDefaultData();

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed as SentenceKnowledgeData;
		}
	} catch (error) {
		console.error('Error loading sentence knowledge:', error);
	}

	return createDefaultData();
}

/**
 * Save sentence knowledge data to localStorage
 */
function saveData(data: SentenceKnowledgeData): void {
	if (!isBrowser()) return;

	try {
		data.meta.updatedAt = new Date().toISOString();
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (error) {
		console.error('Error saving sentence knowledge:', error);
	}
}

// Create the store

function createSentenceKnowledgeStore() {
	const { subscribe, set, update } = writable<SentenceKnowledgeData>(loadData());

	return {
		subscribe,

		/**
		 * Record a sentence answer from a game
		 */
		recordSentenceAnswer(sentenceId: string, correct: boolean): void {
			update((data) => {
				const now = new Date().toISOString();

				// Initialize sentence if not exists
				if (!data.sentences[sentenceId]) {
					data.sentences[sentenceId] = {
						id: sentenceId,
						correctCount: 0,
						wrongCount: 0,
						lastSeenAt: now
					};
				}

				const sentence = data.sentences[sentenceId];

				// Update counters
				if (correct) {
					sentence.correctCount++;
				} else {
					sentence.wrongCount++;
				}

				sentence.lastSeenAt = now;

				saveData(data);
				return data;
			});
		},

		/**
		 * Get knowledge score for a specific sentence
		 * Returns object with correctCount, wrongCount, and mastered status
		 */
		getSentenceScore(sentenceId: string): {
			correctCount: number;
			wrongCount: number;
			mastered: boolean;
		} {
			const data = get({ subscribe });
			const sentence = data.sentences[sentenceId];

			if (!sentence) {
				return {
					correctCount: 0,
					wrongCount: 0,
					mastered: false
				};
			}

			const mastered = sentence.correctCount >= 3 && sentence.correctCount > sentence.wrongCount * 2;

			return {
				correctCount: sentence.correctCount,
				wrongCount: sentence.wrongCount,
				mastered
			};
		},

		/**
		 * Get sentence statistics summary
		 * Returns total sentences, practiced sentences, and mastered sentences
		 */
		getSentenceStats(): {
			total: number;
			practiced: number;
			mastered: number;
		} {
			const data = get({ subscribe });
			const sentences = Object.values(data.sentences);

			const total = sentences.length;
			const practiced = sentences.filter((s) => s.correctCount > 0 || s.wrongCount > 0).length;
			const mastered = sentences.filter(
				(s) => s.correctCount >= 3 && s.correctCount > s.wrongCount * 2
			).length;

			return {
				total,
				practiced,
				mastered
			};
		},

		/**
		 * Reset all sentence knowledge data
		 */
		reset(): void {
			const freshData = createDefaultData();
			saveData(freshData);
			set(freshData);
		}
	};
}

// Export store instance
export const sentenceKnowledge = createSentenceKnowledgeStore();
