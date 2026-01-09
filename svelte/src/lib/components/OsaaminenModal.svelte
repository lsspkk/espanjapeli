<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { wordKnowledge, type LanguageDirection, type CategoryKnowledge } from '$lib/stores/wordKnowledge';
	import { getCategoriesByLearningOrder, getTierEmoji, type CategoryWithKey } from '$lib/data/categoryConfig';
	import { getWordsFromCategory, getCategoryName } from '$lib/data/words';

	export let isOpen = false;

	const dispatch = createEventDispatcher<{ close: void }>();

	// State
	let selectedDirection: LanguageDirection = 'spanish_to_finnish';
	let categoryKnowledgeList: Array<CategoryKnowledge & { name: string; emoji: string; tier: number }> = [];
	let categories: CategoryWithKey[] = [];
	let showExportModal = false;
	let showImportModal = false;
	let importText = '';
	let importError = '';
	let importSuccess = false;
	let exportData = '';

	// Statistics
	let stats = {
		totalWordsLearned: 0,
		totalGamesPlayed: 0,
		averageScore: 0,
		strongWords: 0,
		weakWords: 0
	};

	function close() {
		dispatch('close');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}

	function toggleDirection() {
		selectedDirection = selectedDirection === 'spanish_to_finnish' 
			? 'finnish_to_spanish' 
			: 'spanish_to_finnish';
		updateCategoryKnowledge();
	}

	function updateCategoryKnowledge() {
		categoryKnowledgeList = categories.map(cat => {
			const words = getWordsFromCategory(cat.key);
			const knowledge = wordKnowledge.getCategoryKnowledge(cat.key, words);
			return {
				...knowledge,
				name: getCategoryName(cat.key),
				emoji: getTierEmoji(cat.tier),
				tier: cat.tier
			};
		});
		
		stats = wordKnowledge.getStatistics();
	}

	function getScoreForDirection(knowledge: CategoryKnowledge): number {
		return selectedDirection === 'spanish_to_finnish' 
			? knowledge.spanishToFinnishScore 
			: knowledge.finnishToSpanishScore;
	}

	function getScoreColor(score: number): string {
		if (score >= 80) return 'text-success';
		if (score >= 50) return 'text-warning';
		if (score > 0) return 'text-error';
		return 'text-base-content/50';
	}

	function getProgressColor(score: number): string {
		if (score >= 80) return 'progress-success';
		if (score >= 50) return 'progress-warning';
		if (score > 0) return 'progress-error';
		return 'progress-primary';
	}

	function formatLastPracticed(timestamp: string | null): string {
		if (!timestamp) return 'Ei harjoiteltu';
		
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) return 'Tänään';
		if (diffDays === 1) return 'Eilen';
		if (diffDays < 7) return `${diffDays} päivää sitten`;
		if (diffDays < 30) return `${Math.floor(diffDays / 7)} viikkoa sitten`;
		return `${Math.floor(diffDays / 30)} kuukautta sitten`;
	}

	function handleExport() {
		exportData = wordKnowledge.exportData();
		showExportModal = true;
	}

	function downloadExport() {
		const blob = new Blob([exportData], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `espanjapeli-osaaminen-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	function copyExportToClipboard() {
		navigator.clipboard.writeText(exportData).then(() => {
			alert('Kopioitu leikepöydälle!');
		}).catch(err => {
			console.error('Failed to copy:', err);
		});
	}

	function handleImport() {
		importText = '';
		importError = '';
		importSuccess = false;
		showImportModal = true;
	}

	function processImport() {
		importError = '';
		importSuccess = false;
		
		const result = wordKnowledge.importData(importText);
		if (result.success) {
			importSuccess = true;
			updateCategoryKnowledge();
			setTimeout(() => {
				showImportModal = false;
			}, 1500);
		} else {
			importError = result.error || 'Tuntematon virhe';
		}
	}

	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		
		const reader = new FileReader();
		reader.onload = (e) => {
			importText = e.target?.result as string || '';
		};
		reader.readAsText(file);
	}

	function handleReset() {
		if (confirm('Haluatko varmasti nollata kaikki osaamistiedot? Tätä ei voi kumota.')) {
			wordKnowledge.reset();
			updateCategoryKnowledge();
		}
	}

	// Subscribe to store for reactivity
	$: knowledgeData = $wordKnowledge;

	onMount(() => {
		categories = getCategoriesByLearningOrder();
		updateCategoryKnowledge();
	});

	// Update when store changes or modal opens
	$: if (knowledgeData && categories.length > 0 && isOpen) {
		updateCategoryKnowledge();
	}
</script>

{#if isOpen}
	<div 
		class="fixed inset-0 bg-neutral/50 z-50" 
		on:click={close}
		on:keydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		<div 
			class="bg-base-100 w-full h-full sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:shadow-xl overflow-hidden flex flex-col"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<!-- Header -->
			<div class="bg-primary text-primary-content p-4 flex items-center justify-between flex-shrink-0">
				<h2 class="text-xl font-bold flex items-center gap-2">
					<span>📊</span>
					<span>Osaaminen</span>
				</h2>
				<button class="btn btn-ghost btn-sm btn-circle text-primary-content" on:click={close}>✕</button>
			</div>

			<!-- Content -->
			<div class="overflow-y-auto flex-1 p-4">
				<!-- Language Direction Switch -->
				<div class="mb-4">
					<div class="flex items-center justify-center gap-2 p-2 bg-base-200 rounded-lg">
						<button 
							class="btn btn-sm gap-2 flex-1"
							class:btn-primary={selectedDirection === 'spanish_to_finnish'}
							class:btn-ghost={selectedDirection !== 'spanish_to_finnish'}
							on:click={() => { selectedDirection = 'spanish_to_finnish'; updateCategoryKnowledge(); }}
						>
							<span class="text-lg">🇪🇸</span>
							<span class="text-xs">→</span>
							<span class="text-lg">🇫🇮</span>
						</button>
						<button 
							class="btn btn-sm gap-2 flex-1"
							class:btn-primary={selectedDirection === 'finnish_to_spanish'}
							class:btn-ghost={selectedDirection !== 'finnish_to_spanish'}
							on:click={() => { selectedDirection = 'finnish_to_spanish'; updateCategoryKnowledge(); }}
						>
							<span class="text-lg">🇫🇮</span>
							<span class="text-xs">→</span>
							<span class="text-lg">🇪🇸</span>
						</button>
					</div>
				</div>

				<!-- Overall Statistics -->
				<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
					<div class="bg-base-200 rounded-lg p-3 text-center">
						<div class="text-2xl font-bold text-primary">{stats.totalGamesPlayed}</div>
						<div class="text-xs text-base-content/70">Pelejä</div>
					</div>
					<div class="bg-base-200 rounded-lg p-3 text-center">
						<div class="text-2xl font-bold text-secondary">{stats.totalWordsLearned}</div>
						<div class="text-xs text-base-content/70">Sanoja opittu</div>
					</div>
					<div class="bg-base-200 rounded-lg p-3 text-center">
						<div class="text-2xl font-bold text-success">{stats.strongWords}</div>
						<div class="text-xs text-base-content/70">Vahvoja (≥80%)</div>
					</div>
					<div class="bg-base-200 rounded-lg p-3 text-center">
						<div class="text-2xl font-bold text-error">{stats.weakWords}</div>
						<div class="text-xs text-base-content/70">Heikkoja (&lt;40%)</div>
					</div>
				</div>

				<!-- Category List -->
				<div class="space-y-2">
					{#each [1, 2, 3, 4, 5] as tier}
						{@const tierCategories = categoryKnowledgeList.filter(c => c.tier === tier)}
						{#if tierCategories.length > 0}
							<div class="border-l-4 pl-3 mb-3" 
								class:border-red-500={tier === 1}
								class:border-yellow-500={tier === 2}
								class:border-green-500={tier === 3}
								class:border-blue-500={tier === 4}
								class:border-purple-500={tier === 5}
							>
								<div class="text-xs text-base-content/50 mb-1">
									{tier === 1 ? 'Perusta' : tier === 2 ? 'Perusasiat' : tier === 3 ? 'Arkiaiheet' : tier === 4 ? 'Käytäntö' : 'Erikois'}
								</div>
								{#each tierCategories as cat}
									{@const score = getScoreForDirection(cat)}
									<div class="bg-base-200 rounded-lg p-3 mb-2">
										<div class="flex items-center justify-between mb-1">
											<div class="flex items-center gap-2">
												<span class="font-medium">{cat.name}</span>
												<span class="text-xs text-base-content/50">
													({cat.practicedWords}/{cat.totalWords})
												</span>
											</div>
											<div class="flex items-center gap-2">
												<span class="text-sm font-bold {getScoreColor(score)}">
													{score > 0 ? `${Math.round(score)}%` : '—'}
												</span>
											</div>
										</div>
										<progress 
											class="progress w-full h-2 {getProgressColor(score)}" 
											value={score} 
											max="100"
										></progress>
										<div class="text-xs text-base-content/50 mt-1">
											{formatLastPracticed(cat.lastPracticed)}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					{/each}
				</div>

				<!-- Export/Import/Reset Section -->
				<div class="border-t border-base-300 mt-6 pt-4">
					<h3 class="text-sm font-bold mb-3 text-base-content/70">Tietojen hallinta</h3>
					<div class="flex flex-wrap gap-2">
						<button class="btn btn-sm btn-outline gap-2" on:click={handleExport}>
							<span>📤</span>
							<span>Vie tiedot</span>
						</button>
						<button class="btn btn-sm btn-outline gap-2" on:click={handleImport}>
							<span>📥</span>
							<span>Tuo tiedot</span>
						</button>
						<button class="btn btn-sm btn-outline btn-error gap-2" on:click={handleReset}>
							<span>🗑️</span>
							<span>Nollaa</span>
						</button>
					</div>
				</div>
			</div>

			<!-- Footer -->
			<div class="p-4 border-t border-base-300 flex-shrink-0">
				<button class="btn btn-primary w-full" on:click={close}>
					Sulje
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Export Modal -->
{#if showExportModal}
	<div 
		class="fixed inset-0 bg-neutral/70 z-[60]" 
		on:click={() => showExportModal = false}
		on:keydown={(e) => e.key === 'Escape' && (showExportModal = false)}
		role="button"
		tabindex="0"
	>
		<div 
			class="bg-base-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6 rounded-lg shadow-xl"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<h3 class="text-lg font-bold mb-4">📤 Vie osaamistiedot</h3>
			<textarea 
				class="textarea textarea-bordered w-full h-40 font-mono text-xs" 
				readonly
				value={exportData}
			></textarea>
			<div class="flex gap-2 mt-4">
				<button class="btn btn-primary flex-1" on:click={downloadExport}>
					💾 Lataa tiedosto
				</button>
				<button class="btn btn-outline flex-1" on:click={copyExportToClipboard}>
					📋 Kopioi
				</button>
			</div>
			<button class="btn btn-ghost w-full mt-2" on:click={() => showExportModal = false}>
				Sulje
			</button>
		</div>
	</div>
{/if}

<!-- Import Modal -->
{#if showImportModal}
	<div 
		class="fixed inset-0 bg-neutral/70 z-[60]" 
		on:click={() => showImportModal = false}
		on:keydown={(e) => e.key === 'Escape' && (showImportModal = false)}
		role="button"
		tabindex="0"
	>
		<div 
			class="bg-base-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6 rounded-lg shadow-xl"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<h3 class="text-lg font-bold mb-4">📥 Tuo osaamistiedot</h3>
			
			{#if importSuccess}
				<div class="alert alert-success mb-4">
					<span>✅ Tiedot tuotu onnistuneesti!</span>
				</div>
			{/if}
			
			{#if importError}
				<div class="alert alert-error mb-4">
					<span>❌ {importError}</span>
				</div>
			{/if}
			
			<div class="mb-4">
				<label class="label">
					<span class="label-text">Valitse tiedosto tai liitä JSON:</span>
				</label>
				<input 
					type="file" 
					accept=".json" 
					class="file-input file-input-bordered w-full mb-2"
					on:change={handleFileUpload}
				/>
			</div>
			
			<textarea 
				class="textarea textarea-bordered w-full h-32 font-mono text-xs" 
				placeholder="Liitä JSON-data tähän..."
				bind:value={importText}
			></textarea>
			
			<div class="flex gap-2 mt-4">
				<button 
					class="btn btn-primary flex-1" 
					on:click={processImport}
					disabled={!importText.trim()}
				>
					📥 Tuo tiedot
				</button>
				<button class="btn btn-ghost flex-1" on:click={() => showImportModal = false}>
					Peruuta
				</button>
			</div>
			
			<div class="text-xs text-base-content/50 mt-4">
				⚠️ Tuodut tiedot yhdistetään olemassa oleviin tietoihin.
			</div>
		</div>
	</div>
{/if}
