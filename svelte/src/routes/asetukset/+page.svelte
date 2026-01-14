<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import PeppaStatsViewer from '$lib/components/PeppaStatsViewer.svelte';
	import { ttsSettings } from '$lib/stores/ttsSettings';
	import { tts } from '$lib/services/tts';
	import { theme, availableThemes } from '$lib/stores/theme';

	let currentTheme = $state('light');

	$effect(() => {
		const unsubscribe = theme.subscribe((t) => {
			currentTheme = t;
		});
		return unsubscribe;
	});

	let currentTtsSettings = $state({ rate: 0.8, pitch: 1.0, volume: 1.0, autoSpeak: true });

	$effect(() => {
		const unsubscribe = ttsSettings.subscribe((s) => {
			currentTtsSettings = s;
		});
		return unsubscribe;
	});

	function testTTS() {
		tts.speakSpanish('Hola, ¿cómo estás?');
	}

	let stats = $state({
		gamesPlayed: 0,
		phrasesLearned: 0,
		firstGame: null as string | null,
		dataSize: '0 KB'
	});
	let showConfirmReset = $state(false);
	let showExportSuccess = $state(false);
	let showImportSuccess = $state(false);
	let importError = $state('');

	onMount(() => {
		loadStats();
	});

	function loadStats() {
		try {
			const gameHistory = JSON.parse(localStorage.getItem('gameHistory') || '[]');
			const practiceProgress = JSON.parse(localStorage.getItem('practiceProgress') || '{}');

			stats.gamesPlayed = gameHistory.length;

			// Count mastered phrases
			let mastered = 0;
			if (practiceProgress.categories) {
				Object.values(practiceProgress.categories).forEach((cat: any) => {
					mastered += cat.masteredCount || 0;
				});
			}
			stats.phrasesLearned = mastered;

			// First game date
			if (gameHistory.length > 0) {
				stats.firstGame = new Date(gameHistory[0].date).toLocaleDateString('fi-FI');
			}

			// Calculate data size
			const allData = {
				gameHistory: gameHistory,
				practiceProgress: practiceProgress,
				preferences: JSON.parse(localStorage.getItem('preferences') || '{}')
			};
			const dataStr = JSON.stringify(allData);
			stats.dataSize = `${(dataStr.length / 1024).toFixed(1)} KB`;
		} catch (e) {
			console.error('Failed to load stats:', e);
		}
	}

	function exportData() {
		try {
			const exportData = {
				version: '1.0',
				exportedAt: new Date().toISOString(),
				device: navigator.userAgent,
				gameHistory: JSON.parse(localStorage.getItem('gameHistory') || '[]'),
				practiceProgress: JSON.parse(localStorage.getItem('practiceProgress') || '{}'),
				preferences: JSON.parse(localStorage.getItem('preferences') || '{}')
			};

			const dataStr = JSON.stringify(exportData, null, 2);
			const blob = new Blob([dataStr], { type: 'application/json' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = `espanjapeli-backup-${new Date().toISOString().split('T')[0]}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			showExportSuccess = true;
			setTimeout(() => (showExportSuccess = false), 3000);
		} catch (e) {
			console.error('Export failed:', e);
			alert('Vienti epäonnistui. Katso konsolista lisätietoja.');
		}
	}

	async function shareData() {
		try {
			const sharePayload = {
				version: '1.0',
				exportedAt: new Date().toISOString(),
				gameHistory: JSON.parse(localStorage.getItem('gameHistory') || '[]'),
				practiceProgress: JSON.parse(localStorage.getItem('practiceProgress') || '{}'),
				preferences: JSON.parse(localStorage.getItem('preferences') || '{}')
			};

			const dataStr = JSON.stringify(sharePayload, null, 2);

			if (navigator.share) {
				// Use Web Share API on mobile
				const blob = new Blob([dataStr], { type: 'application/json' });
				const file = new File(
					[blob],
					`espanjapeli-backup-${new Date().toISOString().split('T')[0]}.json`,
					{
						type: 'application/json'
					}
				);

				await navigator.share({
					files: [file],
					title: 'Espanjapeli Progress Backup'
				});
			} else {
				// Fallback to download
				exportData();
			}
		} catch (e: any) {
			if (e.name !== 'AbortError') {
				console.error('Share failed:', e);
				exportData(); // Fallback to download
			}
		}
	}

	function handleImportFile(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const data = JSON.parse(e.target?.result as string);

				// Validate data structure
				if (!data.version || !data.gameHistory) {
					throw new Error('Virheellinen varmuuskopiotiedoston muoto');
				}

				// Import data
				if (data.gameHistory) localStorage.setItem('gameHistory', JSON.stringify(data.gameHistory));
				if (data.practiceProgress)
					localStorage.setItem('practiceProgress', JSON.stringify(data.practiceProgress));
				if (data.preferences) localStorage.setItem('preferences', JSON.stringify(data.preferences));

				showImportSuccess = true;
				setTimeout(() => (showImportSuccess = false), 3000);
				loadStats(); // Refresh stats
				importError = '';
			} catch (e: any) {
				console.error('Import failed:', e);
				importError = `Tuonti epäonnistui: ${e.message}`;
			}
		};
		reader.readAsText(file);
	}

	function resetData() {
		localStorage.removeItem('gameHistory');
		localStorage.removeItem('practiceProgress');
		localStorage.removeItem('preferences');
		showConfirmReset = false;
		loadStats();
	}
</script>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto max-w-2xl px-4 py-8">
		<div class="mb-4">
			<a href="{base}/" class="btn btn-ghost btn-sm">← Takaisin valikkoon</a>
		</div>

		<h1 class="mb-6 text-4xl font-bold">⚙️ Asetukset</h1>

		<!-- Stats Card -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">📊 Oppimisen tiedot</h2>

				<div class="divider"></div>

				<div class="space-y-2">
					<div class="flex justify-between">
						<span>Pelit pelattu:</span>
						<span class="font-bold">{stats.gamesPlayed}</span>
					</div>
					<div class="flex justify-between">
						<span>Fraaseja opittu:</span>
						<span class="font-bold">{stats.phrasesLearned}</span>
					</div>
					{#if stats.firstGame}
						<div class="flex justify-between">
							<span>Ensimmäinen peli:</span>
							<span class="font-bold">{stats.firstGame}</span>
						</div>
					{/if}
					<div class="flex justify-between">
						<span>Tietojen koko:</span>
						<span class="font-bold">{stats.dataSize}</span>
					</div>
				</div>
			</div>
		</div>

		<!-- TTS Settings Card -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">🔊 Puhesynteesi (TTS)</h2>
				<p class="text-sm text-base-content/70">
					Säädä tekstistä puheeksi -asetuksia
				</p>

				<div class="divider"></div>

				<div class="space-y-4">
					<!-- Speech Rate -->
					<div class="form-control">
						<label class="label" for="tts-rate">
							<span class="label-text">Puhenopeus</span>
							<span class="label-text-alt">{currentTtsSettings.rate.toFixed(1)}x</span>
						</label>
						<input
							id="tts-rate"
							type="range"
							min="0.5"
							max="1.5"
							step="0.1"
							value={currentTtsSettings.rate}
							onchange={(e) => ttsSettings.setRate(parseFloat((e.target as HTMLInputElement).value))}
							class="range range-primary"
						/>
						<div class="flex justify-between text-xs px-2 text-base-content/50">
							<span>Hidas</span>
							<span>Normaali</span>
							<span>Nopea</span>
						</div>
					</div>

					<!-- Pitch -->
					<div class="form-control">
						<label class="label" for="tts-pitch">
							<span class="label-text">Äänenkorkeus</span>
							<span class="label-text-alt">{currentTtsSettings.pitch.toFixed(1)}</span>
						</label>
						<input
							id="tts-pitch"
							type="range"
							min="0.5"
							max="1.5"
							step="0.1"
							value={currentTtsSettings.pitch}
							onchange={(e) => ttsSettings.setPitch(parseFloat((e.target as HTMLInputElement).value))}
							class="range range-secondary"
						/>
						<div class="flex justify-between text-xs px-2 text-base-content/50">
							<span>Matala</span>
							<span>Normaali</span>
							<span>Korkea</span>
						</div>
					</div>

					<!-- Volume -->
					<div class="form-control">
						<label class="label" for="tts-volume">
							<span class="label-text">Äänenvoimakkuus</span>
							<span class="label-text-alt">{Math.round(currentTtsSettings.volume * 100)}%</span>
						</label>
						<input
							id="tts-volume"
							type="range"
							min="0"
							max="1"
							step="0.1"
							value={currentTtsSettings.volume}
							onchange={(e) => ttsSettings.setVolume(parseFloat((e.target as HTMLInputElement).value))}
							class="range range-accent"
						/>
					</div>

					<!-- Auto-speak toggle -->
					<div class="form-control">
						<label class="label cursor-pointer">
							<span class="label-text">Automaattinen ääntäminen</span>
							<input
								type="checkbox"
								checked={currentTtsSettings.autoSpeak}
								onchange={(e) => ttsSettings.setAutoSpeak((e.target as HTMLInputElement).checked)}
								class="toggle toggle-primary"
							/>
						</label>
						<p class="text-xs text-base-content/50 ml-1">
							Ääntää uudet sanat automaattisesti peleissä
						</p>
					</div>

					<!-- Test button -->
					<div class="flex gap-2 mt-4">
						<button class="btn btn-outline btn-sm" onclick={testTTS}>
							🔊 Testaa
						</button>
						<button class="btn btn-ghost btn-sm" onclick={() => ttsSettings.reset()}>
							Palauta oletukset
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Theme Selection Card -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">🎨 Teema</h2>
				<p class="text-sm text-base-content/70">
					Valitse sovelluksen ulkoasu
				</p>

				<div class="divider"></div>

				<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
					{#each availableThemes as themeOption}
						<button
							class="btn btn-sm {currentTheme === themeOption.value ? 'btn-primary' : 'btn-ghost'}"
							onclick={() => theme.set(themeOption.value)}
						>
							<span>{themeOption.emoji}</span>
							<span class="text-xs">{themeOption.name}</span>
						</button>
					{/each}
				</div>

				<div class="mt-4">
					<button class="btn btn-ghost btn-sm" onclick={() => theme.reset()}>
						Palauta oletusteema
					</button>
				</div>
			</div>
		</div>

		<!-- Export Card -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">📤 Vie tiedot</h2>
				<p class="text-sm text-base-content/70">
					Tallenna edistymisesi tiedostoon tai jaa se toiselle laitteelle
				</p>

				<div class="divider"></div>

				<div class="flex flex-wrap gap-2">
					<button class="btn btn-primary" onclick={shareData}>
						<span class="text-lg">📱</span>
						Jaa...
					</button>
					<button class="btn btn-primary" onclick={exportData}>
						<span class="text-lg">💾</span>
						Lataa tiedosto
					</button>
				</div>

				{#if showExportSuccess}
					<div class="alert alert-success">
						<span>✓ Vienti onnistui!</span>
					</div>
				{/if}

				<div class="mt-2 text-xs text-base-content/50">
					Vie kaikki pelihistoriasi, edistymisesi ja asetuksesi JSON-tiedostona
				</div>
			</div>
		</div>

		<!-- Import Card -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">📥 Tuo tiedot</h2>
				<p class="text-sm text-base-content/70">Palauta edistymisesi varmuuskopiosta</p>

				<div class="divider"></div>

				<input
					type="file"
					accept=".json"
					class="file-input file-input-bordered w-full"
					onchange={handleImportFile}
				/>

				{#if showImportSuccess}
					<div class="alert alert-success">
						<span>✓ Tuonti onnistui! Tietosi on palautettu.</span>
					</div>
				{/if}

				{#if importError}
					<div class="alert alert-error">
						<span>{importError}</span>
					</div>
				{/if}

				<div class="mt-2 text-xs text-base-content/50">
					⚠️ Tuonti ylikirjoittaa nykyisen edistymisesi
				</div>
			</div>
		</div>

		<!-- Reset Card -->
		<div class="card mb-6 bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title text-error">🗑️ Nollaa kaikki tiedot</h2>
				<p class="text-sm text-base-content/70">Poista pysyvästi kaikki edistymisesi ja asetuksesi</p>

				<div class="divider"></div>

				{#if !showConfirmReset}
					<button class="btn btn-error" onclick={() => (showConfirmReset = true)}>
						Nollaa kaikki tiedot
					</button>
				{:else}
					<div class="alert alert-warning">
						<span>⚠️ Oletko varma? Tätä ei voi peruuttaa!</span>
					</div>
					<div class="flex gap-2">
						<button class="btn btn-error" onclick={resetData}>Kyllä, poista kaikki</button>
						<button class="btn btn-ghost" onclick={() => (showConfirmReset = false)}>Peruuta</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Peppa Statistics Card -->
		<div class="mb-6">
			<PeppaStatsViewer />
		</div>

		<!-- About Card -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">ℹ️ Tietoja</h2>
				<div class="space-y-2 text-sm">
					<p><strong>Versio:</strong> 2.0.0 (SvelteKit)</p>
					<p><strong>Tietojen tallennus:</strong> Paikallinen (selaimen localStorage)</p>
					<p><strong>Yksityisyys:</strong> Kaikki tiedot pysyvät laitteellasi</p>
					<p><strong>Offline-tuki:</strong> Toimii ilman internet-yhteyttä</p>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="mt-8 text-center text-sm text-base-content/50">
			<p>Mobiiliystävällinen oppimissovellus · Ei tiliä tarvita · Avoimen lähdekoodin</p>
		</div>
	</div>
</div>

