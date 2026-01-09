<script lang="ts">
	export let text: string;
	export let onSpeak: (() => void) | undefined = undefined;
	export let showSpeaker: boolean = true;
</script>

<div class="flex-1 flex flex-col items-center justify-center">
	<div 
		class="bg-primary text-primary-content rounded-xl p-3 md:p-4 text-center shadow-lg w-full h-auto mx-3 md:mx-6"
	>
		<div class="text-sm md:text-base lg:text-lg font-medium break-words leading-tight">
			{text}
		</div>
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
