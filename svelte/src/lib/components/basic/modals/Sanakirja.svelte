<script lang="ts">
	import type { Word } from '$lib/data/words';

	export let isOpen: boolean = false;
	export let upcomingWords: Word[] = [];
	export let previousGames: Word[][] = [];
	export let onClose: () => void = () => {};
	export let onSpeak: (spanish: string, finnish: string) => void = () => {};

	function handleClose() {
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	function handleSpeak(spanish: string, finnish: string) {
		onSpeak(spanish, finnish);
	}
</script>

{#if isOpen}
	<div 
		class="fixed inset-0 bg-neutral/50 z-50" 
		on:click={handleClose}
		on:keydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		<div 
			class="bg-base-100 w-full h-full sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:shadow-xl overflow-hidden"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
		<div class="bg-primary text-primary-content p-4 flex items-center justify-between">
			<h2 class="text-xl font-bold">📖 Sanakirja</h2>
			<div class="flex items-center gap-2">
				<slot name="header-actions" />
				<button class="btn btn-ghost btn-sm btn-circle text-primary-content" on:click={handleClose}>✕</button>
			</div>
		</div>

			<div class="overflow-y-auto h-[calc(100vh-64px)] sm:h-auto sm:max-h-[calc(90vh-64px)] p-4">
				<div class="bg-secondary/20 border border-secondary/30 rounded p-2 mb-3">
					<p class="text-sm font-medium text-center text-secondary">
						Seuraavan pelin sanat ({upcomingWords.length})
					</p>
				</div>

				{#if upcomingWords.length > 0}
					<div class="space-y-1 mb-4">
						{#each upcomingWords as word}
							<div class="flex items-center gap-2 p-2 bg-base-200 hover:bg-base-300 rounded transition-colors">
								<span class="font-bold text-primary w-1/2 truncate">{word.spanish}</span>
								<span class="text-base-content/70 w-1/2 truncate">{word.finnish}</span>
								<button
									class="btn btn-ghost btn-xs btn-circle flex-shrink-0"
									on:click={() => handleSpeak(word.spanish, word.finnish)}
									title="Kuuntele"
								>
									🔊
								</button>
							</div>
						{/each}
					</div>
				{/if}

				{#each previousGames as gameWords, gameIndex}
					<div class="bg-base-300 rounded p-2 mb-3 mt-4">
						<p class="text-sm font-medium text-center text-base-content/70">
							{gameIndex === 0 ? 'Edellisen pelin sanat' : `${gameIndex + 1}. viimeisen pelin sanat`}
						</p>
					</div>

					<div class="space-y-1 mb-4">
						{#each gameWords as word}
							<div class="flex items-center gap-2 p-2 bg-base-200 hover:bg-base-300 rounded transition-colors">
								<span class="font-bold text-primary w-1/2 truncate">{word.spanish}</span>
								<span class="text-base-content/70 w-1/2 truncate">{word.finnish}</span>
								<button
									class="btn btn-ghost btn-xs btn-circle flex-shrink-0"
									on:click={() => handleSpeak(word.spanish, word.finnish)}
									title="Kuuntele"
								>
									🔊
								</button>
							</div>
						{/each}
					</div>
				{/each}

				<div class="fixed bottom-4 right-4">
					<button class="btn btn-primary btn-lg" on:click={handleClose}>
						Sulje
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
