import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAllTips, generateTip, getPointsForTips, getTipDifficultyName } from './tipService';

// Mock fetch
global.fetch = vi.fn();

describe('tipService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getAllTips', () => {
		it('should return tips in order of decreasing difficulty', async () => {
			// Mock successful fetch
			const mockData = {
				test_category: {
					name: 'Test Category',
					words: [
						{
							spanish: 'perro',
							english: 'dog',
							finnish: 'koira',
							learningTips: [
								{
									language: 'finnish',
									difficulty: 'hard',
									text: 'Nelijalkainen eläin',
									tipModel: 'gpt-4'
								},
								{
									language: 'finnish',
									difficulty: 'medium',
									text: 'Yleinen lemmikkieläin',
									tipModel: 'gpt-4'
								},
								{
									language: 'finnish',
									difficulty: 'easy',
									text: 'Haukkuva eläin',
									tipModel: 'gpt-4'
								}
							]
						}
					]
				}
			};

			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => mockData
			});

			const tips = await getAllTips('koira', 'perro');

			expect(tips).toHaveLength(3);
			expect(tips[0].difficulty).toBe('Vaikea');
			expect(tips[0].text).toBe('Nelijalkainen eläin');
			expect(tips[0].fromCache).toBe(true);
			expect(tips[1].difficulty).toBe('Keskivaikea');
			expect(tips[2].difficulty).toBe('Helppo');
		});

		it('should return fallback tips when word not found', async () => {
			const mockData = {
				test_category: {
					name: 'Test Category',
					words: []
				}
			};

			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => mockData
			});

			const tips = await getAllTips('unknown');

			expect(tips).toHaveLength(3);
			expect(tips[0].fromCache).toBe(false);
			// Fallback tips are in Finnish
			expect(tips[0].text).toContain('Se alkaa');
			expect(tips[1].text).toContain('Sana alkaa');
			expect(tips[2].text).toContain('Sana alkaa näin');
		});

		it('should handle fetch errors gracefully', async () => {
			(global.fetch as any).mockRejectedValue(new Error('Network error'));

			const tips = await getAllTips('koira', 'perro');

			// Should still return 3 tips (fallback or cached from previous tests)
			expect(tips).toHaveLength(3);
			expect(tips[0]).toHaveProperty('text');
			expect(tips[0]).toHaveProperty('difficulty');
		});

		it('should handle invalid response status', async () => {
			(global.fetch as any).mockResolvedValue({
				ok: false,
				status: 404
			});

			const tips = await getAllTips('koira', 'perro');

			// Should still return 3 tips (fallback or cached from previous tests)
			expect(tips).toHaveLength(3);
			expect(tips[0]).toHaveProperty('text');
			expect(tips[0]).toHaveProperty('difficulty');
		});
	});

	describe('generateTip', () => {
		it('should generate tip for given difficulty', async () => {
			const mockData = {
				test_category: {
					name: 'Test Category',
					words: [
						{
							spanish: 'perro',
							english: 'dog',
							finnish: 'koira',
							learningTips: [
								{
									language: 'finnish',
									difficulty: 'hard',
									text: 'Hard tip'
								}
							]
						}
					]
				}
			};

			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => mockData
			});

			const tips = await generateTip('koira', 'Vaikea', 'perro');

			expect(tips).toBeDefined();
			expect(tips[0].difficulty).toBe('Vaikea');
			expect(tips[0].difficultyIndex).toBe(0);
		});

		it('should return cached tips when available', async () => {
			const mockData = {
				test_category: {
					name: 'Test Category',
					words: [
						{
							spanish: 'perro',
							english: 'dog',
							finnish: 'koira',
							learningTips: [
								{ language: 'finnish', difficulty: 'hard', text: 'Hard tip' },
								{ language: 'finnish', difficulty: 'medium', text: 'Medium tip' }
							]
						}
					]
				}
			};

			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => mockData
			});

			const tips = await generateTip('koira', 'Keskivaikea', 'perro');

			expect(tips).toBeDefined();
			expect(tips[0].difficulty).toBe('Keskivaikea');
			expect(tips[0].fromCache).toBe(true);
		});

		it('should return fallback tips when no cached tips available', async () => {
			const mockData = {
				test_category: {
					name: 'Test Category',
					words: [
						{
							spanish: 'perro',
							english: 'dog',
							finnish: 'koira',
							learningTips: []
						}
					]
				}
			};

			(global.fetch as any).mockResolvedValue({
				ok: true,
				json: async () => mockData
			});

			const tips = await generateTip('unknown', 'Helppo');

			expect(tips[0].fromCache).toBe(false);
			// Fallback tips are in Finnish
			expect(tips[0].text).toContain('Sana alkaa näin');
		});
	});
});
