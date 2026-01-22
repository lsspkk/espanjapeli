<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { 
		loadSentenceIndex, 
		getSentencesByTheme,
		type Sentence,
		type CEFRLevel 
	} from '$lib/services/sentenceLoader';
	import { tts } from '$lib/services/tts';
	import { autoSpeak } from '$lib/stores/progress';

	// Game states
	type GameState = 'home' | 'loading' | 'playing' | 'feedback' | 'report';
	let gameState = $state<GameState>('home');

	// Game configuration
	let selectedMode = $state<'listen' | 'read'>('listen');
	let selectedTheme = $state<string>('greetings');
	let selectedLevel = $state<CEFRLevel>('A1');
	let availableThemes = $state<string[]>([]);

	// Game variables
	let currentSentence = $state<Sentence | null>(null);
	let answerOptions = $state<string[]>([]);
	let selectedAnswer = $state<string | null>(null);
	let score = $state(0);
	let questionIndex = $state(0);
	let totalQuestions = $state(10);
	let sentenceQueue = $state<Sentence[]>([]);

	// Load available themes on mount
	onMount(async () => {
		try {
			const manifest = await loadSentenceIndex();
			availableThemes = [...new Set(manifest.themes.map(t => t.name))];
			if (availableThemes.length > 0) {
				selectedTheme = availableThemes[0];
			}
		} catch (error) {
			console.error('Failed to load sentence themes:', error);
		}
	});

	// Start game
	async function startGame() {
		gameState = 'loading';
		try {
			// Load sentences for selected theme
			const sentences = await getSentencesByTheme(selectedTheme);
			
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
		
		// Generate answer options (placeholder - will be implemented in next subtask)
		answerOptions = [currentSentence.finnish];

		gameState = 'playing';
	}

	// Handle answer selection
	function selectAnswer(answer: string) {
		selectedAnswer = answer;
		const correct = answer === currentSentence?.finnish;
		if (correct) {
			score++;
		}
		gameState = 'feedback';
	}

	// Continue to next question
	function continueGame() {
		questionIndex++;
		loadNextQuestion();
	}

	// Restart game
	function restartGame() {
		gameState = 'home';
	}
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
						<label class="label">
							<span class="label-text font-semibold">Pelimuoto</span>
						</label>
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
						<label class="label">
							<span class="label-text font-semibold">Teema</span>
						</label>
						<select class="select select-bordered" bind:value={selectedTheme}>
							{#each availableThemes as theme}
								<option value={theme}>{theme}</option>
							{/each}
						</select>
					</div>

					<!-- Level selector -->
					<div class="form-control mb-6">
						<label class="label">
							<span class="label-text font-semibold">Taso</span>
						</label>
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
{:else if gameState === 'playing'}
	<div class="min-h-screen bg-base-200">
		<div class="container mx-auto px-4 py-8">
			<div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
				<div class="card-body">
					<div class="flex justify-between items-center mb-4">
						<span class="text-sm">Kysymys {questionIndex + 1}/{totalQuestions}</span>
						<span class="text-sm font-semibold">Pisteet: {score}</span>
					</div>

					<div class="text-center mb-6">
						{#if selectedMode === 'listen'}
							<p class="text-lg mb-4">Kuuntele lause:</p>
							<button class="btn btn-primary" onclick={() => currentSentence && tts(currentSentence.spanish, 'es')}>
								🔊 Toista
							</button>
						{:else}
							<p class="text-2xl font-semibold mb-4">{currentSentence?.spanish}</p>
						{/if}
					</div>

					<div class="space-y-2">
						{#each answerOptions as option}
							<button 
								class="btn btn-outline w-full" 
								onclick={() => selectAnswer(option)}
							>
								{option}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{:else if gameState === 'feedback'}
	<div class="min-h-screen bg-base-200">
		<div class="container mx-auto px-4 py-8">
			<div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
				<div class="card-body">
					{#if selectedAnswer === currentSentence?.finnish}
						<div class="alert alert-success">
							<span class="text-lg">✅ Oikein!</span>
						</div>
					{:else}
						<div class="alert alert-error">
							<span class="text-lg">❌ Väärin</span>
						</div>
					{/if}

					<div class="mt-4">
						<p class="text-lg font-semibold">{currentSentence?.spanish}</p>
						<p class="text-lg">{currentSentence?.finnish}</p>
					</div>

					<button class="btn btn-primary mt-6" onclick={continueGame}>
						Jatka
					</button>
				</div>
			</div>
		</div>
	</div>
{:else if gameState === 'report'}
	<div class="min-h-screen bg-base-200">
		<div class="container mx-auto px-4 py-8">
			<div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
				<div class="card-body">
					<h2 class="card-title text-2xl mb-4">Peli päättyi!</h2>
					
					<div class="stats stats-vertical shadow mb-6">
						<div class="stat">
							<div class="stat-title">Pisteet</div>
							<div class="stat-value">{score}/{totalQuestions}</div>
						</div>
					</div>

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
