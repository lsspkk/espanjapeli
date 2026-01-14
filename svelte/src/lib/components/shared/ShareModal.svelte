<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { 
		generateProgressReport, 
		shareProgressReport, 
		copyToClipboard,
		isWebShareAvailable,
		type ProgressReport,
		type ReportLanguage 
	} from '$lib/services/shareService';

	export let isOpen = false;

	const dispatch = createEventDispatcher<{ close: void }>();

	let report: ProgressReport | null = null;
	let loading = true;
	let selectedLanguage: ReportLanguage = 'fi';
	let shareStatus: 'idle' | 'sharing' | 'copied' | 'failed' = 'idle';
	let showWebShareButton = false;

	async function loadReport() {
		loading = true;
		try {
			report = await generateProgressReport(selectedLanguage);
		} catch (error) {
			console.error('Failed to generate report:', error);
		} finally {
			loading = false;
		}
	}

	async function handleShare() {
		if (!report) return;
		
		shareStatus = 'sharing';
		const result = await shareProgressReport(report);
		
		if (result === 'shared') {
			shareStatus = 'copied';
			setTimeout(() => {
				close();
			}, 1000);
		} else if (result === 'copied') {
			shareStatus = 'copied';
			setTimeout(() => {
				shareStatus = 'idle';
			}, 2000);
		} else {
			shareStatus = 'failed';
			setTimeout(() => {
				shareStatus = 'idle';
			}, 2000);
		}
	}

	async function handleCopy() {
		if (!report) return;
		
		const success = await copyToClipboard(report.text);
		shareStatus = success ? 'copied' : 'failed';
		
		setTimeout(() => {
			shareStatus = 'idle';
		}, 2000);
	}

	function handleLanguageChange(lang: ReportLanguage) {
		selectedLanguage = lang;
		loadReport();
	}

	function close() {
		dispatch('close');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}

	onMount(() => {
		showWebShareButton = isWebShareAvailable();
		if (isOpen) {
			loadReport();
		}
	});

	$: if (isOpen && !report) {
		loadReport();
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
			class="bg-base-100 w-full h-full sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:shadow-xl overflow-hidden flex flex-col"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<!-- Header -->
			<div class="bg-primary text-primary-content p-4 flex items-center justify-between flex-shrink-0">
				<h2 class="text-xl font-bold flex items-center gap-2">
					<span>📤</span>
					<span>{selectedLanguage === 'fi' ? 'Jaa edistymisesi' : 'Share Your Progress'}</span>
				</h2>
				<button class="btn btn-ghost btn-sm btn-circle text-primary-content" on:click={close}>✕</button>
			</div>

			<!-- Content -->
			<div class="overflow-y-auto flex-1 p-4">
				<!-- Language Selection -->
				<div class="mb-4">
					<div class="flex items-center justify-center gap-2 p-2 bg-base-200 rounded-lg">
						<button 
							class="btn btn-sm gap-2 flex-1"
							class:btn-primary={selectedLanguage === 'fi'}
							class:btn-ghost={selectedLanguage !== 'fi'}
							on:click={() => handleLanguageChange('fi')}
							disabled={loading}
						>
							<span class="text-lg">🇫🇮</span>
							<span>Suomi</span>
						</button>
						<button 
							class="btn btn-sm gap-2 flex-1"
							class:btn-primary={selectedLanguage === 'en'}
							class:btn-ghost={selectedLanguage !== 'en'}
							on:click={() => handleLanguageChange('en')}
							disabled={loading}
						>
							<span class="text-lg">🇬🇧</span>
							<span>English</span>
						</button>
					</div>
				</div>

				{#if loading}
					<div class="flex items-center justify-center py-12">
						<span class="loading loading-spinner loading-lg text-primary"></span>
					</div>
				{:else if report}
					<!-- Report Preview -->
					<div class="bg-base-200 rounded-lg p-4 mb-4">
						<div class="text-sm whitespace-pre-wrap font-mono">{report.text}</div>
					</div>

					<!-- Statistics Summary -->
					<div class="grid grid-cols-2 gap-2 mb-4">
						<div class="bg-base-200 rounded-lg p-3 text-center">
							<div class="text-2xl font-bold text-primary">{report.stats.wordsKnown}</div>
							<div class="text-xs text-base-content/70">
								{selectedLanguage === 'fi' ? 'Sanoja opittu' : 'Words learned'}
							</div>
						</div>
						<div class="bg-base-200 rounded-lg p-3 text-center">
							<div class="text-2xl font-bold text-secondary">{report.stats.estimatedLevel}</div>
							<div class="text-xs text-base-content/70">
								{selectedLanguage === 'fi' ? 'Taso' : 'Level'}
							</div>
						</div>
						<div class="bg-base-200 rounded-lg p-3 text-center">
							<div class="text-2xl font-bold text-success">{report.stats.topNProgress.top100.percentage}%</div>
							<div class="text-xs text-base-content/70">Top 100</div>
						</div>
						<div class="bg-base-200 rounded-lg p-3 text-center">
							<div class="text-2xl font-bold text-warning">{report.stats.totalGamesPlayed}</div>
							<div class="text-xs text-base-content/70">
								{selectedLanguage === 'fi' ? 'Pelejä' : 'Games'}
							</div>
						</div>
					</div>

					<!-- Status Messages -->
					{#if shareStatus === 'copied'}
						<div class="alert alert-success mb-4">
							<span>✅ {selectedLanguage === 'fi' ? 'Kopioitu leikepöydälle!' : 'Copied to clipboard!'}</span>
						</div>
					{:else if shareStatus === 'failed'}
						<div class="alert alert-error mb-4">
							<span>❌ {selectedLanguage === 'fi' ? 'Jakaminen epäonnistui' : 'Sharing failed'}</span>
						</div>
					{/if}

					<!-- Info Text -->
					<div class="text-sm text-base-content/70 mb-4">
						{#if selectedLanguage === 'fi'}
							<p>Jaa oppimisedistymisesi ystävillesi tai tallenna se myöhempää tarkastelua varten.</p>
						{:else}
							<p>Share your learning progress with friends or save it for later review.</p>
						{/if}
					</div>
				{:else}
					<div class="alert alert-error">
						<span>❌ {selectedLanguage === 'fi' ? 'Raportin luominen epäonnistui' : 'Failed to generate report'}</span>
					</div>
				{/if}
			</div>

			<!-- Footer Actions -->
			<div class="p-4 border-t border-base-300 flex-shrink-0">
				<div class="flex flex-col gap-2">
					{#if showWebShareButton}
						<button 
							class="btn btn-primary w-full gap-2" 
							on:click={handleShare}
							disabled={loading || !report || shareStatus === 'sharing'}
						>
							{#if shareStatus === 'sharing'}
								<span class="loading loading-spinner loading-sm"></span>
							{:else}
								<span>📤</span>
							{/if}
							<span>{selectedLanguage === 'fi' ? 'Jaa' : 'Share'}</span>
						</button>
					{/if}
					
					<button 
						class="btn btn-outline w-full gap-2" 
						on:click={handleCopy}
						disabled={loading || !report}
					>
						<span>📋</span>
						<span>{selectedLanguage === 'fi' ? 'Kopioi teksti' : 'Copy text'}</span>
					</button>
					
					<button class="btn btn-ghost w-full" on:click={close}>
						{selectedLanguage === 'fi' ? 'Sulje' : 'Close'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
