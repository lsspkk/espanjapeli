<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import type { Story, StoryQuestionResult, StoryGameState } from '$lib/types/story';
	import { loadStories, categoryNames, difficultyNames, getDifficultyColor } from '$lib/services/storyLoader';
	import StoryReader from '$lib/components/basic/stories/StoryReader.svelte';
	import StoryQuestion from '$lib/components/basic/stories/StoryQuestion.svelte';
	import StoryCard from '$lib/components/basic/stories/StoryCard.svelte';
	import StoryReport from '$lib/components/basic/stories/StoryReport.svelte';
	import GameContainer from '$lib/components/shared/GameContainer.svelte';
	import BackButton from '$lib/components/shared/BackButton.svelte';

	// Game state
	let gameState: StoryGameState = 'home';
	let stories: Story[] = [];
	let selectedStory: Story | null = null;
	let currentQuestionIndex = 0;
	let questionResults: StoryQuestionResult[] = [];
	let loading = true;

	// Filters
	let filterDifficulty: string = 'all';
	let filterCategory: string = 'all';

	// Filtered stories
	$: filteredStories = stories.filter((story) => {
		if (filterDifficulty !== 'all' && story.difficulty !== filterDifficulty) return false;
		if (filterCategory !== 'all' && story.category !== filterCategory) return false;
		return true;
	});

	// Get unique categories from stories
	$: categories = [...new Set(stories.map((s) => s.category))];

	onMount(async () => {
		stories = await loadStories();
		loading = false;
	});

	function selectStory(story: Story) {
		selectedStory = story;
		currentQuestionIndex = 0;
		questionResults = [];
		gameState = 'reading';
	}

	function startQuestions() {
		if (!selectedStory) return;
		currentQuestionIndex = 0;
		questionResults = [];
		gameState = 'questions';
	}

	function handleAnswer(selectedIndex: number, correct: boolean) {
		if (!selectedStory) return;

		const question = selectedStory.questions[currentQuestionIndex];
		questionResults = [
			...questionResults,
			{
				questionId: question.id,
				correct,
				selectedIndex,
				correctIndex: question.correctIndex,
				attempts: 1
			}
		];

		// Move to next question or report
		if (currentQuestionIndex < selectedStory.questions.length - 1) {
			currentQuestionIndex++;
		} else {
			gameState = 'report';
		}
	}

	function goHome() {
		gameState = 'home';
		selectedStory = null;
		currentQuestionIndex = 0;
		questionResults = [];
	}

	function playAgain() {
		if (!selectedStory) return;
		currentQuestionIndex = 0;
		questionResults = [];
		gameState = 'reading';
	}

	function nextStory() {
		if (!selectedStory) return;
		
		// Find next story in filtered list
		const currentIndex = filteredStories.findIndex((s) => s.id === selectedStory?.id);
		const nextIndex = (currentIndex + 1) % filteredStories.length;
		
		if (nextIndex !== currentIndex) {
			selectStory(filteredStories[nextIndex]);
		} else {
			goHome();
		}
	}

	function goBackToMenu() {
		window.location.href = `${base}/`;
	}
</script>

<svelte:head>
	<title>Tarinat - Espanjapeli</title>
</svelte:head>

{#if gameState === 'home'}
	<!-- Home screen with story list -->
	<div class="min-h-screen bg-base-200">
		<div class="container mx-auto px-4 py-6 max-w-4xl">
			<!-- Back Button - Top Left -->
			<div class="mb-4">
				<BackButton />
			</div>
			
			<!-- Header -->
			<div class="mb-6">
				<h1 class="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
					📖 Tarinat ja dialogit
				</h1>
			</div>

			<!-- Filters - Commented out for now, may add later -->
			<!-- <div class="card bg-base-100 shadow-md mb-6">
				<div class="card-body p-4">
					<div class="flex flex-wrap gap-4">
						<div class="form-control">
							<label class="label py-1" for="filter-difficulty">
								<span class="label-text text-sm">Vaikeustaso</span>
							</label>
							<select id="filter-difficulty" class="select select-bordered select-sm" bind:value={filterDifficulty}>
								<option value="all">Kaikki tasot</option>
								<option value="beginner">Aloittelija</option>
								<option value="intermediate">Keskitaso</option>
								<option value="advanced">Edistynyt</option>
							</select>
						</div>

						<div class="form-control">
							<label class="label py-1" for="filter-category">
								<span class="label-text text-sm">Aihe</span>
							</label>
							<select id="filter-category" class="select select-bordered select-sm" bind:value={filterCategory}>
								<option value="all">Kaikki aiheet</option>
								{#each categories as cat}
									<option value={cat}>{categoryNames[cat] || cat}</option>
								{/each}
							</select>
						</div>

						<div class="flex items-end ml-auto">
							<span class="text-sm text-base-content/60">
								{filteredStories.length} tarinaa
							</span>
						</div>
					</div>
				</div>
			</div> -->

			<!-- Stories list -->
			{#if loading}
				<div class="flex justify-center py-12">
					<span class="loading loading-spinner loading-lg text-primary"></span>
				</div>
			{:else if filteredStories.length === 0}
				<div class="text-center py-12">
					<p class="text-lg text-base-content/60">Ei tarinoita näillä suodattimilla</p>
				</div>
			{:else}
				<div class="grid gap-3 md:grid-cols-2 md:gap-4">
					{#each filteredStories as story}
						<StoryCard {story} onSelect={selectStory} />
					{/each}
				</div>
			{/if}

		</div>
	</div>

{:else if gameState === 'reading' && selectedStory}
	<!-- Reading mode -->
	<GameContainer showBackButton={false}>
		<!-- Top bar with difficulty badge and close button -->
		<div class="bg-base-100 border-b border-base-200 p-3 flex items-center justify-between">
			<span class="badge {getDifficultyColor(selectedStory.difficulty)}">
				{difficultyNames[selectedStory.difficulty]}
			</span>
			<button class="btn btn-ghost btn-circle btn-sm" on:click={goHome} title="Lopeta">
				✕
			</button>
		</div>
		
		<!-- Story reader -->
		<div class="flex-1 flex flex-col bg-base-100 overflow-y-auto">
			<StoryReader
				dialogue={selectedStory.dialogue}
				vocabulary={selectedStory.vocabulary}
				title={selectedStory.title}
				titleSpanish={selectedStory.titleSpanish}
				onContinue={startQuestions}
			/>
		</div>
	</GameContainer>

{:else if gameState === 'questions' && selectedStory}
	<!-- Questions mode -->
	<GameContainer showBackButton={false}>
		<!-- Top bar -->
		<div class="bg-base-100 border-b border-base-200 p-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-2xl">{selectedStory.icon}</span>
				<span class="font-medium text-sm truncate max-w-32 md:max-w-none">{selectedStory.titleSpanish}</span>
			</div>
			<button class="btn btn-ghost btn-circle btn-sm" on:click={goHome} title="Lopeta">
				✕
			</button>
		</div>

		<!-- Question -->
		<div class="flex-1 flex flex-col bg-base-100 overflow-y-auto">
			<StoryQuestion
				question={selectedStory.questions[currentQuestionIndex]}
				questionNumber={currentQuestionIndex + 1}
				totalQuestions={selectedStory.questions.length}
				onAnswer={handleAnswer}
			/>
		</div>
	</GameContainer>

{:else if gameState === 'report' && selectedStory}
	<!-- Report mode -->
	<StoryReport
		story={selectedStory}
		results={questionResults}
		onHome={goHome}
		onPlayAgain={playAgain}
		onNextStory={filteredStories.length > 1 ? nextStory : undefined}
	/>
{/if}
