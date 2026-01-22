<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import {
		loadSentenceIndex,
		getSentencesByCategory,
		type Sentence,
		type CEFRLevel
	} from '$lib/services/sentenceLoader';
	import { tts } from '$lib/services/tts';
	import { ttsSettings } from '$lib/stores/ttsSettings';
	import StepwiseReveal from '$lib/components/shared/StepwiseReveal.svelte';
	import { timedAnswerSettings } from '$lib/stores/timedAnswerSettings';
	import GameContainer from '$lib/components/shared/GameContainer.svelte';
	import GameHeader from '$lib/components/basic/core/GameHeader.svelte';
	import OptionButtons from '$lib/components/basic/input/OptionButtons.svelte';
	import FeedbackOverlay from '$lib/components/basic/feedback/FeedbackOverlay.svelte';
	import { sentenceKnowledge } from '$lib/stores/sentenceKnowledge';

	// Game states
	type GameState = 'home' | 'loading' | 'playing' | 'feedback' | 'report';
	let gameState = $state<GameState>('home');

	// Game configuration
	let selectedMode = $state<'listen' | 'read'>('listen');
	let selectedTheme = $state<string>('greetings');
	let selectedLevel = $state<CEFRLevel>('A1');
	let availableThemes = $state<string[]>([]);

	// TTS settings
	let autoSpeakEnabled = $state(true);

	// Stepwise reveal state
	let answersRevealed = $state(false);
	let delaySeconds = $state(3);
	let stepwiseRevealRef = $state<any>(null);

	// Game variables
	let currentSentence = $state<Sentence | null>(null);
	let answerOptions = $state<string[]>([]);
	let selectedAnswer = $state<string | null>(null);
	let score = $state(0);
	let questionIndex = $state(0);
	let totalQuestions = $state(10);
	let sentenceQueue = $state<Sentence[]>([]);
	let wrongAnswers = $state<Array<{ spanish: string; finnish: string; userAnswer: string }>>([]);

	// Load available themes on mount
	onMount(async () => {
		try {
			const manifest = await loadSentenceIndex();
			availableThemes = [...new Set(manifest.categories.map(c => c.name))];
			if (availableThemes.length > 0) {
				selectedTheme = availableThemes[0];
			}
		} catch (error) {
			console.error('Failed to load sentence categories:', error);
		}

		// Subscribe to TTS settings
		const unsubscribeTts = ttsSettings.subscribe((settings) => {
			autoSpeakEnabled = settings.autoSpeak;
		});

		// Subscribe to timed answer settings
		const unsubscribeTimer = timedAnswerSettings.subscribe((settings) => {
			delaySeconds = settings.mitasasanoit;
		});

		return () => {
			unsubscribeTts();
			unsubscribeTimer();
		};
	});

	// Start game
	async function startGame() {
		gameState = 'loading';
		try {
			// Load sentences for selected category
			const sentences = await getSentencesByCategory(selectedTheme);
			
			// Filter by level (word count)
			const levelRanges: Record<CEFRLevel, { min: number; max: number }> = {
				A1: { min: 1, max: 6 },
				A2: { min: 1, max: 8 },
				B1: { min: 1, max: 10 },
				B2: { min: 1, max: 12 },
				C1: { min: 1, max: 15 },
				C2: { min: 1, max: 20 }
			};
			const range = levelRanges[selectedLevel];
			const filtered = sentences.filter(
				s => s.wordCount >= range.min && s.wordCount <= range.max
			);

			// Shuffle and select sentences
			const shuffled = [...filtered].sort(() => Math.random() - 0.5);
			sentenceQueue = shuffled.slice(0, totalQuestions);

			// Reset game state
			score = 0;
			questionIndex = 0;
			wrongAnswers = [];

			// Start first question
			if (sentenceQueue.length > 0) {
				loadNextQuestion();
			} else {
				alert('Ei lauseita valitulle teemalle ja tasolle');
				gameState = 'home';
			}
		} catch (error) {
			console.error('Failed to start game:', error);
			alert('Virhe pelin aloittamisessa');
			gameState = 'home';
		}
	}

	// Load next question
	function loadNextQuestion() {
		if (questionIndex >= sentenceQueue.length) {
			gameState = 'report';
			return;
		}

		currentSentence = sentenceQueue[questionIndex];
		selectedAnswer = null;
		answersRevealed = false;
		disabledOptions = new Set();
		
		// Generate answer options
		answerOptions = generateAnswerOptions(currentSentence, sentenceQueue);

		// Reset stepwise reveal timer
		if (stepwiseRevealRef?.reset) {
			stepwiseRevealRef.reset();
		}

		gameState = 'playing';

		// Auto-speak in listen mode if autoSpeak is enabled
		if (selectedMode === 'listen' && autoSpeakEnabled && currentSentence) {
			tts.speakSpanish(currentSentence.spanish);
		}
	}

	// Generate 4 answer options (1 correct + 3 wrong)
	function generateAnswerOptions(correct: Sentence, allSentences: Sentence[]): string[] {
		const correctAnswer = correct.finnish;
		const wrongAnswers: string[] = [];
		
		// Filter candidates: exclude current sentence, prefer similar word count
		const candidates = allSentences.filter(s => s.id !== correct.id);
		
		// Sort by similarity in word count (prefer similar difficulty)
		const sorted = candidates.sort((a, b) => {
			const diffA = Math.abs(a.wordCount - correct.wordCount);
			const diffB = Math.abs(b.wordCount - correct.wordCount);
			return diffA - diffB;
		});
		
		// Select 3 wrong answers
		// Avoid answers that are too different in length (character count)
		const correctLength = correctAnswer.length;
		for (const candidate of sorted) {
			if (wrongAnswers.length >= 3) break;
			
			const candidateLength = candidate.finnish.length;
			const lengthDiff = Math.abs(candidateLength - correctLength);
			const maxDiff = correctLength * 0.5; // Allow up to 50% difference
			
			// Skip if too different in length or already selected
			if (lengthDiff > maxDiff || wrongAnswers.includes(candidate.finnish)) {
				continue;
			}
			
			wrongAnswers.push(candidate.finnish);
		}
		
		// If we couldn't find 3 suitable wrong answers, relax the length constraint
		if (wrongAnswers.length < 3) {
			for (const candidate of sorted) {
				if (wrongAnswers.length >= 3) break;
				if (!wrongAnswers.includes(candidate.finnish) && candidate.finnish !== correctAnswer) {
					wrongAnswers.push(candidate.finnish);
				}
			}
		}
		
		// Combine and shuffle
		const allOptions = [correctAnswer, ...wrongAnswers];
		return allOptions.sort(() => Math.random() - 0.5);
	}

	// Handle answer selection
	function selectAnswer(answer: string) {
		selectedAnswer = answer;
		const correct = answer === currentSentence?.finnish;
		if (correct) {
			score++;
		} else {
			// Track wrong answer
			if (currentSentence) {
				wrongAnswers.push({
					spanish: currentSentence.spanish,
					finnish: currentSentence.finnish,
					userAnswer: answer
				});
			}
		}
		
		// Record answer in sentenceKnowledge store
		if (currentSentence) {
			sentenceKnowledge.recordSentenceAnswer(currentSentence.id, correct);
		}
		
		gameState = 'feedback';
		feedbackVisible = true;
		feedbackClosing = false;
		
		// Auto-continue after delay for correct answers
		if (correct) {
			setTimeout(() => {
				closeFeedbackAndContinue();
			}, 2000);
		}
	}

	// Continue to next question
	function continueGame() {
		questionIndex++;
		loadNextQuestion();
	}
	
	// Close feedback overlay and continue
	function closeFeedbackAndContinue() {
		feedbackClosing = true;
		setTimeout(() => {
			feedbackVisible = false;
			continueGame();
		}, 300);
	}

	// Restart game
	function restartGame() {
		gameState = 'home';
	}

	// Quit game
	function quitGame() {
		gameState = 'home';
	}

	// Prepare options for OptionButtons component
	let optionButtonsData = $derived(
		answerOptions.map(option => ({
			id: option,
			text: option
		}))
	);
	let disabledOptions = $state(new Set<string>());

	// Feedback overlay state
	let feedbackVisible = $state(false);
	let feedbackClosing = $state(false);
	
	// Celebration exclamations for correct answers
	const celebrationExclamations = ['¡Perfecto!', '¡Muy bien!', '¡Excelente!', '¡Fantástico!', '¡Bravo!'];
	
	function getRandomExclamation(): string {
		return celebrationExclamations[Math.floor(Math.random() * celebrationExclamations.length)];
	}
	
	// Get sentence stats for report
	let sentenceStats = $derived(sentenceKnowledge.getSentenceStats());
</script>

{#if gameState === 'home'}
	<div class="min-h-screen bg-base-200">
		<div class="container mx-auto px-4 py-8">
			<!-- Back Button -->
			<div class="mb-4">
				<a href="{base}/" class="btn btn-ghost btn-sm">Takaisin</a>
			</div>

			<div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
				<div class="card-body">
					<h1 class="card-title text-3xl mb-2">Mitä sä sanoit?</h1>
					<p class="text-base text-base-content/70 mb-6">
						Kuuntele tai lue espanjalainen lause ja valitse oikea suomennos neljästä vaihtoehdosta.
					</p>

				<!-- Mode selector -->
				<div class="form-control mb-4">
					<div class="label">
						<span class="label-text font-semibold">Pelimuoto</span>
					</div>
					<div class="flex gap-2">
						<button 
							class="btn flex-1" 
							class:btn-primary={selectedMode === 'listen'}
							onclick={() => selectedMode = 'listen'}
						>
							👂 Kuuntelu
						</button>
						<button 
							class="btn flex-1" 
							class:btn-primary={selectedMode === 'read'}
							onclick={() => selectedMode = 'read'}
						>
							📖 Lukeminen
						</button>
					</div>
				</div>

				<!-- Theme selector -->
				<div class="form-control mb-4">
					<label class="label" for="theme-select">
						<span class="label-text font-semibold">Teema</span>
					</label>
					<select id="theme-select" class="select select-bordered" bind:value={selectedTheme}>
						{#each availableThemes as theme}
							<option value={theme}>{theme}</option>
						{/each}
					</select>
				</div>

				<!-- Level selector -->
				<div class="form-control mb-6">
					<div class="label">
						<span class="label-text font-semibold">Taso</span>
					</div>
					<div class="flex gap-2 flex-wrap">
						{#each ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as level}
							<button 
								class="btn btn-sm" 
								class:btn-primary={selectedLevel === level}
								onclick={() => selectedLevel = level as CEFRLevel}
							>
								{level}
							</button>
						{/each}
					</div>
				</div>

					<!-- Start button -->
					<button class="btn btn-primary btn-lg" onclick={startGame}>
						Aloita
					</button>
				</div>
			</div>
		</div>
	</div>
{:else if gameState === 'loading'}
	<div class="min-h-screen bg-base-200 flex items-center justify-center">
		<div class="text-center">
			<span class="loading loading-spinner loading-lg"></span>
			<p class="mt-4">Ladataan...</p>
		</div>
	</div>
{:else if gameState === 'playing' || gameState === 'feedback'}
	<GameContainer gameType="basic" buttonMode="basic" showBackButton={false}>
		<GameHeader 
			currentQuestion={questionIndex + 1}
			totalQuestions={totalQuestions}
			score={score}
			onQuit={quitGame}
		/>

		<div class="flex-1 flex flex-col items-center justify-start p-4 md:p-6">
			<div class="w-full max-w-2xl">
				<div class="text-center mb-6">
					{#if selectedMode === 'listen'}
						<p class="text-lg md:text-xl mb-4">Kuuntele lause ja valitse oikea käännös:</p>
						<button class="btn btn-primary btn-lg" onclick={() => currentSentence && tts.speakSpanish(currentSentence.spanish)}>
							🔊 Toista uudelleen
						</button>
					{:else}
						<p class="text-2xl md:text-3xl lg:text-4xl font-semibold mb-4 leading-relaxed">{currentSentence?.spanish}</p>
						<button class="btn btn-sm btn-ghost" onclick={() => currentSentence && tts.speakSpanish(currentSentence.spanish)}>
							🔊 Kuuntele ääntämys
						</button>
					{/if}
				</div>

				{#if !answersRevealed && delaySeconds > 0}
					<div class="text-center text-sm text-base-content/60 italic animate-pulse mb-4">
						Muistele...
					</div>
				{/if}

				<StepwiseReveal 
					bind:this={stepwiseRevealRef}
					delaySeconds={delaySeconds} 
					onReveal={() => answersRevealed = true}
				>
					{#snippet children()}
						<!-- Placeholder to maintain space -->
						<div></div>
					{/snippet}

					{#snippet answers()}
						<div style="opacity: {answersRevealed ? 1 : 0}; transition: opacity 300ms ease-in-out;">
							<OptionButtons 
								options={optionButtonsData}
								disabledIds={disabledOptions}
								onSelect={(id) => selectAnswer(id)}
								disabled={false}
							/>
						</div>
					{/snippet}
				</StepwiseReveal>
			</div>
		</div>

		<!-- Feedback Overlay -->
		<FeedbackOverlay
			visible={feedbackVisible}
			isCorrect={selectedAnswer === currentSentence?.finnish}
			exclamation={getRandomExclamation()}
			primaryWord={currentSentence?.spanish || ''}
			secondaryWord={currentSentence?.finnish || ''}
			pointsEarned={1}
			animationIn="animate-pop-in"
			animationOut="animate-pop-out"
			closing={feedbackClosing}
			onContinue={closeFeedbackAndContinue}
		/>
	</GameContainer>
{:else if gameState === 'report'}
	<div class="min-h-screen bg-base-200">
		<div class="container mx-auto px-4 py-8">
			<div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
				<div class="card-body">
					<h2 class="card-title text-2xl md:text-3xl justify-center mb-4 text-primary">
						🎉 Peli päättyi!
					</h2>
					
					<!-- Score Summary -->
					<div class="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
						<div class="text-center">
							<div class="text-3xl font-bold text-primary mb-2">
								{score} / {totalQuestions}
							</div>
							<div class="text-lg text-base-content/70">
								({Math.round((score / totalQuestions) * 100)}%)
							</div>
						</div>
					</div>

					<!-- Score Breakdown -->
					<div class="grid grid-cols-2 gap-3 mb-6">
						<div class="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
							<div class="text-2xl font-bold text-success">{score}</div>
							<div class="text-sm text-base-content/70">Oikein</div>
						</div>
						<div class="bg-error/10 border border-error/30 rounded-lg p-3 text-center">
							<div class="text-2xl font-bold text-error">{wrongAnswers.length}</div>
							<div class="text-sm text-base-content/70">Väärin</div>
						</div>
					</div>

					<!-- Wrong Answers List -->
					{#if wrongAnswers.length > 0}
						<div class="mb-6">
							<h3 class="text-lg font-semibold mb-3">Väärät vastaukset:</h3>
							<div class="space-y-2">
								{#each wrongAnswers as wrong}
									<div class="bg-base-200 rounded-lg p-3">
										<div class="font-semibold text-base-content">{wrong.spanish}</div>
										<div class="text-sm text-success mt-1">✓ {wrong.finnish}</div>
										<div class="text-sm text-error">✗ {wrong.userAnswer}</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Sentence Knowledge Stats -->
					<div class="mb-6">
						<h3 class="text-lg font-semibold mb-3">Lauseiden ymmärrys:</h3>
						<div class="grid grid-cols-2 gap-3">
							<div class="bg-info/10 border border-info/30 rounded-lg p-3 text-center">
								<div class="text-2xl font-bold text-info">{sentenceStats.practiced}</div>
								<div class="text-sm text-base-content/70">Harjoiteltu</div>
							</div>
							<div class="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
								<div class="text-2xl font-bold text-success">{sentenceStats.mastered}</div>
								<div class="text-sm text-base-content/70">Hallittu</div>
							</div>
						</div>
					</div>

					<!-- Action Buttons -->
					<div class="flex gap-2">
						<button class="btn btn-primary flex-1" onclick={startGame}>
							Pelaa uudelleen
						</button>
						<a href="{base}/" class="btn btn-outline flex-1">
							Takaisin
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
