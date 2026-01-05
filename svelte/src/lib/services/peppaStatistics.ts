/**
 * Peppa Pig Game Statistics Service
 * Tracks game performance and stores in localStorage
 */

export interface PeppaGameAnswer {
	questionSpanish: string;
	questionFinnish: string;
	selectedImageId: string;
	correctImageId: string;
	isCorrect: boolean;
	timestamp: number;
	displayMode: 'svg' | 'emoji'; // What mode was active when answered
}

export interface PeppaGameSession {
	sessionId: string;
	gameType: 'peppa_advanced_spanish' | 'peppa_basic' | 'peppa_intermediate';
	startTime: number;
	endTime?: number;
	totalQuestions: number;
	correctAnswers: number;
	wrongAnswers: number;
	answers: PeppaGameAnswer[];
	togglesUsed: number; // How many times user toggled display mode
	finalScore: number; // Percentage
}

export interface PeppaStatisticsData {
	version: string; // Data model version (e.g., "1.0.0")
	userId?: string; // Optional user identifier
	sessions: PeppaGameSession[];
	totalGamesPlayed: number;
	totalCorrectAnswers: number;
	totalWrongAnswers: number;
	lastPlayedTimestamp?: number;
	createdAt: number;
	updatedAt: number;
}

const STORAGE_KEY = 'espanjapeli_peppa_statistics';
const CURRENT_VERSION = '1.0.0';

class PeppaStatisticsService {
	private data: PeppaStatisticsData;

	constructor() {
		// Only load from storage in browser environment
		if (typeof window !== 'undefined') {
			this.data = this.loadFromStorage();
		} else {
			// SSR: Initialize with default data
			this.data = this.createDefaultData();
		}
	}

	/**
	 * Create default empty statistics data
	 */
	private createDefaultData(): PeppaStatisticsData {
		return {
			version: CURRENT_VERSION,
			sessions: [],
			totalGamesPlayed: 0,
			totalCorrectAnswers: 0,
			totalWrongAnswers: 0,
			createdAt: Date.now(),
			updatedAt: Date.now()
		};
	}

	/**
	 * Load statistics from localStorage
	 */
	private loadFromStorage(): PeppaStatisticsData {
		if (typeof window === 'undefined') {
			return this.createDefaultData();
		}
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as PeppaStatisticsData;

				// Version migration if needed
				if (parsed.version !== CURRENT_VERSION) {
					return this.migrateData(parsed);
				}

				return parsed;
			}
		} catch (error) {
			console.error('Failed to load Peppa statistics:', error);
		}

		// Return fresh data structure
		return this.createFreshData();
	}

	/**
	 * Create fresh statistics data
	 */
	private createFreshData(): PeppaStatisticsData {
		const now = Date.now();
		return {
			version: CURRENT_VERSION,
			sessions: [],
			totalGamesPlayed: 0,
			totalCorrectAnswers: 0,
			totalWrongAnswers: 0,
			createdAt: now,
			updatedAt: now
		};
	}

	/**
	 * Migrate data from older versions
	 */
	private migrateData(oldData: any): PeppaStatisticsData {
		console.log(`Migrating Peppa statistics from ${oldData.version} to ${CURRENT_VERSION}`);

		// For now, just update version and preserve data
		// Add migration logic here if data structure changes
		return {
			...oldData,
			version: CURRENT_VERSION,
			updatedAt: Date.now()
		};
	}

	/**
	 * Save statistics to localStorage
	 */
	private saveToStorage(): void {
		if (typeof window === 'undefined') {
			return; // Skip saving during SSR
		}
		try {
			this.data.updatedAt = Date.now();
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
		} catch (error) {
			console.error('Failed to save Peppa statistics:', error);
		}
	}

	/**
	 * Start a new game session
	 */
	startSession(gameType: PeppaGameSession['gameType'], totalQuestions: number): string {
		const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		const newSession: PeppaGameSession = {
			sessionId,
			gameType,
			startTime: Date.now(),
			totalQuestions,
			correctAnswers: 0,
			wrongAnswers: 0,
			answers: [],
			togglesUsed: 0,
			finalScore: 0
		};

		this.data.sessions.push(newSession);
		this.data.totalGamesPlayed++;
		this.saveToStorage();

		return sessionId;
	}

	/**
	 * Record an answer in the current session
	 */
	recordAnswer(sessionId: string, answer: Omit<PeppaGameAnswer, 'timestamp'>): void {
		const session = this.data.sessions.find((s) => s.sessionId === sessionId);
		if (!session) {
			console.error('Session not found:', sessionId);
			return;
		}

		const fullAnswer: PeppaGameAnswer = {
			...answer,
			timestamp: Date.now()
		};

		session.answers.push(fullAnswer);

		if (answer.isCorrect) {
			session.correctAnswers++;
			this.data.totalCorrectAnswers++;
		} else {
			session.wrongAnswers++;
			this.data.totalWrongAnswers++;
		}

		this.saveToStorage();
	}

	/**
	 * Increment toggle counter for session
	 */
	incrementToggles(sessionId: string): void {
		const session = this.data.sessions.find((s) => s.sessionId === sessionId);
		if (session) {
			session.togglesUsed++;
			this.saveToStorage();
		}
	}

	/**
	 * End a game session
	 */
	endSession(sessionId: string): void {
		const session = this.data.sessions.find((s) => s.sessionId === sessionId);
		if (!session) {
			console.error('Session not found:', sessionId);
			return;
		}

		session.endTime = Date.now();
		session.finalScore =
			session.totalQuestions > 0
				? Math.round((session.correctAnswers / session.totalQuestions) * 100)
				: 0;

		this.data.lastPlayedTimestamp = session.endTime;
		this.saveToStorage();
	}

	/**
	 * Get all sessions
	 */
	getAllSessions(): PeppaGameSession[] {
		return [...this.data.sessions];
	}

	/**
	 * Get recent sessions (last N)
	 */
	getRecentSessions(count: number = 10): PeppaGameSession[] {
		return [...this.data.sessions].sort((a, b) => b.startTime - a.startTime).slice(0, count);
	}

	/**
	 * Get sessions by game type
	 */
	getSessionsByGameType(gameType: PeppaGameSession['gameType']): PeppaGameSession[] {
		return this.data.sessions.filter((s) => s.gameType === gameType);
	}

	/**
	 * Get overall statistics
	 */
	getOverallStats() {
		const totalAnswers = this.data.totalCorrectAnswers + this.data.totalWrongAnswers;
		const averageScore =
			totalAnswers > 0 ? Math.round((this.data.totalCorrectAnswers / totalAnswers) * 100) : 0;

		const completedSessions = this.data.sessions.filter((s) => s.endTime);
		const averageSessionScore =
			completedSessions.length > 0
				? Math.round(
						completedSessions.reduce((sum, s) => sum + s.finalScore, 0) / completedSessions.length
					)
				: 0;

		return {
			totalGamesPlayed: this.data.totalGamesPlayed,
			totalCorrectAnswers: this.data.totalCorrectAnswers,
			totalWrongAnswers: this.data.totalWrongAnswers,
			totalAnswers,
			averageScore,
			averageSessionScore,
			lastPlayedTimestamp: this.data.lastPlayedTimestamp,
			createdAt: this.data.createdAt
		};
	}

	/**
	 * Get current session (most recent unfinished)
	 */
	getCurrentSession(): PeppaGameSession | null {
		const unfinished = this.data.sessions.filter((s) => !s.endTime);
		if (unfinished.length === 0) return null;
		return unfinished[unfinished.length - 1];
	}

	/**
	 * Clear all statistics (for testing or reset)
	 */
	clearAllStatistics(): void {
		this.data = this.createFreshData();
		this.saveToStorage();
	}

	/**
	 * Export statistics as JSON
	 */
	exportStatistics(): string {
		return JSON.stringify(this.data, null, 2);
	}

	/**
	 * Get raw data (for debugging)
	 */
	getRawData(): PeppaStatisticsData {
		return { ...this.data };
	}
}

// Singleton instance
export const peppaStats = new PeppaStatisticsService();
