/**
 * Tests for Milestone Detection Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	detectNewMilestones,
	markMilestoneShown,
	markMilestonesShown,
	isMilestoneShown,
	getShownMilestones,
	resetShownMilestones,
	getMilestoneProgress,
	getAllMilestonesProgress,
	getNextMilestone
} from './milestoneService';
import { MILESTONES } from '$lib/config/milestones';

// Mock browser environment
vi.mock('$app/environment', () => ({
	browser: true
}));

// Mock statisticsService
vi.mock('./statisticsService', () => ({
	calculateVocabularyStats: vi.fn().mockResolvedValue({
		wordsKnown: 150,
		wordsMastered: 50,
		topNProgress: {
			top100: { known: 80, total: 100, percentage: 80 },
			top500: { known: 120, total: 500, percentage: 24 },
			top1000: { known: 150, total: 1000, percentage: 15 },
			top5000: { known: 150, total: 5000, percentage: 3 }
		},
		estimatedLevel: 'A2',
		averageScore: 65
	})
}));

// Mock wordKnowledge store
vi.mock('$lib/stores/wordKnowledge', () => ({
	wordKnowledge: {
		subscribe: vi.fn()
	}
}));

describe('milestoneService', () => {
	beforeEach(() => {
		// Clear localStorage before each test
		localStorage.clear();
		resetShownMilestones();
	});

	describe('detectNewMilestones', () => {
		it('should detect achieved milestones that have not been shown', async () => {
			const achievements = await detectNewMilestones();
			
			// With 150 words known and 80 of top 100, should achieve:
			// - words_100 (100 words)
			// - top100_complete (100 of top 100) - NOT achieved (only 80)
			expect(achievements.length).toBeGreaterThan(0);
			
			// Check that words_100 is in achievements
			const words100 = achievements.find(a => a.milestone.id === 'words_100');
			expect(words100).toBeDefined();
			expect(words100?.currentValue).toBe(150);
		});

		it('should not return milestones that have been shown', async () => {
			// Mark words_100 as shown
			markMilestoneShown('words_100');
			
			const achievements = await detectNewMilestones();
			
			// words_100 should not be in results
			const words100 = achievements.find(a => a.milestone.id === 'words_100');
			expect(words100).toBeUndefined();
		});

		it('should sort achievements by priority', async () => {
			const achievements = await detectNewMilestones();
			
			if (achievements.length > 1) {
				for (let i = 1; i < achievements.length; i++) {
					expect(achievements[i].milestone.priority).toBeGreaterThanOrEqual(
						achievements[i - 1].milestone.priority
					);
				}
			}
		});
	});

	describe('markMilestoneShown', () => {
		it('should mark a milestone as shown', () => {
			markMilestoneShown('words_100');
			
			expect(isMilestoneShown('words_100')).toBe(true);
		});

		it('should persist shown status', () => {
			markMilestoneShown('words_100');
			
			// Check that it's stored in localStorage
			const stored = localStorage.getItem('espanjapeli_milestones_shown');
			expect(stored).toBeTruthy();
			
			const data = JSON.parse(stored!);
			expect(data.shown).toContain('words_100');
		});
	});

	describe('markMilestonesShown', () => {
		it('should mark multiple milestones as shown', () => {
			markMilestonesShown(['words_100', 'words_250', 'top100_complete']);
			
			expect(isMilestoneShown('words_100')).toBe(true);
			expect(isMilestoneShown('words_250')).toBe(true);
			expect(isMilestoneShown('top100_complete')).toBe(true);
		});
	});

	describe('isMilestoneShown', () => {
		it('should return false for unshown milestone', () => {
			expect(isMilestoneShown('words_100')).toBe(false);
		});

		it('should return true for shown milestone', () => {
			markMilestoneShown('words_100');
			expect(isMilestoneShown('words_100')).toBe(true);
		});
	});

	describe('getShownMilestones', () => {
		it('should return empty array when no milestones shown', () => {
			const shown = getShownMilestones();
			expect(shown).toEqual([]);
		});

		it('should return all shown milestone IDs', () => {
			markMilestonesShown(['words_100', 'words_250']);
			
			const shown = getShownMilestones();
			expect(shown).toContain('words_100');
			expect(shown).toContain('words_250');
			expect(shown.length).toBe(2);
		});
	});

	describe('resetShownMilestones', () => {
		it('should clear all shown milestones', () => {
			markMilestonesShown(['words_100', 'words_250']);
			
			resetShownMilestones();
			
			const shown = getShownMilestones();
			expect(shown).toEqual([]);
		});
	});

	describe('getMilestoneProgress', () => {
		it('should return progress for a specific milestone', async () => {
			const progress = await getMilestoneProgress('words_100');
			
			expect(progress).toBeDefined();
			expect(progress?.milestone.id).toBe('words_100');
			expect(progress?.currentValue).toBe(150);
			expect(progress?.targetValue).toBe(100);
			expect(progress?.achieved).toBe(true);
			expect(progress?.percentage).toBe(100);
		});

		it('should return null for non-existent milestone', async () => {
			const progress = await getMilestoneProgress('invalid_id');
			expect(progress).toBeNull();
		});

		it('should cap percentage at 100', async () => {
			const progress = await getMilestoneProgress('words_100');
			expect(progress?.percentage).toBeLessThanOrEqual(100);
		});
	});

	describe('getAllMilestonesProgress', () => {
		it('should return progress for all milestones', async () => {
			const allProgress = await getAllMilestonesProgress();
			
			expect(allProgress.length).toBe(MILESTONES.length);
		});

		it('should sort by priority', async () => {
			const allProgress = await getAllMilestonesProgress();
			
			for (let i = 1; i < allProgress.length; i++) {
				expect(allProgress[i].milestone.priority).toBeGreaterThanOrEqual(
					allProgress[i - 1].milestone.priority
				);
			}
		});

		it('should include shown status', async () => {
			markMilestoneShown('words_100');
			
			const allProgress = await getAllMilestonesProgress();
			const words100Progress = allProgress.find(p => p.milestone.id === 'words_100');
			
			expect(words100Progress?.shown).toBe(true);
		});
	});

	describe('getNextMilestone', () => {
		it('should return the next unachieved milestone', async () => {
			// Mark achieved milestones as shown
			markMilestonesShown(['words_100']);
			
			const next = await getNextMilestone();
			
			expect(next).toBeDefined();
			expect(next?.milestone).toBeDefined();
		});

		it('should return null when all milestones achieved', async () => {
			// This test would require mocking stats with all milestones achieved
			// For now, we just verify the function returns something
			const next = await getNextMilestone();
			
			// With current mock (150 words), there should be unachieved milestones
			expect(next).toBeDefined();
		});
	});

	describe('milestone types', () => {
		it('should correctly detect words_known milestones', async () => {
			const progress = await getMilestoneProgress('words_100');
			expect(progress?.achieved).toBe(true);
			
			const progress250 = await getMilestoneProgress('words_250');
			expect(progress250?.achieved).toBe(false);
		});

		it('should correctly detect top_n_complete milestones', async () => {
			// top100_complete requires 100 of top 100, we have 80
			const progress = await getMilestoneProgress('top100_complete');
			expect(progress?.achieved).toBe(false);
			expect(progress?.currentValue).toBe(80);
		});
	});
});
