<script lang="ts">
	import type { Story, StoryQuestionResult, StoryGameState } from '$lib/types/story';

	let { story = $bindable() }: { story: Story } = $props();

	// Game state - using $state for Svelte 5
	let gameState = $state<StoryGameState>('reading');
	let currentQuestionIndex = $state(0);
	let questionResults = $state<StoryQuestionResult[]>([]);
	let vocabularyTracked = $state(false);

	// Expose methods for testing
	function startQuestions() {
		if (!vocabularyTracked) {
			vocabularyTracked = true;
		}
		
		currentQuestionIndex = 0;
		questionResults = [];
		gameState = 'questions';
	}

	function handleAnswer(selectedIndex: number, correct: boolean) {
		const question = story.questions[currentQuestionIndex];
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
		if (currentQuestionIndex < story.questions.length - 1) {
			currentQuestionIndex++;
		} else {
			gameState = 'report';
		}
	}

	// Export state and methods for testing
	export { gameState, currentQuestionIndex, questionResults, startQuestions, handleAnswer };
</script>

<div>
	<p>Game State: {gameState}</p>
	<p>Question: {currentQuestionIndex + 1} / {story.questions.length}</p>
	<p>Results: {questionResults.length}</p>
</div>
