<script lang="ts">
	import WrongAnswersList from './WrongAnswersList.svelte';

	export let title: string = '🎉 Peli päättyi!';
	export let gameTime: string = '';
	export let firstTryCount: number = 0;
	export let secondTryCount: number = 0;
	export let thirdTryCount: number = 0;
	export let failedCount: number = 0;
	export let totalScore: number = 0;
	export let maxScore: number = 0;
	export let wrongAnswers: Array<{ spanish: string; finnish: string; userAnswer?: string }> = [];
	export let onHome: () => void = () => {};
	export let onPlayAgain: (() => void) | undefined = undefined;

	$: scorePercentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
</script>

<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
	<div class="card bg-base-100 shadow-xl w-full max-w-2xl">
		<div class="card-body p-4 md:p-6">
			<h2 class="card-title text-2xl md:text-3xl justify-center mb-4 text-primary">{title}</h2>

			<!-- Game Time -->
			{#if gameTime}
				<div class="text-center mb-4">
					<div class="text-lg font-semibold text-base-content/70">
						Aika: {gameTime}
					</div>
				</div>
			{/if}

			<!-- Answers by Try Count -->
			<div class="grid grid-cols-2 gap-3 mb-4">
				<div class="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
					<div class="text-2xl font-bold text-success">{firstTryCount}</div>
					<div class="text-sm text-base-content/70">1. yrityksellä</div>
				</div>
				<div class="bg-warning/10 border border-warning/30 rounded-lg p-3 text-center">
					<div class="text-2xl font-bold text-warning">{secondTryCount}</div>
					<div class="text-sm text-base-content/70">2. yrityksellä</div>
				</div>
				<div class="bg-error/10 border border-error/30 rounded-lg p-3 text-center">
					<div class="text-2xl font-bold text-error">{thirdTryCount}</div>
					<div class="text-sm text-base-content/70">3. yrityksellä</div>
				</div>
				<div class="bg-base-300 border border-base-content/20 rounded-lg p-3 text-center">
					<div class="text-2xl font-bold text-base-content">{failedCount}</div>
					<div class="text-sm text-base-content/70">Ei löytynyt</div>
				</div>
			</div>

			<!-- Score Summary -->
			<div class="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
				<div class="text-center w-full">
					<div class="text-2xl font-bold text-primary">
						Pisteet: {totalScore} / {maxScore}
					</div>
					<div class="text-lg text-base-content/70">
						({scorePercentage}%)
					</div>
				</div>
			</div>

		<!-- Wrong Answers -->
		<WrongAnswersList answers={wrongAnswers} />

			<!-- Action Buttons -->
			<div class="flex justify-center gap-3">
				{#if onPlayAgain}
					<button class="btn btn-outline btn-lg" on:click={onPlayAgain}>
						Pelaa uudelleen
					</button>
				{/if}
				<button class="btn btn-primary btn-lg" on:click={onHome}>
					Alkuun
				</button>
			</div>
		</div>
	</div>
</div>
