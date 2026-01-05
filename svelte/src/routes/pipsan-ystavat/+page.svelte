<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { base } from '$app/paths';
	import { tts } from '$lib/services/tts';
	import { peppaStats } from '$lib/services/peppaStatistics';

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
	let totalQuestions = 5;
	let correctAnswers = 0;
	let consecutiveCorrect = 0; // Track consecutive correct answers
	let selectedAnswer: string | null = null;
	let isCorrect = false;
	let showCelebration = false;
	let celebrationEmoji = '';
	let showToggleBonus = false;
	let toggleBonusAmount = 0;
	let autoPlayAudio = true; // Audio toggle setting
	
	// Feedback state for showing wrong/correct answer images
	let showFeedback = false;
	let feedbackStage: 'wrong' | 'correct' | 'celebration' | null = null;
	let wrongAnswerImageId: string | null = null;
	let wrongAnswerText: string = '';

	// Display mode (svg vs emoji) - now manual toggle instead of automatic
	let displayMode: 'svg' | 'emoji' = 'svg';
	let togglesRemaining = 3; // Starts at 3
	let displayInterval: ReturnType<typeof setInterval> | null = null;

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

			loading = false;
		} catch (error) {
			console.error('Failed to load game data:', error);
			loading = false;
		}
	});

	onDestroy(() => {
		if (displayInterval) {
			clearInterval(displayInterval);
		}
		// End session if still active
		if (currentSessionId && gameStarted) {
			peppaStats.endSession(currentSessionId);
		}
	});

	/**
	 * Toggle between SVG and emoji display modes
	 */
	function toggleDisplayMode() {
		if (togglesRemaining <= 0) return;
		
		displayMode = displayMode === 'svg' ? 'emoji' : 'svg';
		togglesRemaining--;
		
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
		const img = manifest.images.find(i => i.id === imageId);
		const filePath = img ? `${base}/peppa_advanced_spanish_images/${img.file}` : '';
		if (!img) {
			console.warn(`⚠️ No image file found for ID: "${imageId}"`);
		}
		return filePath;
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
		togglesRemaining = 3; // Reset toggles

		// Shuffle and prepare question queue
		questionQueue = shuffleArray([...manifest.phraseQueue]);
		totalQuestions = Math.min(questionQueue.length, 5);

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
			
			// After 2 correct answers in a row, add 1 toggle
			if (consecutiveCorrect >= 2) {
				togglesRemaining += 1;
				consecutiveCorrect = 0; // Reset counter
				
				// Show bonus notification
				showToggleBonus = true;
				toggleBonusAmount = 1;
				setTimeout(() => {
					showToggleBonus = false;
				}, 2000);
			}
			
			// Show celebration feedback
			showCorrectAnswerFeedback();
		} else {
			// Wrong answer: add 3 toggles
			togglesRemaining += 3;
			consecutiveCorrect = 0; // Reset consecutive counter
			
			// Show bonus notification
			showToggleBonus = true;
			toggleBonusAmount = 3;
			setTimeout(() => {
				showToggleBonus = false;
			}, 2000);
			
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
			// Read the wrong answer in Finnish
			setTimeout(() => {
				const wrongUtterance = new SpeechSynthesisUtterance(wrongAnswerText);
				wrongUtterance.lang = 'fi-FI';
				wrongUtterance.rate = 0.9;
				
				wrongUtterance.onend = () => {
					// After wrong answer audio, wait a bit then show correct answer
					setTimeout(() => {
						feedbackStage = 'correct';
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
			// No audio, use fixed timings
			setTimeout(() => {
				feedbackStage = 'correct';
			}, 2500);

			setTimeout(() => {
				showFeedback = false;
				feedbackStage = null;
				wrongAnswerImageId = null;
				nextQuestion();
			}, 5000);
		}
	}

	function endGame() {
		gameEnded = true;
		gameStarted = false;

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
	<div class="container mx-auto px-4 max-w-5xl py-4">
		<!-- Header -->
		{#if !gameStarted && !gameEnded}
			<div class="mb-4">
				<a href="{base}/" class="btn btn-ghost btn-sm bg-white/80 backdrop-blur">← Takaisin</a>
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
			<div class="card bg-white/95 shadow-2xl backdrop-blur">
				<div class="card-body p-6 sm:p-8">
					<div class="text-center mb-6">
						<div class="text-5xl mb-4">🐷👫🇪🇸</div>
						<h1 class="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
							Pipsan ystävät
						</h1>
						<p class="text-lg text-base-content/70 mt-2">
							Kuuntele ja valitse oikea kuva!
						</p>
						<p class="text-sm text-base-content/50 mt-1">
							Escucha y elige la imagen correcta
						</p>
					</div>


					<!-- Preview: Toggle between modes -->
					<div class="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-2 sm:p-4 mb-4">
						<p class="text-center text-sm font-bold mb-2">
							Vaihda näkymää painikkeella!
						</p>
						<div class="grid grid-cols-2 gap-2 sm:gap-4">
							<div>
								<p class="text-xs font-bold text-center mb-2">🖼️ Kuvatila:</p>
								<div class="grid grid-cols-2 gap-1 sm:gap-2">
									<div class="aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-pink-300">
										<img src="{base}/peppa_advanced_spanish_images/svg/01_muddy_puddles.svg" alt="Muddy puddles" class="w-full h-full object-cover" />
									</div>
									<div class="aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-blue-300">
										<img src="{base}/peppa_advanced_spanish_images/svg/02_yo_soy_peppa.svg" alt="Yo soy Peppa" class="w-full h-full object-cover" />
									</div>
								</div>
							</div>
							<div>
								<p class="text-xs font-bold text-center mb-2">😀 Emojitila:</p>
								<div class="grid grid-cols-2 gap-2">
									<div class="aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
										<span class="text-3xl sm:text-xl">🐷💦🟤👢😄</span>
									</div>
									<div class="aspect-square rounded-lg overflow-hidden shadow-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
										<span class="text-3xl sm:text-xl">🐷👆💗✨</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Audio Toggle -->
					<div class="form-control mb-4">
						<label class="label cursor-pointer justify-center gap-3 bg-base-200 rounded-lg p-3">
							<span class="text-3xl sm:text-4xl">🔊</span>
							<span class="text-lg sm:text-xl font-bold">Ääni päälle</span>
							<input
								type="checkbox"
								bind:checked={autoPlayAudio}
								onchange={saveAudioSetting}
								class="toggle toggle-secondary toggle-md sm:toggle-lg"
							/>
						</label>
					</div>

					<button 
						class="btn btn-primary btn-lg w-full text-2xl h-20"
						onclick={startGame}
					>
						<span class="text-4xl">🎮</span>
						Aloita peli!
					</button>
				</div>
			</div>
		{:else if gameStarted && currentQuestion}
			<!-- Game Screen -->
			<div class="flex flex-col gap-2 max-h-screen overflow-hidden">
				<!-- Progress with integrated close button -->
				<div class="card bg-white/90 shadow-lg">
					<div class="card-body p-2">
						<div class="flex items-center justify-between text-sm">
							<span class="font-bold text-base">Kysymys {questionNumber}/{totalQuestions}</span>
							<div class="flex items-center gap-2">
								<span class="font-bold text-base text-success">✅ {correctAnswers}</span>
								<button onclick={resetGame} class="btn btn-ghost btn-xs" title="Sulje peli">
									✕
								</button>
							</div>
						</div>
						<progress 
							class="progress progress-primary w-full h-2" 
							value={questionNumber} 
							max={totalQuestions}
						></progress>
					</div>
				</div>

				<!-- Audio Card with Toggle -->
				<div class="card bg-gradient-to-br from-yellow-100 to-orange-100 shadow-lg border-2 border-yellow-400">
					<div class="card-body p-3">
						<h2 class="text-base font-bold mb-2 text-center">
							{#if autoPlayAudio}
								Kuuntele ja arvaa!
							{:else}
								Lue ja arvaa!
							{/if}
						</h2>
						
						<div class="grid grid-cols-2 gap-3">
							<!-- Left: Audio Replay -->
							<div class="flex flex-col items-center gap-1">
								<button 
									class="btn btn-circle btn-md bg-white hover:bg-yellow-50 border-2 border-primary shadow-lg {autoPlayAudio ? 'animate-pulse' : ''}"
									onclick={replayAudio}
									disabled={!autoPlayAudio}
								>
									<span class="text-3xl">🔊</span>
								</button>
								<p class="text-xs text-base-content/70">Kuuntele</p>
							</div>
							
							<!-- Right: Display Mode Toggle -->
							<div class="flex flex-col items-center gap-1">
								<button
									class="btn btn-circle btn-md border-2 shadow-lg transition-all duration-300
										{togglesRemaining > 0 
											? 'bg-gradient-to-br from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 border-blue-600' 
											: 'bg-gray-300 border-gray-400 cursor-not-allowed opacity-50'}"
									onclick={toggleDisplayMode}
									disabled={togglesRemaining <= 0}
									title={togglesRemaining > 0 ? 'Vaihda tilaa' : 'Ei vaihtoja'}
								>
									<span class="text-2xl">{displayMode === 'svg' ? '🖼️' : '😀'}</span>
								</button>
								<div class="badge badge-sm gap-1 {togglesRemaining > 0 ? 'badge-primary' : 'badge-ghost'}">
									<span class="text-xs">🔄</span>
									<span class="font-bold text-xs">{togglesRemaining}</span>
								</div>
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

				<!-- Image Options Grid OR Feedback Area -->
				{#if showFeedback}
					<!-- Feedback Area (replaces image grid) -->
					<div class="flex-1 min-h-0 flex items-center justify-center bg-white rounded-2xl shadow-xl p-4">
						{#if feedbackStage === 'wrong' && wrongAnswerImageId}
							<!-- Show wrong answer -->
							<div class="text-center animate-fade-in">
								<div class="text-6xl mb-4">❌</div>
								
								<!-- Wrong answer image -->
								{#if displayMode === 'svg' && getImageFile(wrongAnswerImageId)}
									<div class="mb-4 max-w-md mx-auto">
										<img 
											src={getImageFile(wrongAnswerImageId)} 
											alt="Wrong answer"
											class="w-full h-auto rounded-xl shadow-lg"
										/>
									</div>
								{:else}
									<div class="text-8xl mb-4">{getEmojiDisplay(wrongAnswerImageId)}</div>
								{/if}
								
								<!-- Wrong answer text -->
								<div class="text-3xl font-bold text-red-600 mb-2">
									{wrongAnswerText}
								</div>
								{#if !autoPlayAudio}
									<div class="text-lg text-base-content/70">
										(Tämä oli väärä vastaus)
									</div>
								{/if}
							</div>
						{:else if feedbackStage === 'correct' && currentQuestion}
							<!-- Show correct answer -->
							<div class="text-center animate-fade-in">
								<div class="text-6xl mb-4">✅</div>
								
								<!-- Correct answer image -->
								{#if displayMode === 'svg' && getImageFile(currentQuestion.correctImage)}
									<div class="mb-4 max-w-md mx-auto">
										<img 
											src={getImageFile(currentQuestion.correctImage)} 
											alt="Correct answer"
											class="w-full h-auto rounded-xl shadow-lg border-4 border-green-500"
										/>
									</div>
								{:else}
									<div class="text-8xl mb-4">{getEmojiDisplay(currentQuestion.correctImage)}</div>
								{/if}
								
								<!-- Correct answer text -->
								<div class="text-3xl font-bold text-primary mb-2">
									{currentQuestion.spanish}
								</div>
								<div class="text-2xl text-green-600 font-bold">
									= {findFinnishTranslation(currentQuestion.spanish) || currentQuestion.finnish || ''}
								</div>
								{#if !autoPlayAudio}
									<div class="text-lg text-base-content/70 mt-2">
										(Oikea vastaus)
									</div>
								{/if}
							</div>
						{:else if feedbackStage === 'celebration' && currentQuestion}
							<!-- Show celebration for correct answer -->
							<div class="text-center animate-bounce">
								<div class="text-9xl mb-4">{celebrationEmoji}</div>
								<div class="text-4xl font-bold text-green-600 mb-4">
									¡Muy bien!
								</div>
								
								<!-- Correct answer image -->
								{#if displayMode === 'svg' && getImageFile(currentQuestion.correctImage)}
									<div class="mb-4 max-w-md mx-auto">
										<img 
											src={getImageFile(currentQuestion.correctImage)} 
											alt="Correct answer"
											class="w-full h-auto rounded-xl shadow-lg border-4 border-green-500"
										/>
									</div>
								{:else}
									<div class="text-8xl mb-4">{getEmojiDisplay(currentQuestion.correctImage)}</div>
								{/if}
								
								<div class="text-3xl font-bold text-primary mb-2">
									{currentQuestion.spanish}
								</div>
								<div class="text-2xl text-green-600 font-bold">
									= {findFinnishTranslation(currentQuestion.spanish) || currentQuestion.finnish || ''}
								</div>
								{#if !autoPlayAudio}
									<div class="text-lg text-base-content/70 mt-2">
										(Oikein!)
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{:else}
					<!-- Image Options Grid -->
					<div class="grid grid-cols-2 gap-2 flex-1 min-h-0">
						{#each currentOptions as option}
							<button
								class="aspect-square rounded-2xl overflow-hidden shadow-xl transition-all duration-500 border-4
									{selectedAnswer === option.id 
										? option.isCorrect 
											? 'border-green-500 ring-4 ring-green-300 scale-105' 
											: 'border-red-500 ring-4 ring-red-300 opacity-70'
										: selectedAnswer !== null && option.isCorrect
											? 'border-green-500 ring-4 ring-green-300 animate-pulse'
											: 'border-white/50 hover:border-primary hover:scale-105 hover:shadow-2xl'
									}"
								disabled={selectedAnswer !== null}
								onclick={() => selectAnswer(option.id)}
							>
								<!-- Display mode: SVG or Emoji -->
								{#if displayMode === 'svg' && option.file}
									<!-- SVG Image Mode -->
									<img 
										src={option.file} 
									alt=""
									class="w-full h-full object-cover bg-white transition-all duration-500"
									onerror={(e) => {
										console.error(`❌ Failed to load: ${option.file} for ${option.id}`);
										const target = e.currentTarget as HTMLImageElement;
										target.style.display = 'none';
										const parent = target.parentElement;
										if (parent) {
											const div = document.createElement('div');
											div.className = 'w-full h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center';
											div.innerHTML = `<span class="text-5xl sm:text-6xl">${option.emojiDisplay}</span>`;
											parent.appendChild(div);
										}
									}}
									/>
								{:else}
									<!-- Emoji Mode (or fallback when no SVG) -->
									<div class="w-full h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center transition-all duration-500">
										<span class="text-5xl sm:text-6xl tracking-wider">{option.emojiDisplay}</span>
									</div>
								{/if}
							</button>
						{/each}
					</div>
				{/if}

				<!-- Display mode indicator -->
				{#if !showFeedback}
					<div class="flex justify-center gap-2">
						<span class="badge badge-sm {displayMode === 'svg' ? 'badge-primary' : 'badge-ghost'} transition-all">
							🖼️ Kuva
						</span>
						<span class="badge badge-sm {displayMode === 'emoji' ? 'badge-primary' : 'badge-ghost'} transition-all">
							😀 Emoji
						</span>
					</div>
				{/if}

				<!-- Toggle Bonus Notification -->
				{#if showToggleBonus}
					<div class="fixed top-24 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-bounce">
						<div class="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-2xl shadow-2xl border-4 border-white">
							<div class="text-center">
								<div class="text-4xl mb-2">🔄</div>
								<div class="text-2xl font-bold">+{toggleBonusAmount} vaihtoa!</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else if gameEnded}
			<!-- End Screen -->
			<div class="card bg-white/95 shadow-2xl backdrop-blur">
				<div class="card-body items-center text-center p-8">
					<div class="text-8xl mb-4">
						{#if correctAnswers / totalQuestions >= 0.8}
							🏆
						{:else if correctAnswers / totalQuestions >= 0.5}
							⭐
						{:else}
							💪
						{/if}
					</div>

					<h2 class="text-3xl font-bold mb-2">
						{#if correctAnswers / totalQuestions >= 0.8}
							Loistavaa! 🎉
						{:else if correctAnswers / totalQuestions >= 0.5}
							Hyvä työ! 🌟
						{:else}
							Hyvä yritys! 💪
						{/if}
					</h2>

					<div class="text-6xl font-bold text-primary my-4">
						{correctAnswers} / {totalQuestions}
					</div>

					<div class="text-xl text-base-content/70 mb-6">
						oikein
					</div>

					<!-- Decorations -->
					<div class="flex gap-4 text-4xl mb-6">
						<span class="animate-bounce delay-100">🐷</span>
						<span class="animate-bounce delay-200">🌈</span>
						<span class="animate-bounce delay-300">🎨</span>
						<span class="animate-bounce delay-400">⭐</span>
					</div>

					<div class="flex flex-col sm:flex-row gap-3 w-full max-w-md">
						<button 
							class="btn btn-primary btn-lg flex-1 text-xl"
							onclick={startGame}
						>
							🔄 Pelaa uudelleen
						</button>
						<a 
							href="{base}/"
							class="btn btn-outline btn-lg flex-1 text-xl"
						>
							🏠 Kotiin
						</a>
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
