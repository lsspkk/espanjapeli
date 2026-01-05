import { describe, it, expect } from 'vitest';
import { checkAnswer, isCorrect } from './answerChecker';

describe('answerChecker', () => {
	describe('checkAnswer', () => {
		it('should return exact match for identical answers', () => {
			const result = checkAnswer('koira', 'koira');
			expect(result).toEqual({ isCorrect: true, matchType: 'exact' });
		});

		it('should normalize case and whitespace', () => {
			const result = checkAnswer('  KOIRA  ', 'koira');
			expect(result).toEqual({ isCorrect: true, matchType: 'exact' });
		});

		it('should return empty for empty user answer', () => {
			const result = checkAnswer('', 'koira');
			expect(result).toEqual({ isCorrect: false, matchType: 'empty' });
		});

		it('should return empty for whitespace-only answer', () => {
			const result = checkAnswer('   ', 'koira');
			expect(result).toEqual({ isCorrect: false, matchType: 'empty' });
		});

		describe('declension matching', () => {
			it('should accept user answer with up to 2 extra letters', () => {
				// User types more letters (Finnish declension)
				expect(checkAnswer('koiraa', 'koira').matchType).toBe('declension');
				expect(checkAnswer('koira', 'koiraa').matchType).toBe('declension');
				// 'talossa' has 3 extra letters, so it will be typo match (1 char diff from 'talos')
				expect(checkAnswer('talos', 'talo').matchType).toBe('declension');
			});

			it('should reject answer with more than 2 extra letters', () => {
				const result = checkAnswer('koiraaan', 'koira');
				expect(result.isCorrect).toBe(false);
				expect(result.matchType).toBe('wrong');
			});

			it('should require same prefix for declension match', () => {
				const result = checkAnswer('kissa', 'koira');
				expect(result.isCorrect).toBe(false);
			});
		});

		describe('typo tolerance', () => {
			it('should accept one letter difference', () => {
				// One letter off
				expect(checkAnswer('koita', 'koira').matchType).toBe('typo');
				expect(checkAnswer('kissa', 'kisso').matchType).toBe('typo');
			});

			it('should reject if user answer is a different valid word', () => {
				const allWords = ['me', 'te', 'he'];
				const result = checkAnswer('te', 'me', allWords);
				expect(result).toEqual({ isCorrect: false, matchType: 'different-word' });
			});

			it('should accept typo if user answer is not a valid word', () => {
				const allWords = ['me', 'te', 'he'];
				const result = checkAnswer('ma', 'me', allWords);
				expect(result).toEqual({ isCorrect: true, matchType: 'typo' });
			});

			it('should reject answers with multiple typos', () => {
				// 'koina' -> 'koira' is actually 1 edit (substitute 'n' with 'r'), so use a different example
				const result = checkAnswer('koine', 'koira'); // 2 differences
				expect(result.isCorrect).toBe(false);
			});
		});

		describe('wrong answers', () => {
			it('should reject completely different words', () => {
				const result = checkAnswer('kissa', 'koira');
				expect(result).toEqual({ isCorrect: false, matchType: 'wrong' });
			});

			it('should reject answers with wrong length', () => {
				const result = checkAnswer('k', 'koira');
				expect(result.isCorrect).toBe(false);
			});
		});
	});

	describe('isCorrect', () => {
		it('should return true for correct answers', () => {
			expect(isCorrect('koira', 'koira')).toBe(true);
			expect(isCorrect('KOIRA', 'koira')).toBe(true);
			expect(isCorrect('koiraa', 'koira')).toBe(true); // declension
			expect(isCorrect('koita', 'koira')).toBe(true); // typo
		});

		it('should return false for incorrect answers', () => {
			expect(isCorrect('', 'koira')).toBe(false);
			expect(isCorrect('kissa', 'koira')).toBe(false);
		});

		it('should respect word database for different words', () => {
			const allWords = ['me', 'te', 'he'];
			expect(isCorrect('te', 'me', allWords)).toBe(false); // different valid word
			expect(isCorrect('ma', 'me', allWords)).toBe(true); // typo, not valid word
		});
	});
});
