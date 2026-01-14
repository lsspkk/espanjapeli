<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import {
		calculateKidsVocabularyStats,
		type KidsVocabularyStatistics
	} from '$lib/services/statisticsService';
	import {
		Star,
		Trophy,
		Sparkles,
		Target,
		Smile,
		TrendingUp
	} from 'lucide-svelte';

	let stats = $state<KidsVocabularyStatistics | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			stats = await calculateKidsVocabularyStats();
		} catch (e) {
			console.error('Failed to load stats:', e);
			error = 'Tilastojen lataus epäonnistui';
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

<div class="min-h-screen bg-gradient-to-b from-primary/10 via-secondary/10 to-accent/10">
	<div class="container mx-auto max-w-3xl px-4 py-8">
		<div class="mb-4">
			<a href="{base}/pipsan-maailma" class="btn btn-ghost btn-sm">← Takaisin</a>
		</div>

		<h1 class="mb-2 text-center text-5xl font-bold text-primary">Sanastosi</h1>
		<p class="mb-8 text-center text-xl text-base-content/70">Katso kuinka paljon olet oppinut!</p>

		{#if loading}
			<div class="flex justify-center py-12">
				<span class="loading loading-spinner loading-lg text-primary"></span>
			</div>
		{:else if error}
			<div class="alert alert-error">
				<span>{error}</span>
			</div>
		{:else if stats}
			<!-- Encouragement Card -->
			<div class="card mb-6 bg-gradient-to-r from-primary to-secondary text-primary-content shadow-2xl">
				<div class="card-body text-center">
					<div class="text-6xl mb-2">{getEncouragementEmoji()}</div>
					<h2 class="text-3xl font-bold mb-2">{stats.encouragementMessage}</h2>
					<p class="text-lg opacity-90">Jatka samaan malliin!</p>
				</div>
			</div>

			<!-- Main Stats Grid -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<!-- Total Practiced -->
				<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
					<div class="card-body items-center text-center">
						<Sparkles class="h-12 w-12 text-primary mb-2" />
						<h3 class="text-lg font-semibold">Harjoitellut sanat</h3>
						<p class="text-5xl font-bold text-primary">{stats.totalWordsPracticed}</p>
					</div>
				</div>

				<!-- Words Known -->
				<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
					<div class="card-body items-center text-center">
						<Smile class="h-12 w-12 text-success mb-2" />
						<h3 class="text-lg font-semibold">Osaat sanoja</h3>
						<p class="text-5xl font-bold text-success">{stats.wordsKnown}</p>
					</div>
				</div>

				<!-- Words Mastered -->
				<div class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
					<div class="card-body items-center text-center">
						<Star class="h-12 w-12 text-warning mb-2" />
						<h3 class="text-lg font-semibold">Hallitset sanoja</h3>
						<p class="text-5xl font-bold text-warning">{stats.wordsMastered}</p>
					</div>
				</div>
			</div>

			<!-- Games Played Card -->
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title justify-center">
						<Trophy class="h-8 w-8 text-accent" />
						Pelit pelattu
					</h2>
					<div class="text-center">
						<p class="text-6xl font-bold text-accent">{stats.totalGamesPlayed}</p>
						<p class="mt-2 text-lg text-base-content/70">Hienoa työtä!</p>
					</div>
				</div>
			</div>

			<!-- Recent Progress Card -->
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title justify-center">
						<TrendingUp class="h-8 w-8 text-info" />
						Viimeaikainen edistyminen
					</h2>
					
					<div class="grid grid-cols-2 gap-4 mt-4">
						<div class="stat bg-base-200 rounded-lg p-4 text-center">
							<div class="stat-title text-lg">Viimeiset 7 päivää</div>
							<div class="stat-value text-4xl text-info">{stats.recentProgress.last7Days}</div>
							<div class="stat-desc">uutta sanaa</div>
						</div>
						<div class="stat bg-base-200 rounded-lg p-4 text-center">
							<div class="stat-title text-lg">Viimeiset 30 päivää</div>
							<div class="stat-value text-4xl text-info">{stats.recentProgress.last30Days}</div>
							<div class="stat-desc">uutta sanaa</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Next Milestone Card -->
			<div class="card mb-6 bg-gradient-to-br from-success/20 to-primary/20 shadow-xl">
				<div class="card-body">
					<h2 class="card-title justify-center text-2xl">
						<Target class="h-8 w-8 text-success" />
						Seuraava tavoite
					</h2>

					<div class="divider"></div>

					<div class="text-center">
						<p class="text-2xl font-semibold mb-4">{stats.nextMilestone.description}</p>
						<p class="text-5xl font-bold text-success mb-4">
							{stats.nextMilestone.current} / {stats.nextMilestone.target}
						</p>
						<progress
							class="progress progress-success w-full h-6"
							value={stats.nextMilestone.percentage}
							max="100"
						></progress>
						<p class="mt-2 text-lg text-base-content/70">
							{Math.round(stats.nextMilestone.percentage)}% valmiina!
						</p>
					</div>
				</div>
			</div>

			<!-- Average Score Card -->
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body text-center">
					<h2 class="card-title justify-center text-xl">
						Keskimääräinen osaaminen
					</h2>
					<div class="radial-progress text-primary text-4xl font-bold" 
						style="--value:{stats.averageScore}; --size:12rem; --thickness: 1rem;" 
						role="progressbar">
						{stats.averageScore}%
					</div>
					<p class="mt-4 text-lg text-base-content/70">
						{#if stats.averageScore >= 80}
							Erinomaista! Olet todellinen tähti! ⭐
						{:else if stats.averageScore >= 60}
							Hienoa työtä! Olet oppimassa nopeasti! 🌟
						{:else if stats.averageScore >= 40}
							Hyvää työtä! Jatka harjoittelua! 💪
						{:else}
							Loistava alku! Jatka samaan malliin! 🌈
						{/if}
					</p>
				</div>
			</div>
		{/if}

		<!-- Footer -->
		<div class="mt-8 text-center text-base-content/50">
			<p class="text-lg">✨ Tilastot päivittyvät kun pelaat pelejä ✨</p>
		</div>
	</div>
</div>
