// Local Storage Management for Espanjapeli
// Version 1.0.0

const GAME_VERSION = '1.0.0';
const STORAGE_VERSION = 1; // Increment this when storage schema changes

const STORAGE_KEYS = {
    AUTO_SPEAK: 'espanjapeli_auto_speak',
    COMPACT_MODE: 'espanjapeli_compact_mode',
    CATEGORY: 'espanjapeli_category',
    GAME_LENGTH: 'espanjapeli_game_length',
    GAME_HISTORY: 'espanjapeli_game_history',
    STORAGE_META: 'espanjapeli_storage_meta'
};

const MAX_HISTORY_RECORDS = 20;
const WRONG_WORDS_HISTORY_COUNT = 10;

// Game types for future extensibility
const GAME_TYPES = {
    SPANISH_TO_FINNISH: 'spanish-to-finnish',
    // Future: FINNISH_TO_SPANISH: 'finnish-to-spanish',
    // Future: LISTENING: 'listening',
    // Future: MULTIPLE_CHOICE: 'multiple-choice'
};

/**
 * Check storage version and clear if incompatible
 */
function checkStorageVersion() {
    try {
        const meta = localStorage.getItem(STORAGE_KEYS.STORAGE_META);
        if (meta) {
            const parsed = JSON.parse(meta);
            if (parsed.version === STORAGE_VERSION) {
                console.log(`✅ Storage version ${STORAGE_VERSION} matches`);
                return true;
            }
            console.log(`⚠️ Storage version mismatch: found ${parsed.version}, expected ${STORAGE_VERSION}`);
        } else {
            console.log('ℹ️ No storage metadata found');
        }
        
        // Clear old game history (incompatible format)
        console.log('🗑️ Clearing old game history due to version mismatch');
        localStorage.removeItem(STORAGE_KEYS.GAME_HISTORY);
        
        // Save new version
        saveStorageMeta();
        return false;
    } catch (error) {
        console.error('❌ Error checking storage version:', error);
        saveStorageMeta();
        return false;
    }
}

/**
 * Save storage metadata
 */
function saveStorageMeta() {
    try {
        const meta = {
            version: STORAGE_VERSION,
            gameVersion: GAME_VERSION,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.STORAGE_META, JSON.stringify(meta));
        console.log('💾 Storage metadata saved:', meta);
    } catch (error) {
        console.error('❌ Error saving storage metadata:', error);
    }
}

/**
 * Generate a unique game ID
 */
function generateGameId() {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save user preference for auto-speak
 */
function saveAutoSpeakPreference(enabled) {
    try {
        localStorage.setItem(STORAGE_KEYS.AUTO_SPEAK, JSON.stringify(enabled));
        console.log('💾 Auto-speak preference saved:', enabled);
    } catch (error) {
        console.error('❌ Error saving auto-speak preference:', error);
    }
}

/**
 * Load user preference for auto-speak
 * @returns {boolean} - Auto-speak enabled/disabled, defaults to true
 */
function loadAutoSpeakPreference() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.AUTO_SPEAK);
        if (saved !== null) {
            const enabled = JSON.parse(saved);
            console.log('📂 Auto-speak preference loaded:', enabled);
            return enabled;
        }
    } catch (error) {
        console.error('❌ Error loading auto-speak preference:', error);
    }
    return true; // Default to true
}

/**
 * Save user preference for compact mode
 */
function saveCompactModePreference(enabled) {
    try {
        localStorage.setItem(STORAGE_KEYS.COMPACT_MODE, JSON.stringify(enabled));
        console.log('💾 Compact mode preference saved:', enabled);
    } catch (error) {
        console.error('❌ Error saving compact mode preference:', error);
    }
}

/**
 * Load user preference for compact mode
 * @returns {boolean} - Compact mode enabled/disabled, defaults to true
 */
function loadCompactModePreference() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.COMPACT_MODE);
        if (saved !== null) {
            const enabled = JSON.parse(saved);
            console.log('📂 Compact mode preference loaded:', enabled);
            return enabled;
        }
    } catch (error) {
        console.error('❌ Error loading compact mode preference:', error);
    }
    return true; // Default to true
}

/**
 * Save selected category
 */
function saveCategory(category) {
    try {
        localStorage.setItem(STORAGE_KEYS.CATEGORY, category);
        console.log('💾 Category saved:', category);
    } catch (error) {
        console.error('❌ Error saving category:', error);
    }
}

/**
 * Load selected category
 * @returns {string} - Category key, defaults to 'all'
 */
function loadCategory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.CATEGORY);
        if (saved) {
            console.log('📂 Category loaded:', saved);
            return saved;
        }
    } catch (error) {
        console.error('❌ Error loading category:', error);
    }
    return 'all'; // Default to all
}

/**
 * Save user preference for game length
 * @param {number} length - Number of questions (10, 21, or 42)
 */
function saveGameLength(length) {
    try {
        localStorage.setItem(STORAGE_KEYS.GAME_LENGTH, length.toString());
        console.log('💾 Game length saved:', length);
    } catch (error) {
        console.error('❌ Error saving game length:', error);
    }
}

/**
 * Load user preference for game length
 * @returns {number} - Game length, defaults to 10
 */
function loadGameLength() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.GAME_LENGTH);
        if (saved) {
            const length = parseInt(saved, 10);
            console.log('📂 Game length loaded:', length);
            return length;
        }
    } catch (error) {
        console.error('❌ Error loading game length:', error);
    }
    return 10; // Default to 10 questions
}

/**
 * Save game result to history
 * 
 * Expected gameResult structure:
 * {
 *   gameType: 'spanish-to-finnish',
 *   category: 'category_key',
 *   categoryName: 'Display Name',
 *   gameLength: 10,
 *   totalScore: 85,
 *   maxPossibleScore: 100,
 *   summary: {
 *     correctCount: 9,
 *     incorrectCount: 1,
 *     accuracy: 90
 *   },
 *   questions: [
 *     {
 *       questionNumber: 1,
 *       spanish: 'hola',
 *       finnish: 'hei',
 *       english: 'hello',
 *       userAnswer: 'hei',
 *       isCorrect: true,
 *       pointsEarned: 10,
 *       maxPoints: 10,
 *       tipsRequested: 0,
 *       tipsShown: []
 *     },
 *     ...
 *   ]
 * }
 * 
 * @param {Object} gameResult - Game result object
 */
function saveGameResult(gameResult) {
    try {
        const history = loadGameHistory();
        
        // Add metadata
        const result = {
            id: generateGameId(),
            version: STORAGE_VERSION,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            ...gameResult
        };
        
        history.unshift(result); // Add to beginning
        
        // Keep only last MAX_HISTORY_RECORDS
        if (history.length > MAX_HISTORY_RECORDS) {
            history.splice(MAX_HISTORY_RECORDS);
        }
        
        localStorage.setItem(STORAGE_KEYS.GAME_HISTORY, JSON.stringify(history));
        console.log('💾 Game result saved to history:', result.id);
    } catch (error) {
        console.error('❌ Error saving game result:', error);
    }
}

/**
 * Load game history
 * @returns {Array} - Array of game results
 */
function loadGameHistory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.GAME_HISTORY);
        if (saved) {
            const history = JSON.parse(saved);
            // Filter out any records without version (old format)
            const validHistory = history.filter(record => record.version === STORAGE_VERSION);
            if (validHistory.length !== history.length) {
                console.log(`⚠️ Filtered out ${history.length - validHistory.length} old format records`);
            }
            console.log('📂 Game history loaded:', validHistory.length, 'records');
            return validHistory;
        }
    } catch (error) {
        console.error('❌ Error loading game history:', error);
    }
    return [];
}

/**
 * Get formatted game history for display
 * @returns {Array} - Array of formatted history items
 */
function getFormattedGameHistory() {
    const history = loadGameHistory();
    
    return history.map(record => {
        const date = new Date(record.timestamp);
        const dateStr = formatDate(date);
        const timeStr = formatTime(date);
        
        return {
            id: record.id,
            datetime: `${dateStr} ${timeStr}`,
            gameType: record.gameType || GAME_TYPES.SPANISH_TO_FINNISH,
            category: record.category || 'all',
            categoryName: record.categoryName || 'Kaikki sanat',
            gameLength: record.gameLength || record.totalQuestions || 10,
            totalScore: record.totalScore,
            maxPossibleScore: record.maxPossibleScore,
            summary: record.summary || {
                correctCount: record.correctCount || 0,
                incorrectCount: record.incorrectCount || 0,
                accuracy: record.accuracy || 0
            },
            questions: record.questions || []
        };
    });
}

/**
 * Get wrong words from last N games with detailed info
 * @param {number} count - Number of recent games to check
 * @returns {Array} - Array of wrong word objects sorted by frequency
 */
function getWrongWordsFromHistory(count = WRONG_WORDS_HISTORY_COUNT) {
    const history = loadGameHistory();
    const recentGames = history.slice(0, count);
    
    const wrongWordsMap = {};
    
    recentGames.forEach(game => {
        const questions = game.questions || [];
        
        questions.forEach(q => {
            if (!q.isCorrect) {
                const key = `${q.spanish}|||${q.finnish}`;
                if (!wrongWordsMap[key]) {
                    wrongWordsMap[key] = {
                        spanish: q.spanish,
                        finnish: q.finnish,
                        english: q.english || '',
                        count: 0,
                        userAnswers: [],
                        tipsUsed: []
                    };
                }
                wrongWordsMap[key].count++;
                if (q.userAnswer) {
                    wrongWordsMap[key].userAnswers.push(q.userAnswer);
                }
                if (q.tipsRequested > 0) {
                    wrongWordsMap[key].tipsUsed.push(q.tipsRequested);
                }
            }
        });
    });
    
    // Convert to array and sort by count (descending)
    const wrongWordsArray = Object.values(wrongWordsMap);
    wrongWordsArray.sort((a, b) => b.count - a.count);
    
    return wrongWordsArray;
}

/**
 * Get game statistics summary
 * @returns {Object} - Overall statistics
 */
function getGameStatistics() {
    const history = loadGameHistory();
    
    if (history.length === 0) {
        return {
            totalGames: 0,
            totalQuestions: 0,
            totalCorrect: 0,
            totalScore: 0,
            averageAccuracy: 0
        };
    }
    
    let totalQuestions = 0;
    let totalCorrect = 0;
    let totalScore = 0;
    
    history.forEach(game => {
        const summary = game.summary || {};
        totalQuestions += game.gameLength || summary.correctCount + summary.incorrectCount || 0;
        totalCorrect += summary.correctCount || 0;
        totalScore += game.totalScore || 0;
    });
    
    return {
        totalGames: history.length,
        totalQuestions,
        totalCorrect,
        totalScore,
        averageAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
    };
}

/**
 * Format date as DD.MM.YYYY
 */
function formatDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Format time as HH:MM
 */
function formatTime(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Clear all game history (for testing/reset)
 */
function clearGameHistory() {
    try {
        localStorage.removeItem(STORAGE_KEYS.GAME_HISTORY);
        console.log('🗑️ Game history cleared');
    } catch (error) {
        console.error('❌ Error clearing game history:', error);
    }
}

/**
 * Clear all storage (full reset)
 */
function clearAllStorage() {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('🗑️ All storage cleared');
    } catch (error) {
        console.error('❌ Error clearing all storage:', error);
    }
}

// Initialize storage on load
checkStorageVersion();

// Export functions and constants
window.GameStorage = {
    // Constants
    GAME_VERSION,
    STORAGE_VERSION,
    GAME_TYPES,
    
    // Preferences
    saveAutoSpeakPreference,
    loadAutoSpeakPreference,
    saveCompactModePreference,
    loadCompactModePreference,
    saveCategory,
    loadCategory,
    saveGameLength,
    loadGameLength,
    
    // Game history
    saveGameResult,
    loadGameHistory,
    getFormattedGameHistory,
    getWrongWordsFromHistory,
    getGameStatistics,
    clearGameHistory,
    clearAllStorage,
    
    // Utilities
    generateGameId
};
