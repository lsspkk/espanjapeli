<script lang="ts">
	import { onMount } from 'svelte';
	import { getWordsMetadata, type WordMetadata } from '$lib/services/vocabularyService';
	import type { Word } from '$lib/data/words';

	export let words: Word[] = [];

	let loading = true;
	let top100Count = 0;
	let top500Count = 0;
	let top1000Count = 0;
	let top3000Count = 0;
	let top5000Count = 0;
	let unknownCount = 0;
	let totalWords = 0;

	onMount(async () => {
		if (words.length === 0) {
			loading = false;
			return;
		}

		// Get all Spanish words from the game
		const spanishWords = words.map(w => w.spanish);
		totalWords = spanishWords.length;

		// Fetch metadata for all words
		const metadataMap = await getWordsMetadata(spanishWords);

		// Count words in each frequency tier
		for (const metadata of metadataMap.values()) {
			if (!metadata.isInFrequencyData) {
				unknownCount++;
			} else if (metadata.isTop100) {
				top100Count++;
			} else if (metadata.isTop500) {
				top500Count++;
			} else if (metadata.isTop1000) {
				top1000Count++;
			} else if (metadata.isTop3000) {
				top3000Count++;
			} else if (metadata.isTop5000) {
				top5000Count++;
			} else {
				unknownCount++;
			}
		}

		loading = false;
	});

	$: hasFrequencyData = top100Count + top500Count + top1000Count + top3000Count + top5000Count > 0;
</script>

{#if loading}
	<div class="bg-base-200 rounded-lg p-4 mb-4">
		<div class="flex items-center justify-center gap-2">
			<span class="loading loading-spinner loading-sm"></span>
			<span class="text-sm text-base-content/70">Lasketaan sanojen yleisyyttä...</span>
		</div>
	</div>
{:else if hasFrequencyData}
	<div class="bg-base-200 rounded-lg p-4 mb-4">
		<h3 class="text-lg font-semibold mb-3 text-base-content">📊 Sanojen yleisyys</h3>
		
		<div class="text-sm text-base-content/70 mb-3">
			Harjoittelit {totalWords} sanaa. Tässä niiden jakautuminen yleisyyden mukaan:
		</div>

		<div class="space-y-2">
			{#if top100Count > 0}
				<div class="flex items-center gap-2">
					<div class="badge badge-success badge-sm">Top 100</div>
					<div class="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
						<div 
							class="h-full bg-success transition-all duration-500" 
							style="width: {(top100Count / totalWords) * 100}%"
						></div>
					</div>
					<span class="text-sm font-semibold text-base-content">{top100Count}</span>
				</div>
			{/if}

			{#if top500Count > 0}
				<div class="flex items-center gap-2">
					<div class="badge badge-info badge-sm">Top 500</div>
					<div class="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
						<div 
							class="h-full bg-info transition-all duration-500" 
							style="width: {(top500Count / totalWords) * 100}%"
						></div>
					</div>
					<span class="text-sm font-semibold text-base-content">{top500Count}</span>
				</div>
			{/if}

			{#if top1000Count > 0}
				<div class="flex items-center gap-2">
					<div class="badge badge-primary badge-sm">Top 1000</div>
					<div class="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
						<div 
							class="h-full bg-primary transition-all duration-500" 
							style="width: {(top1000Count / totalWords) * 100}%"
						></div>
					</div>
					<span class="text-sm font-semibold text-base-content">{top1000Count}</span>
				</div>
			{/if}

			{#if top3000Count > 0}
				<div class="flex items-center gap-2">
					<div class="badge badge-warning badge-sm">Top 3000</div>
					<div class="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
						<div 
							class="h-full bg-warning transition-all duration-500" 
							style="width: {(top3000Count / totalWords) * 100}%"
						></div>
					</div>
					<span class="text-sm font-semibold text-base-content">{top3000Count}</span>
				</div>
			{/if}

			{#if top5000Count > 0}
				<div class="flex items-center gap-2">
					<div class="badge badge-sm">Top 5000</div>
					<div class="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
						<div 
							class="h-full bg-base-content/30 transition-all duration-500" 
							style="width: {(top5000Count / totalWords) * 100}%"
						></div>
					</div>
					<span class="text-sm font-semibold text-base-content">{top5000Count}</span>
				</div>
			{/if}

			{#if unknownCount > 0}
				<div class="flex items-center gap-2">
					<div class="badge badge-ghost badge-sm">Muut</div>
					<div class="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
						<div 
							class="h-full bg-base-content/10 transition-all duration-500" 
							style="width: {(unknownCount / totalWords) * 100}%"
						></div>
					</div>
					<span class="text-sm font-semibold text-base-content">{unknownCount}</span>
				</div>
			{/if}
		</div>

		<div class="mt-3 text-xs text-base-content/60">
			💡 Yleisimmät sanat (Top 1000) ovat tärkeimpiä jokapäiväisessä viestinnässä.
		</div>
	</div>
{/if}
