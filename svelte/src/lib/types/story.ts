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
	english?: string; // For international users
	partOfSpeech?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase';
	gender?: 'masculine' | 'feminine';
	verbForm?: string; // e.g., "present tense, first person"
	relatedWords?: string[]; // Word family connections
	frequencyRank?: number; // Frequency rank if available
	cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'; // CEFR level
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
 * Story category types
 */
export type StoryCategory = 
	| 'greetings' | 'food' | 'shopping' | 'travel' 
	| 'health' | 'work' | 'home' | 'social'
	| 'education' | 'nature' | 'culture' | 'technology'
	| 'environment' | 'entertainment';

/**
 * Cultural note for context
 */
export interface CulturalNote {
	topic: string;
	note: string;
	region?: 'spain' | 'latin-america' | 'all';
}

/**
 * A complete story with dialogues, vocabulary, and questions
 */
export interface Story {
	id: string;
	title: string; // Finnish title
	titleSpanish: string; // Spanish title
	description: string; // Short description
	
	// V4: CEFR level replaces difficulty (kept for backward compatibility)
	difficulty?: 'beginner' | 'intermediate' | 'advanced'; // Deprecated, use level
	level: 'A1' | 'A2' | 'B1' | 'B2'; // CEFR level
	
	category: StoryCategory; // Typed category
	icon: string; // Emoji for the story
	dialogue: DialogueLine[];
	vocabulary: VocabularyWord[];
	questions: StoryQuestion[];
	
	// V4: New fields for better organization
	estimatedMinutes?: number; // Reading time estimate
	wordCount?: number; // Total word count
	
	// V4: New fields for learning progression
	prerequisiteStories?: string[]; // Story IDs that should be read first
	relatedStories?: string[]; // Similar difficulty/topic stories
	keyGrammar?: string[]; // Grammar concepts introduced
	
	// V4: New fields for UX
	thumbnailEmoji?: string; // Larger visual for cards
	culturalNotes?: CulturalNote[]; // Spain/LatAm context
	
	// V4: Metadata
	version?: number; // For content updates
	createdAt?: string; // ISO date string
	updatedAt?: string; // ISO date string
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

/**
 * Migration utility: Convert old difficulty levels to CEFR levels
 * Maps V3 difficulty values to V4 CEFR levels
 */
export function difficultyToLevel(difficulty: 'beginner' | 'intermediate' | 'advanced'): Story['level'] {
	const mapping: Record<'beginner' | 'intermediate' | 'advanced', Story['level']> = {
		'beginner': 'A2',
		'intermediate': 'B1',
		'advanced': 'B1'
	};
	return mapping[difficulty];
}

/**
 * Migration utility: Migrate a V3 story to V4 format
 * Converts difficulty to level and adds default V4 fields
 */
export function migrateStoryToV4(oldStory: Story): Story {
	const newStory: Story = { ...oldStory };
	
	// If story has difficulty, convert it to level (difficulty takes precedence)
	if (oldStory.difficulty) {
		newStory.level = difficultyToLevel(oldStory.difficulty);
	}
	
	// Ensure level is set (fallback to A2 if missing)
	if (!newStory.level) {
		newStory.level = 'A2';
	}
	
	// Add default V4 metadata if missing
	if (!newStory.version) {
		newStory.version = 1;
	}
	
	if (!newStory.createdAt) {
		newStory.createdAt = new Date().toISOString().split('T')[0];
	}
	
	if (!newStory.updatedAt) {
		newStory.updatedAt = newStory.createdAt;
	}
	
	// Calculate word count if missing
	if (!newStory.wordCount && newStory.dialogue.length > 0) {
		newStory.wordCount = newStory.dialogue.reduce((count, line) => {
			return count + line.spanish.split(/\s+/).length;
		}, 0);
	}
	
	// Estimate reading time if missing (assuming 150 words per minute)
	if (!newStory.estimatedMinutes && newStory.wordCount) {
		newStory.estimatedMinutes = Math.ceil(newStory.wordCount / 150);
	}
	
	return newStory;
}
