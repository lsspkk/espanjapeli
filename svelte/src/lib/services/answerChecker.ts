// Answer Checker Service for Espanjapeli
// Handles fuzzy matching and typo tolerance for answer validation
// Ported from vanilla JS to TypeScript

export interface AnswerCheckResult {
	isCorrect: boolean;
	matchType: 'exact' | 'declension' | 'typo' | 'wrong' | 'empty' | 'different-word';
}

/**
 * Check if two strings are similar enough to be considered correct
 * @param userAnswer - The user's answer (will be normalized)
 * @param correctAnswer - The correct answer (will be normalized)
 * @param allFinnishWords - Optional array of all Finnish words to check against
 * @returns Result with isCorrect boolean and matchType string
 */
export function checkAnswer(
	userAnswer: string, 
	correctAnswer: string,
	allFinnishWords?: string[]
): AnswerCheckResult {
	// Normalize both answers
	const user = normalize(userAnswer);
	const correct = normalize(correctAnswer);

	// Empty answer is always wrong
	if (user.length === 0) {
		return { isCorrect: false, matchType: 'empty' };
	}

	// Exact match
	if (user === correct) {
		return { isCorrect: true, matchType: 'exact' };
	}

	// Finnish declension tolerance: allow up to 2 extra letters at the end
	// This handles cases like "koira" → "koiraa" or "talo" → "talossa"
	if (isDeclensionMatch(user, correct)) {
		return { isCorrect: true, matchType: 'declension' };
	}

	// Typo tolerance: allow one letter difference
	// BUT: reject if the user's answer is actually a different valid word
	if (isTypoMatch(user, correct)) {
		// If we have a word database, check if user's answer is a different word
		if (allFinnishWords && allFinnishWords.length > 0) {
			const normalizedWords = allFinnishWords.map(w => normalize(w));
			// Check if user's answer exists as a different word in database
			if (normalizedWords.includes(user) && user !== correct) {
				// User wrote a different valid word (like "te" instead of "me")
				return { isCorrect: false, matchType: 'different-word' };
			}
		}
		return { isCorrect: true, matchType: 'typo' };
	}

	return { isCorrect: false, matchType: 'wrong' };
}

/**
 * Simple check that just returns boolean (convenience method)
 * @param userAnswer - The user's answer
 * @param correctAnswer - The correct answer
 * @param allFinnishWords - Optional array of all Finnish words to check against
 * @returns True if answer is correct (exact, declension, or typo match)
 */
export function isCorrect(
	userAnswer: string, 
	correctAnswer: string,
	allFinnishWords?: string[]
): boolean {
	return checkAnswer(userAnswer, correctAnswer, allFinnishWords).isCorrect;
}

/**
 * Normalize a string for comparison
 * - Trim whitespace
 * - Convert to lowercase
 * @param str - String to normalize
 * @returns Normalized string
 */
function normalize(str: string): string {
	if (typeof str !== 'string') return '';
	return str.trim().toLowerCase();
}

/**
 * Check if answer matches with Finnish declension tolerance
 * Allows up to 2 extra letters at the end of either word
 * @param user - Normalized user answer
 * @param correct - Normalized correct answer
 * @returns True if declension match
 */
function isDeclensionMatch(user: string, correct: string): boolean {
	// User typed more letters (e.g., "koiraa" for "koira")
	if (user.startsWith(correct) && user.length <= correct.length + 2) {
		return true;
	}
	// User typed fewer letters (e.g., "koira" for "koiraa")
	if (correct.startsWith(user) && correct.length <= user.length + 2) {
		return true;
	}
	return false;
}

/**
 * Check if answer is a typo (one letter difference)
 * Uses a simple edit distance algorithm optimized for 1-distance check
 * @param user - Normalized user answer
 * @param correct - Normalized correct answer
 * @returns True if within 1 edit distance
 */
function isTypoMatch(user: string, correct: string): boolean {
	const len1 = user.length;
	const len2 = correct.length;

	// If length difference is more than 1, can't be a single typo
	if (Math.abs(len1 - len2) > 1) {
		return false;
	}

	// Count differences using a simple algorithm
	let differences = 0;
	let i = 0;
	let j = 0;

	while (i < len1 && j < len2) {
		if (user[i] !== correct[j]) {
			differences++;
			if (differences > 1) return false;

			// Handle insertion/deletion/substitution
			if (len1 > len2) {
				i++; // Skip char in user answer (user typed extra)
			} else if (len2 > len1) {
				j++; // Skip char in correct answer (user missed one)
			} else {
				i++; j++; // Substitution (user typed wrong letter)
			}
		} else {
			i++;
			j++;
		}
	}

	// Count remaining characters as differences
	differences += (len1 - i) + (len2 - j);

	return differences <= 1;
}

