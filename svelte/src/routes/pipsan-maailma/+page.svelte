<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import { tts } from '$lib/services/tts';
	import { generateRandomAnimation, generateDualAnimation } from '$lib/services/animationGenerator';
	import { pushGameState, replaceGameState, setupHistoryListener } from '$lib/services/gameNavHistory';
	import CharacterAnimation from '$lib/components/CharacterAnimation.svelte';
	import GameContainer from '$lib/components/shared/GameContainer.svelte';
	import KidsVocabularyWidget from '$lib/components/kids/KidsVocabularyWidget.svelte';
	import type { AnimationConfig } from '$lib/types/animation';
	import { 
		wordKnowledge, 
		type AnswerQuality 
	} from '$lib/stores/wordKnowledge';

	interface VocabItem {
		spanish: string;
		finnish: string;
		english: string;
		icon: string;
		description?: string;
	}

	interface GameData {
		characters: VocabItem[];
		basic_vocabulary: VocabItem[];
		activities_vocabulary: VocabItem[];
		positive_feedback_spanish: string[];
		positive_feedback_finnish: string[];
	}

	// Game state
	let gameData: GameData | null = null;
	let loading = $state(true);
	let gameStarted = $state(false);
	let gameEnded = $state(false);

	// Settings
	let difficulty: 'easy' | 'medium' | 'hard' = $state('easy');
	let showTimer = $state(false);
	let autoPlayAudio = $state(true);

	// Current question state
	let currentWord: VocabItem | null = $state(null);
	let options: VocabItem[] = $state([]);
	let questionNumber = $state(0);
	let totalQuestions = $state(10);
	let correctAnswers = $state(0);
	let timeLeft = $state(30);
	let timerInterval: number | null = null;

	// Word queue to avoid repeats
	let wordQueue: VocabItem[] = $state([]);
	
	// Track game results for word knowledge
	let gameResults: Array<{ spanish: string; finnish: string; quality: AnswerQuality }> = $state([]);

	// Animation states
	let showCelebration = $state(false);
	let celebrationText = $state('');
	let celebrationTextFi = $state('');
	let selectedAnswer: number | null = $state(null);
	let isCorrect = $state(false);
	
	// Background animations
	let backgroundAnimations: AnimationConfig[] = $state([]);
	let showBackgroundAnimation = $state(false);

	// Statistics
	let totalGamesPlayed = $state(0);
	let totalCorrectAnswers = $state(0);
	let bestScore = $state(0);

	// All vocab combined
	let allVocab: VocabItem[] = $state([]);
	
	let cleanupHistory: (() => void) | null = null;

	// Load game data and settings
	onMount(async () => {
		// Load settings from localStorage
		try {
			const savedSettings = localStorage.getItem('peppaGameSettings');
			if (savedSettings) {
				const settings = JSON.parse(savedSettings);
				difficulty = settings.difficulty || 'easy';
				showTimer = settings.showTimer || false;
				autoPlayAudio = settings.autoPlayAudio !== undefined ? settings.autoPlayAudio : true;
			}

			// Load statistics
			const savedStats = localStorage.getItem('peppaGameStats');
			if (savedStats) {
				const stats = JSON.parse(savedStats);
				totalGamesPlayed = stats.totalGamesPlayed || 0;
				totalCorrectAnswers = stats.totalCorrectAnswers || 0;
				bestScore = stats.bestScore || 0;
			}
		} catch (e) {
			console.error('Failed to load settings:', e);
		}

		// Load game data
		try {
			const response = await fetch(`${base}/themes/peppa_pig_kids.json`);
			gameData = await response.json();
			
			// Combine all vocabulary
			if (gameData) {
				allVocab = [
					...gameData.characters,
					...gameData.basic_vocabulary,
					...gameData.activities_vocabulary
				];
			}
			
			loading = false;
		} catch (error) {
			console.error('Failed to load Peppa Pig data:', error);
			loading = false;
		}
		
		// Setup history listener for browser back button
		cleanupHistory = setupHistoryListener((state) => {
			if (state?.gameId === 'pipsan-maailma') {
				// Handle back button based on stored state
				handleHistoryBack(state.state);
			} else if (state === null) {
				// User went back to initial state or external page
				resetGameDirectly();
			}
		});
		
		// Replace current state with home state
		replaceGameState('pipsan-maailma', 'home');
	});
	
	onDestroy(() => {
		// Cleanup history listener
		if (cleanupHistory) {
			cleanupHistory();
		}
	});
	
	function handleHistoryBack(targetState: string) {
		// Simple behavior: any back navigation goes to home/start screen
		if (targetState === 'home') {
			resetGameDirectly();
		} else {
			resetGameDirectly();
		}
	}
	
	function resetGameDirectly() {
		gameEnded = false;
		gameStarted = false;
		questionNumber = 0;
		correctAnswers = 0;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	// Save settings to localStorage whenever they change
	function saveSettings() {
		try {
			localStorage.setItem('peppaGameSettings', JSON.stringify({
				difficulty,
				showTimer,
				autoPlayAudio
			}));
		} catch (e) {
			console.error('Failed to save settings:', e);
		}
	}

	// Save statistics
	function saveStats() {
		try {
			localStorage.setItem('peppaGameStats', JSON.stringify({
				totalGamesPlayed,
				totalCorrectAnswers,
				bestScore
			}));
		} catch (e) {
			console.error('Failed to save stats:', e);
		}
	}

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
	
	function generateBackgroundAnimations() {
		// 70% chance single animation, 30% chance dual animations
		const useDual = Math.random() < 0.3;
		
		if (useDual) {
			backgroundAnimations = generateDualAnimation();
		} else {
			backgroundAnimations = [generateRandomAnimation()];
		}
		
		showBackgroundAnimation = true;
	}

	/**
	 * Spread out duplicate words to be at least minDistance apart
	 */
	function spreadOutDuplicates(words: VocabItem[], minDistance = 5): VocabItem[] {
		const result = [...words];
		const wordPositions = new Map<string, number[]>();
		
		// Build initial position map
		result.forEach((word, index) => {
			if (!wordPositions.has(word.spanish)) {
				wordPositions.set(word.spanish, []);
			}
			wordPositions.get(word.spanish)!.push(index);
		});
		
		// For each word that appears multiple times
		for (const [spanish, positions] of wordPositions.entries()) {
			if (positions.length <= 1) continue;
			
			// Check if any duplicates are too close
			for (let i = 0; i < positions.length - 1; i++) {
				const distance = positions[i + 1] - positions[i];
				if (distance < minDistance) {
					// Try to swap the duplicate with a word further away
					const pos1 = positions[i + 1];
					
					// Find a good swap position (at least minDistance away from all positions of this word)
					for (let swapPos = pos1 + minDistance; swapPos < result.length; swapPos++) {
						const swapWord = result[swapPos];
						
						// Don't swap with same word
						if (swapWord.spanish === spanish) continue;
						
						// Check if swap position is far enough from all occurrences
						const tooClose = positions.some(p => Math.abs(swapPos - p) < minDistance);
						if (!tooClose) {
							// Perform swap
							[result[pos1], result[swapPos]] = [result[swapPos], result[pos1]];
							
							// Update position map
							positions[i + 1] = swapPos;
							wordPositions.set(swapWord.spanish, 
								wordPositions.get(swapWord.spanish)!.map(p => p === swapPos ? pos1 : p)
							);
							break;
						}
					}
				}
			}
		}
		
		return result;
	}

	/**
	 * Generate word queue for game (avoids immediate repeats)
	 */
	function generateWordQueue(questionsNeeded: number): VocabItem[] {
		console.log(`🔀 Generating word queue for ${questionsNeeded} questions...`);
		
		const availableWords = [...allVocab];
		console.log(`   Available words: ${availableWords.length}`);
		
		// Build queue by shuffling and repeating words until we have enough
		const queue: VocabItem[] = [];
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

	function startGame() {
		gameStarted = true;
		gameEnded = false;
		questionNumber = 0;
		correctAnswers = 0;
		gameResults = []; // Reset game results tracking
		
		// Adjust total questions based on difficulty
		switch (difficulty) {
			case 'easy':
				totalQuestions = 5;
				break;
			case 'medium':
				totalQuestions = 10;
				break;
			case 'hard':
				totalQuestions = 15;
				break;
		}
		
		// Generate word queue (avoids immediate repeats)
		wordQueue = generateWordQueue(totalQuestions);
		
		// Push playing state to history
		pushGameState('pipsan-maailma', 'playing');
		
		nextQuestion();
	}

	function nextQuestion() {
		if (questionNumber >= totalQuestions) {
			endGame();
			return;
		}

		questionNumber++;
		selectedAnswer = null;
		showCelebration = false;
		showBackgroundAnimation = false;

		// Get next word from queue
		currentWord = wordQueue.shift() || null;

		if (!currentWord) {
			console.error('❌ No more words in queue!');
			return;
		}

		console.log(`📖 Question ${questionNumber}/${totalQuestions}: ${currentWord.spanish}`);

		// Generate options based on difficulty
		const numOptions = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 6;
		options = generateOptions(currentWord, numOptions);

		// Play audio automatically if enabled
		if (autoPlayAudio && currentWord) {
			setTimeout(() => playAudio(), 500);
		}

		// Start timer if enabled
		if (showTimer) {
			startTimer();
		}
	}

	function generateOptions(correct: VocabItem, count: number): VocabItem[] {
		const opts = [correct];
		const available = allVocab.filter(v => v.spanish !== correct.spanish);

		while (opts.length < count && available.length > 0) {
			const idx = Math.floor(Math.random() * available.length);
			opts.push(available[idx]);
			available.splice(idx, 1);
		}

		// Shuffle options
		return opts.sort(() => Math.random() - 0.5);
	}

	function playAudio() {
		if (currentWord && autoPlayAudio) {
			tts.speakSpanish(currentWord.spanish);
		}
	}

	function selectAnswer(index: number) {
		if (selectedAnswer !== null) return; // Already answered

		selectedAnswer = index;
		const selected = options[index];
		isCorrect = selected.spanish === currentWord!.spanish;

		// Record answer to word knowledge store (kids mode)
		const answerQuality: AnswerQuality = isCorrect ? 'perfect' : 'failed';
		wordKnowledge.recordAnswer(
			currentWord!.spanish,
			currentWord!.finnish,
			'spanish_to_finnish',
			answerQuality,
			'kids'
		);
		
		// Track for game-level recording
		gameResults.push({
			spanish: currentWord!.spanish,
			finnish: currentWord!.finnish,
			quality: answerQuality
		});

		if (isCorrect) {
			correctAnswers++;
			celebrate();
		} else {
			// Wrong answer - speak condolence, then Spanish word, then "on suomeksi" + Finnish word
			if (autoPlayAudio && currentWord) {
				setTimeout(() => {
					const condolences = ['¡Ánimo!', 'No pasa nada', '¡Inténtalo otra vez!', 'Casi'];
					const condolence = condolences[Math.floor(Math.random() * condolences.length)];
					
					// Speak condolence first
					tts.speakSpanish(condolence);
					
					// Then speak the correct answer after a delay
					setTimeout(() => {
						tts.speakSpanishThenFinnish(
							currentWord!.spanish,
							`on suomeksi ${currentWord!.finnish}`
						);
					}, 1500);
				}, 500);
			}
		}

		// Clear timer
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		// Move to next question after delay
		setTimeout(() => {
			nextQuestion();
		}, isCorrect ? 2500 : 6500); // Longer delay for wrong answers to allow condolence + Spanish + Finnish speech to finish
	}

	function celebrate() {
		if (!gameData) return;

		const spanishPhrases = gameData.positive_feedback_spanish;
		const finnishPhrases = gameData.positive_feedback_finnish;

		celebrationText = spanishPhrases[Math.floor(Math.random() * spanishPhrases.length)];
		celebrationTextFi = finnishPhrases[Math.floor(Math.random() * finnishPhrases.length)];

		showCelebration = true;
		
		// Generate background animations
		generateBackgroundAnimations();

		// Only speak if audio is enabled
		if (autoPlayAudio) {
			// Speak celebration in Spanish
			tts.speakSpanish(celebrationText);

			// Speak celebration in Finnish after a delay
			setTimeout(() => {
				tts.speakFinnish(celebrationTextFi);
			}, 1500);
		}
	}

	function startTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
		}

		timeLeft = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 20 : 15;

		timerInterval = setInterval(() => {
			timeLeft--;
			if (timeLeft <= 0) {
				clearInterval(timerInterval!);
				timerInterval = null;
				// Auto-skip to next question
				nextQuestion();
			}
		}, 1000) as unknown as number;
	}

	function endGame() {
		gameEnded = true;
		gameStarted = false;

		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		// Record complete game to word knowledge store (kids mode)
		wordKnowledge.recordGame('peppa-vocabulary', 'spanish_to_finnish', gameResults, 'kids');

		// Update statistics
		totalGamesPlayed++;
		totalCorrectAnswers += correctAnswers;
		const currentScore = Math.round((correctAnswers / totalQuestions) * 100);
		if (currentScore > bestScore) {
			bestScore = currentScore;
		}
		saveStats();

		// Play final celebration only if audio is enabled
		if (autoPlayAudio) {
			const percentage = (correctAnswers / totalQuestions) * 100;
			if (percentage >= 80) {
				tts.speakSpanish('¡Excelente!');
				setTimeout(() => tts.speakFinnish('Loistavaa!'), 1500);
			} else if (percentage >= 50) {
				tts.speakSpanish('¡Muy bien!');
				setTimeout(() => tts.speakFinnish('Hyvin tehty!'), 1500);
			} else {
				tts.speakSpanish('¡Buen trabajo!');
				setTimeout(() => tts.speakFinnish('Hyvä yritys!'), 1500);
			}
		}
	}

	function resetGame() {
		// Use browser back to go to home state
		window.history.back();
	}

	// Get button size based on difficulty
	function getButtonSize(): string {
		switch (difficulty) {
			case 'easy':
				return 'h-24 sm:h-28 text-5xl sm:text-6xl';
			case 'medium':
				return 'h-20 sm:h-24 text-4xl sm:text-5xl';
			case 'hard':
				return 'h-16 sm:h-20 text-3xl sm:text-4xl';
		}
	}

	// Get grid columns based on difficulty
	function getGridCols(): string {
		switch (difficulty) {
			case 'easy':
				return 'grid-cols-1 sm:grid-cols-3';
			case 'medium':
				return 'grid-cols-2 sm:grid-cols-2';
			case 'hard':
				return 'grid-cols-2 sm:grid-cols-3';
		}
	}
</script>

<GameContainer gameType="viewport-fitted" buttonMode="kids" backgroundClass="bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200" transparentCard={true} showBackButton={!gameStarted && !gameEnded} onBack={() => window.location.href = `${base}/`}>
	<!-- Kids Vocabulary Widget (only on start screen) -->
	{#if !gameStarted && !gameEnded && !loading}
		<KidsVocabularyWidget />
	{/if}
	
	<div class="flex flex-col h-full p-4">
		<!-- Header - X button during game -->
		{#if gameStarted}
			<div class="flex justify-end">
				<button onclick={resetGame} class="btn btn-ghost btn-circle btn-sm text-base-content/50 hover:text-base-content">
					✕
				</button>
			</div>
		{/if}

		{#if loading}
			<!-- Loading State -->
			<div class="flex min-h-[50vh] items-center justify-center">
				<div class="text-center">
					<div class="loading loading-spinner loading-lg text-primary"></div>
					<p class="mt-4 text-xl">Ladataan peliä...</p>
				</div>
			</div>
		{:else if !gameStarted && !gameEnded}
			<!-- Start Screen -->
			<div class="card bg-white/95 shadow-2xl backdrop-blur">
				<div class="card-body p-4 sm:p-8">
					<div class="text-center mb-4 sm:mb-6">
						<div class="text-3xl sm:text-4xl font-bold">
							🐷 Pipsa Possu
						</div>
						<div class="text-xl sm:text-2xl text-base-content/70">
							Peppa Pig
						</div>
					</div>

					<!-- Settings -->
					<div class="space-y-4 mb-4 sm:space-y-6 sm:mb-6">
						<!-- Difficulty -->
						<div class="form-control">
							<div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
								<button
									class="btn btn-md sm:btn-lg flex-1 {difficulty === 'easy' ? 'btn-primary' : 'btn-outline'} h-16 sm:h-20"
									onclick={() => { difficulty = 'easy'; saveSettings(); }}
								>
									<div class="flex items-center gap-2 sm:gap-3">
										<span class="text-3xl sm:text-4xl">😊</span>
										<div class="text-left">
											<div class="text-base sm:text-lg">Helppo</div>
											<div class="text-xs opacity-70">3 kuvaa</div>
										</div>
									</div>
								</button>
								<button
									class="btn btn-md sm:btn-lg flex-1 {difficulty === 'medium' ? 'btn-primary' : 'btn-outline'} h-16 sm:h-20"
									onclick={() => { difficulty = 'medium'; saveSettings(); }}
								>
									<div class="flex items-center gap-2 sm:gap-3">
										<span class="text-3xl sm:text-4xl">🙂</span>
										<div class="text-left">
											<div class="text-base sm:text-lg">Keski</div>
											<div class="text-xs opacity-70">4 kuvaa</div>
										</div>
									</div>
								</button>
								<button
									class="btn btn-md sm:btn-lg flex-1 {difficulty === 'hard' ? 'btn-primary' : 'btn-outline'} h-16 sm:h-20"
									onclick={() => { difficulty = 'hard'; saveSettings(); }}
								>
									<div class="flex items-center gap-2 sm:gap-3">
										<span class="text-3xl sm:text-4xl">🤓</span>
										<div class="text-left">
											<div class="text-base sm:text-lg">Vaikea</div>
											<div class="text-xs opacity-70">6 kuvaa</div>
										</div>
									</div>
								</button>
							</div>
						</div>

						<!-- Timer Toggle -->
						<div class="form-control">
							<label class="label cursor-pointer justify-center gap-3 bg-base-200 rounded-lg p-2">
								<span class="text-3xl sm:text-4xl">⏱️</span>
								<span class="text-lg sm:text-xl font-bold">Aikamittari</span>
								<input
									type="checkbox"
									bind:checked={showTimer}
									onchange={saveSettings}
									class="toggle toggle-primary toggle-md sm:toggle-lg"
								/>
							</label>
						</div>

						<!-- Auto-play Audio -->
						<div class="form-control">
							<label class="label cursor-pointer justify-center gap-3 bg-base-200 rounded-lg p-2">
								<span class="text-3xl sm:text-4xl">🔊</span>
								<span class="text-lg sm:text-xl font-bold">Ääni päälle</span>
								<input
									type="checkbox"
									bind:checked={autoPlayAudio}
									onchange={saveSettings}
									class="toggle toggle-secondary toggle-md sm:toggle-lg"
								/>
							</label>
						</div>
					</div>

					<!-- Start Button -->
					<button class="btn btn-primary btn-md sm:btn-lg w-full text-2xl sm:text-3xl h-16 sm:h-24" onclick={startGame}>
						<span class="text-4xl sm:text-5xl">🇪🇸</span>
						Aloita!
					</button>

					<!-- Statistics -->
					{#if totalGamesPlayed > 0}
						<div class="mt-6 text-center">
							<div class="flex justify-center gap-6 items-center">
								<div class="flex flex-col items-center">
									<div class="text-3xl">🎮</div>
									<div class="text-2xl font-bold text-primary">{totalGamesPlayed}</div>
									<div class="text-xs text-base-content/70">peliä</div>
								</div>
								<div class="flex flex-col items-center">
									<div class="text-3xl">⭐</div>
									<div class="text-2xl font-bold text-secondary">{bestScore}%</div>
									<div class="text-xs text-base-content/70">paras</div>
								</div>
								<div class="flex flex-col items-center">
									<div class="text-3xl">✨</div>
									<div class="text-2xl font-bold text-accent">{totalCorrectAnswers}</div>
									<div class="text-xs text-base-content/70">oikein</div>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{:else if gameStarted && currentWord}
			<!-- Game Screen -->
			<div class="flex-1 flex flex-col justify-between gap-2 pb-2 overflow-hidden">
				<!-- Progress Bar -->
				<div class="card bg-white/95 shadow-lg backdrop-blur flex-shrink-0">
					<div class="card-body p-2 sm:p-3">
						<div class="flex items-center justify-between text-sm sm:text-base">
							<span class="font-bold">
								{questionNumber}/{totalQuestions}
							</span>
							{#if showTimer}
								<span class="font-bold flex items-center gap-1">
									⏱️ {timeLeft}s
								</span>
							{/if}
							<span class="font-bold">
								✅ {correctAnswers}
							</span>
						</div>
						<progress
							class="progress progress-primary w-full h-2"
							value={questionNumber}
							max={totalQuestions}
						></progress>
					</div>
				</div>

				<!-- Question Card -->
				<div class="card bg-gradient-to-br from-yellow-100 to-orange-100 shadow-2xl border-4 border-yellow-400 flex-shrink-0">
					<div class="card-body items-center text-center p-3 sm:p-4">
						<h2 class="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">
							Mikä tämä on?
						</h2>
						
						{#if !autoPlayAudio && currentWord}
							<p class="text-3xl sm:text-4xl font-bold text-primary mb-2">
								{currentWord.spanish}
							</p>
						{/if}
						
						<!-- Audio Button -->
						<button
							class="btn btn-circle btn-md sm:btn-lg bg-white hover:bg-gray-100 border-4 border-primary animate-pulse"
							onclick={playAudio}
						>
							<span class="text-3xl sm:text-4xl">🔊</span>
						</button>
					</div>
				</div>

				<!-- Options Grid -->
				<div class="grid {getGridCols()} gap-2 sm:gap-3 flex-1 content-center">
					{#each options as option, index}
						<button
							class="btn {getButtonSize()} transition-all duration-300 {selectedAnswer === index
								? isCorrect
									? 'btn-success animate-bounce scale-110 border-4 border-green-600'
									: 'btn-error animate-shake border-4 border-red-600'
								: selectedAnswer !== null && option.spanish === currentWord?.spanish
									? 'btn-success border-4 border-green-600 animate-pulse'
									: 'btn-outline btn-primary bg-white hover:scale-105 hover:shadow-2xl'}"
							disabled={selectedAnswer !== null}
							onclick={() => selectAnswer(index)}
						>
							<span class="drop-shadow-lg">{option.icon}</span>
						</button>
					{/each}
				</div>

			<!-- Wrong Answer Overlay -->
			{#if selectedAnswer !== null && !isCorrect && currentWord}
				<div class="fixed inset-0 flex items-center justify-center pointer-events-none z-50 animate-fade-in">
					<div class="text-center rounded-2xl p-6 max-w-md">
						<div class="text-6xl mb-3 drop-shadow-[0_3px_3px_rgba(255,255,255,0.9)]">😢</div>
						<div class="text-3xl font-bold text-white mb-4 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
							¡Ánimo!
						</div>
						<div class="text-6xl mb-3 drop-shadow-[0_3px_3px_rgba(255,255,255,0.9)]">{currentWord.icon}</div>
						<div class="text-2xl font-bold text-white mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
							{currentWord.spanish}
						</div>
						<div class="text-xl text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
							= {currentWord.finnish}
						</div>
					</div>
				</div>
			{/if}

				<!-- Celebration Overlay -->
				{#if showCelebration}
					<!-- Background Animations (behind celebration) -->
					{#if showBackgroundAnimation}
						<div class="fixed inset-0 pointer-events-none" style="z-index: 1;">
							{#each backgroundAnimations as animConfig}
								<CharacterAnimation config={animConfig} />
							{/each}
						</div>
					{/if}
				
					<div class="fixed inset-0 flex items-center justify-center pointer-events-none animate-fade-in" style="z-index: 50;">
						<div class="text-center animate-bounce">
							<div class="text-7xl sm:text-9xl mb-4">⭐🎉⭐</div>
							<div class="text-4xl sm:text-6xl font-bold text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
								{celebrationText}
							</div>
							<div class="text-3xl sm:text-5xl font-bold text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] mt-2">
								{celebrationTextFi}
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else if gameEnded}
			<!-- End Screen -->
			<div class="card bg-white/95 shadow-2xl backdrop-blur h-screen flex flex-col">
				<div class="card-body items-center text-center flex-1 flex flex-col justify-center p-4">
					<div class="mb-4 animate-spin-slow">
						<span class="text-6xl sm:text-7xl">⭐</span>
					</div>

					<div class="text-3xl sm:text-4xl font-bold mb-4">
						Hyvää!
					</div>

					<!-- Score -->
					<div class="mb-4">
						<div class="text-base sm:text-lg text-base-content/70 mb-1">Oikein</div>
						<div class="text-5xl sm:text-6xl font-bold text-primary">{correctAnswers}/{totalQuestions}</div>
					</div>

					<!-- Performance Message -->
					<div class="mb-4">
						{#if correctAnswers / totalQuestions >= 0.8}
							<div class="text-5xl sm:text-6xl mb-2 animate-bounce">🏆🐴⭐</div>
							<p class="text-2xl sm:text-3xl font-bold">Loistavaa!</p>
						{:else if correctAnswers / totalQuestions >= 0.5}
							<div class="text-5xl sm:text-6xl mb-2">🌟🐷🌈</div>
							<p class="text-2xl sm:text-3xl font-bold">Hyvä!</p>
						{:else}
							<div class="text-5xl sm:text-6xl mb-2">💪🎈🌻</div>
							<p class="text-2xl sm:text-3xl font-bold">Hyvä yritys!</p>
						{/if}
					</div>

					<!-- Rotating decorations -->
					<div class="flex gap-3 text-4xl sm:text-5xl mb-6">
						<span class="animate-spin-slow">⭐</span>
						<span class="animate-bounce">🐴</span>
						<span class="animate-spin-slow">⭐</span>
						<span class="animate-bounce">🐷</span>
						<span class="animate-spin-slow">⭐</span>
					</div>

					<!-- Single Button -->
					<button class="btn btn-primary btn-lg w-full max-w-md h-16 sm:h-20 text-xl sm:text-2xl" onclick={resetGame}>
						<span class="text-3xl sm:text-4xl">🇪🇸</span>
						<div class="flex flex-col items-start leading-tight">
							<span>Jatka</span>
							<span class="text-sm opacity-70">Continuar</span>
						</div>
					</button>
				</div>
			</div>
		{/if}
	</div>
</GameContainer>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-10px);
		}
		75% {
			transform: translateX(10px);
		}
	}

	@keyframes spin-slow {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-in;
	}

	.animate-shake {
		animation: shake 0.5s ease-in-out;
	}

	.animate-spin-slow {
		animation: spin-slow 3s linear infinite;
	}

	.animate-bounce {
		animation: bounce 1s ease-in-out infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20px);
		}
	}
</style>
