<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import {
		calculateVocabularyStats,
		getNextMilestone,
		type VocabularyStatistics
	} from '$lib/services/statisticsService';
	import { getCEFRDescription } from '$lib/services/vocabularyService';

	let stats = $state<VocabularyStatistics | null>(null);
	let nextMilestone = $state<{
		type: string;
		current: number;
		target: number;
		description: string;
	} | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			stats = await calculateVocabularyStats();
			nextMilestone = await getNextMilestone();
		} catch (e) {
			console.error('Failed to load stats:', e);
			error = 'Tilastojen lataus epäonnistui';
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

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto max-w-2xl px-4 py-8">
		<div class="mb-4">
			<a href="{base}/" class="btn btn-ghost btn-sm">← Takaisin valikkoon</a>
		</div>

		<h1 class="mb-6 text-4xl font-bold">📚 Sanasto</h1>

		{#if loading}
			<div class="flex justify-center py-12">
				<span class="loading loading-spinner loading-lg"></span>
			</div>
		{:else if error}
			<div class="alert alert-error">
				<span>{error}</span>
			</div>
		{:else if stats}
			<!-- Summary Card -->
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">📊 Yhteenveto</h2>

					<div class="divider"></div>

					<div class="grid grid-cols-2 gap-4 text-center">
						<div class="stat bg-base-200 rounded-lg p-4">
							<div class="stat-title">Harjoitellut sanat</div>
							<div class="stat-value text-primary">{stats.totalPracticed}</div>
						</div>
						<div class="stat bg-base-200 rounded-lg p-4">
							<div class="stat-title">Osatut sanat</div>
							<div class="stat-value text-success">{stats.wordsKnown}</div>
						</div>
						<div class="stat bg-base-200 rounded-lg p-4">
							<div class="stat-title">Hallitut sanat</div>
							<div class="stat-value text-accent">{stats.wordsMastered}</div>
						</div>
						<div class="stat bg-base-200 rounded-lg p-4">
							<div class="stat-title">Pelit pelattu</div>
							<div class="stat-value">{stats.totalGamesPlayed}</div>
						</div>
					</div>

					{#if stats.wordsWeak > 0}
						<div class="mt-4 text-sm text-base-content/70">
							💡 {stats.wordsWeak} sanaa tarvitsee lisäharjoittelua
						</div>
					{/if}
				</div>
			</div>

			<!-- CEFR Level Card -->
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">🎓 Arvioitu taso</h2>

					<div class="divider"></div>

					<div class="flex items-center justify-center gap-4">
						<span class="text-6xl font-bold">{stats.estimatedLevel}</span>
						<div class="text-left">
							<span class="badge {getCEFRColor(stats.estimatedLevel)} badge-lg">
								{getCEFRDescription(stats.estimatedLevel)}
							</span>
							<p class="mt-2 text-sm text-base-content/70">
								Keskimääräinen osaaminen: {stats.averageScore}%
							</p>
						</div>
					</div>

					<div class="mt-4 text-xs text-base-content/50">
						Taso perustuu sanastoon ja osaamispisteiden keskiarvoon
					</div>
				</div>
			</div>

			<!-- Top N Progress Card -->
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">📈 Yleisimpien sanojen edistyminen</h2>

					<div class="divider"></div>

					<div class="space-y-4">
						<!-- Top 100 -->
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span>Top 100</span>
								<span class="font-bold">{stats.topNProgress.top100.known}/100</span>
							</div>
							<progress
								class="progress progress-primary w-full"
								value={stats.topNProgress.top100.percentage}
								max="100"
							></progress>
						</div>

						<!-- Top 500 -->
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span>Top 500</span>
								<span class="font-bold">{stats.topNProgress.top500.known}/500</span>
							</div>
							<progress
								class="progress progress-secondary w-full"
								value={stats.topNProgress.top500.percentage}
								max="100"
							></progress>
						</div>

						<!-- Top 1000 -->
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span>Top 1000</span>
								<span class="font-bold">{stats.topNProgress.top1000.known}/1000</span>
							</div>
							<progress
								class="progress progress-accent w-full"
								value={stats.topNProgress.top1000.percentage}
								max="100"
							></progress>
						</div>

						<!-- Top 5000 -->
						<div>
							<div class="flex justify-between text-sm mb-1">
								<span>Top 5000</span>
								<span class="font-bold">{stats.topNProgress.top5000.known}/5000</span>
							</div>
							<progress
								class="progress w-full"
								value={stats.topNProgress.top5000.percentage}
								max="100"
							></progress>
						</div>
					</div>
				</div>
			</div>

			<!-- Next Milestone Card -->
			{#if nextMilestone}
				<div class="card mb-6 bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">🎯 Seuraava tavoite</h2>

						<div class="divider"></div>

						<div class="text-center">
							<p class="text-lg">{nextMilestone.description}</p>
							<p class="mt-2 text-3xl font-bold">
								{nextMilestone.current} / {nextMilestone.target}
							</p>
							<progress
								class="progress progress-success w-full mt-4"
								value={nextMilestone.current}
								max={nextMilestone.target}
							></progress>
						</div>
					</div>
				</div>
			{:else}
				<div class="card mb-6 bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl">
					<div class="card-body text-center">
						<h2 class="card-title justify-center">🏆 Onnittelut!</h2>
						<p>Olet saavuttanut kaikki perustason tavoitteet!</p>
					</div>
				</div>
			{/if}

			<!-- Vocabulary Coverage Card -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">📖 Pelin sanasto</h2>

					<div class="divider"></div>

					<div class="text-sm">
						<p>
							Pelissä on yhteensä <strong>{stats.vocabularyCoverage.total}</strong> sanaa.
						</p>
						<p class="mt-2">
							Näistä <strong>{stats.vocabularyCoverage.inFrequencyData}</strong> ({stats.vocabularyCoverage.percentage}%)
							on taajuuslistoilla.
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Footer -->
		<div class="mt-8 text-center text-sm text-base-content/50">
			<p>Tilastot päivittyvät automaattisesti pelaamisen myötä</p>
		</div>
	</div>
</div>
