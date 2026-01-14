<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import type { Story, StoryQuestionResult, StoryGameState } from '$lib/types/story';
	import { loadStories, categoryNames, difficultyNames, getDifficultyColor } from '$lib/services/storyLoader';
	import StoryReader from '$lib/components/basic/stories/StoryReader.svelte';
	import StoryQuestion from '$lib/components/basic/stories/StoryQuestion.svelte';
	import StoryCard from '$lib/components/basic/stories/StoryCard.svelte';
	import StoryReport from '$lib/components/basic/stories/StoryReport.svelte';
	import StoryFilterSort from '$lib/components/basic/stories/StoryFilterSort.svelte';
	import GameContainer from '$lib/components/shared/GameContainer.svelte';
	import BackButton from '$lib/components/shared/BackButton.svelte';

	// Game state
	let gameState: StoryGameState = 'home';
	let stories: Story[] = [];
	let selectedStory: Story | null = null;
	let currentQuestionIndex = 0;
	let questionResults: StoryQuestionResult[] = [];
	let loading = true;

	// Filters and sorting
	let filterDifficulty: string = 'all';
	let filterCategory: string = 'all';
	let sortBy: 'alphabet' | 'difficulty' = 'alphabet';

	// Filtered and sorted stories
	$: filteredStories = (() => {
		// First filter
		let filtered = stories.filter((story) => {
			if (filterDifficulty !== 'all' && story.difficulty !== filterDifficulty) return false;
			if (filterCategory !== 'all' && story.category !== filterCategory) return false;
			return true;
		});

		// Then sort
		if (sortBy === 'alphabet') {
			filtered = filtered.sort((a, b) => a.title.localeCompare(b.title, 'fi'));
		} else if (sortBy === 'difficulty') {
			const difficultyOrder = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4 };
			filtered = filtered.sort((a, b) => {
				const orderA = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 99;
				const orderB = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 99;
				return orderA - orderB;
			});
		}

		return filtered;
	})();

	// Get unique categories from stories
	$: categories = [...new Set(stories.map((s) => s.category))];

	function handleFilterChange(difficulty: string) {
		filterDifficulty = difficulty;
	}

	function handleSortChange(newSortBy: 'alphabet' | 'difficulty') {
		sortBy = newSortBy;
	}

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
	<GameContainer gameType="story" buttonMode="basic" onBack={goBackToMenu}>
		<div class="card-body p-4 md:p-6">
			<!-- Header -->
			<div class="mb-6">
				<h1 class="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
					📖 Tarinat ja dialogit
				</h1>
			</div>

			<!-- Filter and Sort Controls -->
			{#if !loading && stories.length > 0}
				<div class="mb-6">
					<StoryFilterSort
						filterDifficulty={filterDifficulty}
						sortBy={sortBy}
						onFilterChange={handleFilterChange}
						onSortChange={handleSortChange}
					/>
				</div>
			{/if}

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
	</GameContainer>

{:else if gameState === 'reading' && selectedStory}
	<!-- Reading mode -->
	<GameContainer gameType="story" buttonMode="basic" showBackButton={false}>
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
	<GameContainer gameType="story" buttonMode="basic" showBackButton={false}>
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
