// Tip Service - Manages cached tips and LLM fallback

// Default configuration (can be overridden by env.js)
const DEFAULT_CONFIG = {
    OLLAMA_API_URL: 'http://localhost:11434/api/generate',
    OLLAMA_MODEL: 'llama3.2:3b',
    OLLAMA_IN_USE: false  // Default to false - only use cached tips unless env.js enables LLM
};

// Get configuration from ENV or use defaults
function getConfig() {
    if (typeof window.ENV !== 'undefined') {
        return {
            OLLAMA_API_URL: window.ENV.OLLAMA_API_URL || DEFAULT_CONFIG.OLLAMA_API_URL,
            OLLAMA_MODEL: window.ENV.OLLAMA_MODEL || DEFAULT_CONFIG.OLLAMA_MODEL,
            OLLAMA_IN_USE: window.ENV.OLLAMA_IN_USE !== undefined ? window.ENV.OLLAMA_IN_USE : DEFAULT_CONFIG.OLLAMA_IN_USE
        };
    } else {
        console.warn('⚠️ env.js not found - using defaults (OLLAMA_IN_USE = false)');
        console.warn('ℹ️ Create game/env.js from env.example.js to enable LLM or customize settings');
        return DEFAULT_CONFIG;
    }
}

// Configuration for translation model preference order
const TRANSLATION_MODEL_PREFERENCE = [
    'llama3.2:3b',
    'azureTranslatorService'
];

// Language mapping for the game (difficulty names match the game's difficulty system)
const DIFFICULTY_MAP = {
    'Vaikea': 'hard',      // Hardest - most vague
    'Keskivaikea': 'medium', // Medium
    'Helppo': 'easy'       // Easiest - most revealing
};

// Cache for loaded tips data
let tipsData = null;

/**
 * Load tips from the JSON file
 */
async function loadTipsData() {
    if (tipsData) {
        return tipsData; // Already loaded
    }
    
    try {
        console.log('📚 Loading tips data from words_tips_translations.json...');
        const response = await fetch('words_tips_translations.json');
        if (!response.ok) {
            throw new Error(`Failed to load tips: ${response.status}`);
        }
        tipsData = await response.json();
        console.log('✅ Tips data loaded successfully');
        return tipsData;
    } catch (error) {
        console.error('❌ Error loading tips data:', error);
        throw error;
    }
}

/**
 * Sort tips by translation model preference
 * @param {Array} tips - Array of tip objects
 * @returns {Array} - Sorted tips array
 */
function sortTipsByModelPreference(tips) {
    return tips.sort((a, b) => {
        const aIndex = TRANSLATION_MODEL_PREFERENCE.indexOf(a.translationModel);
        const bIndex = TRANSLATION_MODEL_PREFERENCE.indexOf(b.translationModel);
        
        // If model not in preference list, put it at the end
        const aRank = aIndex === -1 ? 999 : aIndex;
        const bRank = bIndex === -1 ? 999 : bIndex;
        
        return aRank - bRank;
    });
}

/**
 * Find cached tips for a specific word and difficulty
 * @param {string} spanishWord - The Spanish word
 * @param {string} difficultyName - Difficulty name ('Vaikea', 'Keskivaikea', 'Helppo')
 * @param {string} language - Language for tips ('finnish' or 'english')
 * @returns {Array} - Array of matching tips with metadata, or empty array
 */
async function findCachedTips(spanishWord, difficultyName, language = 'finnish') {
    const data = await loadTipsData();
    const difficulty = DIFFICULTY_MAP[difficultyName];
    
    if (!difficulty) {
        console.warn('⚠️ Unknown difficulty:', difficultyName);
        return [];
    }
    
    console.log(`🔍 Searching for cached ${language} tips: "${spanishWord}" (${difficultyName}/${difficulty})`);
    
    // Search through all categories
    for (const categoryKey in data) {
        const category = data[categoryKey];
        if (!category.words) continue;
        
        // Find the word
        const word = category.words.find(w => w.spanish === spanishWord);
        if (!word || !word.learningTips) continue;
        
        // Find all tips matching language and difficulty
        const matchingTips = word.learningTips.filter(tip => 
            tip.language === language && 
            tip.difficulty === difficulty &&
            tip.text && tip.text.trim().length > 0
        );
        
        if (matchingTips.length > 0) {
            // Sort by model preference and return with metadata
            const sortedTips = sortTipsByModelPreference(matchingTips);
            
            console.log(`✅ Found ${sortedTips.length} cached tip(s)`);
            sortedTips.forEach((tip, index) => {
                console.log(`   ${index + 1}. Model: ${tip.translationModel || 'N/A'} | Tip: ${tip.text.substring(0, 50)}...`);
            });
            
            return sortedTips.map(tip => ({
                text: tip.text,
                tipModel: tip.tipModel,
                translationModel: tip.translationModel,
                difficulty: difficulty,
                fromCache: true
            }));
        }
    }
    
    console.log('❌ No cached tips found');
    return [];
}

/**
 * Simulate "thinking time" for cached responses
 * Usually 500ms-1s, sometimes 2s
 * @returns {Promise} - Resolves after random delay
 */
function simulateThinking() {
    // 80% chance: 500ms-1000ms
    // 20% chance: 1500ms-2000ms
    const isLonger = Math.random() < 0.2;
    const delay = isLonger 
        ? 1500 + Math.random() * 500  // 1500-2000ms
        : 500 + Math.random() * 500;  // 500-1000ms
    
    console.log(`💭 Simulating thinking time: ${Math.round(delay)}ms`);
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Ask LLM for a tip (fallback when no cached tip exists)
 * @param {string} prompt - The prompt to send
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} timerElementId - Optional element ID for timer display
 * @param {number} maxTokens - Max tokens for response
 * @returns {Promise<object>} - Tip object with text and metadata
 */
async function askLLM(prompt, timeoutMs = 60000, timerElementId = null, maxTokens = 100) {
    const config = getConfig();
    
    console.log('🔵 Sending prompt to LLM:', prompt);
    console.log('📡 API endpoint:', config.OLLAMA_API_URL);
    console.log('⏱️ Timeout set to:', timeoutMs, 'ms', '| Max tokens:', maxTokens);
    
    // Start timer display
    let startTime = Date.now();
    let timerInterval = null;
    
    if (timerElementId) {
        timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const timerEl = document.getElementById(timerElementId);
            if (timerEl) {
                timerEl.textContent = `⏱️ ${elapsed}s`;
            }
        }, 1000);
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.warn('⚠️ Request timeout - aborting...');
        controller.abort();
    }, timeoutMs);
    
    try {
        const response = await fetch(config.OLLAMA_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: config.OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: 0.2,
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        if (timerInterval) clearInterval(timerInterval);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ LLM Response:', data.response);
        console.log('📊 Tokens used:', data.eval_count, '/', maxTokens);
        
        if (data.error) {
            throw new Error(`LLM Error: ${data.error}`);
        }
        
        return {
            text: data.response,
            tipModel: config.OLLAMA_MODEL,
            translationModel: null,
            fromCache: false
        };
    } catch (error) {
        clearTimeout(timeoutId);
        if (timerInterval) clearInterval(timerInterval);
        
        if (error.name === 'AbortError') {
            console.error('❌ Request timed out after', timeoutMs, 'ms');
            throw new Error('Request timed out');
        }
        console.error('❌ Fetch error:', error);
        throw error;
    }
}

/**
 * Get tips for a word - tries cache first, falls back to LLM
 * Returns ALL matching Finnish tips from cache if available
 * @param {string} spanishWord - The Spanish word
 * @param {string} englishTranslation - English translation
 * @param {string} finnishTranslation - Finnish translation
 * @param {string} difficultyName - Difficulty name ('Vaikea', 'Keskivaikea', 'Helppo')
 * @param {string} timerElementId - Optional timer element ID
 * @returns {Promise<Array>} - Array of tip objects with text and metadata
 */
async function getTips(spanishWord, englishTranslation, finnishTranslation, difficultyName, timerElementId = null) {
    console.log(`🎯 Getting tips for: ${spanishWord} (${difficultyName})`);
    
    // Try to get cached tips first
    const cachedTips = await findCachedTips(spanishWord, difficultyName, 'finnish');
    
    if (cachedTips.length > 0) {
        // Simulate thinking time for cached response
        await simulateThinking();
        console.log(`✅ Returning ${cachedTips.length} cached tip(s)`);
        return cachedTips;
    }
    
    // Check if Ollama is enabled before attempting LLM fallback
    const config = getConfig();
    if (!config.OLLAMA_IN_USE) {
        console.warn('⚠️ No cached tips available and OLLAMA_IN_USE is false - cannot generate tips');
        throw new Error('No cached tips available and LLM is disabled');
    }
    
    // No cached tips - fall back to LLM
    console.log('⚠️ No cached tips available, falling back to LLM...');
    
    // Create descriptive prompt based on difficulty
    let prompt;
    if (difficultyName === 'Vaikea') {
        prompt = `Sana: ${englishTranslation}. Anna epämääräinen vihje suomeksi. Älä mainitse sanaa. Esim: "Se on jotain..."`;
    } else if (difficultyName === 'Keskivaikea') {
        prompt = `Sana: ${englishTranslation}. Anna keskivaikea vihje suomeksi. Kuvaa sanaa. Esim: "Sitä käytetään..."`;
    } else {
        prompt = `Sana: ${englishTranslation}. Anna helppo vihje suomeksi. Kuvaa tarkasti. Esim: "Se on..."`;
    }
    
    try {
        const llmTip = await askLLM(prompt, 45000, timerElementId, 800);
        
        // Clean up the response
        let cleanText = llmTip.text.trim();
        cleanText = cleanText.replace(/^[123][:.)]\s*/, ''); // Remove numbering
        cleanText = cleanText.replace(/^["']|["']$/g, ''); // Remove quotes
        cleanText = cleanText.split('\n')[0]; // Take only first line
        cleanText = cleanText.substring(0, 200); // Limit length
        
        // Check if tip is valid
        if (cleanText.length < 10 || cleanText.toLowerCase().includes(englishTranslation.toLowerCase())) {
            console.warn('⚠️ LLM tip too short or contains answer, using fallback');
            cleanText = getFallbackTip(finnishTranslation, difficultyName);
            return [{
                text: cleanText,
                tipModel: 'fallback',
                translationModel: null,
                fromCache: false
            }];
        }
        
        return [{
            text: cleanText,
            tipModel: llmTip.tipModel,
            translationModel: llmTip.translationModel,
            fromCache: false
        }];
    } catch (error) {
        console.error('❌ Error getting LLM tip:', error);
        const fallbackText = getFallbackTip(finnishTranslation, difficultyName);
        return [{
            text: fallbackText,
            tipModel: 'fallback',
            translationModel: null,
            fromCache: false
        }];
    }
}

/**
 * Generate fallback tips in proper Finnish
 * @param {string} finnishWord - The Finnish word
 * @param {string} difficultyName - Difficulty name
 * @returns {string} - Fallback tip text
 */
function getFallbackTip(finnishWord, difficultyName) {
    const firstLetter = finnishWord.charAt(0).toUpperCase();
    
    if (difficultyName === 'Vaikea') {
        return `Se alkaa kirjaimella ${firstLetter}.`;
    } else if (difficultyName === 'Keskivaikea') {
        const length = finnishWord.length;
        return `Sana alkaa ${firstLetter}-kirjaimella ja siinä on ${length} kirjainta.`;
    } else {
        // Easy - show more letters
        const hint = finnishWord.substring(0, Math.ceil(finnishWord.length / 2));
        return `Sana alkaa näin: ${hint}...`;
    }
}

/**
 * Check if a word has cached tips for all difficulties
 * @param {string} spanishWord - The Spanish word to check
 * @returns {Promise<boolean>} - True if word has cached tips for all difficulties
 */
async function wordHasCompleteTips(spanishWord) {
    const difficulties = ['Vaikea', 'Keskivaikea', 'Helppo'];
    
    for (const difficulty of difficulties) {
        const cachedTips = await findCachedTips(spanishWord, difficulty, 'finnish');
        if (cachedTips.length === 0) {
            return false;
        }
    }
    
    return true;
}

// Export functions for use in game.js
window.TipService = {
    getTips,
    loadTipsData,
    wordHasCompleteTips,
    TRANSLATION_MODEL_PREFERENCE
};

