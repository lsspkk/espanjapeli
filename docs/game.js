// LLM functions have been moved to tipService.js
// TTS functions have been moved to tts-service.js
// Answer checking has been moved to answer-checker.js
// This game.js now uses the TipService, TTSService, and AnswerChecker modules
//
// STATE MANAGEMENT:
// The game uses a data-state attribute for clean visibility control.
// See STATE_MANAGEMENT.md for details on the 4 states: home, playing, answered, report

// Game state management
const GameState = {
    HOME: 'home',
    PLAYING: 'playing',
    ANSWERED: 'answered',
    REPORT: 'report'
};

// Game state
let currentWord = null;
let currentTranslations = null;
let currentTips = [];
let tipsShown = 0;
let totalScore = 0;
let gameActive = false;
let isFetchingTip = false;
let selectedCategory = 'all'; // Current selected category
let gameLength = 10; // Number of questions per game (10, 21, or 42)
let wordQueue = []; // Pre-randomized queue of words for current game
let currentQuestionNumber = 0; // Current question in the game
let gameQuestions = []; // Track all questions with full details for this game
let autoSpeakEnabled = true; // Auto-speak words setting
let compactModeEnabled = true; // Compact mode for mobile (default on)

// Current question tracking (reset each question)
let currentQuestionData = null;

// DOM elements
const gameContainer = document.querySelector('.game-container');
const newQuestionBtn = document.getElementById('new-question-btn');
const gameArea = document.getElementById('game-area');
const spanishWordEl = document.getElementById('spanish-word');
const tipsSection = document.getElementById('tips-section');
const showTipBtn = document.getElementById('show-tip-btn');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const resultMessage = document.getElementById('result-message');
const totalScoreEl = document.getElementById('total-score');
const possiblePointsEl = document.getElementById('possible-points');
const categorySelect = document.getElementById('category-select');
const speakWordBtn = document.getElementById('speak-word-btn');
const questionCounterEl = document.getElementById('question-counter');
const exitGameBtn = document.getElementById('exit-game-btn');
const resultArea = document.getElementById('result-area');
const correctAnswerDisplay = document.getElementById('correct-answer-display');
const pointsEarnedDisplay = document.getElementById('points-earned-display');
const reactionMessages = document.getElementById('reaction-messages');
const nextQuestionBtn = document.getElementById('next-question-btn');
const gameReport = document.getElementById('game-report');
const reportStats = document.getElementById('report-stats');
const wrongAnswersSection = document.getElementById('wrong-answers-section');
const newGameBtn = document.getElementById('new-game-btn');
const scoreDisplay = document.querySelector('.score-display');
const autoSpeakCheckbox = document.getElementById('auto-speak-checkbox');
const compactModeCheckbox = document.getElementById('compact-mode-checkbox');
const gameLengthRadios = document.querySelectorAll('input[name="game-length"]');
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');
const wrongWordsList = document.getElementById('wrong-words-list');

// Tip tab elements
const tipTabs = document.querySelectorAll('.tip-tab');
const tipContents = document.querySelectorAll('.tip-content');

// Set game state
function setGameState(state) {
    console.log('🎮 Game state:', state);
    gameContainer.setAttribute('data-state', state);
}

// Update compact mode
function updateCompactMode(enabled) {
    if (enabled) {
        gameContainer.setAttribute('data-compact', 'true');
    } else {
        gameContainer.removeAttribute('data-compact');
    }
}

// Update tip tab visual state (disabled, but shows progress)
function updateTipTabState(tipIndex) {
    tipTabs.forEach((tab, index) => {
        if (index === tipIndex) {
            tab.classList.add('active', 'fetched');
        } else if (index < tipIndex) {
            tab.classList.remove('active');
            tab.classList.add('fetched');
        } else {
            tab.classList.remove('active', 'fetched');
        }
    });
}

// Show active tip content (for mobile scrolling)
function showActiveTipContent(tipIndex) {
    tipContents.forEach((content, index) => {
        if (index === tipIndex) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Initialize tip tabs for a new question
function initializeTipTabs() {
    // Reset all tabs to initial state
    tipTabs.forEach(tab => {
        tab.classList.remove('active', 'fetched');
    });
    
    // Clear all tip content
    tipContents.forEach((content, index) => {
        content.classList.remove('active');
        content.innerHTML = '<div class="tip-placeholder">"Anna vihje" -painike tuottaa vihjeen mutta vähentää pisteitä.</div>';
    });
    
    // Activate first content area for mobile
    tipContents[0].classList.add('active');
}

// Calculate and display statistics about available words (cached tips)
async function displayWordStatistics() {
    const isOllamaDisabled = typeof window.ENV !== 'undefined' && window.ENV.OLLAMA_IN_USE === false;
    
    if (!isOllamaDisabled) {
        return; // Only show statistics when Ollama is disabled
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 WORD AVAILABILITY STATISTICS (OLLAMA_IN_USE = false)');
    console.log('═══════════════════════════════════════════════════════════');
    
    const allWords = getAllWords();
    const categories = getCategoryKeys();
    
    let totalWordsWithTips = 0;
    const categoryStats = [];
    
    // Check each word for complete cached tips
    for (const word of allWords) {
        const hasTips = await window.TipService.wordHasCompleteTips(word.spanish);
        if (hasTips) {
            totalWordsWithTips++;
        }
    }
    
    // Calculate per-category statistics
    for (const categoryKey of categories) {
        const categoryWords = getWordsFromCategory(categoryKey);
        let wordsWithTipsInCategory = 0;
        
        for (const word of categoryWords) {
            const hasTips = await window.TipService.wordHasCompleteTips(word.spanish);
            if (hasTips) {
                wordsWithTipsInCategory++;
            }
        }
        
        categoryStats.push({
            key: categoryKey,
            total: categoryWords.length,
            withTips: wordsWithTipsInCategory,
            percentage: ((wordsWithTipsInCategory / categoryWords.length) * 100).toFixed(1)
        });
    }
    
    // Display overall statistics
    const overallPercentage = ((totalWordsWithTips / allWords.length) * 100).toFixed(1);
    console.log(`📚 Total words in database: ${allWords.length}`);
    console.log(`✅ Words with complete cached tips: ${totalWordsWithTips} (${overallPercentage}%)`);
    console.log(`❌ Words without complete tips: ${allWords.length - totalWordsWithTips}`);
    console.log('');
    
    // Display per-category statistics
    console.log('📋 Breakdown by category:');
    console.log('───────────────────────────────────────────────────────────');
    categoryStats.forEach(stat => {
        const bar = '█'.repeat(Math.floor(stat.percentage / 5)) + '░'.repeat(20 - Math.floor(stat.percentage / 5));
        console.log(`  ${stat.key.padEnd(20)} ${stat.withTips.toString().padStart(3)}/${stat.total.toString().padEnd(3)} [${bar}] ${stat.percentage}%`);
    });
    console.log('═══════════════════════════════════════════════════════════');
}

/**
 * Shuffle array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} - Shuffled copy of array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Spread out duplicate words to be at least minDistance apart
 * @param {Array} words - Array of word objects
 * @param {number} minDistance - Minimum distance between same words (default 5)
 * @returns {Array} - Rearranged array with duplicates spread out
 */
function spreadOutDuplicates(words, minDistance = 5) {
    const result = [...words];
    const wordPositions = new Map(); // Track positions of each word by spanish text
    
    // Build initial position map
    result.forEach((word, index) => {
        if (!wordPositions.has(word.spanish)) {
            wordPositions.set(word.spanish, []);
        }
        wordPositions.get(word.spanish).push(index);
    });
    
    // For each word that appears multiple times
    for (const [spanish, positions] of wordPositions.entries()) {
        if (positions.length <= 1) continue; // Skip words that appear only once
        
        // Try to spread out duplicates
        for (let i = 1; i < positions.length; i++) {
            const currentPos = positions[i];
            const prevPos = positions[i - 1];
            
            // If too close, try to find a better position
            if (currentPos - prevPos < minDistance) {
                // Look for a swap position that's far enough from all instances
                for (let newPos = prevPos + minDistance; newPos < result.length; newPos++) {
                    // Check if this position is far enough from all instances of this word
                    const farEnough = positions.every((pos, idx) => {
                        if (idx >= i) return true; // Don't check positions we haven't processed yet
                        return Math.abs(newPos - pos) >= minDistance;
                    });
                    
                    // Also check that we're not creating a problem for the word at newPos
                    const wordAtNewPos = result[newPos];
                    const newPosInstances = wordPositions.get(wordAtNewPos.spanish) || [];
                    const wouldCreateProblem = newPosInstances.some(pos => 
                        pos !== newPos && Math.abs(currentPos - pos) < minDistance
                    );
                    
                    if (farEnough && !wouldCreateProblem) {
                        // Swap words
                        [result[currentPos], result[newPos]] = [result[newPos], result[currentPos]];
                        
                        // Update position maps
                        positions[i] = newPos;
                        const otherWord = result[currentPos];
                        const otherPositions = wordPositions.get(otherWord.spanish);
                        const otherIdx = otherPositions.indexOf(newPos);
                        if (otherIdx !== -1) {
                            otherPositions[otherIdx] = currentPos;
                        }
                        break;
                    }
                }
            }
        }
    }
    
    return result;
}

/**
 * Generate a randomized queue of words for the entire game
 * Words are shuffled and repeated as needed, then spread out to avoid close repetitions
 * @param {number} questionsNeeded - Number of questions for the game
 * @returns {Array} - Queue of word objects
 */
async function generateWordQueue(questionsNeeded) {
    console.log(`🔀 Generating word queue for ${questionsNeeded} questions...`);
    
    // Get available words from selected category
    let availableWords = [];
    if (selectedCategory === 'all') {
        availableWords = getAllWords();
    } else {
        availableWords = getWordsFromCategory(selectedCategory);
    }
    
    console.log(`   Available words in category: ${availableWords.length}`);
    
    // Filter words based on OLLAMA_IN_USE setting
    if (typeof window.ENV !== 'undefined' && window.ENV.OLLAMA_IN_USE === false) {
        console.log('   🔒 OLLAMA_IN_USE is false - filtering words with complete cached tips only...');
        const wordsWithTips = [];
        
        for (const word of availableWords) {
            const hasTips = await window.TipService.wordHasCompleteTips(word.spanish);
            if (hasTips) {
                wordsWithTips.push(word);
            }
        }
        
        console.log(`   ✅ Found ${wordsWithTips.length}/${availableWords.length} words with complete cached tips`);
        availableWords = wordsWithTips;
        
        if (availableWords.length === 0) {
            console.error('   ❌ No words with complete cached tips available!');
            return [];
        }
    }
    
    // Build queue by shuffling and repeating words until we have enough
    const queue = [];
    while (queue.length < questionsNeeded) {
        const shuffled = shuffleArray(availableWords);
        queue.push(...shuffled);
    }
    
    // Trim to exact length needed
    const trimmedQueue = queue.slice(0, questionsNeeded);
    
    // Spread out duplicates to be at least 5 questions apart
    const finalQueue = spreadOutDuplicates(trimmedQueue, 5);
    
    console.log(`   ✅ Generated queue with ${finalQueue.length} words`);
    return finalQueue;
}

/**
 * Select next word from the pre-generated queue
 * @returns {Object} - Next word object
 */
async function selectNextWord() {
    // If queue is empty or we're starting a new game, generate new queue
    if (wordQueue.length === 0) {
        console.log('📖 Word queue is empty, generating new queue...');
        wordQueue = await generateWordQueue(gameLength);
        
        if (wordQueue.length === 0) {
            console.error('   ❌ Failed to generate word queue!');
            return null;
        }
    }
    
    // Pop the next word from the queue
    const word = wordQueue.shift();
    console.log(`📖 Selected word ${gameLength - wordQueue.length}/${gameLength}: ${word.spanish}`);
    
    return word;
}

// Track word usage
function trackWordUsage(word) {
    console.log('   📊 Question:', currentQuestionNumber, '/', gameLength);
    console.log('   📊 Words remaining in queue:', wordQueue.length);
}

// Get tips using TipService (checks cache first, then LLM)
// Returns array of tip objects with metadata
async function getTipsForDifficulty(spanishWord, englishTranslation, finnishTranslation, difficulty, timerElementId = null) {
    console.log(`🎯 Getting ${difficulty.name} tip(s) for word:`, spanishWord);
    
    try {
        // Use TipService to get tips (cache first, LLM fallback)
        const tips = await window.TipService.getTips(
            spanishWord,
            englishTranslation,
            finnishTranslation,
            difficulty.name,
            timerElementId
        );
        
        return tips; // Returns array of tip objects
    } catch (error) {
        console.error('❌ Error getting tips:', error);
        // Return a fallback tip
        return [{
            text: `Virhe ladattaessa vihjettä. Yritä uudelleen.`,
            tipModel: 'error',
            translationModel: null,
            fromCache: false
        }];
    }
}

// Difficulty levels
const difficulties = [
    { name: 'Vaikea', instruction: 'difficult hint - be vague' },
    { name: 'Keskivaikea', instruction: 'medium hint - give some context' },
    { name: 'Helppo', instruction: 'easy hint - almost reveal the meaning' }
];

// Loading animations for tips
const loadingAnimations = [
    "🤔 AI miettii vihjettä...",
    "🧠 Prosessoidaan espanjan sanaa...",
    "📚 Etsitään hyviä vihjeitä...",
    "🔍 Analysoidaan sanaa...",
    "💭 Keksitään vihje...",
    "🎯 Lähes valmis...",
    "⚡ Hienosäädetään vastausta...",
    "🌟 Viimeistely käynnissä...",
    "🎨 Luodaan täydellinen vihje...",
    "🚀 Vihje matkalla..."
];

// Start new question
async function startNewQuestion() {
    // Check if game is complete
    if (currentQuestionNumber >= gameLength) {
        showGameReport();
        return;
    }

    // Increment question counter
    currentQuestionNumber++;
    updateQuestionCounter();
    
    // Display statistics on first question when Ollama is disabled
    if (currentQuestionNumber === 1) {
        await displayWordStatistics();
    }
    
    // Reset state
    gameActive = false;
    tipsShown = 0;
    currentTips = [];
    answerInput.value = '';
    resultMessage.className = 'result-message';
    resultMessage.style.display = 'none';
    
    newQuestionBtn.disabled = true;
    newQuestionBtn.textContent = 'Ladataan...';
    
    // Get word (checks for cached tips if OLLAMA_IN_USE is false)
    currentTranslations = await selectNextWord();
    
    if (!currentTranslations || !currentTranslations.spanish) {
        spanishWordEl.textContent = 'Virhe: ei sanoja saatavilla';
        newQuestionBtn.disabled = false;
        newQuestionBtn.textContent = 'Seuraava kysymys';
        return;
    }
    
    trackWordUsage(currentTranslations);

    // Set state to playing (this shows game area and hides home screen)
    setGameState(GameState.PLAYING);

    currentWord = currentTranslations.spanish;
    spanishWordEl.textContent = currentWord;
    
    // Initialize question tracking data
    currentQuestionData = {
        questionNumber: currentQuestionNumber,
        spanish: currentTranslations.spanish,
        finnish: currentTranslations.finnish,
        english: currentTranslations.english || '',
        userAnswer: '',
        isCorrect: false,
        pointsEarned: 0,
        maxPoints: 10,
        tipsRequested: 0,
        tipsShown: []
    };
    
    // Initialize tip tabs and button
    initializeTipTabs();
    updateTipButtonText(0); // Start with "Anna vihje 1"
    
    // Speak the Spanish word if auto-speak is enabled
    console.log('🔊 Auto-speak check:', autoSpeakEnabled, 'Checkbox state:', autoSpeakCheckbox.checked);
    if (autoSpeakEnabled) {
        setTimeout(() => {
            window.TTSService.speakSpanish(currentWord);
        }, 300); // Small delay for better UX
    }
    
    // Reset points
    possiblePointsEl.textContent = '10';
    updateSubmitButtonText(10);

    // Enable game
    gameActive = true;
    submitBtn.disabled = false;
    answerInput.disabled = false;
    answerInput.focus();
    newQuestionBtn.disabled = false;
    newQuestionBtn.textContent = 'Seuraava kysymys';
}

// Update question counter display
function updateQuestionCounter() {
    questionCounterEl.textContent = `Kysymys: ${currentQuestionNumber}/${gameLength}`;
}

// Get random reaction message (just one)
function getRandomReaction(isCorrect) {
    const messages = isCorrect ? congratulationMessages : sympathyMessages;
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
}

// Show result with reaction message
function showResult(isCorrect, earnedPoints) {
    // Set state to answered (this shows result area and hides input controls)
    setGameState(GameState.ANSWERED);
    
    // Display correct answer
    correctAnswerDisplay.innerHTML = `<strong>${currentTranslations.spanish}</strong> = ${currentTranslations.finnish}`;
    
    // Display points earned
    if (earnedPoints > 0) {
        pointsEarnedDisplay.innerHTML = `+${earnedPoints} pistettä`;
        pointsEarnedDisplay.className = 'points-earned-display positive';
    } else {
        pointsEarnedDisplay.innerHTML = `0 pistettä`;
        pointsEarnedDisplay.className = 'points-earned-display zero';
    }
    
    // Display one random reaction message (separate lines for each language)
    const reaction = getRandomReaction(isCorrect);
    const [spanish, finnish] = reaction.split(' | ');
    reactionMessages.innerHTML = `
        <div class="reaction-spanish">${spanish}</div>
        <div class="reaction-finnish">${finnish}</div>
    `;
    
    // Focus next question button
    nextQuestionBtn.focus();
}

// Update submit button text with current points
function updateSubmitButtonText(points) {
    if (points === 1) {
        submitBtn.textContent = `${points} pisteen vastaus`;
    } else {
        submitBtn.textContent = `${points} pisteen vastaus`;
    }
}

// Update tip button text
function updateTipButtonText(tipIndex) {
    if (tipIndex >= 3) {
        showTipBtn.textContent = 'Kaikki vihjeet näytetty';
        showTipBtn.disabled = true;
    } else {
        showTipBtn.textContent = `Anna vihje ${tipIndex + 1}`;
        showTipBtn.disabled = false;
    }
}

// Show next tip sequentially
async function showNextTip() {
    if (!gameActive || isFetchingTip) {
        console.log('⚠️ Cannot show tip - game inactive or already fetching');
        return;
    }

    const tipIndex = tipsShown; // Current tip to fetch (0, 1, or 2)
    
    if (tipIndex >= 3) {
        console.log('⚠️ All tips already shown');
        return;
    }
    
    // Disable button while fetching
    showTipBtn.disabled = true;
    showTipBtn.textContent = 'Ladataan vihjettä...';
    
    // Get the target content area
    const tipContentEl = tipContents[tipIndex];
    
    // Show loading animation
    tipContentEl.innerHTML = `
        <div class="loading" id="tip-loading-${tipIndex}">
            ${loadingAnimations[0]} 
            <span id="tip-timer-${tipIndex}">⏱️ 0s</span>
        </div>
    `;
    
    // Animated loading text
    let animationIndex = 0;
    const animationInterval = setInterval(() => {
        animationIndex = (animationIndex + 1) % loadingAnimations.length;
        const loadingEl = document.getElementById(`tip-loading-${tipIndex}`);
        const timerEl = document.getElementById(`tip-timer-${tipIndex}`);
        if (loadingEl && timerEl) {
            loadingEl.innerHTML = `${loadingAnimations[animationIndex]} ${timerEl.outerHTML}`;
        }
    }, 10000);
    
    // Fetch the tips with timer
    isFetchingTip = true;
    const difficulty = difficulties[tipIndex];
    const tips = await getTipsForDifficulty(
        currentTranslations.spanish,
        currentTranslations.english,
        currentTranslations.finnish,
        difficulty,
        `tip-timer-${tipIndex}`
    );
    
    // Stop animation
    clearInterval(animationInterval);
    isFetchingTip = false;
    
    // Store tips
    currentTips[tipIndex] = {
        difficulty: difficulty.name,
        tips: tips
    };
    
    // Display tips in the content area
    displayTipInTab(tipIndex, tips);
    
    // Update tab state
    updateTipTabState(tipIndex);
    
    // Show this tip content on mobile
    showActiveTipContent(tipIndex);
    
    // Update tipsShown count
    tipsShown++;
    
    // Track in current question data
    if (currentQuestionData) {
        currentQuestionData.tipsRequested = tipsShown;
        currentQuestionData.tipsShown.push(difficulty.name);
    }
    
    // Update points
    const pointsMap = [10, 5, 3, 1];
    const newPoints = pointsMap[tipsShown];
    possiblePointsEl.textContent = newPoints;
    updateSubmitButtonText(newPoints);
    
    // Update button text for next tip
    updateTipButtonText(tipsShown);
    
    // Speak the first tip in Finnish if auto-speak is enabled
    if (autoSpeakEnabled && tips.length > 0) {
        setTimeout(() => {
            window.TTSService.speakFinnish(tips[0].text);
        }, 300);
    }
}

// Display tip in a specific tab
function displayTipInTab(tipIndex, tips) {
    const tipContentEl = tipContents[tipIndex];
    
    if (!tips || tips.length === 0) {
        tipContentEl.innerHTML = '<div class="tip-placeholder">Vihjettä ei voitu ladata</div>';
        return;
    }
    
    // Create content
    let html = '';
    
    // Display ALL tips received for this difficulty
    tips.forEach((tipObj, index) => {
        // Create metadata display
        let metadataHtml = '';
        if (tipObj.tipModel || tipObj.translationModel) {
            const models = [];
            if (tipObj.tipModel) models.push(`tip: ${tipObj.tipModel}`);
            if (tipObj.translationModel) models.push(`trans: ${tipObj.translationModel}`);
            metadataHtml = `<div style="font-size: 0.65em; color: #9ca3af; margin-top: 4px;">${models.join(' | ')}</div>`;
        }
        
        html += `
            <div class="tip-item" style="margin-bottom: ${index < tips.length - 1 ? '12px' : '8px'};">
                ${tipObj.text}${metadataHtml}
            </div>
        `;
    });
    
    tipContentEl.innerHTML = html;
}

// Check answer
function checkAnswer() {
    if (!gameActive || !currentTranslations) {
        return;
    }

    const userAnswer = answerInput.value.trim();
    const correctAnswer = currentTranslations.finnish;

    const pointsMap = [10, 5, 3, 1];
    const earnedPoints = pointsMap[tipsShown];
    const isCorrect = window.AnswerChecker.isCorrect(userAnswer, correctAnswer);

    // Update current question data
    if (currentQuestionData) {
        currentQuestionData.userAnswer = answerInput.value.trim();
        currentQuestionData.isCorrect = isCorrect;
        currentQuestionData.pointsEarned = isCorrect ? earnedPoints : 0;
        currentQuestionData.maxPoints = 10;
        
        // Add to game questions array
        gameQuestions.push({ ...currentQuestionData });
    }

    if (isCorrect) {
        // Correct answer (or close enough)
        totalScore += earnedPoints;
        totalScoreEl.textContent = totalScore;
        showResult(true, earnedPoints);
    } else {
        // Incorrect answer
        showResult(false, 0);
    }

    // Disable game controls
    gameActive = false;
    submitBtn.disabled = true;
    answerInput.disabled = true;
    showTipBtn.disabled = true;
}

// Show game report at end
function showGameReport() {
    // Set state to report (this shows report and hides everything else)
    setGameState(GameState.REPORT);
    
    // Calculate statistics from gameQuestions
    const totalQuestions = gameLength;
    const correctCount = gameQuestions.filter(q => q.isCorrect).length;
    const incorrectCount = gameQuestions.filter(q => !q.isCorrect).length;
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const maxPossibleScore = totalQuestions * 10;
    const scorePercentage = Math.round((totalScore / maxPossibleScore) * 100);
    
    // Get wrong answers from gameQuestions
    const wrongAnswers = gameQuestions.filter(q => !q.isCorrect);
    
    // Save game result to local storage with new format
    const categoryName = selectedCategory === 'all' ? 'Kaikki sanat' : getCategoryName(selectedCategory);
    window.GameStorage.saveGameResult({
        gameType: window.GameStorage.GAME_TYPES.SPANISH_TO_FINNISH,
        category: selectedCategory,
        categoryName: categoryName,
        gameLength: gameLength,
        totalScore: totalScore,
        maxPossibleScore: maxPossibleScore,
        summary: {
            correctCount: correctCount,
            incorrectCount: incorrectCount,
            accuracy: accuracy
        },
        questions: gameQuestions
    });
    console.log('💾 Game result saved to history with', gameQuestions.length, 'questions');
    
    // Display statistics
    reportStats.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Kysymyksiä yhteensä:</span>
            <span class="stat-value">${totalQuestions}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Oikeat vastaukset:</span>
            <span class="stat-value">${correctCount}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Väärät vastaukset:</span>
            <span class="stat-value">${incorrectCount}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Tarkkuus:</span>
            <span class="stat-value">${accuracy}%</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Pisteet:</span>
            <span class="stat-value">${totalScore} / ${maxPossibleScore} (${scorePercentage}%)</span>
        </div>
    `;
    
    // Display wrong answers if any
    if (wrongAnswers.length > 0) {
        let wrongAnswersHTML = '<h3>Väärät vastaukset:</h3>';
        wrongAnswers.forEach(item => {
            // Show tips used if any
            const tipsInfo = item.tipsRequested > 0 
                ? `<br><small style="color: #9ca3af;">Vihjeitä käytetty: ${item.tipsRequested} (${item.tipsShown.join(', ')})</small>`
                : '';
            wrongAnswersHTML += `
                <div class="wrong-answer-item">
                    <span class="wrong-word">${item.spanish}</span>
                    <span class="correct-translation">= ${item.finnish}</span>
                    ${item.userAnswer ? `<br><small style="color: #6b7280;">Sinun vastauksesi: ${item.userAnswer}</small>` : ''}
                    ${tipsInfo}
                </div>
            `;
        });
        wrongAnswersSection.innerHTML = wrongAnswersHTML;
    } else {
        wrongAnswersSection.innerHTML = '<p style="color: #10b981; font-weight: bold; text-align: center;">🎉 Täydellinen! Ei yhtään väärää vastausta!</p>';
    }
}

// Reset game
function resetGame() {
    currentQuestionNumber = 0;
    totalScore = 0;
    gameQuestions = [];
    currentQuestionData = null;
    wordQueue = [];
    gameActive = false;
    
    totalScoreEl.textContent = '0';
    updateQuestionCounter();
    
    // Set state back to home
    setGameState(GameState.HOME);
    
    // Refresh history display
    displayGameHistory();
    displayWrongWords();
    
    newQuestionBtn.textContent = 'Aloita peli';
}

// Exit game early
function exitGame() {
    resetGame();
}

// Initialize category selector
async function initializeCategorySelector() {
    console.log('🎯 Initializing category selector...');
    
    // Get categories in recommended learning order
    const orderedCategories = getCategoriesByLearningOrder();
    const isOllamaDisabled = typeof window.ENV !== 'undefined' && window.ENV.OLLAMA_IN_USE === false;
    
    let availableCategories = orderedCategories;
    
    // Filter categories when Ollama is disabled
    if (isOllamaDisabled) {
        console.log('🔒 OLLAMA_IN_USE is false - filtering categories with available words...');
        
        const categoriesWithWords = [];
        
        for (const category of orderedCategories) {
            const categoryWords = getWordsFromCategory(category.key);
            let hasAnyWordWithTips = false;
            
            // Check if at least one word has complete tips
            for (const word of categoryWords) {
                const hasTips = await window.TipService.wordHasCompleteTips(word.spanish);
                if (hasTips) {
                    hasAnyWordWithTips = true;
                    break; // Found at least one, no need to check more
                }
            }
            
            if (hasAnyWordWithTips) {
                categoriesWithWords.push(category);
            } else {
                console.log(`   ⚠️ Skipping category "${category.key}" - no words with complete tips`);
            }
        }
        
        availableCategories = categoriesWithWords;
        console.log(`   ✅ ${availableCategories.length}/${orderedCategories.length} categories have words with tips`);
    }
    
    // Add available categories to dropdown in recommended learning order
    availableCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.key;
        
        // Add tier indicator and category name
        const tierEmoji = ['🔴', '🟡', '🟢', '🔵', '🟣'][category.tier - 1];
        option.textContent = `${tierEmoji} ${getCategoryName(category.key)}`;
        
        // Add data attributes for potential future filtering
        option.dataset.tier = category.tier;
        option.dataset.difficulty = category.difficulty;
        option.dataset.cefrLevel = category.cefrLevel;
        option.dataset.priority = category.priority;
        
        // Add tooltip with learning note
        option.title = `${category.description} (${category.cefrLevel})`;
        
        categorySelect.appendChild(option);
    });
    
    console.log(`✅ Added ${availableCategories.length} categories in recommended learning order`);
}

// Handle category change
function handleCategoryChange() {
    selectedCategory = categorySelect.value;
    console.log('📂 Category changed to:', selectedCategory, getCategoryName(selectedCategory));
    
    // Save category preference
    window.GameStorage.saveCategory(selectedCategory);
    
    // Reset word queue when changing category (new words will be loaded on game start)
    wordQueue = [];
}

// Display game history
function displayGameHistory() {
    const history = window.GameStorage.getFormattedGameHistory();
    
    if (history.length === 0) {
        historyList.innerHTML = '<p style="color: #6b7280; font-style: italic;">Ei vielä pelattuja pelejä</p>';
        return;
    }
    
    let html = '<ul class="history-items">';
    history.forEach(record => {
        const percentage = Math.round((record.totalScore / record.maxPossibleScore) * 100);
        const accuracyColor = percentage >= 80 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
        const questionsInfo = `${record.summary.correctCount}/${record.gameLength}`;
        
        html += `
            <li class="history-item">
                <span class="history-date">${record.datetime}</span>
                <span class="history-category">${record.categoryName}</span>
                <span class="history-questions">${questionsInfo}</span>
                <span class="history-score" style="color: ${accuracyColor};">
                    ${record.totalScore}p (${record.summary.accuracy}%)
                </span>
            </li>
        `;
    });
    html += '</ul>';
    
    historyList.innerHTML = html;
}

// Display frequently wrong words
function displayWrongWords() {
    const wrongWords = window.GameStorage.getWrongWordsFromHistory(10);
    
    if (wrongWords.length === 0) {
        wrongWordsList.innerHTML = '<p style="color: #6b7280; font-style: italic;">Ei virheellisiä vastauksia vielä</p>';
        return;
    }
    
    let html = '<table class="wrong-words-table">';
    wrongWords.forEach(word => {
        // Show count as times wrong
        const countLabel = word.count === 1 ? '1×' : `${word.count}×`;
        html += `
            <tr>
                <td class="word-spanish">${word.spanish}</td>
                <td class="word-finnish">${word.finnish}</td>
                <td class="word-count" title="${word.count} kertaa väärin">${countLabel}</td>
            </tr>
        `;
    });
    html += '</table>';
    
    wrongWordsList.innerHTML = html;
}

// Event listeners
newQuestionBtn.addEventListener('click', startNewQuestion);
showTipBtn.addEventListener('click', showNextTip);
submitBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && gameActive) {
        checkAnswer();
    }
});
categorySelect.addEventListener('change', handleCategoryChange);
exitGameBtn.addEventListener('click', exitGame);
nextQuestionBtn.addEventListener('click', startNewQuestion);
newGameBtn.addEventListener('click', resetGame);
autoSpeakCheckbox.addEventListener('change', (e) => {
    autoSpeakEnabled = e.target.checked;
    window.GameStorage.saveAutoSpeakPreference(autoSpeakEnabled);
    console.log('🔊 Auto-speak:', autoSpeakEnabled ? 'enabled' : 'disabled');
});
compactModeCheckbox.addEventListener('change', (e) => {
    compactModeEnabled = e.target.checked;
    window.GameStorage.saveCompactModePreference(compactModeEnabled);
    updateCompactMode(compactModeEnabled);
    console.log('📱 Compact mode:', compactModeEnabled ? 'enabled' : 'disabled');
});

gameLengthRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        gameLength = parseInt(e.target.value, 10);
        window.GameStorage.saveGameLength(gameLength);
        updateQuestionCounter();
        console.log('📏 Game length:', gameLength);
    });
});

// Speaker button to replay Spanish word
speakWordBtn.addEventListener('click', () => {
    if (currentWord) {
        window.TTSService.speakSpanish(currentWord);
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize TipService - preload the tips data
    window.TipService.loadTipsData()
        .then(() => {
            console.log('✅ TipService initialized with cached tips');
        })
        .catch(error => {
            console.error('⚠️ Could not preload tips data:', error);
            console.log('ℹ️ Tips will be loaded on-demand');
        });
    
    await initializeCategorySelector();
    
    // Load saved preferences
    const savedAutoSpeak = window.GameStorage.loadAutoSpeakPreference();
    autoSpeakEnabled = savedAutoSpeak;
    autoSpeakCheckbox.checked = savedAutoSpeak;
    console.log('📂 Auto-speak loaded from storage:', savedAutoSpeak);
    
    const savedCompactMode = window.GameStorage.loadCompactModePreference();
    compactModeEnabled = savedCompactMode;
    compactModeCheckbox.checked = savedCompactMode;
    updateCompactMode(savedCompactMode);
    console.log('📂 Compact mode loaded from storage:', savedCompactMode);
    
    const savedGameLength = window.GameStorage.loadGameLength();
    gameLength = savedGameLength;
    // Set the radio button
    const lengthRadio = document.querySelector(`input[name="game-length"][value="${savedGameLength}"]`);
    if (lengthRadio) {
        lengthRadio.checked = true;
    }
    console.log('📂 Game length loaded from storage:', savedGameLength);
    
    const savedCategory = window.GameStorage.loadCategory();
    
    // Check if saved category is still available (it may have been filtered out)
    const categoryOption = Array.from(categorySelect.options).find(opt => opt.value === savedCategory);
    
    if (categoryOption) {
        selectedCategory = savedCategory;
        categorySelect.value = savedCategory;
        console.log('📂 Category loaded from storage:', savedCategory);
    } else {
        // Saved category not available, use default (all)
        selectedCategory = 'all';
        categorySelect.value = 'all';
        console.log(`⚠️ Saved category "${savedCategory}" not available, defaulting to "all"`);
        window.GameStorage.saveCategory('all'); // Update saved preference
    }
    
    // Display game history and wrong words
    displayGameHistory();
    displayWrongWords();
    
    // Initialize question counter
    updateQuestionCounter();
    
    // Set initial state to home
    setGameState(GameState.HOME);
    
    // Initialize TTS service
    window.TTSService.init();
    
    console.log(`🎮 Espanjapeli v${window.GameStorage.GAME_VERSION} valmis! Valitse kategoria ja aloita.`);
    
    // Display version in footer if element exists
    const versionEl = document.getElementById('game-version');
    if (versionEl) {
        versionEl.textContent = `v${window.GameStorage.GAME_VERSION}`;
    }
});


