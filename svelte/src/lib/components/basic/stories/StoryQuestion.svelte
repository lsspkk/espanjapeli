<script lang="ts">
	import type { StoryQuestion } from '$lib/types/story';

	export let question: StoryQuestion;
	export let questionNumber: number;
	export let totalQuestions: number;
	export let onAnswer: (selectedIndex: number, correct: boolean) => void;

	// Reset state when question changes
	$: if (question) {
		selectedIndex = null;
		answered = false;
	}

	let selectedIndex: number | null = null;
	let answered = false;

	function selectOption(index: number) {
		if (answered) return;
		
		answered = true;
		const isCorrect = index === question.correctIndex;
		
		// Immediately advance to next question
		onAnswer(index, isCorrect);
	}
</script>

<div class="flex flex-col h-full">
	<!-- Progress header -->
	<div class="p-4 border-b border-base-200">
		<div class="flex justify-between items-center">
			<span class="text-sm font-medium text-base-content/70">
				Kysymys {questionNumber}/{totalQuestions}
			</span>
			<div class="flex gap-1">
				{#each Array(totalQuestions) as _, i}
					<div 
						class="w-2 h-2 rounded-full"
						class:bg-primary={i < questionNumber}
						class:bg-base-300={i >= questionNumber}
					></div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Question content -->
	<div class="flex-1 overflow-y-auto p-4">
		<!-- Question text -->
		<div class="bg-base-200 rounded-xl p-4 mb-6">
			<p class="text-lg md:text-xl font-medium text-center">{question.question}</p>
			{#if question.questionSpanish}
				<p class="text-sm text-base-content/60 text-center mt-2 italic">
					{question.questionSpanish}
				</p>
			{/if}
		</div>

		<!-- Answer options -->
		<div class="space-y-3">
			{#each question.options as option, index}
				<button
					class="btn btn-outline hover:btn-primary w-full justify-start text-left h-auto py-4 px-5 text-base"
					on:click={() => selectOption(index)}
					disabled={answered}
				>
					<span class="badge badge-circle badge-ghost mr-3">
						{String.fromCharCode(65 + index)}
					</span>
					<span class="flex-1">{option}</span>
				</button>
			{/each}
		</div>
	</div>

</div>
