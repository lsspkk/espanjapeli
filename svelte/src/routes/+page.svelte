<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import VocabularyProgressWidget from '$lib/components/shared/VocabularyProgressWidget.svelte';

	interface GameMode {
		id: string;
		icon: string;
		iconSvg?: string;
		title: string;
		description: string;
		scored: boolean;
		route: string;
		available: boolean;
	}

	const basicGameModes: GameMode[] = [
		{
			id: 'sanapeli',
			icon: '⌨️',
			title: 'Sanapeli',
			description: 'Espanjan sana → kirjoita suomeksi',
			scored: true,
			route: '/sanapeli',
			available: true 
		},
		{
			id: 'yhdistasanat',
			icon: '🔗',
			title: 'Yhdistä sanat',
			description: 'Valitse oikea käännös – 3 yritystä',
			scored: true,
			route: '/yhdistasanat',
			available: true 
		},
		{
			id: 'tarinat',
			icon: '📖',
			title: 'Tarinat',
			description: 'Lue dialogeja espanjaksi ja vastaa kysymyksiin',
			scored: true,
			route: '/tarinat',
			available: true // NEW: Story reading game ✅
		},
	{
		id: 'mita-sa-sanoit',
		icon: '👂',
		title: 'Mitä sä sanoit?',
		description: 'Kuuntele tai lue espanjalainen lause ja valitse oikea suomennos',
		scored: true,
		route: '/mita-sa-sanoit',
		available: true // NEW: Sentence comprehension game ✅
	},
	{
		id: 'valitut-sanat',
		icon: '📚',
		title: 'Valitut sanat',
		description: 'Strukturoitu sanasto-oppitunti esimerkkeineen ja testillä',
		scored: true,
		route: '/valitut-sanat',
		available: true // NEW: Structured vocabulary lesson game ✅
	}
	];


	const kidGameModes: GameMode[] = [

		{
			id: 'pipsan-maailma',
			icon: '🌍',
			title: 'Pipsan maailma',
			description: 'Lasten sanapeli - valitse emoji!',
			scored: false,
			route: '/pipsan-maailma',
			available: true // Phase 6 - NOW AVAILABLE! ✅
		},
		{
			id: 'pipsan-ystavat',
			icon: '👫',
			title: 'Pipsan ystävät',
			description: 'Kuuntele espanjaa → valitse oikea kuva!',
			scored: false,
			route: '/pipsan-ystavat',
			available: true // NEW: Image matching game ✅
		},

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

<VocabularyProgressWidget />

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto px-4 py-4 md:py-8">
	<!-- Header -->
	<div class="mb-4 md:mb-8 text-center">
		<h1 class="mb-1 md:mb-2 text-3xl md:text-5xl font-bold hidden lg:block">Espanjapeli</h1>
		<p class="text-base md:text-lg text-base-content/70">Hauskaa ja tehokasta opiskelua</p>
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

<!-- Kids Game Mode Grid -->
		<div class="grid gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each kidGameModes as mode}
				<button
					class="card bg-base-100 shadow-xl transition-all hover:shadow-2xl {mode.available
						? 'cursor-pointer hover:scale-105'
						: 'cursor-not-allowed opacity-60'}"
					onclick={() => navigateToGame(mode)}
					disabled={!mode.available}
				>
				
				<div class="absolute inset-0 bg-gradient-to-br from-pink-200 via-fuchsia-200 to-purple-200"></div>
				<div class="absolute inset-0 opacity-60 [background-image:repeating-linear-gradient(45deg,rgba(255,255,255,0.35)_0px,rgba(255,255,255,0.35)_10px,transparent_10px,transparent_22px)] animate-[stripeMove_12s_linear_infinite] [background-size:200%_200%]"></div>

					<div class="relative card-body">
						<!-- Icon and Title -->
						<div class="flex items-center gap-3">
							<span class="text-4xl">
									{#if mode.iconSvg}
										<img src={mode.iconSvg} alt={mode.title} class="w-8 h-8" />
									{:else}
										{mode.icon}
									{/if}
							</span>
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

		<!-- Game Mode Grid -->
		<div class="grid gap-2 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4 md:mt-8">
			{#each basicGameModes as mode}
				<button
					class="card bg-base-100 shadow-xl transition-all hover:shadow-2xl {mode.available
						? 'cursor-pointer hover:scale-105'
						: 'cursor-not-allowed opacity-60'}"
					onclick={() => navigateToGame(mode)}
					disabled={!mode.available}
				>
					<div class="card-body">
						<!-- Icon and Title -->
						<div class="flex items-center gap-3 w-full">
							<span class="text-4xl filter saturate-30">
								{#if mode.iconSvg}
									<img src={mode.iconSvg} alt={mode.title} class="w-8 h-8" />
								{:else}
									{mode.icon}
								{/if}
							</span>
							<h2 class="card-title">
								{mode.title}
							</h2>
								{#if mode.scored}
									<div class="opacity-50 text-right justify-end flex-grow">🎓</div>

								{/if}
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

		<!-- Footer Note -->
		<div class="mt-12 text-center text-sm text-base-content/50 space-y-1">
			<p>Espanjan opiskelua älypuhelimalla</p>
			<p>Tallentaa edistymisen laitteellesi</p>
			<p>Ilmainen</p>
		</div>
	</div>
</div>
