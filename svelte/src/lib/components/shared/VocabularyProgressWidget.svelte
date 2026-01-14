<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import {
		calculateVocabularyStats,
		type VocabularyStatistics
	} from '$lib/services/statisticsService';

	let stats = $state<VocabularyStatistics | null>(null);
	let loading = $state(true);
	let error = $state(false);

	onMount(async () => {
		try {
			stats = await calculateVocabularyStats();
		} catch (e) {
			console.error('Failed to load vocabulary stats:', e);
			error = true;
		} finally {
			loading = false;
		}
	});

	function getCEFRColor(level: string): string {
		const colors: Record<string, string> = {
			A1: 'text-info',
			A2: 'text-success',
			B1: 'text-warning',
			B2: 'text-error',
			C1: 'text-primary'
		};
		return colors[level] || 'text-neutral';
	}
</script>

{#if !loading && !error && stats && stats.totalPracticed > 0}
	<a 
		href="{base}/sanasto" 
		class="fixed top-20 right-4 z-40 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center group"
		title="Sanasto"
	>
		<div class="text-center">
			<div class="text-xl font-bold text-white">{stats.wordsKnown}</div>
			<div class="text-[8px] text-white/80 leading-none">sanaa</div>
		</div>
		
		<div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
			<span class="text-xs font-bold text-white {getCEFRColor(stats.estimatedLevel)}">{stats.estimatedLevel}</span>
		</div>
		
		<div class="absolute top-0 left-0 w-full h-full rounded-full">
			<svg class="w-full h-full -rotate-90">
				<circle
					cx="32"
					cy="32"
					r="28"
					fill="none"
					stroke="rgba(255,255,255,0.3)"
					stroke-width="2"
				/>
				<circle
					cx="32"
					cy="32"
					r="28"
					fill="none"
					stroke="white"
					stroke-width="2"
					stroke-dasharray="{(stats.topNProgress.top100.percentage / 100) * 176} 176"
					stroke-linecap="round"
				/>
			</svg>
		</div>
	</a>
{/if}
