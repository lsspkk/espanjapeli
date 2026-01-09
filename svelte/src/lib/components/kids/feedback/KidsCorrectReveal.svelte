<script lang="ts">
	export let spanishPhrase: string;
	export let finnishPhrase: string;
	export let imageFile: string;
	export let emojiDisplay: string;
	export let displayMode: 'svg' | 'emoji';
</script>

<div class="text-center animate-fade-in">
	<div class="text-6xl mb-4">✅</div>
	
	<!-- Correct answer image -->
	{#if displayMode === 'svg' && imageFile}
		<div class="mb-4 max-w-md mx-auto">
			<img 
				src={imageFile} 
				alt="Correct answer"
				class="w-full h-auto rounded-xl shadow-lg border-4 border-green-500"
			/>
		</div>
	{:else}
		<div class="text-8xl mb-4">{emojiDisplay}</div>
	{/if}
	
	<!-- Correct answer text -->
	<div class="text-3xl font-bold text-primary mb-2">
		{spanishPhrase}
	</div>
	<div class="text-2xl text-green-600 font-bold">
		= {finnishPhrase}
	</div>
</div>
