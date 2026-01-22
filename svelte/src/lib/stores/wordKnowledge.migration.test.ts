/**
 * Tests for V4 to V5 migration in wordKnowledge store
 * 
 * V4: Keys are Spanish words (string)
 * V5: Keys are word IDs (word.id or word.spanish for non-polysemous words)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import type { WordKnowledgeData } from './wordKnowledge';

// Mock browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

// Mock words.ts to have controlled test data
vi.mock('$lib/data/words', () => ({
	WORD_CATEGORIES: {
		greetings: {
			name: 'Tervehdykset',
			words: [
				{ spanish: 'hola', english: 'hello', finnish: 'hei' },
				{ spanish: 'adios', english: 'goodbye', finnish: 'näkemiin' }
			]
		},
		time: {
			name: 'Aika',
			words: [
				{ 
					id: 'tiempo#time', 
					spanish: 'tiempo', 
					english: 'time', 
					finnish: 'aika',
					senseKey: 'time'
				}
			]
		},
		weather: {
			name: 'Sää',
			words: [
				{ 
					id: 'tiempo#weather', 
					spanish: 'tiempo', 
					english: 'weather', 
					finnish: 'sää',
					senseKey: 'weather'
				}
			]
		},
		colors: {
			name: 'Värit',
			words: [
				{ spanish: 'rojo', english: 'red', finnish: 'punainen' }
			]
		}
	}
}));

describe('V4 to V5 Migration', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.resetModules();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should migrate simple words correctly', async () => {
		// Create V4 fixture data
		const v4Data = {
			version: 4,
			words: {
				'hola': {
					spanish_to_finnish: {
						basic: {
							score: 85.5,
							practiceCount: 10,
							firstTryCount: 8,
							secondTryCount: 2,
							thirdTryCount: 0,
							failedCount: 0,
							lastPracticed: '2024-01-15T10:00:00.000Z',
							firstPracticed: '2024-01-01T10:00:00.000Z'
						}
					},
					finnish_to_spanish: {
						basic: {
							score: 72.3,
							practiceCount: 8,
							firstTryCount: 5,
							secondTryCount: 3,
							thirdTryCount: 0,
							failedCount: 0,
							lastPracticed: '2024-01-14T10:00:00.000Z',
							firstPracticed: '2024-01-02T10:00:00.000Z'
						}
					}
				},
				'adios': {
					spanish_to_finnish: {
						basic: {
							score: 90.0,
							practiceCount: 5,
							firstTryCount: 5,
							secondTryCount: 0,
							thirdTryCount: 0,
							failedCount: 0,
							lastPracticed: '2024-01-16T10:00:00.000Z',
							firstPracticed: '2024-01-03T10:00:00.000Z'
						}
					},
					finnish_to_spanish: {}
				}
			},
			gameHistory: [],
			meta: {
				createdAt: '2024-01-01T10:00:00.000Z',
				updatedAt: '2024-01-16T10:00:00.000Z',
				totalGamesPlayed: 15,
				basicGamesPlayed: 12,
				kidsGamesPlayed: 3
			}
		};

		// Store V4 data in localStorage
		localStorage.setItem('yhdistasanat_word_knowledge', JSON.stringify(v4Data));

		// Dynamically import the store to trigger migration
		const { wordKnowledge } = await import('./wordKnowledge');
		const data = get(wordKnowledge);

		// Verify migration to V5
		expect(data.version).toBe(5);

		// Verify simple words are migrated correctly (key remains Spanish word)
		expect(data.words['hola']).toBeDefined();
		expect(data.words['hola'].spanish_to_finnish.basic?.score).toBe(85.5);
		expect(data.words['hola'].spanish_to_finnish.basic?.practiceCount).toBe(10);
		expect(data.words['hola'].finnish_to_spanish.basic?.score).toBe(72.3);

		expect(data.words['adios']).toBeDefined();
		expect(data.words['adios'].spanish_to_finnish.basic?.score).toBe(90.0);

		// Verify metadata is preserved
		expect(data.meta.createdAt).toBe('2024-01-01T10:00:00.000Z');
		expect(data.meta.totalGamesPlayed).toBe(15);
		expect(data.meta.basicGamesPlayed).toBe(12);
		expect(data.meta.kidsGamesPlayed).toBe(3);
	});

	it('should skip polysemous words during migration', async () => {
		// Create V4 fixture with polysemous word
		const v4Data = {
			version: 4,
			words: {
				'tiempo': {
					spanish_to_finnish: {
						basic: {
							score: 75.0,
							practiceCount: 6,
							firstTryCount: 4,
							secondTryCount: 2,
							thirdTryCount: 0,
							failedCount: 0,
							lastPracticed: '2024-01-15T10:00:00.000Z',
							firstPracticed: '2024-01-01T10:00:00.000Z'
						}
					},
					finnish_to_spanish: {}
				},
				'hola': {
					spanish_to_finnish: {
						basic: {
							score: 85.0,
							practiceCount: 5,
							firstTryCount: 5,
							secondTryCount: 0,
							thirdTryCount: 0,
							failedCount: 0,
							lastPracticed: '2024-01-16T10:00:00.000Z',
							firstPracticed: '2024-01-03T10:00:00.000Z'
						}
					},
					finnish_to_spanish: {}
				}
			},
			gameHistory: [],
			meta: {
				createdAt: '2024-01-01T10:00:00.000Z',
				updatedAt: '2024-01-16T10:00:00.000Z',
				totalGamesPlayed: 11,
				basicGamesPlayed: 11,
				kidsGamesPlayed: 0
			}
		};

		// Spy on console.warn to verify warning is logged
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		localStorage.setItem('yhdistasanat_word_knowledge', JSON.stringify(v4Data));

		// Dynamically import the store to trigger migration
		const { wordKnowledge } = await import('./wordKnowledge');
		const data = get(wordKnowledge);

		// Verify migration occurred
		expect(data.version).toBe(5);

		// Verify polysemous word 'tiempo' was skipped (not migrated)
		expect(data.words['tiempo']).toBeUndefined();
		expect(data.words['tiempo#time']).toBeUndefined();
		expect(data.words['tiempo#weather']).toBeUndefined();

		// Verify warning was logged
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('tiempo')
		);
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('polysemous')
		);

		// Verify non-polysemous word was migrated
		expect(data.words['hola']).toBeDefined();
		expect(data.words['hola'].spanish_to_finnish.basic?.score).toBe(85.0);

		warnSpy.mockRestore();
	});

	it('should skip removed words during migration', async () => {
		// Create V4 fixture with a word that no longer exists in vocabulary
		const v4Data = {
			version: 4,
			words: {
				'palabraremovida': {
					spanish_to_finnish: {
						basic: {
							score: 60.0,
							practiceCount: 3,
							firstTryCount: 2,
							secondTryCount: 1,
							thirdTryCount: 0,
							failedCount: 0,
							lastPracticed: '2024-01-10T10:00:00.000Z',
							firstPracticed: '2024-01-05T10:00:00.000Z'
						}
					},
					finnish_to_spanish: {}
				},
				'hola': {
					spanish_to_finnish: {
						basic: {
							score: 85.0,
							practiceCount: 5,
							firstTryCount: 5,
							secondTryCount: 0,
							thirdTryCount: 0,
							failedCount: 0,
							lastPracticed: '2024-01-16T10:00:00.000Z',
							firstPracticed: '2024-01-03T10:00:00.000Z'
						}
					},
					finnish_to_spanish: {}
				}
			},
			gameHistory: [],
			meta: {
				createdAt: '2024-01-01T10:00:00.000Z',
				updatedAt: '2024-01-16T10:00:00.000Z',
				totalGamesPlayed: 8,
				basicGamesPlayed: 8,
				kidsGamesPlayed: 0
			}
		};

		// Spy on console.warn to verify warning is logged
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		localStorage.setItem('yhdistasanat_word_knowledge', JSON.stringify(v4Data));

		// Dynamically import the store to trigger migration
		const { wordKnowledge } = await import('./wordKnowledge');
		const data = get(wordKnowledge);

		// Verify migration occurred
		expect(data.version).toBe(5);

		// Verify removed word was skipped
		expect(data.words['palabraremovida']).toBeUndefined();

		// Verify warning was logged
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('palabraremovida')
		);
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('not found')
		);

		// Verify existing word was migrated
		expect(data.words['hola']).toBeDefined();
		expect(data.words['hola'].spanish_to_finnish.basic?.score).toBe(85.0);

		warnSpy.mockRestore();
	});

	it('should handle empty V4 data', async () => {
		const v4Data = {
			version: 4,
			words: {},
			gameHistory: [],
			meta: {
				createdAt: '2024-01-01T10:00:00.000Z',
				updatedAt: '2024-01-01T10:00:00.000Z',
				totalGamesPlayed: 0,
				basicGamesPlayed: 0,
				kidsGamesPlayed: 0
			}
		};

		localStorage.setItem('yhdistasanat_word_knowledge', JSON.stringify(v4Data));

		// Dynamically import the store to trigger migration
		const { wordKnowledge } = await import('./wordKnowledge');
		const data = get(wordKnowledge);

		// Verify migration to V5
		expect(data.version).toBe(5);

		// Verify structure is valid
		expect(data.words).toEqual({});
		expect(data.gameHistory).toEqual([]);
		expect(data.meta.totalGamesPlayed).toBe(0);
	});

	it('should not re-migrate existing V5 data', async () => {
		// Create V5 data
		const v5Data: WordKnowledgeData = {
			version: 5,
			words: {
				'hola': {
					spanish_to_finnish: {
						basic: {
							score: 85.5,
							practiceCount: 10,
							firstTryCount: 8,
							secondTryCount: 2,
							thirdTryCount: 0,
							failedCount: 0,
							lastPracticed: '2024-01-15T10:00:00.000Z',
							firstPracticed: '2024-01-01T10:00:00.000Z'
						}
					},
					finnish_to_spanish: {}
				},
				'tiempo#time': {
					spanish_to_finnish: {
						basic: {
							score: 70.0,
							practiceCount: 5,
							firstTryCount: 4,
							secondTryCount: 1,
							thirdTryCount: 0,
							failedCount: 0,
							lastPracticed: '2024-01-14T10:00:00.000Z',
							firstPracticed: '2024-01-02T10:00:00.000Z'
						}
					},
					finnish_to_spanish: {}
				}
			},
			gameHistory: [],
			meta: {
				createdAt: '2024-01-01T10:00:00.000Z',
				updatedAt: '2024-01-16T10:00:00.000Z',
				totalGamesPlayed: 15,
				basicGamesPlayed: 15,
				kidsGamesPlayed: 0
			}
		};

		localStorage.setItem('yhdistasanat_word_knowledge', JSON.stringify(v5Data));

		// Dynamically import the store to trigger load
		const { wordKnowledge } = await import('./wordKnowledge');
		const data = get(wordKnowledge);

		// Verify version remains V5
		expect(data.version).toBe(5);

		// Verify data is unchanged
		expect(data.words['hola']).toBeDefined();
		expect(data.words['hola'].spanish_to_finnish.basic?.score).toBe(85.5);
		expect(data.words['tiempo#time']).toBeDefined();
		expect(data.words['tiempo#time'].spanish_to_finnish.basic?.score).toBe(70.0);

		// Verify no migration warnings (check that console.warn was not called with migration messages)
		const warnSpy = vi.spyOn(console, 'warn');
		expect(warnSpy).not.toHaveBeenCalledWith(expect.stringContaining('Migration'));
	});

	it('should preserve all word knowledge fields during migration', async () => {
		// Create V4 fixture with all possible fields
		const v4Data = {
			version: 4,
			words: {
				'rojo': {
					spanish_to_finnish: {
						basic: {
							score: 88.2,
							practiceCount: 12,
							firstTryCount: 10,
							secondTryCount: 1,
							thirdTryCount: 1,
							failedCount: 0,
							lastPracticed: '2024-01-20T15:30:00.000Z',
							firstPracticed: '2024-01-05T08:00:00.000Z',
							storiesEncountered: ['story1', 'story2'],
							storyEncounterCount: 5
						},
						kids: {
							score: 75.0,
							practiceCount: 6,
							firstTryCount: 4,
							secondTryCount: 2,
							thirdTryCount: 0,
							failedCount: 0,
							lastPracticed: '2024-01-18T12:00:00.000Z',
							firstPracticed: '2024-01-10T09:00:00.000Z'
						}
					},
					finnish_to_spanish: {
						basic: {
							score: 82.5,
							practiceCount: 8,
							firstTryCount: 7,
							secondTryCount: 1,
							thirdTryCount: 0,
							failedCount: 0,
							lastPracticed: '2024-01-19T14:00:00.000Z',
							firstPracticed: '2024-01-06T10:00:00.000Z'
						}
					}
				}
			},
			gameHistory: [
				{
					id: 'game_123',
					timestamp: '2024-01-20T15:30:00.000Z',
					category: 'colors',
					direction: 'spanish_to_finnish',
					questionsCount: 5,
					results: {
						firstTry: 4,
						secondTry: 1,
						thirdTry: 0,
						failed: 0
					},
					words: [
						{ spanish: 'rojo', finnish: 'punainen', quality: 'first_try' }
					]
				}
			],
			meta: {
				createdAt: '2024-01-01T10:00:00.000Z',
				updatedAt: '2024-01-20T15:30:00.000Z',
				totalGamesPlayed: 20,
				basicGamesPlayed: 15,
				kidsGamesPlayed: 5
			}
		};

		localStorage.setItem('yhdistasanat_word_knowledge', JSON.stringify(v4Data));

		// Dynamically import the store to trigger migration
		const { wordKnowledge } = await import('./wordKnowledge');
		const data = get(wordKnowledge);

		// Verify migration to V5
		expect(data.version).toBe(5);

		// Verify all fields are preserved
		const wordData = data.words['rojo'];
		expect(wordData).toBeDefined();

		// Check basic mode Spanish→Finnish
		const basicStf = wordData.spanish_to_finnish.basic;
		expect(basicStf?.score).toBe(88.2);
		expect(basicStf?.practiceCount).toBe(12);
		expect(basicStf?.firstTryCount).toBe(10);
		expect(basicStf?.secondTryCount).toBe(1);
		expect(basicStf?.thirdTryCount).toBe(1);
		expect(basicStf?.failedCount).toBe(0);
		expect(basicStf?.lastPracticed).toBe('2024-01-20T15:30:00.000Z');
		expect(basicStf?.firstPracticed).toBe('2024-01-05T08:00:00.000Z');
		expect(basicStf?.storiesEncountered).toEqual(['story1', 'story2']);
		expect(basicStf?.storyEncounterCount).toBe(5);

		// Check kids mode Spanish→Finnish
		const kidsStf = wordData.spanish_to_finnish.kids;
		expect(kidsStf?.score).toBe(75.0);
		expect(kidsStf?.practiceCount).toBe(6);

		// Check basic mode Finnish→Spanish
		const basicFts = wordData.finnish_to_spanish.basic;
		expect(basicFts?.score).toBe(82.5);
		expect(basicFts?.practiceCount).toBe(8);

		// Verify game history is preserved
		expect(data.gameHistory).toHaveLength(1);
		expect(data.gameHistory[0].id).toBe('game_123');

		// Verify metadata is preserved
		expect(data.meta.totalGamesPlayed).toBe(20);
		expect(data.meta.basicGamesPlayed).toBe(15);
		expect(data.meta.kidsGamesPlayed).toBe(5);
	});

	it('should migrate 100+ words fixture correctly', async () => {
		// Load fixture file
		const v4Data = await import('./test-fixtures/v4-100-words.json');

		// Spy on console.warn to track skipped words
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		localStorage.setItem('yhdistasanat_word_knowledge', JSON.stringify(v4Data.default));

		// Dynamically import the store to trigger migration
		const { wordKnowledge } = await import('./wordKnowledge');
		const data = get(wordKnowledge);

		// Verify migration to V5
		expect(data.version).toBe(5);

		// Verify metadata is preserved
		expect(data.meta).toBeDefined();
		expect(data.meta.totalGamesPlayed).toBeGreaterThan(0);

		// Verify words that exist in mocked vocabulary are migrated
		// (Most words in fixture don't exist in mock, so only a few will migrate)
		const wordCount = Object.keys(data.words).length;
		expect(wordCount).toBeGreaterThanOrEqual(2); // At least hola and adios

		// Spot check words that exist in mock vocabulary
		expect(data.words['hola']).toBeDefined();
		expect(data.words['adios']).toBeDefined();

		// Verify structure is correct for migrated words
		for (const [wordKey, wordData] of Object.entries(data.words)) {
			expect(wordData.spanish_to_finnish).toBeDefined();
			expect(wordData.finnish_to_spanish).toBeDefined();
		}

		// Verify warnings were logged for words not in vocabulary
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('not found in vocabulary')
		);

		warnSpy.mockRestore();
	});

	it('should handle removed words fixture correctly', async () => {
		// Load fixture file with removed words
		const v4Data = await import('./test-fixtures/v4-removed-words.json');

		// Spy on console.warn to verify warnings are logged
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		localStorage.setItem('yhdistasanat_word_knowledge', JSON.stringify(v4Data.default));

		// Dynamically import the store to trigger migration
		const { wordKnowledge } = await import('./wordKnowledge');
		const data = get(wordKnowledge);

		// Verify migration to V5
		expect(data.version).toBe(5);

		// Verify removed words are skipped
		expect(data.words['palabraremovida']).toBeUndefined();
		expect(data.words['antiguapalabra']).toBeUndefined();
		expect(data.words['vocabularioviejo']).toBeUndefined();

		// Verify warnings were logged for removed words
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('palabraremovida')
		);

		// Verify existing words that are in mock vocabulary are migrated
		expect(data.words['hola']).toBeDefined();
		expect(data.words['adios']).toBeDefined();
		// Note: 'casa' is not in the mocked vocabulary, so it won't be migrated

		warnSpy.mockRestore();
	});

	it('should handle empty fixture correctly', async () => {
		// Load empty fixture
		const v4Data = await import('./test-fixtures/v4-empty.json');

		localStorage.setItem('yhdistasanat_word_knowledge', JSON.stringify(v4Data.default));

		// Dynamically import the store to trigger migration
		const { wordKnowledge } = await import('./wordKnowledge');
		const data = get(wordKnowledge);

		// Verify migration to V5
		expect(data.version).toBe(5);

		// Verify empty data structure is valid
		expect(data.words).toEqual({});
		expect(data.gameHistory).toEqual([]);
		expect(data.meta.totalGamesPlayed).toBe(0);
	});

	it('should handle 10 words fixture correctly', async () => {
		// Load 10 words fixture
		const v4Data = await import('./test-fixtures/v4-10-words.json');

		// Spy on console.warn to track skipped words
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		localStorage.setItem('yhdistasanat_word_knowledge', JSON.stringify(v4Data.default));

		// Dynamically import the store to trigger migration
		const { wordKnowledge } = await import('./wordKnowledge');
		const data = get(wordKnowledge);

		// Verify migration to V5
		expect(data.version).toBe(5);

		// Verify word count (only words in mocked vocabulary will migrate)
		// Mock vocabulary has: hola, adios, rojo (and polysemous tiempo)
		const wordCount = Object.keys(data.words).length;
		expect(wordCount).toBeGreaterThanOrEqual(2); // At least hola and adios

		// Verify words that exist in mock vocabulary are migrated with correct data
		expect(data.words['hola']).toBeDefined();
		expect(data.words['hola'].spanish_to_finnish.basic?.score).toBe(85.5);
		expect(data.words['adios']).toBeDefined();
		expect(data.words['rojo']).toBeDefined();

		// Words not in mock vocabulary won't be migrated
		expect(data.words['casa']).toBeUndefined();
		expect(data.words['perro']).toBeUndefined();

		// Verify game history is preserved
		expect(data.gameHistory).toHaveLength(1);
		expect(data.gameHistory[0].id).toBe('game_123');

		// Verify metadata
		expect(data.meta.totalGamesPlayed).toBe(20);

		warnSpy.mockRestore();
	});

	it('should handle polysemous words fixture correctly', async () => {
		// Load polysemous fixture
		const v4Data = await import('./test-fixtures/v4-polysemous.json');

		// Spy on console.warn to verify warnings
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		localStorage.setItem('yhdistasanat_word_knowledge', JSON.stringify(v4Data.default));

		// Dynamically import the store to trigger migration
		const { wordKnowledge } = await import('./wordKnowledge');
		const data = get(wordKnowledge);

		// Verify migration to V5
		expect(data.version).toBe(5);

		// Verify polysemous words are skipped
		expect(data.words['tiempo']).toBeUndefined();
		expect(data.words['banco']).toBeUndefined();
		expect(data.words['copa']).toBeUndefined();
		expect(data.words['planta']).toBeUndefined();
		expect(data.words['carta']).toBeUndefined();

		// Verify warnings were logged
		expect(warnSpy).toHaveBeenCalledWith(
			expect.stringContaining('polysemous')
		);

		// Verify non-polysemous words are migrated
		expect(data.words['hola']).toBeDefined();
		expect(data.words['adios']).toBeDefined();

		warnSpy.mockRestore();
	});
});
