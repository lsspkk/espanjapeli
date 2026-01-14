<script lang="ts">
	import { onMount } from 'svelte';
	import { getWordMetadata, type WordMetadata } from '$lib/services/vocabularyService';

	export let spanish: string;
	export let size: 'sm' | 'md' | 'lg' = 'md';

	let metadata: WordMetadata | null = null;
	let loading = true;

	onMount(async () => {
		try {
			metadata = await getWordMetadata(spanish);
		} catch (error) {
			console.error('Failed to load word metadata:', error);
		} finally {
			loading = false;
		}
	});

	// Determine badge text and color based on frequency
	$: badgeText = metadata?.isTop100 ? '100 yleisintä' 
		: metadata?.isTop500 ? '500 yleisintä' 
		: metadata?.isTop1000 ? '1000 yleisintä'
		: metadata?.isTop3000 ? '3000 yleisintä'
		: metadata?.isTop5000 ? '5000 yleisintä'
		: null;

	$: badgeColor = metadata?.isTop100 ? 'badge-success' 
		: metadata?.isTop500 ? 'badge-info' 
		: metadata?.isTop1000 ? 'badge-primary'
		: metadata?.isTop3000 ? 'badge-secondary'
		: metadata?.isTop5000 ? 'badge-accent'
		: 'badge-ghost';

	$: sizeClass = size === 'sm' ? 'badge-sm' 
		: size === 'lg' ? 'badge-lg' 
		: 'badge-md';
</script>

{#if !loading && badgeText}
	<div class="badge {badgeColor} {sizeClass} gap-1">
		<span>⭐</span>
		<span>{badgeText}</span>
	</div>
{/if}
