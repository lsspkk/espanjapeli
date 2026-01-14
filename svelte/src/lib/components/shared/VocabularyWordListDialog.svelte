<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Word } from '$lib/data/words';
	import { X, ArrowUpAZ, ArrowDownZA } from 'lucide-svelte';

	interface Props {
		isOpen?: boolean;
		title?: string;
		words?: Word[];
		showFrequency?: boolean;
	}

	let { isOpen = false, title = 'Sanat', words = [], showFrequency = false }: Props = $props();

	const dispatch = createEventDispatcher<{ close: void }>();

	type SortColumn = 'spanish' | 'finnish' | null;
	type SortDirection = 'asc' | 'desc';

	let sortColumn = $state<SortColumn>(null);
	let sortDirection = $state<SortDirection>('asc');

	let sortedWords = $derived.by(() => {
		if (!sortColumn) return words;

		return [...words].sort((a, b) => {
			const aValue = a[sortColumn]?.toLowerCase() || '';
			const bValue = b[sortColumn]?.toLowerCase() || '';
			
			if (sortDirection === 'asc') {
				return aValue.localeCompare(bValue, 'fi');
			} else {
				return bValue.localeCompare(aValue, 'fi');
			}
		});
	});

	function toggleSort(column: 'spanish' | 'finnish') {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	function close() {
		dispatch('close');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}

	function handleBackdropClick() {
		close();
	}
</script>

{#if isOpen}
	<div 
		class="fixed inset-0 bg-neutral/50 z-50 flex items-center justify-center p-4" 
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		<div 
			class="bg-base-100 w-full max-w-2xl max-h-[80vh] rounded-lg shadow-xl overflow-hidden flex flex-col"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="dialog-title"
			tabindex="-1"
		>
			<!-- Header -->
			<div class="bg-primary text-primary-content p-4 flex items-center justify-between">
				<h2 id="dialog-title" class="text-xl font-bold">{title}</h2>
				<button 
					class="btn btn-ghost btn-sm btn-circle"
					onclick={close}
					aria-label="Sulje"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if words.length === 0}
					<div class="text-center py-12 text-base-content/50">
						<p>Ei sanoja näytettäväksi</p>
					</div>
				{:else}
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th class="w-1/2">
										<div class="flex items-center justify-between">
											<span>Espanja</span>
											<button 
												class="btn btn-ghost btn-xs btn-circle"
											onclick={() => toggleSort('spanish')}
												aria-label={sortColumn === 'spanish' && sortDirection === 'desc' ? 'Järjestä A-Z' : 'Järjestä Z-A'}
											>
												{#if sortColumn === 'spanish'}
													{#if sortDirection === 'asc'}
														<ArrowUpAZ class="h-4 w-4" />
													{:else}
														<ArrowDownZA class="h-4 w-4" />
													{/if}
												{:else}
													<ArrowUpAZ class="h-4 w-4 opacity-30" />
												{/if}
											</button>
										</div>
									</th>
									<th class="w-1/2">
										<div class="flex items-center justify-between">
											<span>Suomi</span>
											<button 
												class="btn btn-ghost btn-xs btn-circle"
											onclick={() => toggleSort('finnish')}
												aria-label={sortColumn === 'finnish' && sortDirection === 'desc' ? 'Järjestä A-Z' : 'Järjestä Z-A'}
											>
												{#if sortColumn === 'finnish'}
													{#if sortDirection === 'asc'}
														<ArrowUpAZ class="h-4 w-4" />
													{:else}
														<ArrowDownZA class="h-4 w-4" />
													{/if}
												{:else}
													<ArrowUpAZ class="h-4 w-4 opacity-30" />
												{/if}
											</button>
										</div>
									</th>
									{#if showFrequency}
										<th class="w-20">Taso</th>
									{/if}
								</tr>
							</thead>
							<tbody>
								{#each sortedWords as word}
									<tr class="hover">
										<td>
											{word.spanish}
											{#if word.english}
												<span class="text-xs text-base-content/50 ml-2">({word.english})</span>
											{/if}
										</td>
										<td>{word.finnish}</td>
										{#if showFrequency}
											<td>
												{#if word.frequency}
													<div class="flex flex-col gap-1">
														<div class="badge badge-xs badge-primary">#{word.frequency.rank}</div>
														<div class="badge badge-xs badge-outline">{word.frequency.cefrLevel}</div>
													</div>
												{/if}
											</td>
										{/if}
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="p-4 border-t border-base-300 bg-base-200">
				<div class="flex items-center justify-between">
					<span class="text-sm text-base-content/70">
						Yhteensä: {words.length} sanaa
					</span>
					<button 
						class="btn btn-primary btn-sm" 
						onclick={close}
					>
						Sulje
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
