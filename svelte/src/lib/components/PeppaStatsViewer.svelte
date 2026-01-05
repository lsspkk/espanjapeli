<script lang="ts">
	import { peppaStats } from '$lib/services/peppaStatistics';
	import { onMount } from 'svelte';

	let stats = peppaStats.getOverallStats();
	let recentSessions = peppaStats.getRecentSessions(5);
	let showDetails = false;

	onMount(() => {
		// Refresh stats
		stats = peppaStats.getOverallStats();
		recentSessions = peppaStats.getRecentSessions(5);
	});

	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleString('fi-FI', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDuration(startTime: number, endTime?: number): string {
		if (!endTime) return 'Kesken';
		const seconds = Math.floor((endTime - startTime) / 1000);
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	}

	function clearStats() {
		if (confirm('Haluatko varmasti tyhjentää kaikki tilastot?')) {
			peppaStats.clearAllStatistics();
			stats = peppaStats.getOverallStats();
			recentSessions = peppaStats.getRecentSessions(5);
		}
	}

	function exportStats() {
		const data = peppaStats.exportStatistics();
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `peppa-stats-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title text-2xl mb-4">
			🐷 Peppa-pelin tilastot
		</h2>

		<!-- Overall Stats -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
			<div class="stat bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg p-4">
				<div class="stat-title text-xs">Pelejä pelattu</div>
				<div class="stat-value text-2xl text-primary">{stats.totalGamesPlayed}</div>
			</div>
			<div class="stat bg-gradient-to-br from-green-100 to-blue-100 rounded-lg p-4">
				<div class="stat-title text-xs">Oikein</div>
				<div class="stat-value text-2xl text-success">{stats.totalCorrectAnswers}</div>
			</div>
			<div class="stat bg-gradient-to-br from-orange-100 to-red-100 rounded-lg p-4">
				<div class="stat-title text-xs">Väärin</div>
				<div class="stat-value text-2xl text-error">{stats.totalWrongAnswers}</div>
			</div>
			<div class="stat bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg p-4">
				<div class="stat-title text-xs">Keskiarvo</div>
				<div class="stat-value text-2xl text-warning">{stats.averageScore}%</div>
			</div>
		</div>

		<!-- Recent Sessions -->
		{#if recentSessions.length > 0}
			<div class="mb-4">
				<h3 class="font-bold text-lg mb-2">📊 Viimeisimmät pelit:</h3>
				<div class="space-y-2">
					{#each recentSessions as session}
						<div class="bg-base-200 rounded-lg p-3">
							<div class="flex justify-between items-center">
								<div>
									<div class="font-bold">
										{session.correctAnswers}/{session.totalQuestions} oikein
										<span class="badge badge-sm ml-2">{session.finalScore}%</span>
									</div>
									<div class="text-xs text-base-content/60">
										{formatDate(session.startTime)}
										{#if session.endTime}
											• Kesto: {formatDuration(session.startTime, session.endTime)}
										{/if}
									</div>
								</div>
								<div class="text-right">
									<div class="text-xs text-base-content/60">
										🔄 {session.togglesUsed} vaihtoa
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Actions -->
		<div class="card-actions justify-end gap-2">
			<button class="btn btn-sm btn-ghost" onclick={() => showDetails = !showDetails}>
				{showDetails ? '🔼 Piilota' : '🔽 Näytä lisää'}
			</button>
			<button class="btn btn-sm btn-info" onclick={exportStats}>
				💾 Vie JSON
			</button>
			<button class="btn btn-sm btn-error" onclick={clearStats}>
				🗑️ Tyhjennä
			</button>
		</div>

		<!-- Detailed View -->
		{#if showDetails}
			<div class="mt-4 p-4 bg-base-200 rounded-lg">
				<h4 class="font-bold mb-2">🔍 Yksityiskohdat:</h4>
				<div class="text-xs space-y-1">
					<p>Versio: {peppaStats.getRawData().version}</p>
					<p>Luotu: {formatDate(stats.createdAt)}</p>
					{#if stats.lastPlayedTimestamp}
						<p>Viimeksi pelattu: {formatDate(stats.lastPlayedTimestamp)}</p>
					{/if}
					<p>Keskimääräinen pistemäärä: {stats.averageSessionScore}%</p>
				</div>
			</div>
		{/if}
	</div>
</div>
