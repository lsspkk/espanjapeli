import { describe, it, expect } from 'vitest';
import { shuffleArray, spreadOutDuplicates } from './array';

describe('shuffleArray', () => {
	it('returns array of same length', () => {
		const arr = [1, 2, 3, 4, 5];
		expect(shuffleArray(arr)).toHaveLength(5);
	});

	it('contains all original elements', () => {
		const arr = [1, 2, 3, 4, 5];
		const shuffled = shuffleArray(arr);
		expect(shuffled.sort()).toEqual([1, 2, 3, 4, 5]);
	});

	it('does not modify original array', () => {
		const arr = [1, 2, 3];
		const original = [...arr];
		shuffleArray(arr);
		expect(arr).toEqual(original);
	});

	it('handles empty array', () => {
		expect(shuffleArray([])).toEqual([]);
	});

	it('handles single element array', () => {
		expect(shuffleArray([1])).toEqual([1]);
	});

	it('shuffles array with objects', () => {
		const arr = [
			{ id: 1, name: 'a' },
			{ id: 2, name: 'b' },
			{ id: 3, name: 'c' }
		];
		const shuffled = shuffleArray(arr);
		expect(shuffled).toHaveLength(3);
		expect(shuffled).toContainEqual({ id: 1, name: 'a' });
		expect(shuffled).toContainEqual({ id: 2, name: 'b' });
		expect(shuffled).toContainEqual({ id: 3, name: 'c' });
	});
});

describe('spreadOutDuplicates', () => {
	it('spreads out duplicate words with default distance', () => {
		const words = [
			{ spanish: 'hola', finnish: 'hei' },
			{ spanish: 'hola', finnish: 'hei' },
			{ spanish: 'adios', finnish: 'näkemiin' },
			{ spanish: 'casa', finnish: 'talo' },
			{ spanish: 'perro', finnish: 'koira' },
			{ spanish: 'gato', finnish: 'kissa' },
			{ spanish: 'agua', finnish: 'vesi' },
			{ spanish: 'libro', finnish: 'kirja' }
		];
		const result = spreadOutDuplicates(words);
		
		const holaPositions: number[] = [];
		result.forEach((word, index) => {
			if (word.spanish === 'hola') {
				holaPositions.push(index);
			}
		});
		
		if (holaPositions.length === 2) {
			expect(Math.abs(holaPositions[1] - holaPositions[0])).toBeGreaterThanOrEqual(5);
		}
	});

	it('respects custom minDistance parameter', () => {
		const words = [
			{ spanish: 'casa', finnish: 'talo' },
			{ spanish: 'casa', finnish: 'talo' },
			{ spanish: 'perro', finnish: 'koira' },
			{ spanish: 'gato', finnish: 'kissa' }
		];
		const minDistance = 2;
		const result = spreadOutDuplicates(words, minDistance);
		
		const casaPositions: number[] = [];
		result.forEach((word, index) => {
			if (word.spanish === 'casa') {
				casaPositions.push(index);
			}
		});
		
		if (casaPositions.length === 2) {
			expect(Math.abs(casaPositions[1] - casaPositions[0])).toBeGreaterThanOrEqual(minDistance);
		}
	});

	it('does not modify array without duplicates', () => {
		const words = [
			{ spanish: 'uno', finnish: 'yksi' },
			{ spanish: 'dos', finnish: 'kaksi' },
			{ spanish: 'tres', finnish: 'kolme' }
		];
		const result = spreadOutDuplicates(words);
		expect(result).toHaveLength(3);
		expect(result.map(w => w.spanish)).toEqual(['uno', 'dos', 'tres']);
	});

	it('handles array with all same words', () => {
		const words = [
			{ spanish: 'hola', finnish: 'hei' },
			{ spanish: 'hola', finnish: 'hei' },
			{ spanish: 'hola', finnish: 'hei' }
		];
		const result = spreadOutDuplicates(words);
		expect(result).toHaveLength(3);
		expect(result.every(w => w.spanish === 'hola')).toBe(true);
	});

	it('does not modify original array', () => {
		const words = [
			{ spanish: 'hola', finnish: 'hei' },
			{ spanish: 'hola', finnish: 'hei' }
		];
		const original = [...words];
		spreadOutDuplicates(words);
		expect(words).toEqual(original);
	});

	it('handles empty array', () => {
		expect(spreadOutDuplicates([])).toEqual([]);
	});

	it('handles single element array', () => {
		const words = [{ spanish: 'hola', finnish: 'hei' }];
		expect(spreadOutDuplicates(words)).toEqual(words);
	});

	it('maintains all original elements', () => {
		const words = [
			{ spanish: 'a', finnish: 'a1' },
			{ spanish: 'b', finnish: 'b1' },
			{ spanish: 'a', finnish: 'a2' },
			{ spanish: 'c', finnish: 'c1' }
		];
		const result = spreadOutDuplicates(words);
		expect(result).toHaveLength(4);
		expect(result.filter(w => w.spanish === 'a')).toHaveLength(2);
		expect(result.filter(w => w.spanish === 'b')).toHaveLength(1);
		expect(result.filter(w => w.spanish === 'c')).toHaveLength(1);
	});
});
