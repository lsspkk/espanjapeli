<script lang="ts">
	interface Props {
		wrongImageId: string;
		wrongText: string;
		imageFile?: string;
		emojiDisplay: string;
		displayMode: 'svg' | 'emoji';
	}

	let { wrongImageId, wrongText, imageFile, emojiDisplay, displayMode }: Props = $props();
</script>

<div class="text-center animate-fade-in">
	<div class="text-6xl mb-4">❌</div>
	
	<!-- Wrong answer image -->
	{#if displayMode === 'svg' && imageFile}
		<div class="mb-4 max-w-md mx-auto">
			<img 
				src={imageFile} 
				alt="Wrong answer"
				class="w-full h-auto rounded-xl shadow-lg"
			/>
		</div>
	{:else}
		<div class="text-8xl mb-4">{emojiDisplay}</div>
	{/if}
	
	<!-- Wrong answer text -->
	<div class="text-3xl font-bold text-red-600 mb-2">
		{wrongText}
	</div>
</div>
