/**
 * Core game type definitions for Espanjapeli V3
 */

/**
 * Game state machine states
 */
export type GameState = 'home' | 'playing' | 'feedback' | 'report';

/**
 * Available game types in the application
 */
export type GameType = 'sanapeli' | 'yhdistasanat' | 'tarinat' | 'peppa' | 'mitasasanoit';

/**
 * Game configuration interface
 */
export interface GameConfig {
	gameType: GameType;
	questionCount: number;
	category: string;
	direction: 'spanish_to_finnish' | 'finnish_to_spanish';
	timed: boolean;
}

/**
 * Question display data
 */
export interface QuestionDisplay {
	id: string;
	displayText: string;
	audioText: string;
	audioLanguage: 'spanish' | 'finnish';
}

/**
 * Answer result for a single question
 */
export interface AnswerResult {
	correct: boolean;
	userAnswer: string;
	correctAnswer: string;
	pointsEarned: number;
	feedback: string;
}
