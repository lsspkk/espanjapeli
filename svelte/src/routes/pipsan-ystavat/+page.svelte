<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import { tts } from '$lib/services/tts';
	import { peppaStats } from '$lib/services/peppaStatistics';
	import { selectGamePhrases, recordGameCompletion } from '$lib/services/phraseSelection';
	import KidsStartScreen from '$lib/components/kids/home/KidsStartScreen.svelte';
	import KidsEndScreen from '$lib/components/kids/home/KidsEndScreen.svelte';
	import KidsGameHeader from '$lib/components/kids/core/KidsGameHeader.svelte';
	import KidsImageOptions from '$lib/components/kids/input/KidsImageOptions.svelte';
	import BackButton from '$lib/components/shared/BackButton.svelte';

	interface EmojiTip {
		emojis: string[];
		display: string;
		description: string;
	}

	interface ImageItem {
		id: string;
		file: string;
		phrases: string[];
		category: string;
		keywords: string[];
		distractorPool: string[];
		emojiTip?: EmojiTip;
	}

	interface DistractorItem {
		description: string;
		emojiTip?: EmojiTip;
		status: string;
		file?: string;
	}

	interface GameQuestion {
		spanish: string;
		finnish?: string;
		english?: string;
		correctImage: string;
		distractors: string[];
		difficulty: string;
		category: string;
	}

	interface ImageManifest {
		images: ImageItem[];
		distractorImages: Record<string, DistractorItem>;
		gameSettings: {
			optionsPerQuestion: number;
			shuffleOptions: boolean;
			audioAutoplay: boolean;
			alternateDisplay?: {
				enabled: boolean;
				intervalMs: number;
				modes: string[];
			};
		};
		phraseQueue: GameQuestion[];
	}

	// Game data
	let manifest: ImageManifest | null = null;
	let phraseData: any = null;
	let loading = true;

	// Game state
	let gameStarted = false;
	let gameEnded = false;
	let currentQuestion: GameQuestion | null = null;
	let questionNumber = 0;
	let totalQuestions = 10; // Changed from 5 to 10
	let correctAnswers = 0;
	let consecutiveCorrect = 0; // Track consecutive correct answers
	let selectedAnswer: string | null = null;
	let isCorrect = false;
	let showCelebration = false;
	let celebrationEmoji = '';
	let autoPlayAudio = true; // Audio toggle setting
	
	// Phrase preview state
	let showPhrasePreview = false;
	let upcomingPhrases: GameQuestion[] = [];
	let previousGames: GameQuestion[][] = [];
	
	// Feedback state for showing wrong/correct answer images
	let showFeedback = false;
	let feedbackStage: 'wrong' | 'correct' | 'celebration' | null = null;
	let wrongAnswerImageId: string | null = null;
	let wrongAnswerText: string = '';

	// Display mode (svg vs emoji) - manual toggle, no limitations
	let displayMode: 'svg' | 'emoji' = 'svg';

	// Statistics tracking
	let currentSessionId: string | null = null;

	// Images for current question
	let currentOptions: { id: string; file: string; emojiDisplay: string; isCorrect: boolean }[] = [];

	// All available questions
	let questionQueue: GameQuestion[] = [];

	// Load game data
	onMount(async () => {
		try {
			// Load image manifest
			const manifestRes = await fetch(`${base}/peppa_advanced_spanish_images/image_manifest.json`);
			manifest = await manifestRes.json();

			// Load phrase data for Finnish translations
			const phraseRes = await fetch(`${base}/themes/peppa_advanced_spanish.json`);
			phraseData = await phraseRes.json();

			// Load audio setting from localStorage
			const savedAudioSetting = localStorage.getItem('peppaKuvatAudioEnabled');
			if (savedAudioSetting !== null) {
				autoPlayAudio = savedAudioSetting === 'true';
			}

			// Prepare phrases for the next game
			prepareNextGamePhrases();

			loading = false;
		} catch (error) {
			console.error('Failed to load game data:', error);
			loading = false;
		}
	});

	onDestroy(() => {
		// End session if still active
		if (currentSessionId && gameStarted) {
			peppaStats.endSession(currentSessionId);
		}
	});

	/**
	 * Toggle between SVG and emoji display modes
	 */
	function toggleDisplayMode() {
		displayMode = displayMode === 'svg' ? 'emoji' : 'svg';
		
		// Track toggle usage in statistics
		if (currentSessionId) {
			peppaStats.incrementToggles(currentSessionId);
		}
		
		// Replay audio when toggling
		replayAudio();
	}

	/**
	 * Save audio setting to localStorage
	 */
	function saveAudioSetting() {
		localStorage.setItem('peppaKuvatAudioEnabled', autoPlayAudio.toString());
	}

	/**
	 * Prepare phrases for the next game using intelligent selection
	 */
	function prepareNextGamePhrases() {
		if (!manifest) return;
		
		// Use the phrase selection service to get 10 phrases
		upcomingPhrases = selectGamePhrases(manifest.phraseQueue);
	}

	/**
	 * Toggle phrase preview modal
	 */
	function togglePhrasePreview() {
		showPhrasePreview = !showPhrasePreview;
		
		// Load previous games when opening the modal
		if (showPhrasePreview && manifest) {
			loadPreviousGames();
		}
	}

	/**
	 * Load previous games from localStorage
	 */
	function loadPreviousGames() {
		if (!manifest) return;
		
		try {
			const stored = localStorage.getItem('pipsan_ystavat_history');
			if (stored) {
				const history = JSON.parse(stored);
				previousGames = [];
				
				// Get last 3 games (in reverse order, most recent first)
				const recentGames = history.games.slice(-3).reverse();
				
				for (const gamePhrasesIds of recentGames) {
					const gamePhrases: GameQuestion[] = [];
					for (const phraseId of gamePhrasesIds) {
						const phrase = manifest.phraseQueue.find(p => p.spanish === phraseId);
						if (phrase) {
							gamePhrases.push(phrase);
						}
					}
					if (gamePhrases.length > 0) {
						previousGames.push(gamePhrases);
					}
				}
			}
		} catch (error) {
			console.error('Error loading previous games:', error);
		}
	}

	/**
	 * Speak a phrase in Spanish and Finnish using TTS
	 */
	function speakPhrase(spanish: string, finnish: string) {
		// Speak Spanish first
		const spanishUtterance = new SpeechSynthesisUtterance(spanish);
		spanishUtterance.lang = 'es-ES';
		spanishUtterance.rate = 0.8;
		
		spanishUtterance.onend = () => {
			// Then speak Finnish
			const finnishUtterance = new SpeechSynthesisUtterance(finnish);
			finnishUtterance.lang = 'fi-FI';
			finnishUtterance.rate = 0.9;
			window.speechSynthesis.speak(finnishUtterance);
		};
		
		window.speechSynthesis.speak(spanishUtterance);
	}

	function shuffleArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	function findFinnishTranslation(spanish: string): string {
		if (!phraseData) return '';
		
		// Search through all phrase categories
		const categories = [
			'introduction_phrases',
			'common_phrases', 
			'family_phrases',
			'school_phrases',
			'friendship_phrases',
			'activities_and_games',
			'emotions_and_reactions',
			'questions_and_answers',
			'weather_phrases',
			'time_phrases',
			'food_phrases'
		];

		for (const cat of categories) {
			const phrases = phraseData[cat];
			if (phrases) {
				const found = phrases.find((p: any) => p.spanish === spanish);
				if (found) return found.finnish;
			}
		}
		return '';
	}

	function getImageFile(imageId: string): string {
		if (!manifest) return '';
		
		// Check main images first
		const img = manifest.images.find(i => i.id === imageId);
		if (img) {
			return `${base}/peppa_advanced_spanish_images/${img.file}`;
		}
		
		// Check distractor images
		if (manifest.distractorImages && manifest.distractorImages[imageId]) {
			const distractor = manifest.distractorImages[imageId];
			if (distractor.file) {
				return `${base}/peppa_advanced_spanish_images/${distractor.file}`;
			}
		}
		
		console.warn(`⚠️ No image file found for ID: "${imageId}"`);
		return '';
	}

	function getEmojiDisplay(imageId: string): string {
		if (!manifest) return '❓';
		
		// Check main images first
		const img = manifest.images.find(i => i.id === imageId);
		if (img?.emojiTip?.display) return img.emojiTip.display;
		
		// Check distractor images
		if (manifest.distractorImages) {
			const distractor = manifest.distractorImages[imageId];
			if (distractor?.emojiTip?.display) return distractor.emojiTip.display;
		}
		
		// Debug: log missing ID
		console.warn(`⚠️ No emoji found for ID: "${imageId}"`);
		return '❓';
	}

	function startGame() {
		if (!manifest) return;

		gameStarted = true;
		gameEnded = false;
		questionNumber = 0;
		correctAnswers = 0;
		consecutiveCorrect = 0;
		selectedAnswer = null;
		displayMode = 'svg'; // Start with SVG mode

		// Use the prepared upcoming phrases (already selected with smart logic)
		questionQueue = shuffleArray([...upcomingPhrases]);
		totalQuestions = questionQueue.length; // Should be 10

		// Start statistics session
		currentSessionId = peppaStats.startSession('peppa_advanced_spanish', totalQuestions);

		nextQuestion();
	}

	function nextQuestion() {
		if (questionNumber >= totalQuestions || questionQueue.length === 0) {
			endGame();
			return;
		}

		questionNumber++;
		selectedAnswer = null;
		showCelebration = false;
		isCorrect = false;

		currentQuestion = questionQueue.shift()!;
		
		// Build options: 1 correct + distractors
		const correctImageId = currentQuestion.correctImage;
		const correctImageFile = getImageFile(correctImageId);
		const correctEmojiDisplay = getEmojiDisplay(correctImageId);
		
		// Get distractors
		const distractorIds = currentQuestion.distractors.slice(0, 3);
		
		currentOptions = [
			{ id: correctImageId, file: correctImageFile, emojiDisplay: correctEmojiDisplay, isCorrect: true },
			...distractorIds.map(id => ({
				id,
				file: getImageFile(id), // May be empty for distractors without SVG
				emojiDisplay: getEmojiDisplay(id),
				isCorrect: false
			}))
		];

		// Shuffle options
		currentOptions = shuffleArray(currentOptions);

		// Play Spanish audio if enabled
		if (autoPlayAudio) {
			setTimeout(() => {
				tts.speakSpanish(currentQuestion!.spanish);
			}, 500);
		}
	}

	function selectAnswer(optionId: string) {
		if (selectedAnswer !== null || !currentQuestion) return;

		selectedAnswer = optionId;
		const selectedOption = currentOptions.find(o => o.id === optionId);
		isCorrect = selectedOption?.isCorrect || false;

		// Record answer in statistics
		if (currentSessionId) {
			peppaStats.recordAnswer(currentSessionId, {
				questionSpanish: currentQuestion.spanish,
				questionFinnish: findFinnishTranslation(currentQuestion.spanish) || currentQuestion.finnish || '',
				selectedImageId: optionId,
				correctImageId: currentQuestion.correctImage,
				isCorrect,
				displayMode
			});
		}

		if (isCorrect) {
			correctAnswers++;
			consecutiveCorrect++;
			
			// Show celebration feedback
			showCorrectAnswerFeedback();
		} else {
			consecutiveCorrect = 0; // Reset consecutive counter
			
			// Show wrong answer feedback
			showWrongAnswerFeedback(optionId);
		}
	}

	/**
	 * Show feedback when user answers correctly
	 */
	function showCorrectAnswerFeedback() {
		if (!currentQuestion) return;

		showFeedback = true;
		feedbackStage = 'celebration';
		celebrationEmoji = ['🎉', '⭐', '🌟', '🏆', '🎊'][Math.floor(Math.random() * 5)];
		
		const celebrations = ['¡Muy bien!', '¡Excelente!', '¡Perfecto!', '¡Genial!', '¡Fantástico!', '¡Súper!'];
		const celebration = celebrations[Math.floor(Math.random() * celebrations.length)];
		const finnish = findFinnishTranslation(currentQuestion.spanish) || currentQuestion.finnish || '';
		
		if (autoPlayAudio) {
			// Speak: celebration, then Spanish phrase, then "on suomeksi", then Finnish
			const celebrationUtterance = new SpeechSynthesisUtterance(celebration);
			celebrationUtterance.lang = 'es-ES';
			celebrationUtterance.rate = 0.8;
			
			celebrationUtterance.onend = () => {
				// After celebration, speak Spanish then Finnish
				const spanishUtterance = new SpeechSynthesisUtterance(currentQuestion!.spanish);
				spanishUtterance.lang = 'es-ES';
				spanishUtterance.rate = 0.8;
				
				spanishUtterance.onend = () => {
					// After Spanish, speak Finnish
					const finnishUtterance = new SpeechSynthesisUtterance(`on suomeksi ${finnish}`);
					finnishUtterance.lang = 'fi-FI';
					finnishUtterance.rate = 0.9;
					
					finnishUtterance.onend = () => {
						// All audio finished, move to next question
						setTimeout(() => {
							showFeedback = false;
							feedbackStage = null;
							nextQuestion();
						}, 800);
					};
					
					window.speechSynthesis.speak(finnishUtterance);
				};
				
				window.speechSynthesis.speak(spanishUtterance);
			};
			
			window.speechSynthesis.speak(celebrationUtterance);
		} else {
			// No audio, just show for a fixed time
			setTimeout(() => {
				showFeedback = false;
				feedbackStage = null;
				nextQuestion();
			}, 3000);
		}
	}

	/**
	 * Show feedback when user answers incorrectly
	 */
	function showWrongAnswerFeedback(wrongImageId: string) {
		if (!currentQuestion) return;

		showFeedback = true;
		feedbackStage = 'wrong';
		wrongAnswerImageId = wrongImageId;
		
		// Find the description of the wrong answer
		const wrongOption = currentOptions.find(o => o.id === wrongImageId);
		
		// Try to find Finnish translation for the wrong answer
		// First check if it's in the main images
		const wrongImage = manifest?.images.find(i => i.id === wrongImageId);
		let wrongFinnish = '';
		
		if (wrongImage && wrongImage.phrases && wrongImage.phrases.length > 0) {
			wrongFinnish = findFinnishTranslation(wrongImage.phrases[0]);
		}
		
		// If not found, check distractor images
		if (!wrongFinnish && manifest?.distractorImages) {
			const distractor = manifest.distractorImages[wrongImageId];
			if (distractor?.description) {
				wrongFinnish = distractor.description;
			}
		}
		
		wrongAnswerText = wrongFinnish || wrongImageId.replace(/_/g, ' ');

		if (autoPlayAudio) {
			// Read the wrong answer in Finnish, then the correct answer
			setTimeout(() => {
				const wrongUtterance = new SpeechSynthesisUtterance(wrongAnswerText);
				wrongUtterance.lang = 'fi-FI';
				wrongUtterance.rate = 0.9;
				
				wrongUtterance.onend = () => {
					// After wrong answer audio, wait a bit then speak correct answer
					setTimeout(() => {
						const finnish = findFinnishTranslation(currentQuestion!.spanish) || currentQuestion!.finnish || '';
						
						// Speak: Spanish phrase, then "on suomeksi", then Finnish
						const spanishUtterance = new SpeechSynthesisUtterance(currentQuestion!.spanish);
						spanishUtterance.lang = 'es-ES';
						spanishUtterance.rate = 0.8;
						
						spanishUtterance.onend = () => {
							// After Spanish, speak Finnish
							const finnishUtterance = new SpeechSynthesisUtterance(`on suomeksi ${finnish}`);
							finnishUtterance.lang = 'fi-FI';
							finnishUtterance.rate = 0.9;
							
							finnishUtterance.onend = () => {
								// All audio finished, move to next question
								setTimeout(() => {
									showFeedback = false;
									feedbackStage = null;
									wrongAnswerImageId = null;
									nextQuestion();
								}, 800);
							};
							
							window.speechSynthesis.speak(finnishUtterance);
						};
						
						window.speechSynthesis.speak(spanishUtterance);
					}, 800);
				};
				
				window.speechSynthesis.speak(wrongUtterance);
			}, 500);
		} else {
			// No audio, show both wrong and correct answers together, then move on
			setTimeout(() => {
				showFeedback = false;
				feedbackStage = null;
				wrongAnswerImageId = null;
				nextQuestion();
			}, 4500);
		}
	}

	function endGame() {
		gameEnded = true;
		gameStarted = false;

		// Record game completion in phrase selection history
		recordGameCompletion(upcomingPhrases);

		// Prepare phrases for the next game
		prepareNextGamePhrases();

		// End statistics session
		if (currentSessionId) {
			peppaStats.endSession(currentSessionId);
		}

		const percentage = (correctAnswers / totalQuestions) * 100;
		if (percentage >= 80) {
			tts.speakSpanish('¡Fantástico!');
		} else if (percentage >= 50) {
			tts.speakSpanish('¡Buen trabajo!');
		} else {
			tts.speakSpanish('¡Sigue practicando!');
		}
	}

	function resetGame() {
		// End session if still active
		if (currentSessionId && gameStarted) {
			peppaStats.endSession(currentSessionId);
		}
		
		gameEnded = false;
		gameStarted = false;
		questionNumber = 0;
		correctAnswers = 0;
		consecutiveCorrect = 0;
		currentSessionId = null;
	}

	function replayAudio() {
		if (currentQuestion && autoPlayAudio) {
			tts.speakSpanish(currentQuestion.spanish);
		}
	}

	function getImageDescription(imageId: string): string {
		if (!manifest) return '';
		
		// Check main images
		const img = manifest.images.find(i => i.id === imageId);
		if (img && img.phrases && img.phrases.length > 0) {
			return findFinnishTranslation(img.phrases[0]) || img.phrases[0];
		}
		
		// Check distractor images
		if (manifest.distractorImages) {
			const distractor = manifest.distractorImages[imageId];
			if (distractor?.description) {
				return distractor.description;
			}
		}
		
		return imageId.replace(/_/g, ' ');
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300">
	<div class="container mx-auto px-2 max-w-5xl py-2">
		<!-- Back Button - Top Left (only on home screen) -->
		{#if !gameStarted && !gameEnded}
			<div class="mb-2">
				<BackButton />
			</div>
		{/if}

		{#if loading}
			<!-- Loading State -->
			<div class="flex min-h-[60vh] items-center justify-center">
				<div class="text-center">
					<div class="loading loading-spinner loading-lg text-primary"></div>
					<p class="mt-4 text-xl font-bold">Ladataan kuvia... 🐷</p>
				</div>
			</div>
		{:else if !gameStarted && !gameEnded}
			<!-- Start Screen -->
			<KidsStartScreen
				title="Pipsan ystävät"
				subtitle="Kuuntele ja valitse oikea kuva!"
				subtitleSpanish="Escucha y elige la imagen correcta"
				previewImages={[
					`${base}/peppa_advanced_spanish_images/svg/01_muddy_puddles.svg`,
					`${base}/peppa_advanced_spanish_images/svg/02_yo_soy_peppa.svg`
				]}
				{autoPlayAudio}
				onToggleAudio={(enabled) => {
					autoPlayAudio = enabled;
					saveAudioSetting();
				}}
				onStart={startGame}
				onOpenSanakirja={togglePhrasePreview}
			/>
		{:else if gameStarted && currentQuestion}
			<!-- Game Screen -->
			<div class="flex flex-col gap-2 max-h-screen overflow-hidden">
				<!-- Progress with integrated close button -->
				<KidsGameHeader
					currentQuestion={questionNumber}
					{totalQuestions}
					correctCount={correctAnswers}
					onClose={resetGame}
				/>

				<!-- Audio Card with Toggle (hidden during feedback) -->
				{#if !showFeedback}
					<div class="card bg-gradient-to-br from-yellow-100 to-orange-100 shadow-lg border-2 border-yellow-400">
						<div class="card-body p-3">
							<div class="grid grid-cols-2 gap-3 items-center">
								<!-- Left: Audio Replay -->
								<div class="flex flex-col items-center gap-1 border border-base-content/20 rounded-lg p-2 bg-white/30">
									<button 
										class="btn btn-circle btn-md bg-white hover:bg-yellow-50 border-2 border-primary shadow-lg {autoPlayAudio ? 'animate-pulse' : ''}"
										onclick={replayAudio}
										disabled={!autoPlayAudio}
									>
										<span class="text-3xl">🔊</span>
									</button>
									<p class="text-xs text-base-content/70">Kuuntele</p>
								</div>
								
								<!-- Right: Display Mode Selector -->
								<div class="flex flex-col items-center gap-1 border border-base-content/20 rounded-lg p-2 bg-white/30">
									<p class="text-[8px] font-bold text-base-content/60 mb-1">Tyyli</p>
									<button
										class="badge badge-sm {displayMode === 'svg' ? 'badge-primary' : 'badge-ghost'} transition-all cursor-pointer hover:scale-110 w-full"
										onclick={toggleDisplayMode}
									>
										🖼️ Kuva
									</button>
									<button
										class="badge badge-sm {displayMode === 'emoji' ? 'badge-primary' : 'badge-ghost'} transition-all cursor-pointer hover:scale-110 w-full"
										onclick={toggleDisplayMode}
									>
										😀 Emoji
									</button>
								</div>
							</div>
							
							<!-- Show Spanish text when audio is off -->
							{#if !autoPlayAudio && currentQuestion}
								<div class="mt-2 text-center">
									<p class="text-2xl font-bold text-primary">{currentQuestion.spanish}</p>
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Image Options Grid OR Feedback Area -->
				{#if showFeedback}
					<!-- Feedback Area (replaces image grid) -->
					<div class="flex-1 min-h-0 flex items-center justify-center bg-white rounded-2xl shadow-xl p-4 overflow-y-auto">
						{#if feedbackStage === 'wrong' && wrongAnswerImageId && currentQuestion}
							<!-- Show wrong answer first, then correct answer -->
							<div class="w-full max-w-2xl space-y-3 md:space-y-6 animate-fade-in">
								<!-- Wrong Answer Row -->
								<div class="flex items-center gap-2 md:gap-4 p-2 md:p-4 bg-red-50 rounded-xl border-2 border-red-300">
									<!-- Left: Image/Emoji (50% width, max 400px) -->
									<div class="flex items-center justify-center" style="width:50%; max-width:400px;">
										{#if displayMode === 'svg' && getImageFile(wrongAnswerImageId)}
											<img
												src={getImageFile(wrongAnswerImageId)}
												alt="Wrong answer"
												class="w-full h-full object-contain rounded-lg"
											/>
										{:else}
											<div class="text-5xl md:text-7xl">{getEmojiDisplay(wrongAnswerImageId)}</div>
										{/if}
									</div>
									
									<!-- Right: Text and Icon (50% width) -->
									<div class="flex flex-col items-center justify-center text-center" style="width:50%;">
										<div class="text-sm md:text-xl font-bold text-red-600 mb-1 md:mb-2">
											{wrongAnswerText}
										</div>
										<div class="text-4xl md:text-6xl">❌</div>
									</div>
								</div>

								<!-- Separator Arrow -->
								<div class="text-center">
									<div class="text-2xl md:text-4xl">👇</div>
								</div>

								<!-- Correct Answer Row -->
								<div class="flex items-center gap-2 md:gap-4 p-2 md:p-4 bg-green-50 rounded-xl border-2 border-green-300">
										<!-- Left: Image/Emoji (50% width, max 400px) -->
									<div class="flex items-center justify-center" style="width:50%; max-width:400px;">
										{#if displayMode === 'svg' && getImageFile(currentQuestion.correctImage)}
											<img
												src={getImageFile(currentQuestion.correctImage)}
												alt="Correct answer"
												class="w-full h-full object-contain rounded-lg"
											/>
										{:else}
											<div class="text-5xl md:text-7xl">{getEmojiDisplay(currentQuestion.correctImage)}</div>
										{/if}
									</div>
									
									<!-- Right: Text and Icon (50% width) -->
									<div class="flex flex-col items-center justify-center text-center" style="width:50%;">
										<div class="text-sm md:text-xl font-bold text-primary mb-1">
											{currentQuestion.spanish}
										</div>
										<div class="text-xs md:text-lg text-green-600 font-bold mb-1 md:mb-2">
											= {findFinnishTranslation(currentQuestion.spanish) || currentQuestion.finnish || ''}
										</div>
										<div class="text-4xl md:text-6xl">✅</div>
									</div>
								</div>
							</div>
						{:else if feedbackStage === 'correct' && currentQuestion}
							<!-- Show correct answer (fallback case, shouldn't be used with new logic) -->
							<div class="w-full max-w-2xl animate-fade-in">
								<!-- Correct Answer Row -->
								<div class="flex items-center gap-2 md:gap-4 p-2 md:p-4 bg-green-50 rounded-xl border-2 border-green-300">
										<!-- Left: Image/Emoji (50% width, max 400px) -->
									<div class="flex items-center justify-center" style="width:50%; max-width:400px;">
										{#if displayMode === 'svg' && getImageFile(currentQuestion.correctImage)}
											<img
												src={getImageFile(currentQuestion.correctImage)}
												alt="Correct answer"
												class="w-full h-full object-contain rounded-lg"
											/>
										{:else}
											<div class="text-5xl md:text-7xl">{getEmojiDisplay(currentQuestion.correctImage)}</div>
										{/if}
									</div>
									
									<!-- Right: Text and Icon (50% width) -->
									<div class="flex flex-col items-center justify-center text-center" style="width:50%;">
										<div class="text-sm md:text-xl font-bold text-primary mb-1">
											{currentQuestion.spanish}
										</div>
										<div class="text-xs md:text-lg text-green-600 font-bold mb-1 md:mb-2">
											= {findFinnishTranslation(currentQuestion.spanish) || currentQuestion.finnish || ''}
										</div>
										<div class="text-4xl md:text-6xl">✅</div>
									</div>
								</div>
							</div>
						{:else if feedbackStage === 'celebration' && currentQuestion}
							<!-- Show celebration for correct answer (user got it right on first try) -->
							<div class="w-full max-w-2xl animate-bounce">
								<div class="text-center mb-2 md:mb-4">
									<div class="text-6xl md:text-8xl mb-1 md:mb-2">{celebrationEmoji}</div>
									<div class="text-2xl md:text-3xl font-bold text-green-600">
										¡Muy bien!
									</div>
								</div>
								
								<!-- Correct Answer Row -->
								<div class="flex items-center gap-2 md:gap-4 p-2 md:p-4 bg-green-50 rounded-xl border-2 border-green-300">
									<!-- Left: Image/Emoji -->
									<div class="flex-shrink-0 w-20 h-20 md:w-32 md:h-32 flex items-center justify-center">
										{#if displayMode === 'svg' && getImageFile(currentQuestion.correctImage)}
											<img 
												src={getImageFile(currentQuestion.correctImage)} 
												alt="Correct answer"
												class="w-full h-full object-contain rounded-lg"
											/>
										{:else}
											<div class="text-5xl md:text-7xl">{getEmojiDisplay(currentQuestion.correctImage)}</div>
										{/if}
									</div>
									
									<!-- Right: Text and Icon -->
									<div class="flex-1 flex flex-col items-center justify-center text-center">
										<div class="text-sm md:text-xl font-bold text-primary mb-1">
											{currentQuestion.spanish}
										</div>
										<div class="text-xs md:text-lg text-green-600 font-bold mb-1 md:mb-2">
											= {findFinnishTranslation(currentQuestion.spanish) || currentQuestion.finnish || ''}
										</div>
										<div class="text-4xl md:text-6xl">✅</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Image Options Grid -->
					<KidsImageOptions
						options={currentOptions}
						{displayMode}
						{selectedAnswer}
						onSelect={selectAnswer}
						showDebugLabels={true}
					/>
				{/if}
			</div>
		{:else if gameEnded}
			<!-- End Screen -->
			<KidsEndScreen
				correctCount={correctAnswers}
				{totalQuestions}
				onPlayAgain={startGame}
				onHome={() => window.location.href = `${base}/`}
			/>
		{/if}

		<!-- Phrase Preview Modal -->
		{#if showPhrasePreview}
			<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 sm:flex sm:items-center sm:justify-center sm:p-2" onclick={togglePhrasePreview} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && togglePhrasePreview()}>
				<div class="bg-white sm:rounded-2xl shadow-2xl sm:max-w-2xl w-full h-full sm:h-auto sm:max-h-[95vh] overflow-hidden" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" onkeydown={(e) => e.stopPropagation()}>
					<!-- Modal Header -->
					<div class="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-3 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-2xl">📖</span>
							<h2 class="text-xl font-bold">Sanakirja</h2>
						</div>
						<button class="btn btn-circle btn-sm btn-ghost text-white" onclick={togglePhrasePreview}>
							✕
						</button>
					</div>

					<!-- Modal Content -->
					<div class="overflow-y-auto h-[calc(100vh-60px)] sm:h-auto sm:max-h-[calc(95vh-60px)] p-2">
						<!-- Upcoming Game Phrases -->
						<div class="space-y-1 mb-4">
							{#each upcomingPhrases as phrase}
								<div class="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-2 border border-pink-200">
									<div class="flex items-center gap-2">
										<!-- Phrase content -->
										<div class="flex-1 min-w-0">
											<div class="text-sm font-bold text-gray-700 truncate">
												{phrase.spanish}
											</div>
											<div class="text-xs text-base-content/70 truncate">
												{findFinnishTranslation(phrase.spanish) || phrase.finnish || ''}
											</div>
										</div>

										<!-- TTS Button -->
										<button 
											class="btn btn-circle btn-xs bg-white hover:bg-pink-100 border border-pink-300 flex-shrink-0"
											onclick={() => speakPhrase(phrase.spanish, findFinnishTranslation(phrase.spanish) || phrase.finnish || '')}
											title="Kuuntele"
										>
											<span class="text-sm">🔊</span>
										</button>
									</div>
								</div>
							{/each}
						</div>

						<!-- Previous Games -->
						{#each previousGames as gamePhrases, gameIndex}
							<!-- Separator -->
							<div class="bg-base-200 rounded-lg p-2 mb-2 mt-4">
								<p class="text-xs font-semibold text-center text-base-content/70">
									{gameIndex === 0 ? 'Edellisen pelin sanat' : `${gameIndex + 1}. viimeisen pelin sanat`}
								</p>
							</div>

							<!-- Game Phrases -->
							<div class="space-y-1 mb-4">
								{#each gamePhrases as phrase}
									<div class="bg-base-100 rounded-lg p-2 border border-base-300">
										<div class="flex items-center gap-2">
											<!-- Phrase content -->
											<div class="flex-1 min-w-0">
												<div class="text-sm font-bold text-gray-700 truncate">
													{phrase.spanish}
												</div>
												<div class="text-xs text-base-content/60 truncate">
													{findFinnishTranslation(phrase.spanish) || phrase.finnish || ''}
												</div>
											</div>

											<!-- TTS Button -->
											<button 
												class="btn btn-circle btn-xs bg-white hover:bg-base-200 border border-base-300 flex-shrink-0"
												onclick={() => speakPhrase(phrase.spanish, findFinnishTranslation(phrase.spanish) || phrase.finnish || '')}
												title="Kuuntele"
											>
												<span class="text-sm">🔊</span>
											</button>
										</div>
									</div>
								{/each}
							</div>
						{/each}

						<!-- Close button at bottom -->
						<div class="mt-4 mb-2 text-center">
							<button class="btn btn-primary btn-sm btn-wide" onclick={togglePhrasePreview}>
								Sulje
							</button>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}

	.delay-100 { animation-delay: 100ms; }
	.delay-200 { animation-delay: 200ms; }
	.delay-300 { animation-delay: 300ms; }
	.delay-400 { animation-delay: 400ms; }
</style>
