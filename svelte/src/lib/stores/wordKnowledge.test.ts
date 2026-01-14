/**
 * Tests for wordKnowledge store with mode separation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { wordKnowledge, type GameMode, type LanguageDirection, type AnswerQuality } from './wordKnowledge';

// Mock browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('wordKnowledge store', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		wordKnowledge.reset();
	});

	describe('Mode Separation', () => {
		it('should track basic mode separately from kids mode', () => {
			// Record answer in basic mode
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'first_try', 'basic');
			
			// Record answer in kids mode
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'second_try', 'kids');
			
			const data = get(wordKnowledge);
			const wordData = data.words['hola'];
			
			// Both modes should exist
			expect(wordData.spanish_to_finnish.basic).toBeDefined();
			expect(wordData.spanish_to_finnish.kids).toBeDefined();
			
			// Scores should be different
			expect(wordData.spanish_to_finnish.basic!.score).toBeGreaterThan(
				wordData.spanish_to_finnish.kids!.score
			);
			
			// Practice counts should be separate
			expect(wordData.spanish_to_finnish.basic!.practiceCount).toBe(1);
			expect(wordData.spanish_to_finnish.kids!.practiceCount).toBe(1);
		});

		it('should default to basic mode when mode not specified', () => {
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'first_try');
			
			const data = get(wordKnowledge);
			const wordData = data.words['hola'];
			
			expect(wordData.spanish_to_finnish.basic).toBeDefined();
			expect(wordData.spanish_to_finnish.kids).toBeUndefined();
		});

		it('should track game counts separately by mode', () => {
			// Record basic game
			wordKnowledge.recordGame('colors', 'spanish_to_finnish', [
				{ spanish: 'rojo', finnish: 'punainen', quality: 'first_try' }
			], 'basic');
			
			// Record kids game
			wordKnowledge.recordGame('animals', 'spanish_to_finnish', [
				{ spanish: 'gato', finnish: 'kissa', quality: 'first_try' }
			], 'kids');
			
			const data = get(wordKnowledge);
			
			expect(data.meta.basicGamesPlayed).toBe(1);
			expect(data.meta.kidsGamesPlayed).toBe(1);
			expect(data.meta.totalGamesPlayed).toBe(2);
		});
	});

	describe('V1 to V2 Migration', () => {
		it('should have V2 data structure', () => {
			// Add some data in the new V2 format
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'first_try', 'basic');
			
			const data = get(wordKnowledge);
			
			// Check version is 2
			expect(data.version).toBe(2);
			
			// Check metadata has new fields
			expect(data.meta).toHaveProperty('basicGamesPlayed');
			expect(data.meta).toHaveProperty('kidsGamesPlayed');
			expect(data.meta).toHaveProperty('totalGamesPlayed');
			
			// Check word data has mode-separated structure
			const wordData = data.words['hola'];
			expect(wordData.spanish_to_finnish).toHaveProperty('basic');
			expect(wordData.spanish_to_finnish.basic).toBeDefined();
			
			// Note: Actual V1->V2 migration is tested in integration/manual testing
			// as it requires module reloading which is difficult in unit tests
		});
	});

	describe('getWordScore', () => {
		it('should return score for specific mode', () => {
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'first_try', 'basic');
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'third_try', 'kids');
			
			const basicScore = wordKnowledge.getWordScore('hola', 'spanish_to_finnish', 'basic');
			const kidsScore = wordKnowledge.getWordScore('hola', 'spanish_to_finnish', 'kids');
			
			expect(basicScore).toBeGreaterThan(kidsScore);
		});

		it('should return 0 for non-existent word', () => {
			const score = wordKnowledge.getWordScore('nonexistent', 'spanish_to_finnish', 'basic');
			expect(score).toBe(0);
		});

		it('should return 0 for non-existent mode', () => {
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'first_try', 'basic');
			const score = wordKnowledge.getWordScore('hola', 'spanish_to_finnish', 'kids');
			expect(score).toBe(0);
		});
	});

	describe('getCategoryKnowledge', () => {
		it('should calculate category knowledge for specific mode', () => {
			// Add words in basic mode
			wordKnowledge.recordAnswer('rojo', 'punainen', 'spanish_to_finnish', 'first_try', 'basic');
			wordKnowledge.recordAnswer('azul', 'sininen', 'spanish_to_finnish', 'first_try', 'basic');
			
			// Add words in kids mode
			wordKnowledge.recordAnswer('rojo', 'punainen', 'spanish_to_finnish', 'third_try', 'kids');
			
			const categoryWords = [
				{ spanish: 'rojo' },
				{ spanish: 'azul' },
				{ spanish: 'verde' }
			];
			
			const basicKnowledge = wordKnowledge.getCategoryKnowledge('colors', categoryWords, 'basic');
			const kidsKnowledge = wordKnowledge.getCategoryKnowledge('colors', categoryWords, 'kids');
			
			expect(basicKnowledge.practicedWords).toBe(2);
			expect(kidsKnowledge.practicedWords).toBe(1);
			
			expect(basicKnowledge.combinedScore).toBeGreaterThan(kidsKnowledge.combinedScore);
		});
	});

	describe('getStatistics', () => {
		it('should return statistics for specific mode', () => {
			// Add basic mode data
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'first_try', 'basic');
			wordKnowledge.recordAnswer('adios', 'näkemiin', 'spanish_to_finnish', 'first_try', 'basic');
			wordKnowledge.recordGame('greetings', 'spanish_to_finnish', [
				{ spanish: 'hola', finnish: 'hei', quality: 'first_try' }
			], 'basic');
			
			// Add kids mode data
			wordKnowledge.recordAnswer('gato', 'kissa', 'spanish_to_finnish', 'second_try', 'kids');
			wordKnowledge.recordGame('animals', 'spanish_to_finnish', [
				{ spanish: 'gato', finnish: 'kissa', quality: 'second_try' }
			], 'kids');
			
			const basicStats = wordKnowledge.getStatistics('basic');
			const kidsStats = wordKnowledge.getStatistics('kids');
			const allStats = wordKnowledge.getStatistics();
			
			expect(basicStats.totalWordsLearned).toBe(2);
			expect(kidsStats.totalWordsLearned).toBe(1);
			expect(allStats.totalWordsLearned).toBe(3);
			
			expect(basicStats.totalGamesPlayed).toBe(1);
			expect(kidsStats.totalGamesPlayed).toBe(1);
			expect(allStats.totalGamesPlayed).toBe(2);
		});
	});

	describe('exportData', () => {
		it('should export only specified mode data', () => {
			// Add data to both modes
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'first_try', 'basic');
			wordKnowledge.recordAnswer('gato', 'kissa', 'spanish_to_finnish', 'second_try', 'kids');
			
			const basicExport = JSON.parse(wordKnowledge.exportData('basic'));
			const kidsExport = JSON.parse(wordKnowledge.exportData('kids'));
			
			// Basic export should only have basic mode data
			expect(basicExport.words['hola'].spanish_to_finnish.basic).toBeDefined();
			expect(basicExport.words['hola'].spanish_to_finnish.kids).toBeUndefined();
			expect(basicExport.words['gato']).toBeUndefined();
			
			// Kids export should only have kids mode data
			expect(kidsExport.words['gato'].spanish_to_finnish.kids).toBeDefined();
			expect(kidsExport.words['gato'].spanish_to_finnish.basic).toBeUndefined();
			expect(kidsExport.words['hola']).toBeUndefined();
		});

		it('should export all data when no mode specified', () => {
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'first_try', 'basic');
			wordKnowledge.recordAnswer('gato', 'kissa', 'spanish_to_finnish', 'second_try', 'kids');
			
			const fullExport = JSON.parse(wordKnowledge.exportData());
			
			expect(fullExport.words['hola']).toBeDefined();
			expect(fullExport.words['gato']).toBeDefined();
		});
	});

	describe('getWordsForMode', () => {
		it('should return only words practiced in specified mode', () => {
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'first_try', 'basic');
			wordKnowledge.recordAnswer('adios', 'näkemiin', 'spanish_to_finnish', 'first_try', 'basic');
			wordKnowledge.recordAnswer('gato', 'kissa', 'spanish_to_finnish', 'second_try', 'kids');
			
			const basicWords = wordKnowledge.getWordsForMode('basic');
			const kidsWords = wordKnowledge.getWordsForMode('kids');
			
			expect(basicWords).toHaveLength(2);
			expect(basicWords).toContain('hola');
			expect(basicWords).toContain('adios');
			
			expect(kidsWords).toHaveLength(1);
			expect(kidsWords).toContain('gato');
		});
	});

	describe('Backward Compatibility', () => {
		it('should work with existing code that does not specify mode', () => {
			// Existing code calls without mode parameter
			wordKnowledge.recordAnswer('hola', 'hei', 'spanish_to_finnish', 'first_try');
			wordKnowledge.recordGame('greetings', 'spanish_to_finnish', [
				{ spanish: 'hola', finnish: 'hei', quality: 'first_try' }
			]);
			
			const score = wordKnowledge.getWordScore('hola', 'spanish_to_finnish');
			expect(score).toBeGreaterThan(0);
			
			const stats = wordKnowledge.getStatistics();
			expect(stats.totalWordsLearned).toBe(1);
			expect(stats.totalGamesPlayed).toBe(1);
		});
	});
});
