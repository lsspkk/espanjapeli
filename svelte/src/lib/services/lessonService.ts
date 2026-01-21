/**
 * Lesson service for loading and managing lesson content
 * 
 * Lessons combine vocabulary words with example sentences from Tatoeba.
 * 
 * Data source: Tatoeba (https://tatoeba.org)
 * License: CC-BY 2.0 FR (https://creativecommons.org/licenses/by/2.0/fr/)
 * Attribution: Sentences from Tatoeba.org contributors
 */

import { base } from '$app/paths';

/**
 * Lesson metadata from manifest
 */
export interface LessonMetadata {
	id: string;
	category: string;
	categoryName: string;
	tier: number;
	wordCount: number;
	phraseCount: number;
	filename: string;
}

/**
 * Lesson manifest
 */
export interface LessonManifest {
	lessons: LessonMetadata[];
}

/**
 * Full lesson with word and phrase IDs
 */
export interface Lesson {
	id: string;
	category: string;
	categoryName: string;
	tier: number;
	words: string[];
	phrases: string[];
}

// Cache for loaded data
let cachedManifest: LessonManifest | null = null;
const cachedLessons: Map<string, Lesson> = new Map();

/**
 * Load lesson index manifest (lightweight metadata for all lessons)
 */
export async function loadLessonIndex(): Promise<LessonManifest> {
	if (cachedManifest) {
		return cachedManifest;
	}

	try {
		const response = await fetch(`${base}/lessons/index.json`);
		if (!response.ok) {
			throw new Error(`Failed to load lesson index: ${response.status}`);
		}
		cachedManifest = await response.json();
		return cachedManifest;
	} catch (error) {
		console.error('Error loading lesson index:', error);
		throw error;
	}
}

/**
 * Load a single lesson by ID (lazy loading)
 */
export async function loadLesson(lessonId: string): Promise<Lesson> {
	// Check cache first
	if (cachedLessons.has(lessonId)) {
		return cachedLessons.get(lessonId)!;
	}

	// Get lesson metadata from manifest
	const manifest = await loadLessonIndex();
	const metadata = manifest.lessons.find((l) => l.id === lessonId);

	if (!metadata) {
		throw new Error(`Lesson not found in manifest: ${lessonId}`);
	}

	// Load individual lesson file
	const lessonPath = `${base}/lessons/${metadata.filename}`;

	try {
		const response = await fetch(lessonPath);
		if (!response.ok) {
			throw new Error(`Failed to load lesson: ${response.status}`);
		}
		const lesson: Lesson = await response.json();

		// Cache the loaded lesson
		cachedLessons.set(lessonId, lesson);

		return lesson;
	} catch (error) {
		console.error(`Error loading lesson ${lessonId}:`, error);
		throw error;
	}
}

/**
 * Get lessons filtered by category
 */
export async function getLessonsByCategory(category: string): Promise<Lesson[]> {
	const manifest = await loadLessonIndex();
	
	// Find all lessons for this category
	const categoryLessons = manifest.lessons.filter((l) => l.category === category);
	
	if (categoryLessons.length === 0) {
		console.warn(`No lessons found for category: ${category}`);
		return [];
	}

	// Load all lessons for this category
	const lessons: Lesson[] = [];
	for (const metadata of categoryLessons) {
		const lesson = await loadLesson(metadata.id);
		lessons.push(lesson);
	}

	return lessons;
}

/**
 * Get all unique categories from lessons
 */
export async function getLessonCategories(): Promise<string[]> {
	const manifest = await loadLessonIndex();
	const categories = new Set(manifest.lessons.map((lesson) => lesson.category));
	return Array.from(categories).sort();
}

/**
 * Get lesson metadata (lightweight, no full lesson content)
 */
export async function getLessonMetadata(): Promise<LessonMetadata[]> {
	const manifest = await loadLessonIndex();
	return manifest.lessons;
}

/**
 * Clear the lesson cache (useful for development)
 */
export function clearLessonCache(): void {
	cachedManifest = null;
	cachedLessons.clear();
}
