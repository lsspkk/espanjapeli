<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import {
		calculateKidsVocabularyStats,
		type KidsVocabularyStatistics
	} from '$lib/services/statisticsService';

	let stats = $state<KidsVocabularyStatistics | null>(null);
	let loading = $state(true);
	let error = $state(false);

	onMount(async () => {
		try {
			stats = await calculateKidsVocabularyStats();
		} catch (e) {
			console.error('Failed to load kids vocabulary stats:', e);
			error = true;
		} finally {
			loading = false;
		}
	});

	function getEncouragementEmoji(): string {
		if (!stats) return '🌟';
		if (stats.wordsMastered >= 50) return '🏆';
		if (stats.wordsKnown >= 30) return '⭐';
		if (stats.totalWordsPracticed >= 10) return '🌈';
		return '🌟';
	}
</script>

{#if !loading && !error && stats && stats.totalWordsPracticed > 0}
	<a 
		href="{base}/sanasto-kids" 
		class="fixed top-20 right-4 z-40 w-20 h-20 rounded-full bg-gradient-to-br from-primary via-secondary to-accent shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center group animate-bounce-slow"
		title="Katso sanastosi!"
		data-testid="kids-vocabulary-widget"
	>
		<!-- Main content -->
		<div class="text-center z-10">
			<div class="text-3xl mb-1">{getEncouragementEmoji()}</div>
			<div class="text-2xl font-bold text-white">{stats.wordsKnown}</div>
			<div class="text-[10px] text-white/90 leading-none font-semibold">sanaa</div>
		</div>
		
		<!-- Progress ring -->
		<div class="absolute top-0 left-0 w-full h-full rounded-full">
			<svg class="w-full h-full -rotate-90">
				<!-- Background circle -->
				<circle
					cx="40"
					cy="40"
					r="36"
					fill="none"
					stroke="rgba(255,255,255,0.3)"
					stroke-width="3"
				/>
				<!-- Progress circle -->
				<circle
					cx="40"
					cy="40"
					r="36"
					fill="none"
					stroke="white"
					stroke-width="3"
					stroke-dasharray="{(stats.nextMilestone.percentage / 100) * 226} 226"
					stroke-linecap="round"
					class="transition-all duration-500"
				/>
			</svg>
		</div>
		
		<!-- Sparkle effect on hover -->
		<div class="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
			<div class="absolute top-2 right-2 text-yellow-300 text-xl animate-pulse">✨</div>
			<div class="absolute bottom-2 left-2 text-yellow-300 text-xl animate-pulse delay-150">✨</div>
		</div>
	</a>
{/if}

<style>
	@keyframes bounce-slow {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-10px);
		}
	}
	
	.animate-bounce-slow {
		animation: bounce-slow 3s ease-in-out infinite;
	}
	
	.delay-150 {
		animation-delay: 150ms;
	}
</style>
