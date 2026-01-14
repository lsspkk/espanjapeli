/**
 * Story loader service for loading and managing story content
 * V4: Supports lazy loading with manifest-based structure
 */

import type { Story } from '$lib/types/story';
import { base } from '$app/paths';

interface StoryMetadata {
	id: string;
	title: string;
	titleSpanish: string;
	description: string;
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	level: string;
	category: string;
	icon: string;
	wordCount: number;
	estimatedMinutes: number;
	vocabularyCount: number;
	questionCount: number;
}

interface StoryManifest {
	version: string;
	lastUpdated: string;
	stories: StoryMetadata[];
}

let cachedManifest: StoryManifest | null = null;
const cachedStories: Map<string, Story> = new Map();

/**
 * Load story manifest (lightweight metadata for all stories)
 */
export async function loadManifest(): Promise<StoryManifest> {
	if (cachedManifest) {
		return cachedManifest;
	}

	try {
		const response = await fetch(`${base}/stories/manifest.json`);
		if (!response.ok) {
			throw new Error(`Failed to load manifest: ${response.status}`);
		}
		cachedManifest = await response.json();
		return cachedManifest;
	} catch (error) {
		console.error('Error loading story manifest:', error);
		throw error;
	}
}

/**
 * Get level folder name from CEFR level
 */
function getLevelFolder(level: string): string {
	return level.toLowerCase();
}

/**
 * Load a single story by ID (lazy loading)
 */
export async function loadStoryById(id: string): Promise<Story | null> {
	// Check cache first
	if (cachedStories.has(id)) {
		return cachedStories.get(id)!;
	}

	// Get story metadata from manifest
	const manifest = await loadManifest();
	const metadata = manifest.stories.find((s) => s.id === id);

	if (!metadata) {
		console.error(`Story not found in manifest: ${id}`);
		return null;
	}

	// Load individual story file
	const levelFolder = getLevelFolder(metadata.level);
	const storyPath = `${base}/stories/${levelFolder}/${id}.json`;

	try {
		const response = await fetch(storyPath);
		if (!response.ok) {
			throw new Error(`Failed to load story: ${response.status}`);
		}
		const story: Story = await response.json();

		// Cache the loaded story
		cachedStories.set(id, story);

		return story;
	} catch (error) {
		console.error(`Error loading story ${id}:`, error);
		return null;
	}
}

/**
 * Load all stories from the JSON file (legacy support)
 * @deprecated Use loadManifest() and loadStoryById() for better performance
 */
export async function loadStories(): Promise<Story[]> {
	const manifest = await loadManifest();
	const stories: Story[] = [];

	for (const metadata of manifest.stories) {
		const story = await loadStoryById(metadata.id);
		if (story) {
			stories.push(story);
		}
	}

	return stories;
}

/**
 * Get a single story by ID
 */
export async function getStoryById(id: string): Promise<Story | undefined> {
	const story = await loadStoryById(id);
	return story ?? undefined;
}

/**
 * Get story metadata (lightweight, no full story content)
 */
export async function getStoryMetadata(): Promise<StoryMetadata[]> {
	const manifest = await loadManifest();
	return manifest.stories;
}

/**
 * Get stories metadata filtered by difficulty
 */
export async function getStoriesMetadataByDifficulty(
	difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<StoryMetadata[]> {
	const manifest = await loadManifest();
	return manifest.stories.filter((story) => story.difficulty === difficulty);
}

/**
 * Get stories metadata filtered by CEFR level
 */
export async function getStoriesMetadataByLevel(level: string): Promise<StoryMetadata[]> {
	const manifest = await loadManifest();
	return manifest.stories.filter((story) => story.level === level);
}

/**
 * Get stories filtered by difficulty (loads full content)
 */
export async function getStoriesByDifficulty(
	difficulty: 'beginner' | 'intermediate' | 'advanced'
): Promise<Story[]> {
	const metadata = await getStoriesMetadataByDifficulty(difficulty);
	const stories: Story[] = [];

	for (const meta of metadata) {
		const story = await loadStoryById(meta.id);
		if (story) stories.push(story);
	}

	return stories;
}

/**
 * Get stories filtered by category (loads full content)
 */
export async function getStoriesByCategory(category: string): Promise<Story[]> {
	const manifest = await loadManifest();
	const metadata = manifest.stories.filter((story) => story.category === category);
	const stories: Story[] = [];

	for (const meta of metadata) {
		const story = await loadStoryById(meta.id);
		if (story) stories.push(story);
	}

	return stories;
}

/**
 * Get all unique categories from stories
 */
export async function getStoryCategories(): Promise<string[]> {
	const manifest = await loadManifest();
	const categories = new Set(manifest.stories.map((story) => story.category));
	return Array.from(categories);
}

/**
 * Clear the story cache (useful for development)
 */
export function clearStoryCache(): void {
	cachedManifest = null;
	cachedStories.clear();
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
	beginner: 'Alkeet',
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
