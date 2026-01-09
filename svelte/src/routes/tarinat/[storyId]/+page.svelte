<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { Story, StoryQuestionResult, StoryGameState } from '$lib/types/story';
	import { difficultyNames, getDifficultyColor } from '$lib/services/storyLoader';
	import StoryReader from '$lib/components/basic/stories/StoryReader.svelte';
	import StoryQuestion from '$lib/components/basic/stories/StoryQuestion.svelte';
	import StoryReport from '$lib/components/basic/stories/StoryReport.svelte';

	export let data: {
		story: Story;
		nextStoryId: string | null;
		prevStoryId: string | null;
	};

	// Game state
	let gameState: StoryGameState = 'reading';
	let currentQuestionIndex = 0;
	let questionResults: StoryQuestionResult[] = [];

	// Reset state when story changes
	$: if (data.story) {
		gameState = 'reading';
		currentQuestionIndex = 0;
		questionResults = [];
	}

	function startQuestions() {
		currentQuestionIndex = 0;
		questionResults = [];
		gameState = 'questions';
	}

	function handleAnswer(selectedIndex: number, correct: boolean) {
		const question = data.story.questions[currentQuestionIndex];
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
		if (currentQuestionIndex < data.story.questions.length - 1) {
			currentQuestionIndex++;
		} else {
			gameState = 'report';
		}
	}

	function goHome() {
		goto(`${base}/tarinat`);
	}

	function playAgain() {
		gameState = 'reading';
		currentQuestionIndex = 0;
		questionResults = [];
	}

	function nextStory() {
		if (data.nextStoryId) {
			goto(`${base}/tarinat/${data.nextStoryId}`);
		} else {
			goHome();
		}
	}
</script>

<svelte:head>
	<title>{data.story.title} - Tarinat - Espanjapeli</title>
</svelte:head>

{#if gameState === 'reading'}
	<!-- Reading mode -->
	<div class="min-h-screen bg-base-200 flex flex-col">
		<!-- Top bar with quit button -->
		<div class="bg-base-100 border-b border-base-200 p-3 flex items-center justify-between">
			<button class="btn btn-ghost btn-sm" on:click={goHome}>
				← Takaisin
			</button>
			<span class="badge {getDifficultyColor(data.story.difficulty)}">
				{difficultyNames[data.story.difficulty]}
			</span>
		</div>

		<!-- Story reader -->
		<div class="flex-1 flex flex-col bg-base-100">
			<StoryReader
				dialogue={data.story.dialogue}
				vocabulary={data.story.vocabulary}
				title={data.story.title}
				titleSpanish={data.story.titleSpanish}
				onContinue={startQuestions}
			/>
		</div>
	</div>

{:else if gameState === 'questions'}
	<!-- Questions mode -->
	<div class="min-h-screen bg-base-200 flex flex-col">
		<!-- Top bar -->
		<div class="bg-base-100 border-b border-base-200 p-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<span class="text-2xl">{data.story.icon}</span>
				<span class="font-medium text-sm truncate max-w-32 md:max-w-none">{data.story.title}</span>
			</div>
			<button class="btn btn-ghost btn-circle btn-sm" on:click={goHome} title="Lopeta">
				✕
			</button>
		</div>

		<!-- Question -->
		<div class="flex-1 flex flex-col bg-base-100">
			<StoryQuestion
				question={data.story.questions[currentQuestionIndex]}
				questionNumber={currentQuestionIndex + 1}
				totalQuestions={data.story.questions.length}
				onAnswer={handleAnswer}
			/>
		</div>
	</div>

{:else if gameState === 'report'}
	<!-- Report mode -->
	<StoryReport
		story={data.story}
		results={questionResults}
		onHome={goHome}
		onPlayAgain={playAgain}
		onNextStory={data.nextStoryId ? nextStory : undefined}
	/>
{/if}
