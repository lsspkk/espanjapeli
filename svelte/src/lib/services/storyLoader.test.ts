import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	loadManifest,
	loadStoryById,
	getStoryById,
	getStoryMetadata,
	getStoriesMetadataByDifficulty,
	getStoriesMetadataByLevel,
	clearStoryCache
} from './storyLoader';

// Mock fetch
global.fetch = vi.fn();

const mockManifest = {
	version: '4.0.0',
	lastUpdated: '2026-01-14',
	stories: [
		{
			id: 'test-story-1',
			title: 'Test Story 1',
			titleSpanish: 'Historia de Prueba 1',
			description: 'A test story',
			difficulty: 'beginner' as const,
			level: 'A2',
			category: 'test',
			icon: '📖',
			wordCount: 100,
			estimatedMinutes: 3,
			vocabularyCount: 10,
			questionCount: 5
		},
		{
			id: 'test-story-2',
			title: 'Test Story 2',
			titleSpanish: 'Historia de Prueba 2',
			description: 'Another test story',
			difficulty: 'intermediate' as const,
			level: 'B1',
			category: 'test',
			icon: '📚',
			wordCount: 150,
			estimatedMinutes: 4,
			vocabularyCount: 15,
			questionCount: 5
		}
	]
};

const mockStory1 = {
	id: 'test-story-1',
	title: 'Test Story 1',
	titleSpanish: 'Historia de Prueba 1',
	description: 'A test story',
	difficulty: 'beginner' as const,
	category: 'test',
	icon: '📖',
	dialogue: [
		{ speaker: 'A', spanish: 'Hola', finnish: 'Hei' }
	],
	vocabulary: [
		{ spanish: 'hola', finnish: 'hei' }
	],
	questions: [
		{
			id: 'q1',
			question: 'Test question?',
			options: ['A', 'B', 'C', 'D'],
			correctIndex: 0
		}
	]
};

vi.mock('$app/paths', () => ({
	base: ''
}));

describe('storyLoader', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		clearStoryCache();
	});

	describe('loadManifest', () => {
		it('loads and caches manifest', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			const manifest = await loadManifest();
			
			expect(manifest).toEqual(mockManifest);
			expect(fetch).toHaveBeenCalledWith('/stories/manifest.json');
			expect(fetch).toHaveBeenCalledTimes(1);

			// Second call should use cache
			const manifest2 = await loadManifest();
			expect(manifest2).toEqual(mockManifest);
			expect(fetch).toHaveBeenCalledTimes(1);
		});

		it('throws error when manifest fails to load', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 404
			} as Response);

			await expect(loadManifest()).rejects.toThrow('Failed to load manifest: 404');
		});
	});

	describe('loadStoryById', () => {
		it('loads story from correct path', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockStory1
				} as Response);

			const story = await loadStoryById('test-story-1');
			
			expect(story).toEqual(mockStory1);
			expect(fetch).toHaveBeenCalledWith('/stories/manifest.json');
			expect(fetch).toHaveBeenCalledWith('/stories/a2/test-story-1.json');
		});

		it('caches loaded stories', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockStory1
				} as Response);

			const story1 = await loadStoryById('test-story-1');
			const story2 = await loadStoryById('test-story-1');
			
			expect(story1).toEqual(story2);
			expect(fetch).toHaveBeenCalledTimes(2); // manifest + story
		});

		it('returns null for non-existent story', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			const story = await loadStoryById('non-existent');
			
			expect(story).toBeNull();
		});

		it('returns null when story file fails to load', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: false,
					status: 404
				} as Response);

			const story = await loadStoryById('test-story-1');
			
			expect(story).toBeNull();
		});
	});

	describe('getStoryById', () => {
		it('returns story or undefined', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockStory1
				} as Response);

			const story = await getStoryById('test-story-1');
			expect(story).toEqual(mockStory1);

			const missing = await getStoryById('non-existent');
			expect(missing).toBeUndefined();
		});
	});

	describe('getStoryMetadata', () => {
		it('returns all story metadata', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			const metadata = await getStoryMetadata();
			
			expect(metadata).toEqual(mockManifest.stories);
			expect(metadata).toHaveLength(2);
		});
	});

	describe('getStoriesMetadataByDifficulty', () => {
		it('filters stories by difficulty', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			const beginnerStories = await getStoriesMetadataByDifficulty('beginner');
			
			expect(beginnerStories).toHaveLength(1);
			expect(beginnerStories[0].id).toBe('test-story-1');
		});
	});

	describe('getStoriesMetadataByLevel', () => {
		it('filters stories by CEFR level', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			const a2Stories = await getStoriesMetadataByLevel('A2');
			
			expect(a2Stories).toHaveLength(1);
			expect(a2Stories[0].id).toBe('test-story-1');
			expect(a2Stories[0].level).toBe('A2');
		});
	});

	describe('clearStoryCache', () => {
		it('clears cached data', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => mockManifest
			} as Response);

			await loadManifest();
			expect(fetch).toHaveBeenCalledTimes(1);

			clearStoryCache();

			await loadManifest();
			expect(fetch).toHaveBeenCalledTimes(2);
		});
	});
});
