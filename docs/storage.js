// Local Storage Management for Espanjapeli

const STORAGE_KEYS = {
    AUTO_SPEAK: 'espanjapeli_auto_speak',
    CATEGORY: 'espanjapeli_category',
    GAME_HISTORY: 'espanjapeli_game_history'
};

const MAX_HISTORY_RECORDS = 20;
const WRONG_WORDS_HISTORY_COUNT = 10;

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
 * Save game result to history
 * @param {Object} gameResult - Game result object
 */
function saveGameResult(gameResult) {
    try {
        const history = loadGameHistory();
        
        // Add new result with timestamp
        const result = {
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
        console.log('💾 Game result saved to history');
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
            console.log('📂 Game history loaded:', history.length, 'records');
            return history;
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
            datetime: `${dateStr} ${timeStr}`,
            category: record.category || 'Kaikki',
            categoryName: record.categoryName || 'Kaikki sanat',
            score: record.score,
            maxScore: record.maxScore,
            correctCount: record.correctCount,
            totalQuestions: record.totalQuestions,
            wrongAnswers: record.wrongAnswers || []
        };
    });
}

/**
 * Get wrong words from last N games
 * @param {number} count - Number of recent games to check
 * @returns {Object} - Object with spanish words as keys and count as values
 */
function getWrongWordsFromHistory(count = WRONG_WORDS_HISTORY_COUNT) {
    const history = loadGameHistory();
    const recentGames = history.slice(0, count);
    
    const wrongWordsMap = {};
    
    recentGames.forEach(game => {
        if (game.wrongAnswers && Array.isArray(game.wrongAnswers)) {
            game.wrongAnswers.forEach(item => {
                const key = `${item.spanish}|||${item.finnish}`; // Use separator to split later
                wrongWordsMap[key] = (wrongWordsMap[key] || 0) + 1;
            });
        }
    });
    
    // Convert to array and sort by count (descending)
    const wrongWordsArray = Object.entries(wrongWordsMap).map(([key, count]) => {
        const [spanish, finnish] = key.split('|||');
        return { spanish, finnish, count };
    });
    
    wrongWordsArray.sort((a, b) => b.count - a.count);
    
    return wrongWordsArray;
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

// Export functions
window.GameStorage = {
    saveAutoSpeakPreference,
    loadAutoSpeakPreference,
    saveCategory,
    loadCategory,
    saveGameResult,
    loadGameHistory,
    getFormattedGameHistory,
    getWrongWordsFromHistory,
    clearGameHistory
};

