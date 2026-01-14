import { describe, it, expect } from 'vitest';
import {
	MILESTONES,
	getMilestoneById,
	getMilestonesByType,
	getMilestonesByPriority,
	getNextMilestone,
	type Milestone
} from './milestones';

describe('milestones', () => {
	describe('MILESTONES constant', () => {
		it('should have at least 10 milestones defined', () => {
			expect(MILESTONES.length).toBeGreaterThanOrEqual(10);
		});

		it('should have unique IDs', () => {
			const ids = MILESTONES.map(m => m.id);
			const uniqueIds = new Set(ids);
			expect(uniqueIds.size).toBe(ids.length);
		});

		it('should have all required fields', () => {
			MILESTONES.forEach(milestone => {
				expect(milestone.id).toBeTruthy();
				expect(milestone.type).toBeTruthy();
				expect(milestone.title).toBeTruthy();
				expect(milestone.description).toBeTruthy();
				expect(milestone.icon).toBeTruthy();
				expect(milestone.target).toBeGreaterThan(0);
				expect(milestone.priority).toBeGreaterThanOrEqual(0);
			});
		});

		it('should have topN field for top_n_complete milestones', () => {
			const topNMilestones = MILESTONES.filter(m => m.type === 'top_n_complete');
			topNMilestones.forEach(milestone => {
				expect(milestone.topN).toBeDefined();
				expect([100, 500, 1000]).toContain(milestone.topN);
			});
		});

		it('should have words_known milestones', () => {
			const wordsKnownMilestones = MILESTONES.filter(m => m.type === 'words_known');
			expect(wordsKnownMilestones.length).toBeGreaterThan(0);
		});

		it('should have stories_read milestones', () => {
			const storiesReadMilestones = MILESTONES.filter(m => m.type === 'stories_read');
			expect(storiesReadMilestones.length).toBeGreaterThan(0);
		});
	});

	describe('getMilestoneById', () => {
		it('should return milestone for valid ID', () => {
			const milestone = getMilestoneById('words_100');
			expect(milestone).toBeDefined();
			expect(milestone?.id).toBe('words_100');
			expect(milestone?.target).toBe(100);
		});

		it('should return undefined for invalid ID', () => {
			const milestone = getMilestoneById('nonexistent');
			expect(milestone).toBeUndefined();
		});
	});

	describe('getMilestonesByType', () => {
		it('should return all words_known milestones', () => {
			const milestones = getMilestonesByType('words_known');
			expect(milestones.length).toBeGreaterThan(0);
			milestones.forEach(m => {
				expect(m.type).toBe('words_known');
			});
		});

		it('should return all top_n_complete milestones', () => {
			const milestones = getMilestonesByType('top_n_complete');
			expect(milestones.length).toBeGreaterThan(0);
			milestones.forEach(m => {
				expect(m.type).toBe('top_n_complete');
				expect(m.topN).toBeDefined();
			});
		});

		it('should return all stories_read milestones', () => {
			const milestones = getMilestonesByType('stories_read');
			expect(milestones.length).toBeGreaterThan(0);
			milestones.forEach(m => {
				expect(m.type).toBe('stories_read');
			});
		});

		it('should return empty array for invalid type', () => {
			const milestones = getMilestonesByType('invalid' as any);
			expect(milestones).toEqual([]);
		});
	});

	describe('getMilestonesByPriority', () => {
		it('should return milestones sorted by priority', () => {
			const milestones = getMilestonesByPriority();
			expect(milestones.length).toBe(MILESTONES.length);
			
			// Check that priorities are in ascending order
			for (let i = 1; i < milestones.length; i++) {
				expect(milestones[i].priority).toBeGreaterThanOrEqual(milestones[i - 1].priority);
			}
		});

		it('should not mutate original MILESTONES array', () => {
			const originalFirst = MILESTONES[0];
			getMilestonesByPriority();
			expect(MILESTONES[0]).toBe(originalFirst);
		});
	});

	describe('getNextMilestone', () => {
		it('should return next words_known milestone', () => {
			const next = getNextMilestone('words_known', 50);
			expect(next).toBeDefined();
			expect(next?.type).toBe('words_known');
			expect(next?.target).toBeGreaterThan(50);
		});

		it('should return 100 words milestone when at 0', () => {
			const next = getNextMilestone('words_known', 0);
			expect(next?.id).toBe('words_100');
			expect(next?.target).toBe(100);
		});

		it('should return 250 words milestone when at 150', () => {
			const next = getNextMilestone('words_known', 150);
			expect(next?.id).toBe('words_250');
			expect(next?.target).toBe(250);
		});

		it('should return null when all milestones achieved', () => {
			const next = getNextMilestone('words_known', 2000);
			expect(next).toBeNull();
		});

		it('should return next top_n_complete milestone for top100', () => {
			const next = getNextMilestone('top_n_complete', 50, 100);
			expect(next).toBeDefined();
			expect(next?.type).toBe('top_n_complete');
			expect(next?.topN).toBe(100);
			expect(next?.target).toBe(100);
		});

		it('should return next top_n_complete milestone for top500', () => {
			const next = getNextMilestone('top_n_complete', 200, 500);
			expect(next).toBeDefined();
			expect(next?.type).toBe('top_n_complete');
			expect(next?.topN).toBe(500);
			expect(next?.target).toBe(500);
		});

		it('should return next stories_read milestone', () => {
			const next = getNextMilestone('stories_read', 3);
			expect(next).toBeDefined();
			expect(next?.type).toBe('stories_read');
			expect(next?.target).toBeGreaterThan(3);
		});

		it('should return 5 stories milestone when at 0', () => {
			const next = getNextMilestone('stories_read', 0);
			expect(next?.id).toBe('stories_5');
			expect(next?.target).toBe(5);
		});

		it('should return 10 stories milestone when at 7', () => {
			const next = getNextMilestone('stories_read', 7);
			expect(next?.id).toBe('stories_10');
			expect(next?.target).toBe(10);
		});

		it('should return null for stories when all achieved', () => {
			const next = getNextMilestone('stories_read', 50);
			expect(next).toBeNull();
		});
	});

	describe('milestone targets', () => {
		it('should have reasonable word count targets', () => {
			const wordsKnownMilestones = getMilestonesByType('words_known');
			const targets = wordsKnownMilestones.map(m => m.target);
			
			// Should include common milestones
			expect(targets).toContain(100);
			expect(targets).toContain(250);
			expect(targets).toContain(500);
		});

		it('should have top N targets matching topN values', () => {
			const topNMilestones = getMilestonesByType('top_n_complete');
			topNMilestones.forEach(milestone => {
				expect(milestone.target).toBe(milestone.topN);
			});
		});

		it('should have reasonable story count targets', () => {
			const storiesMilestones = getMilestonesByType('stories_read');
			const targets = storiesMilestones.map(m => m.target);
			
			// Should include common milestones
			expect(targets).toContain(5);
			expect(targets).toContain(10);
		});
	});
});
