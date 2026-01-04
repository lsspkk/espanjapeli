// Answer Checker Service for Espanjapeli
// Handles fuzzy matching and typo tolerance for answer validation
//
// Features:
// - Exact match
// - Finnish declension tolerance (up to 2 extra letters at end)
// - Typo tolerance (1 letter difference)
//
// Usage:
//   const result = window.AnswerChecker.check(userAnswer, correctAnswer);
//   if (result.isCorrect) { ... }

const AnswerChecker = (function() {
    'use strict';

    /**
     * Check if two strings are similar enough to be considered correct
     * @param {string} userAnswer - The user's answer (will be normalized)
     * @param {string} correctAnswer - The correct answer (will be normalized)
     * @returns {Object} Result with isCorrect boolean and matchType string
     */
    function check(userAnswer, correctAnswer) {
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
        if (isTypoMatch(user, correct)) {
            return { isCorrect: true, matchType: 'typo' };
        }

        return { isCorrect: false, matchType: 'wrong' };
    }

    /**
     * Normalize a string for comparison
     * - Trim whitespace
     * - Convert to lowercase
     * @param {string} str - String to normalize
     * @returns {string} Normalized string
     */
    function normalize(str) {
        if (typeof str !== 'string') return '';
        return str.trim().toLowerCase();
    }

    /**
     * Check if answer matches with Finnish declension tolerance
     * Allows up to 2 extra letters at the end of either word
     * @param {string} user - Normalized user answer
     * @param {string} correct - Normalized correct answer
     * @returns {boolean} True if declension match
     */
    function isDeclensionMatch(user, correct) {
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
     * @param {string} user - Normalized user answer
     * @param {string} correct - Normalized correct answer
     * @returns {boolean} True if within 1 edit distance
     */
    function isTypoMatch(user, correct) {
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

    /**
     * Simple check that just returns boolean (convenience method)
     * @param {string} userAnswer - The user's answer
     * @param {string} correctAnswer - The correct answer
     * @returns {boolean} True if answer is correct (exact, declension, or typo match)
     */
    function isCorrect(userAnswer, correctAnswer) {
        return check(userAnswer, correctAnswer).isCorrect;
    }

    // Public API
    return {
        check,
        isCorrect,
        normalize,
        // Expose internal methods for testing
        _isDeclensionMatch: isDeclensionMatch,
        _isTypoMatch: isTypoMatch
    };
})();

// Export for browser
window.AnswerChecker = AnswerChecker;

