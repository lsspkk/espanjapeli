/**
 * Story game type definitions for Espanjapeli
 * Reading comprehension game with Spanish dialogues
 */

/**
 * A single line of dialogue in a story
 */
export interface DialogueLine {
	speaker: string;
	spanish: string;
	finnish: string;
}

/**
 * Vocabulary word associated with a story
 */
export interface VocabularyWord {
	spanish: string;
	finnish: string;
	example?: string;
}

/**
 * A comprehension question about the story
 */
export interface StoryQuestion {
	id: string;
	question: string; // Question in Finnish
	questionSpanish?: string; // Optional question in Spanish
	options: string[]; // 4 answer options
	correctIndex: number; // Index of correct answer (0-3)
	explanation?: string; // Optional explanation shown after answering
}

/**
 * A complete story with dialogues, vocabulary, and questions
 */
export interface Story {
	id: string;
	title: string; // Finnish title
	titleSpanish: string; // Spanish title
	description: string; // Short description
	difficulty: 'beginner' | 'intermediate' | 'advanced';
	category: string; // e.g., 'shopping', 'travel', 'cafe'
	icon: string; // Emoji for the story
	dialogue: DialogueLine[];
	vocabulary: VocabularyWord[];
	questions: StoryQuestion[];
}

/**
 * Story game state
 */
export type StoryGameState = 'home' | 'reading' | 'vocabulary' | 'questions' | 'report';

/**
 * Result of answering a story question
 */
export interface StoryQuestionResult {
	questionId: string;
	correct: boolean;
	selectedIndex: number;
	correctIndex: number;
	attempts: number;
}

/**
 * Game session result for a story
 */
export interface StoryGameResult {
	storyId: string;
	questionResults: StoryQuestionResult[];
	totalCorrect: number;
	totalQuestions: number;
	completedAt: Date;
}
