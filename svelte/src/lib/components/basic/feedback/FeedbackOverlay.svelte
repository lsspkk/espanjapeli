<script lang="ts">
	export let visible: boolean = false;
	export let isCorrect: boolean = false;
	export let exclamation: string = '';
	export let primaryWord: string = '';
	export let secondaryWord: string = '';
	export let pointsEarned: number = 0;
	export let animationIn: string = 'animate-pop-in';
	export let animationOut: string = 'animate-pop-out';
	export let closing: boolean = false;
	export let onContinue: () => void = () => {};
</script>

{#if visible}
	<div class="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
		<div 
			class="bg-base-100 rounded-lg shadow-lg p-6 md:p-8 max-w-md mx-4 text-center"
			class:animate-pop-in={!closing && animationIn === 'animate-pop-in'}
			class:animate-slide-down={!closing && animationIn === 'animate-slide-down'}
			class:animate-slide-up={!closing && animationIn === 'animate-slide-up'}
			class:animate-fade-in={!closing && animationIn === 'animate-fade-in'}
			class:animate-rotate-in={!closing && animationIn === 'animate-rotate-in'}
			class:animate-pop-out={closing && animationOut === 'animate-pop-out'}
			class:animate-slide-down-out={closing && animationOut === 'animate-slide-down-out'}
			class:animate-slide-up-out={closing && animationOut === 'animate-slide-up-out'}
			class:animate-fade-out={closing && animationOut === 'animate-fade-out'}
			class:animate-rotate-out={closing && animationOut === 'animate-rotate-out'}
		>
			{#if isCorrect}
				<!-- Correct answer feedback -->
				<div class="text-4xl md:text-5xl font-bold text-success mb-4 animate-slide-down">
					{exclamation}
				</div>

				<!-- Word pair -->
				<div class="text-2xl md:text-3xl font-bold text-base-content mb-6">
					{primaryWord} = {secondaryWord}
				</div>

				<!-- Points earned -->
				<div class="text-lg font-semibold text-success">
					+{pointsEarned} pistettä
				</div>
			{:else}
				<!-- Wrong answer feedback - just show the word pair -->
				<div class="text-2xl md:text-3xl font-bold text-base-content mb-6">
					{primaryWord} = {secondaryWord}
				</div>

				<!-- Continue button (only for wrong answers) -->
				<button 
					class="btn btn-lg w-full btn-primary"
					on:click={onContinue}
				>
					Seuraava
				</button>
			{/if}
		</div>
	</div>
{/if}
