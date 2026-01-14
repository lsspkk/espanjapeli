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
			A1: 'badge-info',
			A2: 'badge-success',
			B1: 'badge-warning',
			B2: 'badge-error',
			C1: 'badge-primary'
		};
		return colors[level] || 'badge-neutral';
	}
</script>

{#if !loading && !error && stats && stats.totalPracticed > 0}
	<div class="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg mb-6">
		<div class="card-body">
			<div class="flex items-center justify-between">
				<h2 class="card-title text-lg">📚 Sanastosi</h2>
				<a href="{base}/sanasto" class="btn btn-ghost btn-sm">Näytä lisää →</a>
			</div>

			<div class="divider my-2"></div>

			<div class="grid grid-cols-3 gap-2 text-center mb-3">
				<div>
					<div class="text-2xl font-bold text-primary">{stats.wordsKnown}</div>
					<div class="text-xs text-base-content/70">Osatut</div>
				</div>
				<div>
					<div class="text-2xl font-bold text-accent">{stats.wordsMastered}</div>
					<div class="text-xs text-base-content/70">Hallitut</div>
				</div>
				<div>
					<div class="text-2xl font-bold">
						<span class="badge {getCEFRColor(stats.estimatedLevel)} badge-lg">
							{stats.estimatedLevel}
						</span>
					</div>
					<div class="text-xs text-base-content/70">Taso</div>
				</div>
			</div>

			<div class="space-y-2">
				<div>
					<div class="flex justify-between text-xs mb-1">
						<span>Top 100</span>
						<span class="font-semibold">{stats.topNProgress.top100.known}/100</span>
					</div>
					<progress
						class="progress progress-primary w-full h-2"
						value={stats.topNProgress.top100.percentage}
						max="100"
					></progress>
				</div>

				<div>
					<div class="flex justify-between text-xs mb-1">
						<span>Top 1000</span>
						<span class="font-semibold">{stats.topNProgress.top1000.known}/1000</span>
					</div>
					<progress
						class="progress progress-accent w-full h-2"
						value={stats.topNProgress.top1000.percentage}
						max="100"
					></progress>
				</div>
			</div>
		</div>
	</div>
{/if}
