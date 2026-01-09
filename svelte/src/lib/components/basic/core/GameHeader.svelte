<script lang="ts">
	export let currentQuestion: number;
	export let totalQuestions: number;
	export let score: number;
	export let onQuit: () => void;
	export let triesRemaining: number | undefined = undefined;
	export let maxTries: number = 3;
</script>

<div class="flex items-center justify-between p-3 md:p-4 border-b border-base-200 flex-shrink-0">
	<div class="text-sm md:text-lg font-bold">
		<span class="text-base-content/70">{currentQuestion}/{totalQuestions}</span>
		<span class="mx-1 md:mx-2 text-base-content/30">|</span>
		<span class="text-primary">{score} p</span>
	</div>
	<div class="flex items-center gap-2">
		{#if triesRemaining !== undefined}
			<!-- Tries remaining indicator -->
			<div class="flex gap-1">
				{#each Array(maxTries) as _, i}
					<div 
						class="w-3 h-3 md:w-4 md:h-4 rounded-full transition-all"
						class:bg-success={i < triesRemaining}
						class:bg-base-300={i >= triesRemaining}
					></div>
				{/each}
			</div>
		{/if}
		<button 
			on:click={onQuit} 
			class="btn btn-ghost btn-circle btn-sm text-xl" 
			title="Lopeta peli"
		>✕</button>
	</div>
</div>
