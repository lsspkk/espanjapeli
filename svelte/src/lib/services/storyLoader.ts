/**
 * Story loader service for loading and managing story content
 */

import type { Story } from '$lib/types/story';
import { base } from '$app/paths';

interface StoriesData {
	stories: Story[];
}

let cachedStories: Story[] | null = null;

/**
 * Load all stories from the JSON file
 */
export async function loadStories(): Promise<Story[]> {
	if (cachedStories) {
		return cachedStories;
	}

	try {
		const response = await fetch(`${base}/stories/stories.json`);
		if (!response.ok) {
			throw new Error(`Failed to load stories: ${response.status}`);
		}
		const data: StoriesData = await response.json();
		cachedStories = data.stories;
		return cachedStories;
	} catch (error) {
		console.error('Error loading stories:', error);
		return [];
	}
}

/**
 * Get a single story by ID
 */
export async function getStoryById(id: string): Promise<Story | undefined> {
	const stories = await loadStories();
	return stories.find((story) => story.id === id);
}

/**
 * Get stories filtered by difficulty
 */
export async function getStoriesByDifficulty(
	difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<Story[]> {
	const stories = await loadStories();
	return stories.filter((story) => story.difficulty === difficulty);
}

/**
 * Get stories filtered by category
 */
export async function getStoriesByCategory(category: string): Promise<Story[]> {
	const stories = await loadStories();
	return stories.filter((story) => story.category === category);
}

/**
 * Get all unique categories from stories
 */
export async function getStoryCategories(): Promise<string[]> {
	const stories = await loadStories();
	const categories = new Set(stories.map((story) => story.category));
	return Array.from(categories);
}

/**
 * Clear the story cache (useful for development)
 */
export function clearStoryCache(): void {
	cachedStories = null;
}

/**
 * Category display names in Finnish
 */
export const categoryNames: Record<string, string> = {
	shopping: 'Ostoksilla',
	cafe: 'Kahvilassa',
	travel: 'Matkustaminen',
	nature: 'Luonnossa',
	everyday: 'Arkipäivä',
	food: 'Ruoka'
};

/**
 * Difficulty display names in Finnish
 */
export const difficultyNames: Record<string, string> = {
	beginner: 'Aloittelija',
	intermediate: 'Keskitaso',
	advanced: 'Edistynyt'
};

/**
 * Get difficulty color class (muted colors with subtle shading)
 */
export function getDifficultyColor(difficulty: string): string {
	switch (difficulty) {
		case 'beginner':
			return 'bg-green-100 text-green-700 border-green-200';
		case 'intermediate':
			return 'bg-amber-100 text-amber-700 border-amber-200';
		case 'advanced':
			return 'bg-red-100 text-red-700 border-red-200';
		default:
			return 'badge-neutral';
	}
}
