<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import { tts } from '$lib/services/tts';
	import { 
		category, 
		gameLength, 
		gameHistory,
		autoSpeak,
		type QuestionResult 
	} from '$lib/stores/progress';
	import { theme, availableThemes, type Theme } from '$lib/stores/theme';
	import { 
		getAllWords, 
		getWordsFromCategory, 
		getCategoryName,
		type Word 
	} from '$lib/data/words';
	import { 
		getCategoriesByLearningOrder, 
		getTierEmoji,
		type CategoryWithKey 
	} from '$lib/data/categoryConfig';
	import { 
		selectGameWords, 
		recordGameCompletion, 
		getPreviousGames 
	} from '$lib/services/wordSelection';
	import { 
		wordKnowledge, 
		type LanguageDirection, 
		type AnswerQuality 
	} from '$lib/stores/wordKnowledge';
	import OsaaminenModal from '$lib/components/OsaaminenModal.svelte';

	// Game states
	type GameState = 'home' | 'playing' | 'feedback' | 'report';
	let gameState: GameState = 'home';

	// Question language mode: 'spanish' = show Spanish, pick Finnish; 'finnish' = show Finnish, pick Spanish
	type QuestionLanguage = 'spanish' | 'finnish';
	let questionLanguage: QuestionLanguage = 'spanish';
	
	// Storage key for question language preference
	const QUESTION_LANGUAGE_KEY = 'yhdistasanat_question_language';

	// Game variables
	let currentWord: Word | null = null;
	let currentQuestionNumber = 0;
	let totalScore = 0;
	let wordQueue: Word[] = [];
	let gameQuestions: QuestionResult[] = [];
	let currentQuestionData: QuestionResult | null = null;
	let gameStartTime: number = 0;
	let gameEndTime: number = 0;
	
	// Report statistics
	let reportFirstTryCount = 0;
	let reportSecondTryCount = 0;
	let reportThirdTryCount = 0;
	let reportFailedCount = 0;

	// Answer options for current question
	let answerOptions: Word[] = [];
	let triesRemaining = 3;
	let wrongClicks: Set<string> = new Set();

	// Feedback animation state
	let showFeedback = false;
	let feedbackIsCorrect = false;
	let feedbackSpanish = '';
	let feedbackFinnish = '';
	let feedbackExclamation = '';
	let pointsEarned = 0;
	let feedbackAnimationIn = 'animate-pop-in';
	let feedbackAnimationOut = 'animate-pop-out';
	let feedbackClosing = false;

	// Line animation state
	let lineStart: { x: number; y: number } | null = null;
	let lineEnd: { x: number; y: number } | null = null;
	let showLine = false;
	let lineColor = 'stroke-success';

	// Element references for line animation
	let questionWordRef: HTMLElement | null = null;
	let questionWordCardRef: HTMLElement | null = null;
	let gameAreaRef: HTMLElement | null = null;

	// Spanish exclamations for correct answers
	const correctExclamations = [
		'¡Muy bien!',
		'¡Excelente!',
		'¡Perfecto!',
		'¡Genial!',
		'¡Fantástico!',
		'¡Increíble!',
		'¡Bravo!',
		'¡Estupendo!'
	];

	// Sanakirja state
	let showSanakirja = false;
	let upcomingWords: Word[] = [];
	let previousGames: Word[][] = [];

	// Category picker modal state
	let showCategoryPicker = false;

	// Osaaminen modal state
	let showOsaaminen = false;

	// Track word results for knowledge recording
	let gameWordResults: Array<{ spanish: string; finnish: string; quality: AnswerQuality }> = [];

	// Settings (bound to stores)
	let selectedCategory: string;
	let selectedGameLength: number;
	let selectedTheme: Theme;
	let isAutoSpeakEnabled: boolean;

	// Subscribe to stores
	category.subscribe(value => selectedCategory = value);
	gameLength.subscribe(value => selectedGameLength = value);
	theme.subscribe(value => selectedTheme = value);
	autoSpeak.subscribe(value => isAutoSpeakEnabled = value);

	/**
	 * Shuffle array using Fisher-Yates algorithm
	 */
	function shuffleArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	/**
	 * Spread out duplicate words to be at least minDistance apart
	 */
	function spreadOutDuplicates(words: Word[], minDistance = 5): Word[] {
		const result = [...words];
		const wordPositions = new Map<string, number[]>();
		
		result.forEach((word, index) => {
			if (!wordPositions.has(word.spanish)) {
				wordPositions.set(word.spanish, []);
			}
			wordPositions.get(word.spanish)!.push(index);
		});
		
		for (const [spanish, positions] of wordPositions.entries()) {
			if (positions.length <= 1) continue;
			
			for (let i = 1; i < positions.length; i++) {
				const currentPos = positions[i];
				const prevPos = positions[i - 1];
				
				if (currentPos - prevPos < minDistance) {
					for (let newPos = prevPos + minDistance; newPos < result.length; newPos++) {
						const farEnough = positions.every((pos, idx) => {
							if (idx >= i) return true;
							return Math.abs(newPos - pos) >= minDistance;
						});
						
						const wordAtNewPos = result[newPos];
						const newPosInstances = wordPositions.get(wordAtNewPos.spanish) || [];
						const wouldCreateProblem = newPosInstances.some(pos => 
							pos !== newPos && Math.abs(currentPos - pos) < minDistance
						);
						
						if (farEnough && !wouldCreateProblem) {
							[result[currentPos], result[newPos]] = [result[newPos], result[currentPos]];
							positions[i] = newPos;
							const otherPositions = wordPositions.get(wordAtNewPos.spanish);
							if (otherPositions) {
								const otherIdx = otherPositions.indexOf(newPos);
								if (otherIdx !== -1) {
									otherPositions[otherIdx] = currentPos;
								}
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
	 * Get available words based on selected category
	 */
	function getAvailableWords(): Word[] {
		if (selectedCategory === 'all') {
			return getAllWords();
		}
		return getWordsFromCategory(selectedCategory);
	}

	/**
	 * Prepare words for the next game using intelligent selection
	 */
	function prepareNextGameWords() {
		const availableWords = getAvailableWords();
		const direction: LanguageDirection = questionLanguage === 'spanish' 
			? 'spanish_to_finnish' 
			: 'finnish_to_spanish';
		upcomingWords = selectGameWords(availableWords, selectedGameLength, selectedCategory, direction);
		console.log(`📚 Prepared ${upcomingWords.length} words for next game`);
	}

	/**
	 * Generate a randomized queue of words for the entire game
	 */
	function generateWordQueue(questionsNeeded: number): Word[] {
		console.log(`🔀 Generating word queue for ${questionsNeeded} questions...`);
		
		if (upcomingWords.length === questionsNeeded) {
			const queue = spreadOutDuplicates([...upcomingWords], 5);
			console.log(`   ✅ Using prepared words (${queue.length} words)`);
			return queue;
		}
		
		const availableWords = getAvailableWords();
		console.log(`   Available words in category: ${availableWords.length}`);
		
		const direction: LanguageDirection = questionLanguage === 'spanish' 
			? 'spanish_to_finnish' 
			: 'finnish_to_spanish';
		const selectedWords = selectGameWords(availableWords, questionsNeeded, selectedCategory, direction);
		const finalQueue = spreadOutDuplicates(selectedWords, 5);
		
		console.log(`   ✅ Generated queue with ${finalQueue.length} words`);
		return finalQueue;
	}

	/**
	 * Generate answer options for the current word
	 * Returns array with correct answer + wrong options (6-8 total)
	 */
	function generateAnswerOptions(correctWord: Word): Word[] {
		const availableWords = getAvailableWords();
		const optionCount = Math.min(8, availableWords.length);
		
		// Filter out the correct word AND words with the same Finnish translation
		// (e.g., ellos and ellas both mean "he" in Finnish, but only one should appear)
		const wrongWords = availableWords.filter(w => 
			w.spanish !== correctWord.spanish && 
			w.finnish !== correctWord.finnish
		);
		
		// Shuffle and take needed wrong options
		const shuffledWrong = shuffleArray(wrongWords);
		const wrongOptions = shuffledWrong.slice(0, optionCount - 1);
		
		// Combine and shuffle
		const allOptions = [correctWord, ...wrongOptions];
		return shuffleArray(allOptions);
	}

	/**
	 * Get the display text for a word based on question language
	 */
	function getQuestionText(word: Word): string {
		return questionLanguage === 'spanish' ? word.spanish : word.finnish;
	}

	/**
	 * Get the answer text for a word based on question language
	 */
	function getAnswerText(word: Word): string {
		return questionLanguage === 'spanish' ? word.finnish : word.spanish;
	}

	/**
	 * Get a random correct exclamation
	 */
	function getRandomExclamation(): string {
		return correctExclamations[Math.floor(Math.random() * correctExclamations.length)];
	}

	/**
	 * Get random animation pair (entry and exit)
	 */
	function getRandomAnimations(): { entry: string; exit: string } {
		const animations = [
			{ entry: 'animate-pop-in', exit: 'animate-pop-out' },
			{ entry: 'animate-slide-down', exit: 'animate-slide-up-out' },
			{ entry: 'animate-slide-up', exit: 'animate-slide-down-out' },
			{ entry: 'animate-fade-in', exit: 'animate-fade-out' },
			{ entry: 'animate-rotate-in', exit: 'animate-rotate-out' }
		];
		const selected = animations[Math.floor(Math.random() * animations.length)];
		return { entry: selected.entry, exit: selected.exit };
	}

	/**
	 * Auto-close feedback after delay (only for correct answers)
	 */
	function autoCloseFeedback() {
		// Only auto-close for correct answers
		if (!feedbackIsCorrect) {
			return;
		}
		
		const delay = 1000; // 1 second
		
		setTimeout(() => {
			closeFeedbackAndContinue();
		}, delay);
	}

	/**
	 * Close feedback with exit animation and continue
	 */
	function closeFeedbackAndContinue() {
		feedbackClosing = true;
		
		// Wait for exit animation to complete
		setTimeout(() => {
			feedbackClosing = false;
			showFeedback = false;
			showLine = false;
			nextQuestion();
		}, 300); // Match animation duration
	}

	/**
	 * Start a new game
	 */
	function startGame() {
		console.log('🎮 Starting new Yhdistä sanat game');
		
		showSanakirja = false;
		totalScore = 0;
		currentQuestionNumber = 0;
		gameQuestions = [];
		gameWordResults = [];
		gameStartTime = Date.now();
		gameEndTime = 0;
		
		if (upcomingWords.length !== selectedGameLength) {
			prepareNextGameWords();
		}
		
		wordQueue = generateWordQueue(selectedGameLength);
		nextQuestion();
	}

	/**
	 * Start next question
	 */
	function nextQuestion() {
		if (currentQuestionNumber >= selectedGameLength) {
			showGameReport();
			return;
		}

		currentWord = wordQueue.shift() || null;
		
		if (!currentWord) {
			console.error('❌ No more words in queue!');
			return;
		}

		currentQuestionNumber++;
		console.log(`📖 Question ${currentQuestionNumber}/${selectedGameLength}: ${currentWord.spanish}`);

		// Reset question state
		triesRemaining = 3;
		wrongClicks = new Set();
		answerOptions = generateAnswerOptions(currentWord);
		showFeedback = false;
		feedbackClosing = false;
		showLine = false;
		lineStart = null;
		lineEnd = null;
		
		// Get random animations for this question
		const animations = getRandomAnimations();
		feedbackAnimationIn = animations.entry;
		feedbackAnimationOut = animations.exit;
		
		// Initialize question data
		currentQuestionData = {
			questionNumber: currentQuestionNumber,
			spanish: currentWord.spanish,
			finnish: currentWord.finnish,
			english: currentWord.english || '',
			userAnswer: '',
			isCorrect: false,
			pointsEarned: 0,
			maxPoints: 10,
			tipsRequested: 0,
			tipsShown: []
		};

		gameState = 'playing';

		// Speak the word if auto-speak enabled
		if (isAutoSpeakEnabled && currentWord) {
			setTimeout(() => {
				if (questionLanguage === 'spanish') {
					tts.speakSpanish(currentWord!.spanish);
				} else {
					tts.speakFinnish(currentWord!.finnish);
				}
			}, 300);
		}
	}

	/**
	 * Calculate line coordinates from center of clicked button to center of question word
	 */
	async function calculateLineCoordinates(clickedButton: HTMLElement) {
		await tick();
		
		if (!questionWordCardRef || !gameAreaRef) return;
		
		const gameAreaRect = gameAreaRef.getBoundingClientRect();
		const buttonRect = clickedButton.getBoundingClientRect();
		const questionRect = questionWordCardRef.getBoundingClientRect();
		
		// Start from center of clicked button
		lineStart = {
			x: buttonRect.left - gameAreaRect.left + buttonRect.width / 2,
			y: buttonRect.top - gameAreaRect.top + buttonRect.height / 2
		};
		
		// End at center of question word card
		lineEnd = {
			x: questionRect.left - gameAreaRect.left + questionRect.width / 2,
			y: questionRect.top - gameAreaRect.top + questionRect.height / 2
		};
	}

	/**
	 * Handle clicking an answer option
	 */
	async function handleAnswerClick(selectedWord: Word, event: MouseEvent) {
		if (!currentWord || !currentQuestionData || triesRemaining <= 0 || showFeedback) return;
		
		const clickedButton = event.currentTarget as HTMLElement;
		const isCorrect = selectedWord.spanish === currentWord.spanish;
		
		// Calculate and show line animation
		await calculateLineCoordinates(clickedButton);
		lineColor = isCorrect ? 'stroke-success' : 'stroke-error';
		showLine = true;
		
		if (isCorrect) {
			// Calculate points based on remaining tries
			const pointsMap: Record<number, number> = { 3: 10, 2: 3, 1: 1 };
			pointsEarned = pointsMap[triesRemaining] || 0;
			
			// Determine answer quality for knowledge tracking
			const qualityMap: Record<number, AnswerQuality> = { 
				3: 'first_try', 
				2: 'second_try', 
				1: 'third_try' 
			};
			const answerQuality = qualityMap[triesRemaining] || 'third_try';
			
			// Record word result for knowledge tracking
			gameWordResults.push({
				spanish: currentWord.spanish,
				finnish: currentWord.finnish,
				quality: answerQuality
			});
			
			// Record individual answer to knowledge store
			const direction: LanguageDirection = questionLanguage === 'spanish' 
				? 'spanish_to_finnish' 
				: 'finnish_to_spanish';
			wordKnowledge.recordAnswer(currentWord.spanish, currentWord.finnish, direction, answerQuality);
			
			currentQuestionData.userAnswer = getAnswerText(selectedWord);
			currentQuestionData.isCorrect = true;
			currentQuestionData.pointsEarned = pointsEarned;
			currentQuestionData.tipsRequested = 3 - triesRemaining;
			
			gameQuestions.push({ ...currentQuestionData });
			totalScore += pointsEarned;
			
			// Show feedback overlay
			feedbackIsCorrect = true;
			feedbackSpanish = currentWord.spanish;
			feedbackFinnish = currentWord.finnish;
			feedbackExclamation = getRandomExclamation();
			
			// Speak the Spanish word
			if (isAutoSpeakEnabled) {
				setTimeout(() => {
					tts.speakSpanish(currentWord!.spanish);
				}, 300);
			}
			
			console.log(`✅ Correct! +${pointsEarned} points (${triesRemaining} tries remaining)`);
			
			// Show feedback after line animation
			setTimeout(() => {
				showFeedback = true;
				gameState = 'feedback';
				autoCloseFeedback();
			}, 400);
		} else {
			// Wrong answer
			triesRemaining--;
			wrongClicks.add(selectedWord.spanish);
			wrongClicks = wrongClicks; // Trigger reactivity
			
			console.log(`❌ Wrong! ${triesRemaining} tries remaining`);
			
			// Hide line after brief display
			setTimeout(() => {
				showLine = false;
			}, 500);
			
			if (triesRemaining <= 0) {
				// Out of tries - set to 0 before showing dialog
				triesRemaining = 0;
				pointsEarned = 0;
				
				// Record failed word result for knowledge tracking
				gameWordResults.push({
					spanish: currentWord.spanish,
					finnish: currentWord.finnish,
					quality: 'failed'
				});
				
				// Record failed answer to knowledge store
				const direction: LanguageDirection = questionLanguage === 'spanish' 
					? 'spanish_to_finnish' 
					: 'finnish_to_spanish';
				wordKnowledge.recordAnswer(currentWord.spanish, currentWord.finnish, direction, 'failed');
				
				currentQuestionData.userAnswer = getAnswerText(selectedWord);
				currentQuestionData.isCorrect = false;
				currentQuestionData.pointsEarned = 0;
				currentQuestionData.tipsRequested = 3;
				
				gameQuestions.push({ ...currentQuestionData });
				
				// Show feedback with correct answer
				feedbackIsCorrect = false;
				feedbackSpanish = currentWord.spanish;
				feedbackFinnish = currentWord.finnish;
				feedbackExclamation = '';
				
				// Speak the correct answer
				if (isAutoSpeakEnabled) {
					setTimeout(() => {
						tts.speakSpanish(currentWord!.spanish);
					}, 600);
				}
				
				// Show feedback after line animation
				setTimeout(() => {
					showFeedback = true;
					gameState = 'feedback';
					autoCloseFeedback();
				}, 600);
			}
		}
	}

	/**
	 * Speak current word
	 */
	function speakCurrentWord() {
		if (currentWord) {
			if (questionLanguage === 'spanish') {
				tts.speakSpanish(currentWord.spanish);
			} else {
				tts.speakFinnish(currentWord.finnish);
			}
		}
	}

	/**
	 * Continue to next question from feedback (manual click)
	 */
	function continueToNext() {
		if (!feedbackClosing) {
			closeFeedbackAndContinue();
		}
	}

	/**
	 * Show game report
	 */
	function showGameReport() {
		gameState = 'report';
		gameEndTime = Date.now();
		recordGameCompletion(upcomingWords, selectedCategory);
		prepareNextGameWords();

		// Calculate report statistics
		reportFirstTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 0).length;
		reportSecondTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 1).length;
		reportThirdTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 2).length;
		reportFailedCount = gameQuestions.filter(q => !q.isCorrect).length;

		// Record complete game to word knowledge store
		const direction: LanguageDirection = questionLanguage === 'spanish' 
			? 'spanish_to_finnish' 
			: 'finnish_to_spanish';
		wordKnowledge.recordGame(selectedCategory, direction, gameWordResults);

		const correctCount = gameQuestions.filter(q => q.isCorrect).length;
		const incorrectCount = gameQuestions.filter(q => !q.isCorrect).length;
		const accuracy = Math.round((correctCount / selectedGameLength) * 100);
		const maxPossibleScore = selectedGameLength * 10;

		const categoryName = selectedCategory === 'all' ? 'Kaikki sanat' : getCategoryName(selectedCategory);
		gameHistory.add({
			gameType: 'yhdista-sanat',
			category: selectedCategory,
			categoryName: categoryName,
			gameLength: selectedGameLength,
			totalScore: totalScore,
			maxPossibleScore: maxPossibleScore,
			summary: {
				correctCount,
				incorrectCount,
				accuracy
			},
			questions: gameQuestions
		});

		console.log('💾 Game result saved to history');
	}

	/**
	 * Go back to home screen
	 */
	function goHome() {
		gameState = 'home';
		showFeedback = false;
		showLine = false;
	}

	/**
	 * Select a category from the picker modal
	 */
	function selectCategory(categoryKey: string) {
		selectedCategory = categoryKey;
		category.set(selectedCategory);
		showCategoryPicker = false;
		prepareNextGameWords();
	}

	/**
	 * Toggle category picker modal
	 */
	function toggleCategoryPicker() {
		showCategoryPicker = !showCategoryPicker;
	}

	/**
	 * Get the display name for current category
	 */
	$: currentCategoryDisplay = (() => {
		if (selectedCategory === 'all') {
			return { emoji: '📚', name: 'Kaikki sanat' };
		}
		const cat = categories.find(c => c.key === selectedCategory);
		return cat ? { emoji: cat.emoji, name: cat.name } : { emoji: '📚', name: 'Valitse kategoria' };
	})();

	/**
	 * Handle game length change
	 */
	function handleGameLengthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedGameLength = parseInt(target.value);
		gameLength.set(selectedGameLength);
		prepareNextGameWords();
	}

	/**
	 * Handle question language toggle
	 */
	function handleQuestionLanguageChange(lang: QuestionLanguage) {
		questionLanguage = lang;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(QUESTION_LANGUAGE_KEY, lang);
		}
	}

	/**
	 * Handle auto-speak toggle
	 */
	function handleAutoSpeakChange(event: Event) {
		const target = event.target as HTMLInputElement;
		isAutoSpeakEnabled = target.checked;
		autoSpeak.set(isAutoSpeakEnabled);
	}

	/**
	 * Handle theme change
	 */
	function handleThemeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedTheme = target.value as Theme;
		theme.set(selectedTheme);
	}

	/**
	 * Toggle Sanakirja modal
	 */
	function toggleSanakirja() {
		showSanakirja = !showSanakirja;
		
		if (showSanakirja) {
			const availableWords = getAvailableWords();
			previousGames = getPreviousGames(selectedCategory, availableWords, 3);
		}
	}

	/**
	 * Speak a word in Spanish and Finnish using TTS
	 */
	function speakWord(spanish: string, finnish: string) {
		tts.speakSpanish(spanish);
		setTimeout(() => {
			tts.speakFinnish(finnish);
		}, 1000);
	}

	// Get categories for dropdown (sorted by learning order)
	let categories: { key: string; name: string; emoji: string; tooltip: string; tier: number }[] = [];
	
	onMount(() => {
		// Load question language preference
		if (typeof localStorage !== 'undefined') {
			const savedLang = localStorage.getItem(QUESTION_LANGUAGE_KEY);
			if (savedLang === 'finnish' || savedLang === 'spanish') {
				questionLanguage = savedLang;
			}
		}
		
		const orderedCategories = getCategoriesByLearningOrder();
		categories = [
			{ key: 'all', name: 'Kaikki sanat', emoji: '📚', tooltip: 'Kaikki sanat kaikista kategorioista', tier: 0 },
			...orderedCategories.map(cat => ({
				key: cat.key,
				name: getCategoryName(cat.key),
				emoji: getTierEmoji(cat.tier),
				tooltip: `${cat.description} (${cat.cefrLevel})`,
				tier: cat.tier
			}))
		];

		prepareNextGameWords();
	});

	$: wrongAnswers = gameQuestions.filter(q => !q.isCorrect);
	$: correctCount = gameQuestions.filter(q => q.isCorrect).length;
	$: accuracy = selectedGameLength > 0 ? Math.round((correctCount / selectedGameLength) * 100) : 0;
	$: maxPossibleScore = selectedGameLength * 10;
	$: scorePercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
	
	// Format game time
	$: gameTimeFormatted = (() => {
		if (gameEndTime === 0 || gameStartTime === 0) return '0s';
		const totalSeconds = Math.floor((gameEndTime - gameStartTime) / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
	})();
</script>

<style>
	/* Component-specific styles only - shared animations are in layout.css */
</style>

<!-- HOME STATE -->
{#if gameState === 'home'}
	<div class="min-h-screen bg-base-200">
		<div class="container mx-auto px-2 max-w-2xl py-2">
			<!-- Back Button -->
			<div class="mb-2">
				<a href="{base}/" class="btn btn-ghost btn-sm">← Takaisin</a>
			</div>

			<!-- Game Card -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body p-4 md:p-6">
					<h1 class="text-3xl font-bold text-center text-primary mb-4 flex items-center justify-center gap-3">
						<img src="{base}/yhdistasanat-icon.svg" alt="Yhdistä sanat" class="w-10 h-10" />
						<span>Yhdistä sanat</span>
					</h1>

				<!-- Question Language Switch -->
				<div class="form-control mb-6">
					<div class="flex items-center justify-center gap-2 p-2 bg-base-200 rounded-lg">
						<button 
							class="btn btn-sm gap-2 flex-1"
							class:btn-primary={questionLanguage === 'spanish'}
							class:btn-ghost={questionLanguage !== 'spanish'}
							on:click={() => handleQuestionLanguageChange('spanish')}
						>
							<span class="text-xl">🇪🇸</span>
							<span>Espanja</span>
						</button>
						<div class="divider divider-horizontal mx-0">→</div>
						<button 
							class="btn btn-sm gap-2 flex-1"
							class:btn-primary={questionLanguage === 'finnish'}
							class:btn-ghost={questionLanguage !== 'finnish'}
							on:click={() => handleQuestionLanguageChange('finnish')}
						>
							<span class="text-xl">🇫🇮</span>
							<span>Suomi</span>
						</button>
					</div>
					<p class="text-xs text-center text-base-content/50 mt-1">
						{questionLanguage === 'spanish' 
							? 'Näet espanjankielisen sanan, valitse suomenkielinen käännös'
							: 'Näet suomenkielisen sanan, valitse espanjankielinen käännös'}
					</p>
				</div>

				<!-- Category Selection -->
				<div class="form-control mb-4">
					<span class="label">
						<span class="label-text font-semibold text-lg">Valitse kategoria:</span>
					</span>
					<button 
						class="btn btn-outline btn-lg w-full justify-between text-left font-normal"
						on:click={toggleCategoryPicker}
					>
						<span class="flex items-center gap-2">
							<span>{currentCategoryDisplay.emoji}</span>
							<span>{currentCategoryDisplay.name}</span>
						</span>
						<span class="text-base-content/50">▼</span>
					</button>
				</div>

				<!-- Game Length -->
				<div class="form-control mb-4">
					<span class="label">
						<span class="label-text font-semibold text-lg">Kysymyksiä:</span>
					</span>
					<div class="flex gap-4">
						<label class="label cursor-pointer gap-2">
							<input 
								type="radio" 
								name="game-length" 
								value="10" 
								class="radio radio-primary"
								checked={selectedGameLength === 10}
								on:change={handleGameLengthChange}
							/>
							<span class="label-text text-base">10</span>
						</label>
						<label class="label cursor-pointer gap-2">
							<input 
								type="radio" 
								name="game-length" 
								value="21" 
								class="radio radio-primary"
								checked={selectedGameLength === 21}
								on:change={handleGameLengthChange}
							/>
							<span class="label-text text-base">21</span>
						</label>
						<label class="label cursor-pointer gap-2">
							<input 
								type="radio" 
								name="game-length" 
								value="42" 
								class="radio radio-primary"
								checked={selectedGameLength === 42}
								on:change={handleGameLengthChange}
							/>
							<span class="label-text text-base">42</span>
						</label>
					</div>
				</div>

				<!-- Auto-speak -->
				<div class="form-control mb-4">
					<label class="label cursor-pointer justify-start gap-3">
						<input 
							type="checkbox" 
							class="checkbox checkbox-primary"
							checked={isAutoSpeakEnabled}
							on:change={handleAutoSpeakChange}
						/>
						<span class="label-text">Lue sanat ääneen automaattisesti</span>
					</label>
				</div>

				<!-- Theme Selection -->
				<div class="form-control mb-4">
					<label class="label" for="theme-select">
						<span class="label-text font-semibold text-lg">Väriteema:</span>
					</label>
					<select 
						id="theme-select"
						class="select select-bordered w-full"
						bind:value={selectedTheme}
						on:change={handleThemeChange}
					>
						{#each availableThemes as themeOption}
							<option value={themeOption.value}>
								{themeOption.emoji} {themeOption.name}
							</option>
						{/each}
					</select>
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-col gap-3">
					<div class="flex gap-3">
						<button 
							class="btn btn-outline flex-1 gap-2"
							on:click={() => showOsaaminen = true}
						>
							<span>📊</span>
							<span>Osaaminen</span>
						</button>
						<button 
							class="btn btn-outline flex-1 gap-2"
							on:click={toggleSanakirja}
						>
							<span>📖</span>
							<span>Sanakirja</span>
						</button>
					</div>
					<button class="btn btn-primary btn-lg w-full" on:click={startGame}>
						Aloita peli
					</button>
				</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Osaaminen Modal -->
	<OsaaminenModal isOpen={showOsaaminen} on:close={() => showOsaaminen = false} />

	<!-- Sanakirja Modal -->
	{#if showSanakirja}
		<div 
			class="fixed inset-0 bg-neutral/50 z-50" 
			on:click={toggleSanakirja}
			on:keydown={(e) => e.key === 'Escape' && toggleSanakirja()}
			role="button"
			tabindex="0"
		>
			<div 
				class="bg-base-100 w-full h-full sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:shadow-xl overflow-hidden"
				on:click|stopPropagation
				on:keydown|stopPropagation
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<div class="bg-primary text-primary-content p-4 flex items-center justify-between">
					<h2 class="text-xl font-bold">📖 Sanakirja</h2>
					<button class="btn btn-ghost btn-sm btn-circle text-primary-content" on:click={toggleSanakirja}>✕</button>
				</div>

				<div class="overflow-y-auto h-[calc(100vh-64px)] sm:h-auto sm:max-h-[calc(90vh-64px)] p-4">
					<div class="bg-secondary/20 border border-secondary/30 rounded p-2 mb-3">
						<p class="text-sm font-medium text-center text-secondary">
							Seuraavan pelin sanat ({upcomingWords.length})
						</p>
					</div>

					{#if upcomingWords.length > 0}
						<div class="space-y-1 mb-4">
							{#each upcomingWords as word}
								<div class="flex items-center gap-2 p-2 bg-base-200 hover:bg-base-300 rounded transition-colors">
									<span class="font-bold text-primary w-1/2 truncate">{word.spanish}</span>
									<span class="text-base-content/70 w-1/2 truncate">{word.finnish}</span>
									<button
										class="btn btn-ghost btn-xs btn-circle flex-shrink-0"
										on:click={() => speakWord(word.spanish, word.finnish)}
										title="Kuuntele"
									>
										🔊
									</button>
								</div>
							{/each}
						</div>
					{/if}

					{#each previousGames as gameWords, gameIndex}
						<div class="bg-base-300 rounded p-2 mb-3 mt-4">
							<p class="text-sm font-medium text-center text-base-content/70">
								{gameIndex === 0 ? 'Edellisen pelin sanat' : `${gameIndex + 1}. viimeisen pelin sanat`}
							</p>
						</div>

						<div class="space-y-1 mb-4">
							{#each gameWords as word}
								<div class="flex items-center gap-2 p-2 bg-base-200 hover:bg-base-300 rounded transition-colors">
									<span class="font-bold text-primary w-1/2 truncate">{word.spanish}</span>
									<span class="text-base-content/70 w-1/2 truncate">{word.finnish}</span>
									<button
										class="btn btn-ghost btn-xs btn-circle flex-shrink-0"
										on:click={() => speakWord(word.spanish, word.finnish)}
										title="Kuuntele"
									>
										🔊
									</button>
								</div>
							{/each}
						</div>
					{/each}

					<div class="fixed bottom-4 right-4">
						<button class="btn btn-primary btn-lg" on:click={toggleSanakirja}>
							Sulje
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Category Picker Modal -->
	{#if showCategoryPicker}
		<div 
			class="fixed inset-0 bg-neutral/50 z-50" 
			on:click={toggleCategoryPicker}
			on:keydown={(e) => e.key === 'Escape' && toggleCategoryPicker()}
			role="button"
			tabindex="0"
		>
			<div 
				class="bg-base-100 w-full h-full sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:shadow-xl overflow-hidden"
				on:click|stopPropagation
				on:keydown|stopPropagation
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<div class="bg-primary text-primary-content px-3 py-2 flex items-center justify-between">
					<h2 class="text-base font-bold">Valitse kategoria</h2>
					<button class="btn btn-ghost btn-xs btn-circle text-primary-content" on:click={toggleCategoryPicker}>✕</button>
				</div>

				<div class="overflow-y-auto h-[calc(100vh-44px)] sm:h-auto sm:max-h-[calc(90vh-44px)] p-2">
					<button
						class="w-full text-left px-2 py-1.5 rounded mb-2 flex items-center gap-2 transition-colors text-sm"
						class:bg-primary={selectedCategory === 'all'}
						class:text-primary-content={selectedCategory === 'all'}
						class:bg-base-200={selectedCategory !== 'all'}
						class:hover:bg-base-300={selectedCategory !== 'all'}
						on:click={() => selectCategory('all')}
					>
						<span>📚</span>
						<span class="font-medium">Kaikki sanat</span>
					</button>

					<!-- Tier 1: Foundation -->
					<div class="border-l-[3px] border-red-500 pl-2 mb-2">
						<div class="text-[10px] text-base-content/50 mb-0.5">Perusta</div>
						<div class="grid grid-cols-2 gap-1">
							{#each categories.filter(c => c.tier === 1) as cat}
								<button
									class="text-left px-2 py-1 rounded text-sm transition-colors"
									class:bg-primary={selectedCategory === cat.key}
									class:text-primary-content={selectedCategory === cat.key}
									class:bg-base-200={selectedCategory !== cat.key}
									class:hover:bg-base-300={selectedCategory !== cat.key}
									on:click={() => selectCategory(cat.key)}
								>
									{cat.name}
								</button>
							{/each}
						</div>
					</div>

					<!-- Tier 2: Concrete Basics -->
					<div class="border-l-[3px] border-yellow-500 pl-2 mb-2">
						<div class="text-[10px] text-base-content/50 mb-0.5">Perusasiat</div>
						<div class="grid grid-cols-2 gap-1">
							{#each categories.filter(c => c.tier === 2) as cat}
								<button
									class="text-left px-2 py-1 rounded text-sm transition-colors"
									class:bg-primary={selectedCategory === cat.key}
									class:text-primary-content={selectedCategory === cat.key}
									class:bg-base-200={selectedCategory !== cat.key}
									class:hover:bg-base-300={selectedCategory !== cat.key}
									on:click={() => selectCategory(cat.key)}
								>
									{cat.name}
								</button>
							{/each}
						</div>
					</div>

					<!-- Tier 3: Everyday Topics -->
					<div class="border-l-[3px] border-green-500 pl-2 mb-2">
						<div class="text-[10px] text-base-content/50 mb-0.5">Arkiaiheet</div>
						<div class="grid grid-cols-2 gap-1">
							{#each categories.filter(c => c.tier === 3) as cat}
								<button
									class="text-left px-2 py-1 rounded text-sm transition-colors"
									class:bg-primary={selectedCategory === cat.key}
									class:text-primary-content={selectedCategory === cat.key}
									class:bg-base-200={selectedCategory !== cat.key}
									class:hover:bg-base-300={selectedCategory !== cat.key}
									on:click={() => selectCategory(cat.key)}
								>
									{cat.name}
								</button>
							{/each}
						</div>
					</div>

					<!-- Tier 4: Practical Skills -->
					<div class="border-l-[3px] border-blue-500 pl-2 mb-2">
						<div class="text-[10px] text-base-content/50 mb-0.5">Käytäntö</div>
						<div class="grid grid-cols-2 gap-1">
							{#each categories.filter(c => c.tier === 4) as cat}
								<button
									class="text-left px-2 py-1 rounded text-sm transition-colors"
									class:bg-primary={selectedCategory === cat.key}
									class:text-primary-content={selectedCategory === cat.key}
									class:bg-base-200={selectedCategory !== cat.key}
									class:hover:bg-base-300={selectedCategory !== cat.key}
									on:click={() => selectCategory(cat.key)}
								>
									{cat.name}
								</button>
							{/each}
						</div>
					</div>

					<!-- Tier 5: Specialized -->
					<div class="border-l-[3px] border-purple-500 pl-2 mb-2">
						<div class="text-[10px] text-base-content/50 mb-0.5">Erikois</div>
						<div class="grid grid-cols-2 gap-1">
							{#each categories.filter(c => c.tier === 5) as cat}
								<button
									class="text-left px-2 py-1 rounded text-sm transition-colors"
									class:bg-primary={selectedCategory === cat.key}
									class:text-primary-content={selectedCategory === cat.key}
									class:bg-base-200={selectedCategory !== cat.key}
									class:hover:bg-base-300={selectedCategory !== cat.key}
									on:click={() => selectCategory(cat.key)}
								>
									{cat.name}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}

<!-- PLAYING STATE & FEEDBACK STATE -->
{#if gameState === 'playing' || gameState === 'feedback'}
	<div class="h-screen bg-base-200 flex flex-col md:items-center md:justify-center p-0 md:p-4">
		<div 
			class="card bg-base-100 shadow-xl w-full md:max-w-5xl h-full md:h-auto md:max-h-[90vh] flex flex-col relative overflow-hidden"
		>
			<!-- Header Row -->
			<div class="flex items-center justify-between p-3 md:p-4 border-b border-base-200 flex-shrink-0">
				<div class="text-sm md:text-lg font-bold">
					<span class="text-base-content/70">{currentQuestionNumber}/{selectedGameLength}</span>
					<span class="mx-1 md:mx-2 text-base-content/30">|</span>
					<span class="text-primary">{totalScore} p</span>
				</div>
				<div class="flex items-center gap-2">
					<!-- Tries remaining indicator -->
					<div class="flex gap-1">
						{#each Array(3) as _, i}
							<div 
								class="w-3 h-3 md:w-4 md:h-4 rounded-full transition-all"
								class:bg-success={i < triesRemaining}
								class:bg-base-300={i >= triesRemaining}
							></div>
						{/each}
					</div>
					<button 
						on:click={goHome} 
						class="btn btn-ghost btn-circle btn-sm text-xl" 
						title="Lopeta peli"
					>✕</button>
				</div>
			</div>

			<!-- Main Game Area - Two Column Layout -->
			<div class="flex flex-row flex-1 min-h-0 relative" bind:this={gameAreaRef}>
				<!-- SVG Line Animation Overlay -->
				{#if showLine && lineStart && lineEnd}
					<svg class="absolute inset-0 w-full h-full pointer-events-none z-10">
						<line 
							x1={lineStart.x} 
							y1={lineStart.y} 
							x2={lineEnd.x} 
							y2={lineEnd.y}
							class="{lineColor} animate-line"
							stroke-width="3"
							stroke-linecap="round"
						/>
					</svg>
				{/if}

				<!-- Left Column: Question Word -->
				<div class="w-1/2 flex flex-col items-center bg-base-200/50 py-4 md:py-6">
					<!-- Instruction text -->
					<div class="text-xs md:text-sm text-center text-base-content/50 mb-2">
						Valitse oikea sana
					</div>
					
					<!-- Current question score -->
					<div class="text-3xl md:text-4xl font-bold mb-4 md:mb-6"
						class:text-success={triesRemaining === 3}
						class:text-warning={triesRemaining === 2}
						class:text-error={triesRemaining === 1}
					>
						{#if triesRemaining === 3}
							+10
						{:else if triesRemaining === 2}
							+3
						{:else if triesRemaining === 1}
							+1
						{:else}
							0
						{/if}
					</div>

					<!-- Question word (centered in remaining space) -->
					<div class="flex-1 flex flex-col items-center justify-center" bind:this={questionWordRef}>
						<div 
							class="bg-primary text-primary-content rounded-xl p-3 md:p-4 text-center shadow-lg w-full h-auto mx-3 md:mx-6"
							bind:this={questionWordCardRef}
						>
							<div class="text-sm md:text-base lg:text-lg font-medium break-words leading-tight">
								{currentWord ? getQuestionText(currentWord) : ''}
							</div>
						</div>
						<button 
							class="text-4xl mt-8 hover:scale-110 transition-transform cursor-pointer" 
							on:click={speakCurrentWord} 
							title="Kuuntele"
						>
							🔊
						</button>
					</div>
				</div>

				<!-- Right Column: Answer Options -->
				<div class="w-1/2 flex flex-col p-3 md:p-6 overflow-y-auto">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 flex-1 content-center">
						{#each answerOptions as option}
							<button
								class="btn h-auto min-h-[2.5rem] md:min-h-[3.5rem] py-2 md:py-3 px-3 md:px-4 text-sm md:text-base lg:text-lg font-medium normal-case whitespace-normal break-words leading-tight transition-all"
								class:btn-outline={!wrongClicks.has(option.spanish)}
								class:btn-disabled={wrongClicks.has(option.spanish)}
								class:btn-error={wrongClicks.has(option.spanish)}
								class:opacity-40={wrongClicks.has(option.spanish)}
								disabled={wrongClicks.has(option.spanish) || triesRemaining <= 0 || showFeedback}
								on:click={(e) => handleAnswerClick(option, e)}
							>
								{getAnswerText(option)}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Feedback Overlay -->
			{#if showFeedback}
				<div class="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
					<div 
						class="bg-base-100 rounded-lg shadow-lg p-6 md:p-8 max-w-md mx-4 text-center"
						class:animate-pop-in={!feedbackClosing && feedbackAnimationIn === 'animate-pop-in'}
						class:animate-slide-down={!feedbackClosing && feedbackAnimationIn === 'animate-slide-down'}
						class:animate-slide-up={!feedbackClosing && feedbackAnimationIn === 'animate-slide-up'}
						class:animate-fade-in={!feedbackClosing && feedbackAnimationIn === 'animate-fade-in'}
						class:animate-rotate-in={!feedbackClosing && feedbackAnimationIn === 'animate-rotate-in'}
						class:animate-pop-out={feedbackClosing && feedbackAnimationOut === 'animate-pop-out'}
						class:animate-slide-down-out={feedbackClosing && feedbackAnimationOut === 'animate-slide-down-out'}
						class:animate-slide-up-out={feedbackClosing && feedbackAnimationOut === 'animate-slide-up-out'}
						class:animate-fade-out={feedbackClosing && feedbackAnimationOut === 'animate-fade-out'}
						class:animate-rotate-out={feedbackClosing && feedbackAnimationOut === 'animate-rotate-out'}
					>
						{#if feedbackIsCorrect}
							<!-- Correct answer feedback -->
							<div class="text-4xl md:text-5xl font-bold text-success mb-4 animate-slide-down">
								{feedbackExclamation}
							</div>

							<!-- Word pair based on question language -->
							<div class="text-2xl md:text-3xl font-bold text-base-content mb-6">
								{#if questionLanguage === 'spanish'}
									{feedbackSpanish} = {feedbackFinnish}
								{:else}
									{feedbackFinnish} = {feedbackSpanish}
								{/if}
							</div>

							<!-- Points earned -->
							<div class="text-lg font-semibold text-success">
								+{pointsEarned} pistettä
							</div>
						{:else}
							<!-- Wrong answer feedback - just show the word pair -->
							<div class="text-2xl md:text-3xl font-bold text-base-content mb-6">
								{#if questionLanguage === 'spanish'}
									{feedbackSpanish} = {feedbackFinnish}
								{:else}
									{feedbackFinnish} = {feedbackSpanish}
								{/if}
							</div>

							<!-- Continue button (only for wrong answers) -->
							<button 
								class="btn btn-lg w-full btn-primary"
								on:click={continueToNext}
							>
								Seuraava
							</button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- REPORT STATE -->
{#if gameState === 'report'}
	<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
		<div class="card bg-base-100 shadow-xl w-full max-w-2xl">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-2xl md:text-3xl justify-center mb-4 text-primary">🎉 Peli päättyi!</h2>

				<!-- Game Time -->
				<div class="text-center mb-4">
					<div class="text-lg font-semibold text-base-content/70">
						Aika: {gameTimeFormatted}
					</div>
				</div>

				<!-- Answers by Try Count -->
				<div class="grid grid-cols-2 gap-3 mb-4">
					<div class="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
						<div class="text-2xl font-bold text-success">{reportFirstTryCount}</div>
						<div class="text-sm text-base-content/70">1. yrityksellä</div>
					</div>
					<div class="bg-warning/10 border border-warning/30 rounded-lg p-3 text-center">
						<div class="text-2xl font-bold text-warning">{reportSecondTryCount}</div>
						<div class="text-sm text-base-content/70">2. yrityksellä</div>
					</div>
					<div class="bg-error/10 border border-error/30 rounded-lg p-3 text-center">
						<div class="text-2xl font-bold text-error">{reportThirdTryCount}</div>
						<div class="text-sm text-base-content/70">3. yrityksellä</div>
					</div>
					<div class="bg-base-300 border border-base-content/20 rounded-lg p-3 text-center">
						<div class="text-2xl font-bold text-base-content">{reportFailedCount}</div>
						<div class="text-sm text-base-content/70">Ei löytynyt</div>
					</div>
				</div>

				<!-- Score Summary -->
				<div class="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
					<div class="text-center w-full">
						<div class="text-2xl font-bold text-primary">
							Pisteet: {totalScore} / {maxPossibleScore}
						</div>
						<div class="text-lg text-base-content/70">
							({scorePercentage}%)
						</div>
					</div>
				</div>

				<!-- Wrong Answers -->
				{#if wrongAnswers.length > 0}
					<div class="mb-4">
						<h3 class="text-lg font-bold mb-2 text-error">Väärät vastaukset:</h3>
						<div class="space-y-2">
							{#each wrongAnswers as wrong}
								<div class="bg-base-200 border-l-4 border-error rounded-r-lg p-2">
									<div class="flex-1">
										<div class="font-bold text-base">
											<span class="text-primary">{wrong.spanish}</span> = <span class="text-secondary">{wrong.finnish}</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Action Button -->
				<div class="flex justify-center">
					<button class="btn btn-primary btn-lg" on:click={goHome}>
						Alkuun
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
