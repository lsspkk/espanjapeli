/**
 * Milestone Detection Service for Espanjapeli V4
 * 
 * Detects when users achieve learning milestones and manages
 * which milestones have been shown to avoid duplicate celebrations.
 * 
 * Key features:
 * - Detect milestone achievements based on current progress
 * - Track which milestones have been shown to user
 * - Persist shown milestones in localStorage
 * - Support for words_known, top_n_complete, and stories_read milestones
 */

import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { wordKnowledge } from '$lib/stores/wordKnowledge';
import { calculateVocabularyStats } from './statisticsService';
import { MILESTONES, type Milestone, type MilestoneType } from '$lib/config/milestones';

const STORAGE_KEY = 'espanjapeli_milestones_shown';

/**
 * Milestone achievement data
 */
export interface MilestoneAchievement {
	milestone: Milestone;
	achievedAt: string;
	currentValue: number;
}

/**
 * Shown milestones tracking
 */
interface ShownMilestonesData {
	/** Set of milestone IDs that have been shown */
	shown: string[];
	/** Last updated timestamp */
	updatedAt: string;
}

/**
 * Check if we're in browser environment
 */
function isBrowser(): boolean {
	return browser && typeof localStorage !== 'undefined';
}

/**
 * Load shown milestones from localStorage
 */
function loadShownMilestones(): Set<string> {
	if (!isBrowser()) return new Set();
	
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const data: ShownMilestonesData = JSON.parse(stored);
			return new Set(data.shown);
		}
	} catch (error) {
		console.error('Error loading shown milestones:', error);
	}
	
	return new Set();
}

/**
 * Save shown milestones to localStorage
 */
function saveShownMilestones(shown: Set<string>): void {
	if (!isBrowser()) return;
	
	try {
		const data: ShownMilestonesData = {
			shown: Array.from(shown),
			updatedAt: new Date().toISOString()
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (error) {
		console.error('Error saving shown milestones:', error);
	}
}

/**
 * Count stories read by user
 * 
 * A story is considered "read" if it has been completed at least once.
 * This checks localStorage for story completion data.
 */
function countStoriesRead(): number {
	if (!isBrowser()) return 0;
	
	try {
		// Look for story progress in localStorage
		// Format: espanjapeli_story_progress
		const storyProgressKey = 'espanjapeli_story_progress';
		const stored = localStorage.getItem(storyProgressKey);
		
		if (stored) {
			const progress = JSON.parse(stored);
			// Count stories with readCompletely: true
			let count = 0;
			for (const storyData of Object.values(progress)) {
				if (typeof storyData === 'object' && storyData !== null) {
					const story = storyData as { readCompletely?: boolean };
					if (story.readCompletely) {
						count++;
					}
				}
			}
			return count;
		}
	} catch (error) {
		console.error('Error counting stories read:', error);
	}
	
	return 0;
}

/**
 * Check if a milestone is achieved based on current progress
 */
async function isMilestoneAchieved(milestone: Milestone): Promise<{
	achieved: boolean;
	currentValue: number;
}> {
	const stats = await calculateVocabularyStats();
	
	switch (milestone.type) {
		case 'words_known': {
			const currentValue = stats.wordsKnown;
			return {
				achieved: currentValue >= milestone.target,
				currentValue
			};
		}
		
		case 'top_n_complete': {
			let currentValue = 0;
			let achieved = false;
			
			switch (milestone.topN) {
				case 100:
					currentValue = stats.topNProgress.top100.known;
					achieved = currentValue >= milestone.target;
					break;
				case 500:
					currentValue = stats.topNProgress.top500.known;
					achieved = currentValue >= milestone.target;
					break;
				case 1000:
					currentValue = stats.topNProgress.top1000.known;
					achieved = currentValue >= milestone.target;
					break;
			}
			
			return { achieved, currentValue };
		}
		
		case 'stories_read': {
			const currentValue = countStoriesRead();
			return {
				achieved: currentValue >= milestone.target,
				currentValue
			};
		}
		
		default:
			return { achieved: false, currentValue: 0 };
	}
}

/**
 * Detect newly achieved milestones that haven't been shown yet
 * 
 * Returns array of milestone achievements sorted by priority.
 */
export async function detectNewMilestones(): Promise<MilestoneAchievement[]> {
	const shownMilestones = loadShownMilestones();
	const newAchievements: MilestoneAchievement[] = [];
	
	// Check each milestone
	for (const milestone of MILESTONES) {
		// Skip if already shown
		if (shownMilestones.has(milestone.id)) {
			continue;
		}
		
		// Check if achieved
		const { achieved, currentValue } = await isMilestoneAchieved(milestone);
		
		if (achieved) {
			newAchievements.push({
				milestone,
				achievedAt: new Date().toISOString(),
				currentValue
			});
		}
	}
	
	// Sort by priority (lower priority number = show first)
	newAchievements.sort((a, b) => a.milestone.priority - b.milestone.priority);
	
	return newAchievements;
}

/**
 * Mark a milestone as shown
 */
export function markMilestoneShown(milestoneId: string): void {
	const shown = loadShownMilestones();
	shown.add(milestoneId);
	saveShownMilestones(shown);
}

/**
 * Mark multiple milestones as shown
 */
export function markMilestonesShown(milestoneIds: string[]): void {
	const shown = loadShownMilestones();
	milestoneIds.forEach(id => shown.add(id));
	saveShownMilestones(shown);
}

/**
 * Check if a specific milestone has been shown
 */
export function isMilestoneShown(milestoneId: string): boolean {
	const shown = loadShownMilestones();
	return shown.has(milestoneId);
}

/**
 * Get all shown milestone IDs
 */
export function getShownMilestones(): string[] {
	const shown = loadShownMilestones();
	return Array.from(shown);
}

/**
 * Reset shown milestones (for testing or user reset)
 */
export function resetShownMilestones(): void {
	if (!isBrowser()) return;
	
	try {
		localStorage.removeItem(STORAGE_KEY);
		console.log('🗑️ Shown milestones reset');
	} catch (error) {
		console.error('Error resetting shown milestones:', error);
	}
}

/**
 * Get progress towards a specific milestone
 */
export async function getMilestoneProgress(milestoneId: string): Promise<{
	milestone: Milestone | null;
	currentValue: number;
	targetValue: number;
	percentage: number;
	achieved: boolean;
} | null> {
	const milestone = MILESTONES.find(m => m.id === milestoneId);
	if (!milestone) return null;
	
	const { achieved, currentValue } = await isMilestoneAchieved(milestone);
	const percentage = Math.min(100, Math.round((currentValue / milestone.target) * 100));
	
	return {
		milestone,
		currentValue,
		targetValue: milestone.target,
		percentage,
		achieved
	};
}

/**
 * Get all milestones with their progress
 */
export async function getAllMilestonesProgress(): Promise<Array<{
	milestone: Milestone;
	currentValue: number;
	targetValue: number;
	percentage: number;
	achieved: boolean;
	shown: boolean;
}>> {
	const shownMilestones = loadShownMilestones();
	const results = [];
	
	for (const milestone of MILESTONES) {
		const { achieved, currentValue } = await isMilestoneAchieved(milestone);
		const percentage = Math.min(100, Math.round((currentValue / milestone.target) * 100));
		
		results.push({
			milestone,
			currentValue,
			targetValue: milestone.target,
			percentage,
			achieved,
			shown: shownMilestones.has(milestone.id)
		});
	}
	
	// Sort by priority
	results.sort((a, b) => a.milestone.priority - b.milestone.priority);
	
	return results;
}

/**
 * Get next unachieved milestone
 */
export async function getNextMilestone(): Promise<{
	milestone: Milestone;
	currentValue: number;
	targetValue: number;
	percentage: number;
} | null> {
	const allProgress = await getAllMilestonesProgress();
	
	// Find first unachieved milestone
	const next = allProgress.find(p => !p.achieved);
	
	if (!next) return null;
	
	return {
		milestone: next.milestone,
		currentValue: next.currentValue,
		targetValue: next.targetValue,
		percentage: next.percentage
	};
}
