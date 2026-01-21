import { describe, it, expect } from 'vitest';
import { getWordId, createPolysemousId } from './wordId';
import type { Word } from '$lib/data/words';

describe('getWordId', () => {
	it('returns word.id when id is defined', () => {
		const word: Word = {
			id: 'tiempo#time',
			spanish: 'tiempo',
			english: 'time',
			finnish: 'aika',
			category: 'time',
			senseKey: 'time'
		};
		expect(getWordId(word)).toBe('tiempo#time');
	});

	it('returns word.spanish when id is undefined', () => {
		const word: Word = {
			spanish: 'casa',
			english: 'house',
			finnish: 'talo',
			category: 'home'
		};
		expect(getWordId(word)).toBe('casa');
	});

	it('handles polysemous words with different senses', () => {
		const word1: Word = {
			id: 'tiempo#time',
			spanish: 'tiempo',
			english: 'time',
			finnish: 'aika',
			category: 'time',
			senseKey: 'time'
		};
		const word2: Word = {
			id: 'tiempo#weather',
			spanish: 'tiempo',
			english: 'weather',
			finnish: 'sää',
			category: 'weather',
			senseKey: 'weather'
		};
		expect(getWordId(word1)).toBe('tiempo#time');
		expect(getWordId(word2)).toBe('tiempo#weather');
		expect(getWordId(word1)).not.toBe(getWordId(word2));
	});
});

describe('createPolysemousId', () => {
	it('creates ID in correct format', () => {
		expect(createPolysemousId('tiempo', 'time')).toBe('tiempo#time');
		expect(createPolysemousId('tiempo', 'weather')).toBe('tiempo#weather');
	});

	it('handles various sense keys', () => {
		expect(createPolysemousId('banco', 'bank')).toBe('banco#bank');
		expect(createPolysemousId('banco', 'bench')).toBe('banco#bench');
		expect(createPolysemousId('capital', 'finance')).toBe('capital#finance');
		expect(createPolysemousId('capital', 'city')).toBe('capital#city');
	});

	it('preserves exact input strings', () => {
		expect(createPolysemousId('test', 'sense1')).toBe('test#sense1');
		expect(createPolysemousId('palabra', 'meaning-a')).toBe('palabra#meaning-a');
	});
});
