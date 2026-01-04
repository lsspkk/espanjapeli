<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	interface GameMode {
		id: string;
		icon: string;
		title: string;
		description: string;
		scored: boolean;
		route: string;
		available: boolean;
	}

	const gameModes: GameMode[] = [
		{
			id: 'sanapeli',
			icon: '🇪🇸→🇫🇮',
			title: 'Sanapeli',
			description: 'Espanjan sana → kirjoita suomeksi',
			scored: true,
			route: '/sanapeli',
			available: true // Phase 5 - NOW AVAILABLE! ✅
		},
		// Hidden for now - keep in code for future
		// {
		// 	id: 'muisti',
		// 	icon: '🇫🇮→🇪🇸',
		// 	title: 'Muisti',
		// 	description: 'Suomen sana → muista espanjaksi',
		// 	scored: false,
		// 	route: '/muisti',
		// 	available: false // Future
		// },
		// {
		// 	id: 'kuuntelu',
		// 	icon: '👂',
		// 	title: 'Kuuntelu',
		// 	description: 'Kuuntele espanjaa → valitse oikea tarkoitus',
		// 	scored: true,
		// 	route: '/kuuntelu',
		// 	available: false // Future
		// },
		// {
		// 	id: 'puhuminen',
		// 	icon: '🎤',
		// 	title: 'Puhuminen',
		// 	description: 'Näe espanjaa → puhu → kuuntele oikea lausunta',
		// 	scored: false,
		// 	route: '/puhuminen',
		// 	available: false // Future
		// },
		{
			id: 'peppa',
			icon: '🐷',
			title: 'Pipsa Possu',
			description: 'Lasten sanapeli - valitse oikea kuva!',
			scored: false,
			route: '/peppa',
			available: false // Phase 6
		}
		// {
		// 	id: 'lukeminen',
		// 	icon: '📖',
		// 	title: 'Lukeminen',
		// 	description: 'Lue kertomuksia + sanastoja',
		// 	scored: false,
		// 	route: '/lukeminen',
		// 	available: false // Future
		// }
	];

	let stats = $state({ gamesPlayed: 0, phrasesLearned: 0, categoriesMastered: 0 });

	onMount(() => {
		// Load stats from localStorage
		try {
			const gameHistory = JSON.parse(localStorage.getItem('gameHistory') || '[]');
			const practiceProgress = JSON.parse(localStorage.getItem('practiceProgress') || '{}');

			stats.gamesPlayed = gameHistory.length;

			// Count mastered phrases from practice progress
			let mastered = 0;
			if (practiceProgress.categories) {
				Object.values(practiceProgress.categories).forEach((cat: any) => {
					mastered += cat.masteredCount || 0;
				});
			}
			stats.phrasesLearned = mastered;

			// Count categories with status "mastered"
			let completedCategories = 0;
			if (practiceProgress.categories) {
				Object.values(practiceProgress.categories).forEach((cat: any) => {
					if (cat.status === 'mastered') completedCategories++;
				});
			}
			stats.categoriesMastered = completedCategories;
		} catch (e) {
			console.error('Failed to load stats:', e);
		}
	});

	function navigateToGame(mode: GameMode) {
		if (mode.available) {
			window.location.href = `${base}${mode.route}`;
		}
	}
</script>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-5xl font-bold">Espanjapeli</h1>
		<p class="text-lg text-base-content/70">Hauskaa ja tehokasta opiskelua</p>
		<a href="{base}/kielten-oppiminen" class="btn btn-ghost btn-sm mt-2">
			📖 Kielten oppiminen
		</a>
	</div>

		<!-- Stats Summary (if user has played) -->
		{#if stats.gamesPlayed > 0}
			<div class="mb-8">
				<div class="stats stats-vertical shadow lg:stats-horizontal">
					<div class="stat">
						<div class="stat-title">Pelatut pelit</div>
						<div class="stat-value text-primary">{stats.gamesPlayed}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Opitut fraasit</div>
						<div class="stat-value text-secondary">{stats.phrasesLearned}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Opitut kategoriat</div>
						<div class="stat-value text-accent">{stats.categoriesMastered}</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Game Mode Grid -->
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each gameModes as mode}
				<button
					class="card bg-base-100 shadow-xl transition-all hover:shadow-2xl {mode.available
						? 'cursor-pointer hover:scale-105'
						: 'cursor-not-allowed opacity-60'}"
					onclick={() => navigateToGame(mode)}
					disabled={!mode.available}
				>
					<div class="card-body">
						<!-- Icon and Title -->
						<div class="flex items-center gap-3">
							<span class="text-4xl">{mode.icon}</span>
							<h2 class="card-title">
								{mode.title}
								{#if mode.scored}
									<div class="badge badge-primary badge-sm">Pisteytetty</div>
								{/if}
							</h2>
						</div>

						<!-- Description -->
						<p class="text-sm text-base-content/70">{mode.description}</p>

						<!-- Status Badge -->
						{#if !mode.available}
							<div class="card-actions mt-2 justify-end">
								<div class="badge badge-ghost badge-sm">Pian saatavilla</div>
							</div>
						{/if}
					</div>
				</button>
			{/each}
		</div>

		<!-- Settings Link -->
		<div class="mt-8 text-center">
			<a href="{base}/asetukset" class="btn btn-ghost btn-sm">
				⚙️ Asetukset & Tietojen vienti
			</a>
		</div>

		<!-- Footer Note -->
		<div class="mt-12 text-center text-sm text-base-content/50">
			<p>Espanjan opiskelua älypuhelimella · Tallentaa edistymisen laitteellesi · Ilmainen</p>
		</div>
	</div>
</div>
