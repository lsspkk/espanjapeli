import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	loadSentenceIndex,
	loadSentenceGroup,
	getSentencesByTheme,
	getSentencesByLevel,
	clearSentenceCache,
	type SentenceGroupManifest,
	type Sentence
} from './sentenceLoader';

// Mock $app/paths
vi.mock('$app/paths', () => ({
	base: ''
}));

// Mock fetch
global.fetch = vi.fn();

const mockManifest: SentenceGroupManifest = {
	categories: [
		{
			id: 'greetings',
			name: 'greetings',
			count: 2,
			filename: 'greetings.json'
		},
		{
			id: 'food',
			name: 'food',
			count: 2,
			filename: 'food.json'
		},
		{
			id: 'general-1',
			name: 'general',
			part: 1,
			count: 2,
			filename: 'general-1.json'
		},
		{
			id: 'general-2',
			name: 'general',
			part: 2,
			count: 2,
			filename: 'general-2.json'
		}
	]
};

const mockGreetingsSentences: Sentence[] = [
	{
		id: '1',
		spanish: 'Hola',
		finnish: 'Hei',
		english: 'Hello',
		wordCount: 1,
		themes: ['greetings']
	},
	{
		id: '2',
		spanish: 'Buenos días',
		finnish: 'Hyvää huomenta',
		english: 'Good morning',
		wordCount: 2,
		themes: ['greetings']
	}
];

const mockFoodSentences: Sentence[] = [
	{
		id: '3',
		spanish: 'Me gusta la pizza',
		finnish: 'Pidän pizzasta',
		english: 'I like pizza',
		wordCount: 4,
		themes: ['food']
	},
	{
		id: '4',
		spanish: 'Quiero comer una manzana',
		finnish: 'Haluan syödä omenan',
		english: 'I want to eat an apple',
		wordCount: 5,
		themes: ['food']
	}
];

const mockGeneral1Sentences: Sentence[] = [
	{
		id: '5',
		spanish: 'Esto es una prueba muy larga con muchas palabras',
		finnish: 'Tämä on pitkä testi monilla sanoilla',
		english: 'This is a long test with many words',
		wordCount: 9,
		themes: ['general']
	}
];

const mockGeneral2Sentences: Sentence[] = [
	{
		id: '6',
		spanish: 'Otra oración',
		finnish: 'Toinen lause',
		english: 'Another sentence',
		wordCount: 2,
		themes: ['general']
	}
];

describe('sentenceLoader', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		clearSentenceCache();
	});

	describe('loadSentenceIndex', () => {
		it('loads and caches manifest', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			const manifest = await loadSentenceIndex();

			expect(manifest).toEqual(mockManifest);
			expect(fetch).toHaveBeenCalledWith('/sentences/index.json');
			expect(fetch).toHaveBeenCalledTimes(1);

			// Second call should use cache
			const manifest2 = await loadSentenceIndex();
			expect(manifest2).toEqual(mockManifest);
			expect(fetch).toHaveBeenCalledTimes(1);
		});

		it('throws error when index fails to load', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 404
			} as Response);

			await expect(loadSentenceIndex()).rejects.toThrow('Failed to load sentence index: 404');
		});
	});

	describe('loadSentenceGroup', () => {
		it('loads sentence group from correct path', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGreetingsSentences
				} as Response);

			const group = await loadSentenceGroup('greetings');

			expect(group.theme).toBe('greetings');
			expect(group.sentences).toEqual(mockGreetingsSentences);
			expect(fetch).toHaveBeenCalledWith('/sentences/index.json');
			expect(fetch).toHaveBeenCalledWith('/sentences/greetings.json');
		});

		it('caches loaded sentence groups', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGreetingsSentences
				} as Response);

			const group1 = await loadSentenceGroup('greetings');
			const group2 = await loadSentenceGroup('greetings');

			expect(group1).toEqual(group2);
			expect(fetch).toHaveBeenCalledTimes(2); // manifest + sentences
		});

		it('throws error for non-existent group', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			await expect(loadSentenceGroup('non-existent')).rejects.toThrow(
				'Sentence group not found in manifest: non-existent'
			);
		});

		it('handles multi-part groups (general-1)', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGeneral1Sentences
				} as Response);

			const group = await loadSentenceGroup('general-1');

			expect(group.theme).toBe('general');
			expect(group.sentences).toEqual(mockGeneral1Sentences);
		});
	});

	describe('getSentencesByTheme', () => {
		it('loads all sentences for a theme', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGreetingsSentences
				} as Response);

			const sentences = await getSentencesByTheme('greetings');

			expect(sentences).toEqual(mockGreetingsSentences);
		});

		it('loads all parts of a multi-part theme', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGeneral1Sentences
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGeneral2Sentences
				} as Response);

			const sentences = await getSentencesByTheme('general');

			expect(sentences).toHaveLength(2);
			expect(sentences).toEqual([...mockGeneral1Sentences, ...mockGeneral2Sentences]);
		});

		it('returns empty array for non-existent theme', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			const sentences = await getSentencesByTheme('non-existent');

			expect(sentences).toEqual([]);
		});
	});

	describe('getSentencesByLevel', () => {
		it('filters sentences by word count for A1 level', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGreetingsSentences
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockFoodSentences
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGeneral1Sentences
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGeneral2Sentences
				} as Response);

			const sentences = await getSentencesByLevel('A1');

			// A1 max word count is 6, so should include sentences with 1-6 words
			expect(sentences.every((s) => s.wordCount <= 6)).toBe(true);
			expect(sentences.length).toBeGreaterThan(0);
		});

		it('filters sentences by word count for B1 level', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGreetingsSentences
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockFoodSentences
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGeneral1Sentences
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockGeneral2Sentences
				} as Response);

			const sentences = await getSentencesByLevel('B1');

			// B1 max word count is 10, so should include all test sentences
			expect(sentences.every((s) => s.wordCount <= 10)).toBe(true);
		});
	});

	describe('clearSentenceCache', () => {
		it('clears cached data', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => mockManifest
			} as Response);

			await loadSentenceIndex();
			expect(fetch).toHaveBeenCalledTimes(1);

			clearSentenceCache();

			await loadSentenceIndex();
			expect(fetch).toHaveBeenCalledTimes(2);
		});
	});
});
