<script lang="ts">
	import FrequencyBadge from '$lib/components/shared/FrequencyBadge.svelte';

	export let text: string;
	export let onSpeak: (() => void) | undefined = undefined;
	export let showSpeaker: boolean = true;
	export let spanishWord: string | undefined = undefined;
	export let showFrequencyBadge: boolean = false;
</script>

<div class="flex-1 flex flex-col items-center justify-center">
	<div 
		class="bg-primary text-primary-content rounded-xl p-3 md:p-4 text-center shadow-lg w-full h-auto mx-3 md:mx-6 relative"
	>
		<div class="text-sm md:text-base lg:text-lg font-medium break-words leading-tight">
			{text}
		</div>
		{#if showFrequencyBadge && spanishWord}
			<div class="absolute -top-2 -right-2">
				<FrequencyBadge spanish={spanishWord} size="sm" />
			</div>
		{/if}
	</div>
	{#if showSpeaker && onSpeak}
		<button 
			class="text-4xl mt-8 hover:scale-110 transition-transform cursor-pointer" 
			on:click={onSpeak} 
			title="Kuuntele"
		>
			🔊
		</button>
	{/if}
</div>
