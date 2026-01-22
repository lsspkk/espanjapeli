<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { 
		loadLessonIndex, 
		loadLesson,
		type Lesson,
		type LessonMetadata 
	} from '$lib/services/lessonService';
	import { lessonProgress } from '$lib/stores/lessonProgress';
	import { wordKnowledge } from '$lib/stores/wordKnowledge';
	import { tts } from '$lib/services/tts';
	import { ttsSettings } from '$lib/stores/ttsSettings';
	import StepwiseReveal from '$lib/components/shared/StepwiseReveal.svelte';
	import { timedAnswerSettings } from '$lib/stores/timedAnswerSettings';
	import LessonCard from '$lib/components/basic/LessonCard.svelte';
	import WordList from '$lib/components/basic/WordList.svelte';
	import { getAllWords, type Word } from '$lib/data/words';

	// Game states
	type GameState = 'home' | 'loading' | 'teaching-words' | 'teaching-phrases' | 'quiz' | 'report';
	let gameState = $state<GameState>('home');

	// Lesson data
	let availableLessons = $state<LessonMetadata[]>([]);
	let selectedLesson = $state<Lesson | null>(null);
	let lessonWords = $state<Word[]>([]);

	// Game variables
	let score = $state(0);
	let questionIndex = $state(0);
	let totalQuestions = $state(0);

	// Grouped lessons by category
	let lessonsByCategory = $derived.by(() => {
		const grouped = new Map<string, LessonMetadata[]>();
		for (const lesson of availableLessons) {
			const category = lesson.categoryName;
			if (!grouped.has(category)) {
				grouped.set(category, []);
			}
			grouped.get(category)!.push(lesson);
		}
		return grouped;
	});

	// Get lesson status
	function getLessonStatus(lessonId: string): 'not-started' | 'in-progress' | 'completed' {
		const progress = lessonProgress.getLessonProgress(lessonId);
		if (!progress) {
			return 'not-started';
		}
		
		// Check if lesson is fully completed (all words scored well)
		const scores = Object.values(progress.wordScores);
		if (scores.length === 0) {
			return 'in-progress';
		}
		
		const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
		return avgScore >= 70 ? 'completed' : 'in-progress';
	}

	// Check if lesson needs review based on spaced repetition
	function needsReview(lessonId: string): boolean {
		const progress = lessonProgress.getLessonProgress(lessonId);
		if (!progress) {
			return false;
		}
		
		const now = new Date();
		const nextReview = new Date(progress.nextReviewAt);
		return nextReview <= now;
	}

	// Calculate next review interval based on performance
	// Intervals: 1 day, 3 days, 7 days, 14 days, 30 days
	function calculateNextReviewInterval(wordScores: Record<string, number>): number {
		const scores = Object.values(wordScores);
		if (scores.length === 0) {
			return 1; // Default to 1 day if no scores
		}
		
		const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
		
		// Determine interval based on average score
		if (avgScore >= 90) {
			return 30; // Excellent: review in 30 days
		} else if (avgScore >= 80) {
			return 14; // Good: review in 14 days
		} else if (avgScore >= 70) {
			return 7; // Fair: review in 7 days
		} else if (avgScore >= 60) {
			return 3; // Needs work: review in 3 days
		} else {
			return 1; // Poor: review in 1 day
		}
	}

	// Get lessons that need review (for prioritization)
	let lessonsDueForReview = $derived.by(() => {
		return availableLessons.filter(lesson => needsReview(lesson.id));
	});

	// Load available lessons on mount
	onMount(async () => {
		try {
			const manifest = await loadLessonIndex();
			availableLessons = manifest.lessons;
		} catch (error) {
			console.error('Failed to load lessons:', error);
		}
	});

	// Get Word objects from word IDs
	function getWordsFromIds(wordIds: string[]): Word[] {
		const allWords = getAllWords();
		const wordMap = new Map<string, Word>();
		
		// Create a map for quick lookup by word ID or spanish
		for (const word of allWords) {
			const wordId = word.id ?? word.spanish;
			wordMap.set(wordId, word);
			// Also map by spanish for backwards compatibility
			wordMap.set(word.spanish, word);
		}
		
		// Get words in the order they appear in the lesson
		const words: Word[] = [];
		for (const wordId of wordIds) {
			const word = wordMap.get(wordId);
			if (word) {
				words.push(word);
			}
		}
		
		return words;
	}

	// Start lesson
	async function startLesson(lessonId: string) {
		gameState = 'loading';
		try {
			selectedLesson = await loadLesson(lessonId);
			
			// Load word objects from word IDs
			if (selectedLesson) {
				lessonWords = getWordsFromIds(selectedLesson.words);
			}
			
			gameState = 'teaching-words';
		} catch (error) {
			console.error('Failed to load lesson:', error);
			gameState = 'home';
		}
	}

	// Return to home
	function returnToHome() {
		gameState = 'home';
		selectedLesson = null;
		lessonWords = [];
		score = 0;
		questionIndex = 0;
	}
</script>

<svelte:head>
	<title>Valitut sanat - Espanjapeli</title>
</svelte:head>

<div class="min-h-screen bg-base-100 p-4">
	{#if gameState === 'home'}
		<div class="max-w-4xl mx-auto">
			<h1 class="text-3xl font-bold mb-4">Valitut sanat</h1>
			<p class="text-lg mb-6">
				Opi sanoja oppitunneilla. Jokaisessa oppitunnissa on sanoja, esimerkkejä ja testi.
			</p>

			<!-- Spaced Repetition Recommendations -->
			{#if lessonsDueForReview.length > 0}
				<div class="alert alert-warning mb-6">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
					</svg>
					<div>
						<h3 class="font-bold">Aika kerrata!</h3>
						<div class="text-sm">
							{lessonsDueForReview.length} oppituntia odottaa kertausta. Säännöllinen kertaus auttaa muistamaan paremmin.
						</div>
					</div>
				</div>
			{/if}

			<div class="space-y-6">
				{#if availableLessons.length === 0}
					<p class="text-base-content/70">Ladataan oppitunteja...</p>
				{:else}
					{#each Array.from(lessonsByCategory) as [categoryName, lessons]}
						<div class="space-y-3">
							<h2 class="text-xl font-semibold">{categoryName}</h2>
							<div class="grid gap-4 md:grid-cols-2">
								{#each lessons as lesson}
									{@const status = getLessonStatus(lesson.id)}
									{@const needsReviewFlag = needsReview(lesson.id)}
									<LessonCard
										{lesson}
										{status}
										needsReview={needsReviewFlag}
										onclick={() => startLesson(lesson.id)}
									/>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>

	{:else if gameState === 'loading'}
		<div class="flex items-center justify-center min-h-[50vh]">
			<div class="text-center">
				<div class="loading loading-spinner loading-lg"></div>
				<p class="mt-4">Ladataan oppituntia...</p>
			</div>
		</div>

	{:else if gameState === 'teaching-words'}
		<div class="max-w-4xl mx-auto">
			<div class="mb-4">
				<button class="btn btn-sm" onclick={returnToHome}>
					← Takaisin
				</button>
			</div>
			<h2 class="text-2xl font-bold mb-4">Sanat</h2>
			<p class="text-base-content/70 mb-4">Vaihe 1/3</p>
			{#if selectedLesson}
				<div class="mb-6">
					<h3 class="text-xl font-semibold mb-2">{selectedLesson.categoryName}</h3>
					<p class="text-base-content/70">{lessonWords.length} sanaa</p>
				</div>
				
				<WordList words={lessonWords} />
				
				<div class="mt-6 flex justify-end">
					<button class="btn btn-primary" onclick={() => gameState = 'teaching-phrases'}>
						Jatka →
					</button>
				</div>
			{/if}
		</div>

	{:else if gameState === 'teaching-phrases'}
		<div class="max-w-4xl mx-auto">
			<h2 class="text-2xl font-bold mb-4">Esimerkit</h2>
			<p class="text-base-content/70 mb-4">Vaihe 2/3</p>
		</div>

	{:else if gameState === 'quiz'}
		<div class="max-w-4xl mx-auto">
			<h2 class="text-2xl font-bold mb-4">Testi</h2>
			<p class="text-base-content/70 mb-4">Vaihe 3/3</p>
		</div>

	{:else if gameState === 'report'}
		<div class="max-w-4xl mx-auto">
			<h2 class="text-2xl font-bold mb-4">Valmis!</h2>
			<p class="mb-4">Pisteet: {score}/{totalQuestions}</p>
			<div class="flex gap-2">
				<button class="btn btn-primary" onclick={returnToHome}>
					Takaisin oppitunteihin
				</button>
			</div>
		</div>
	{/if}
</div>
