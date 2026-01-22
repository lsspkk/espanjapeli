/**
 * Lesson progress store for tracking user progress through lessons
 * 
 * Stores lesson completion data and word scores in localStorage.
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'espanjapeli_lesson_progress';

/**
 * Progress data for a single lesson
 */
export interface LessonProgressData {
	lessonId: string;
	completedAt: string; // ISO date string
	wordScores: Record<string, number>; // word ID -> score (0-100)
	nextReviewAt: string; // ISO date string for spaced repetition
}

/**
 * All lesson progress data
 */
export interface LessonProgressStore {
	lessons: Record<string, LessonProgressData>; // lessonId -> progress data
}

/**
 * Load lesson progress from localStorage
 */
function loadLessonProgress(): LessonProgressStore {
	if (!browser) {
		return { lessons: {} };
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) {
			return { lessons: {} };
		}

		const data = JSON.parse(stored);
		return data;
	} catch (error) {
		console.error('Error loading lesson progress:', error);
		return { lessons: {} };
	}
}

/**
 * Save lesson progress to localStorage
 */
function saveLessonProgress(data: LessonProgressStore): void {
	if (!browser) {
		return;
	}

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch (error) {
		console.error('Error saving lesson progress:', error);
	}
}

/**
 * Create the lesson progress store
 */
function createLessonProgressStore() {
	const { subscribe, set, update } = writable<LessonProgressStore>(loadLessonProgress());

	return {
		subscribe,

		/**
		 * Mark a lesson as completed with word scores
		 * Automatically calculates next review interval based on performance
		 * Intervals: 1 day, 3 days, 7 days, 14 days, 30 days
		 */
		completeLesson: (
			lessonId: string,
			wordScores: Record<string, number>,
			reviewDelayDays?: number
		) => {
			update((store) => {
				const now = new Date();
				const nextReview = new Date(now);
				
				// Calculate review delay based on average score if not provided
				let delayDays = reviewDelayDays;
				if (delayDays === undefined) {
					const scores = Object.values(wordScores);
					if (scores.length > 0) {
						const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
						
						// Spaced repetition intervals based on performance
						if (avgScore >= 90) {
							delayDays = 30; // Excellent: review in 30 days
						} else if (avgScore >= 80) {
							delayDays = 14; // Good: review in 14 days
						} else if (avgScore >= 70) {
							delayDays = 7; // Fair: review in 7 days
						} else if (avgScore >= 60) {
							delayDays = 3; // Needs work: review in 3 days
						} else {
							delayDays = 1; // Poor: review in 1 day
						}
					} else {
						delayDays = 1; // Default to 1 day if no scores
					}
				}
				
				nextReview.setDate(nextReview.getDate() + delayDays);

				store.lessons[lessonId] = {
					lessonId,
					completedAt: now.toISOString(),
					wordScores,
					nextReviewAt: nextReview.toISOString()
				};

				saveLessonProgress(store);
				return store;
			});
		},

		/**
		 * Update word scores for a lesson
		 */
		updateWordScores: (lessonId: string, wordScores: Record<string, number>) => {
			update((store) => {
				if (store.lessons[lessonId]) {
					store.lessons[lessonId].wordScores = {
						...store.lessons[lessonId].wordScores,
						...wordScores
					};
					saveLessonProgress(store);
				}
				return store;
			});
		},

		/**
		 * Get progress for a specific lesson
		 */
		getLessonProgress: (lessonId: string): LessonProgressData | null => {
			const store = loadLessonProgress();
			return store.lessons[lessonId] || null;
		},

		/**
		 * Check if a lesson is completed
		 */
		isLessonCompleted: (lessonId: string): boolean => {
			const store = loadLessonProgress();
			return !!store.lessons[lessonId];
		},

		/**
		 * Get lessons that need review (nextReviewAt is in the past)
		 */
		getLessonsForReview: (): string[] => {
			const store = loadLessonProgress();
			const now = new Date();

			return Object.values(store.lessons)
				.filter((lesson) => new Date(lesson.nextReviewAt) <= now)
				.map((lesson) => lesson.lessonId);
		},

		/**
		 * Reset all lesson progress (for testing/development)
		 */
		reset: () => {
			const emptyStore: LessonProgressStore = { lessons: {} };
			set(emptyStore);
			saveLessonProgress(emptyStore);
		}
	};
}

export const lessonProgress = createLessonProgressStore();
