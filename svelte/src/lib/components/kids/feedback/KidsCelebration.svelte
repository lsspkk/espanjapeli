<script lang="ts">
	interface Props {
		emoji: string;
		spanishPhrase: string;
		finnishPhrase: string;
		imageFile?: string;
		emojiDisplay?: string;
		displayMode: 'svg' | 'emoji';
	}

	let { emoji, spanishPhrase, finnishPhrase, imageFile, emojiDisplay, displayMode }: Props = $props();
</script>

<div class="text-center animate-bounce">
	<div class="text-9xl mb-4">{emoji}</div>
	<div class="text-4xl font-bold text-green-600 mb-4">
		¡Muy bien!
	</div>
	
	<!-- Correct answer image -->
	{#if displayMode === 'svg' && imageFile}
		<div class="mb-4 max-w-md mx-auto">
			<img 
				src={imageFile} 
				alt="Correct answer"
				class="w-full h-auto rounded-xl shadow-lg border-4 border-green-500"
			/>
		</div>
	{:else if emojiDisplay}
		<div class="text-8xl mb-4">{emojiDisplay}</div>
	{/if}
	
	<div class="text-3xl font-bold text-primary mb-2">
		{spanishPhrase}
	</div>
	<div class="text-2xl text-green-600 font-bold">
		= {finnishPhrase}
	</div>
</div>
