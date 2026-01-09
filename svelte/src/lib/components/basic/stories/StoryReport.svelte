<script lang="ts">
	import type { Story, StoryQuestionResult } from '$lib/types/story';

	export let story: Story;
	export let results: StoryQuestionResult[];
	export let onHome: () => void;
	export let onPlayAgain: () => void;
	export let onNextStory: (() => void) | undefined = undefined;

	$: correctCount = results.filter((r) => r.correct).length;
	$: totalQuestions = results.length;
	$: percentage = Math.round((correctCount / totalQuestions) * 100);

	$: performanceMessage = getPerformanceMessage(percentage);

	function getPerformanceMessage(pct: number): { emoji: string; message: string } {
		if (pct === 100) return { emoji: '🌟', message: '¡Perfecto! Täydellinen tulos!' };
		if (pct >= 80) return { emoji: '🎉', message: '¡Muy bien! Erinomainen suoritus!' };
		if (pct >= 60) return { emoji: '👍', message: '¡Bien! Hyvä yritys!' };
		if (pct >= 40) return { emoji: '💪', message: 'Jatka harjoittelua!' };
		return { emoji: '📚', message: 'Lue tarina uudelleen ja yritä uudestaan!' };
	}

	// Find wrong answers for review
	$: wrongAnswers = results
		.filter((r) => !r.correct)
		.map((r) => {
			const question = story.questions.find((q) => q.id === r.questionId);
			return {
				question: question?.question || '',
				correctAnswer: question?.options[r.correctIndex] || '',
				userAnswer: question?.options[r.selectedIndex] || ''
			};
		});
</script>

<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
	<div class="card bg-base-100 shadow-xl w-full max-w-2xl">
		<div class="card-body p-3 md:p-6">
			<!-- Header -->
			<div class="mb-3">
				<div class="flex items-center gap-2 mb-1">
					<span class="text-xl">{story.icon}</span>
					<h2 class="text-lg font-semibold">{story.titleSpanish}</h2>
				</div>
				<p class="text-base text-base-content/80">{performanceMessage.message}</p>
			</div>

			<!-- Score summary -->
			<div class="text-center py-2 mb-3">
				<span class="text-xl font-bold text-primary">{correctCount} / {totalQuestions}</span>
				<span class="text-sm text-base-content/70 ml-2">({percentage}%)</span>
			</div>

			<!-- All questions review -->
			<div class="mb-4">
				<div class="space-y-0 border-t border-base-300">
					{#each story.questions as question, idx}
						{@const result = results.find(r => r.questionId === question.id)}
						{@const isCorrect = result?.correct}
						<div class="py-3 border-b border-base-300">
							<p class="text-sm font-medium mb-1">
								<span class="text-base-content/60">{idx + 1}:</span> {question.question}
							</p>
							<div class="space-y-1">
								{#if !isCorrect && result}
									<p class="text-sm text-error">
										Vastasit väärin: {question.options[result.selectedIndex]}
									</p>
								{/if}
								<p class="text-sm text-success">
									Oikea: {question.options[question.correctIndex]}
								</p>
								{#if question.explanation}
									<p class="text-sm text-base-content/70 italic mt-1">{question.explanation}</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Action buttons -->
			<div class="flex justify-center">
				<button class="btn btn-primary" on:click={onHome}>
					Alkuun
				</button>
			</div>
		</div>
	</div>
</div>
