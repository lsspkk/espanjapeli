<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { base } from '$app/paths';
	import { tts } from '$lib/services/tts';
	import { pushGameState, replaceGameState, setupHistoryListener } from '$lib/services/gameNavHistory';
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
	import { getWordId } from '$lib/utils/wordId';
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
	import { gameSettings } from '$lib/stores/gameSettings';
	import OsaaminenModal from '$lib/components/OsaaminenModal.svelte';
	import GameHeader from '$lib/components/basic/core/GameHeader.svelte';
	import QuestionCard from '$lib/components/basic/core/QuestionCard.svelte';
	import PossiblePoints from '$lib/components/basic/core/PossiblePoints.svelte';
	import OptionButtons from '$lib/components/basic/input/OptionButtons.svelte';
	import LineAnimation from '$lib/components/basic/feedback/LineAnimation.svelte';
	import FeedbackOverlay from '$lib/components/basic/feedback/FeedbackOverlay.svelte';
	import CategoryPicker from '$lib/components/basic/modals/CategoryPicker.svelte';
	import Sanakirja from '$lib/components/basic/modals/Sanakirja.svelte';
	import LanguageDirectionSwitch from '$lib/components/basic/input/LanguageDirectionSwitch.svelte';
	import GameLengthSelector from '$lib/components/basic/input/GameLengthSelector.svelte';
	import GameReport from '$lib/components/basic/report/GameReport.svelte';
	import GameContainer from '$lib/components/shared/GameContainer.svelte';
	import BackButton from '$lib/components/shared/BackButton.svelte';

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
	async function prepareNextGameWords() {
		const availableWords = getAvailableWords();
		const direction: LanguageDirection = questionLanguage === 'spanish' 
			? 'spanish_to_finnish' 
			: 'finnish_to_spanish';
		const settings = $gameSettings;
		upcomingWords = await selectGameWords(availableWords, selectedGameLength, selectedCategory, direction, settings.prioritizeFrequency);
		console.log(`📚 Prepared ${upcomingWords.length} words for next game`);
	}

	/**
	 * Generate a randomized queue of words for the entire game
	 */
	async function generateWordQueue(questionsNeeded: number): Promise<Word[]> {
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
		const settings = $gameSettings;
		const selectedWords = await selectGameWords(availableWords, questionsNeeded, selectedCategory, direction, settings.prioritizeFrequency);
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
	async function startGame() {
		console.log('🎮 Starting new Yhdistä sanat game');
		
		showSanakirja = false;
		totalScore = 0;
		currentQuestionNumber = 0;
		gameQuestions = [];
		gameWordResults = [];
		gameStartTime = Date.now();
		gameEndTime = 0;
		
		if (upcomingWords.length !== selectedGameLength) {
			await prepareNextGameWords();
		}
		
		wordQueue = await generateWordQueue(selectedGameLength);
		
		// Push playing state to history
		pushGameState('yhdistasanat', 'playing');
		
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
			wordKnowledge.recordAnswer(getWordId(currentWord), currentWord.finnish, direction, answerQuality, 'basic');
			
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
				wordKnowledge.recordAnswer(getWordId(currentWord), currentWord.finnish, direction, 'failed', 'basic');
				
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
	async function showGameReport() {
		gameState = 'report';
		gameEndTime = Date.now();
		recordGameCompletion(upcomingWords, selectedCategory);
		await prepareNextGameWords();

		// Calculate report statistics
		reportFirstTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 0).length;
		reportSecondTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 1).length;
		reportThirdTryCount = gameQuestions.filter(q => q.isCorrect && q.tipsRequested === 2).length;
		reportFailedCount = gameQuestions.filter(q => !q.isCorrect).length;

		// Record complete game to word knowledge store
		const direction: LanguageDirection = questionLanguage === 'spanish' 
			? 'spanish_to_finnish' 
			: 'finnish_to_spanish';
		wordKnowledge.recordGame(selectedCategory, direction, gameWordResults, 'basic');

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
		// Use browser back to go to home state
		window.history.back();
	}

	/**
	 * Select a category from the picker modal
	 */
	async function selectCategory(categoryKey: string) {
		selectedCategory = categoryKey;
		category.set(selectedCategory);
		showCategoryPicker = false;
		await prepareNextGameWords();
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
	async function handleGameLengthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedGameLength = parseInt(target.value);
		gameLength.set(selectedGameLength);
		await prepareNextGameWords();
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
	
	let cleanupHistory: (() => void) | null = null;
	
	onMount(async () => {
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

		await prepareNextGameWords();
		
		// Setup history listener for browser back button
		cleanupHistory = setupHistoryListener((state) => {
			if (state?.gameId === 'yhdistasanat') {
				// Handle back button based on stored state
				handleHistoryBack(state.state as GameState);
			} else if (state === null) {
				// User went back to initial state or external page
				goHomeDirectly();
			}
		});
		
		// Replace current state with home state
		replaceGameState('yhdistasanat', 'home');
	});
	
	onDestroy(() => {
		// Cleanup history listener
		if (cleanupHistory) {
			cleanupHistory();
		}
	});
	
	function handleHistoryBack(targetState: GameState) {
		// Simple behavior: any back navigation goes to home
		if (targetState === 'home') {
			goHomeDirectly();
		} else {
			// For any other state, just go home
			goHomeDirectly();
		}
	}
	
	function goHomeDirectly() {
		gameState = 'home';
		showFeedback = false;
		showLine = false;
	}

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
			<!-- Back Button - Top Left -->
			<div class="mb-2">
				<BackButton />
			</div>

			<!-- Game Card -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body p-4 md:p-6">
					<h1 class="text-3xl font-bold text-center text-primary mb-4 flex items-center justify-center gap-3">
						<img src="{base}/yhdistasanat-icon.svg" alt="Yhdistä sanat" class="w-10 h-10" />
						<span>Yhdistä sanat</span>
					</h1>

			<!-- Question Language Switch -->
			<LanguageDirectionSwitch
				direction={questionLanguage}
				onChange={handleQuestionLanguageChange}
			/>

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
			<GameLengthSelector
				value={selectedGameLength}
				onChange={handleGameLengthChange}
			/>

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
	<Sanakirja
		isOpen={showSanakirja}
		{upcomingWords}
		{previousGames}
		onClose={toggleSanakirja}
		onSpeak={speakWord}
	/>

	<!-- Category Picker Modal -->
	<CategoryPicker
		isOpen={showCategoryPicker}
		{selectedCategory}
		{categories}
		onSelect={selectCategory}
		onClose={toggleCategoryPicker}
	/>
{/if}

<!-- PLAYING STATE & FEEDBACK STATE -->
{#if gameState === 'playing' || gameState === 'feedback'}
	<GameContainer gameType="basic" buttonMode="basic" showBackButton={false}>
		<!-- Header Row -->
		<GameHeader 
			currentQuestion={currentQuestionNumber}
			totalQuestions={selectedGameLength}
			score={totalScore}
			onQuit={goHome}
			triesRemaining={triesRemaining}
		/>

		<!-- Main Game Area - Two Column Layout -->
		<div class="flex flex-row flex-1 min-h-0 relative" bind:this={gameAreaRef}>
			<!-- SVG Line Animation Overlay -->
			<LineAnimation 
				start={lineStart}
				end={lineEnd}
				visible={showLine}
				color={lineColor === 'stroke-success' ? 'success' : 'error'}
			/>

			<!-- Left Column: Question Word -->
			<div class="w-1/2 flex flex-col items-center bg-base-200/50 py-4 md:py-6">
				<!-- Instruction text -->
				<div class="text-xs md:text-sm text-center text-base-content/50 mb-2">
					Valitse oikea sana
				</div>
				
				<!-- Current question score -->
				<PossiblePoints {triesRemaining} />

				<!-- Question word (centered in remaining space) -->
				<div bind:this={questionWordRef}>
					<div bind:this={questionWordCardRef}>
						<QuestionCard 
							text={currentWord ? getQuestionText(currentWord) : ''}
							onSpeak={speakCurrentWord}
							spanishWord={currentWord?.spanish}
							showFrequencyBadge={true}
						/>
					</div>
				</div>
			</div>

			<!-- Right Column: Answer Options -->
			<div class="w-1/2 flex flex-col p-3 md:p-6 overflow-y-auto">
				<OptionButtons 
					options={answerOptions.map(opt => ({ id: opt.spanish, text: getAnswerText(opt) }))}
					disabledIds={wrongClicks}
					onSelect={(id, e) => {
						const selectedWord = answerOptions.find(opt => opt.spanish === id);
						if (selectedWord) handleAnswerClick(selectedWord, e);
					}}
					disabled={triesRemaining <= 0 || showFeedback}
				/>
			</div>
		</div>

		<!-- Feedback Overlay -->
		<FeedbackOverlay
			visible={showFeedback}
			isCorrect={feedbackIsCorrect}
			exclamation={feedbackExclamation}
			primaryWord={questionLanguage === 'spanish' ? feedbackSpanish : feedbackFinnish}
			secondaryWord={questionLanguage === 'spanish' ? feedbackFinnish : feedbackSpanish}
			{pointsEarned}
			animationIn={feedbackAnimationIn}
			animationOut={feedbackAnimationOut}
			closing={feedbackClosing}
			onContinue={continueToNext}
		/>
	</GameContainer>
{/if}

<!-- REPORT STATE -->
{#if gameState === 'report'}
	<GameReport
		gameTime={gameTimeFormatted}
		firstTryCount={reportFirstTryCount}
		secondTryCount={reportSecondTryCount}
		thirdTryCount={reportThirdTryCount}
		failedCount={reportFailedCount}
		{totalScore}
		maxScore={maxPossibleScore}
		{wrongAnswers}
		gameWords={upcomingWords}
		onHome={goHome}
	/>
{/if}
