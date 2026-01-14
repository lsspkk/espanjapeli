/**
 * Tests for vocabularyService.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCEFRDescription } from './vocabularyService';

// Note: Most functions in vocabularyService are async and depend on fetch/browser
// We test the synchronous utility functions directly

describe('vocabularyService', () => {
	describe('getCEFRDescription', () => {
		it('returns correct description for A1', () => {
			expect(getCEFRDescription('A1')).toBe('Alkeet');
		});

		it('returns correct description for A2', () => {
			expect(getCEFRDescription('A2')).toBe('Beginner');
		});

		it('returns correct description for B1', () => {
			expect(getCEFRDescription('B1')).toBe('Intermediate');
		});

		it('returns correct description for B2', () => {
			expect(getCEFRDescription('B2')).toBe('Upper Intermediate');
		});

		it('returns correct description for C1', () => {
			expect(getCEFRDescription('C1')).toBe('Advanced');
		});

		it('returns correct description for C2', () => {
			expect(getCEFRDescription('C2')).toBe('Proficient');
		});

		it('returns input for unknown level', () => {
			expect(getCEFRDescription('X1')).toBe('X1');
		});
	});
});

// Integration tests would need to mock fetch and browser environment
// These are better suited for integration test files with proper setup
