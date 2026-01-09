<script lang="ts">
	interface GameQuestion {
		spanish: string;
		finnish?: string;
	}

	export let isOpen: boolean;
	export let upcomingPhrases: GameQuestion[];
	export let previousGames: GameQuestion[][];
	export let onClose: () => void;
	export let onSpeak: (spanish: string, finnish: string) => void;
</script>

{#if isOpen}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 sm:flex sm:items-center sm:justify-center sm:p-2" onclick={onClose} role="button" tabindex="0" onkeydown={(e) => e.key === 'Escape' && onClose()}>
		<div class="bg-white sm:rounded-2xl shadow-2xl sm:max-w-2xl w-full h-full sm:h-auto sm:max-h-[95vh] overflow-hidden" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" onkeydown={(e) => e.stopPropagation()}>
			<!-- Modal Header -->
			<div class="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-3 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-2xl">📖</span>
					<h2 class="text-xl font-bold">Sanakirja</h2>
				</div>
				<button class="btn btn-circle btn-sm btn-ghost text-white" onclick={onClose}>
					✕
				</button>
			</div>

			<!-- Modal Content -->
			<div class="overflow-y-auto h-[calc(100vh-60px)] sm:h-auto sm:max-h-[calc(95vh-60px)] p-2">
				<!-- Upcoming Game Phrases -->
				<div class="space-y-1 mb-4">
					{#each upcomingPhrases as phrase}
						<div class="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-2 border border-pink-200">
							<div class="flex items-center gap-2">
								<!-- Phrase content -->
								<div class="flex-1 min-w-0">
									<div class="text-sm font-bold text-gray-700 truncate">
										{phrase.spanish}
									</div>
									<div class="text-xs text-base-content/70 truncate">
										{phrase.finnish || ''}
									</div>
								</div>

								<!-- TTS Button -->
								<button 
									class="btn btn-circle btn-xs bg-white hover:bg-pink-100 border border-pink-300 flex-shrink-0"
									onclick={() => onSpeak(phrase.spanish, phrase.finnish || '')}
									title="Kuuntele"
								>
									<span class="text-sm">🔊</span>
								</button>
							</div>
						</div>
					{/each}
				</div>

				<!-- Previous Games -->
				{#each previousGames as gamePhrases, gameIndex}
					<!-- Separator -->
					<div class="bg-base-200 rounded-lg p-2 mb-2 mt-4">
						<p class="text-xs font-semibold text-center text-base-content/70">
							{gameIndex === 0 ? 'Edellisen pelin sanat' : `${gameIndex + 1}. viimeisen pelin sanat`}
						</p>
					</div>

					<!-- Game Phrases -->
					<div class="space-y-1 mb-4">
						{#each gamePhrases as phrase}
							<div class="bg-base-100 rounded-lg p-2 border border-base-300">
								<div class="flex items-center gap-2">
									<!-- Phrase content -->
									<div class="flex-1 min-w-0">
										<div class="text-sm font-bold text-gray-700 truncate">
											{phrase.spanish}
										</div>
										<div class="text-xs text-base-content/60 truncate">
											{phrase.finnish || ''}
										</div>
									</div>

									<!-- TTS Button -->
									<button 
										class="btn btn-circle btn-xs bg-white hover:bg-base-200 border border-base-300 flex-shrink-0"
										onclick={() => onSpeak(phrase.spanish, phrase.finnish || '')}
										title="Kuuntele"
									>
										<span class="text-sm">🔊</span>
									</button>
								</div>
							</div>
						{/each}
					</div>
				{/each}

				<!-- Close button at bottom -->
				<div class="mt-4 mb-2 text-center">
					<button class="btn btn-primary btn-sm btn-wide" onclick={onClose}>
						Sulje
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
