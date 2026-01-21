import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	loadLessonIndex,
	loadLesson,
	getLessonsByCategory,
	getLessonCategories,
	getLessonMetadata,
	clearLessonCache,
	type LessonManifest,
	type Lesson
} from './lessonService';

// Mock $app/paths
vi.mock('$app/paths', () => ({
	base: ''
}));

// Mock fetch
global.fetch = vi.fn();

const mockManifest: LessonManifest = {
	lessons: [
		{
			id: 'verbs-1',
			category: 'verbs',
			categoryName: 'Verbit',
			tier: 1,
			wordCount: 15,
			phraseCount: 45,
			filename: 'verbs-1.json'
		},
		{
			id: 'verbs-2',
			category: 'verbs',
			categoryName: 'Verbit',
			tier: 2,
			wordCount: 10,
			phraseCount: 30,
			filename: 'verbs-2.json'
		},
		{
			id: 'food',
			category: 'food',
			categoryName: 'Ruoka',
			tier: 1,
			wordCount: 12,
			phraseCount: 36,
			filename: 'food.json'
		}
	]
};

const mockVerbs1Lesson: Lesson = {
	id: 'verbs-1',
	category: 'verbs',
	categoryName: 'Verbit',
	tier: 1,
	words: ['ser', 'estar', 'tener', 'hacer', 'ir'],
	phrases: ['1', '2', '3', '4', '5']
};

const mockVerbs2Lesson: Lesson = {
	id: 'verbs-2',
	category: 'verbs',
	categoryName: 'Verbit',
	tier: 2,
	words: ['venir', 'ver', 'decir', 'dar', 'saber'],
	phrases: ['6', '7', '8', '9', '10']
};

const mockFoodLesson: Lesson = {
	id: 'food',
	category: 'food',
	categoryName: 'Ruoka',
	tier: 1,
	words: ['pan', 'agua', 'leche', 'carne', 'pescado'],
	phrases: ['11', '12', '13', '14', '15']
};

describe('lessonService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		clearLessonCache();
	});

	describe('loadLessonIndex', () => {
		it('loads and caches manifest', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			const manifest = await loadLessonIndex();

			expect(manifest).toEqual(mockManifest);
			expect(fetch).toHaveBeenCalledWith('/lessons/index.json');
			expect(fetch).toHaveBeenCalledTimes(1);

			// Second call should use cache
			const manifest2 = await loadLessonIndex();
			expect(manifest2).toEqual(mockManifest);
			expect(fetch).toHaveBeenCalledTimes(1);
		});

		it('throws error when index fails to load', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 404
			} as Response);

			await expect(loadLessonIndex()).rejects.toThrow('Failed to load lesson index: 404');
		});
	});

	describe('loadLesson', () => {
		it('loads lesson from correct path', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockVerbs1Lesson
				} as Response);

			const lesson = await loadLesson('verbs-1');

			expect(lesson).toEqual(mockVerbs1Lesson);
			expect(fetch).toHaveBeenCalledWith('/lessons/index.json');
			expect(fetch).toHaveBeenCalledWith('/lessons/verbs-1.json');
		});

		it('caches loaded lessons', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockVerbs1Lesson
				} as Response);

			const lesson1 = await loadLesson('verbs-1');
			const lesson2 = await loadLesson('verbs-1');

			expect(lesson1).toEqual(lesson2);
			expect(fetch).toHaveBeenCalledTimes(2); // manifest + lesson
		});

		it('throws error for non-existent lesson', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			await expect(loadLesson('non-existent')).rejects.toThrow(
				'Lesson not found in manifest: non-existent'
			);
		});

		it('throws error when lesson file fails to load', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: false,
					status: 404
				} as Response);

			await expect(loadLesson('verbs-1')).rejects.toThrow('Failed to load lesson: 404');
		});
	});

	describe('getLessonsByCategory', () => {
		it('loads all lessons for a category', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockVerbs1Lesson
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockVerbs2Lesson
				} as Response);

			const lessons = await getLessonsByCategory('verbs');

			expect(lessons).toHaveLength(2);
			expect(lessons[0]).toEqual(mockVerbs1Lesson);
			expect(lessons[1]).toEqual(mockVerbs2Lesson);
		});

		it('returns empty array for non-existent category', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			const lessons = await getLessonsByCategory('non-existent');

			expect(lessons).toEqual([]);
		});

		it('loads single lesson for single-tier category', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockManifest
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockFoodLesson
				} as Response);

			const lessons = await getLessonsByCategory('food');

			expect(lessons).toHaveLength(1);
			expect(lessons[0]).toEqual(mockFoodLesson);
		});
	});

	describe('getLessonCategories', () => {
		it('returns all unique categories sorted', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			const categories = await getLessonCategories();

			expect(categories).toEqual(['food', 'verbs']);
			expect(categories).toHaveLength(2);
		});
	});

	describe('getLessonMetadata', () => {
		it('returns all lesson metadata', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockManifest
			} as Response);

			const metadata = await getLessonMetadata();

			expect(metadata).toEqual(mockManifest.lessons);
			expect(metadata).toHaveLength(3);
		});
	});

	describe('clearLessonCache', () => {
		it('clears cached data', async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => mockManifest
			} as Response);

			await loadLessonIndex();
			expect(fetch).toHaveBeenCalledTimes(1);

			clearLessonCache();

			await loadLessonIndex();
			expect(fetch).toHaveBeenCalledTimes(2);
		});
	});
});
