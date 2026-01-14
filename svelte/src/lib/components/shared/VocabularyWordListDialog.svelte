<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Word } from '$lib/data/words';
	import { X } from 'lucide-svelte';

	export let isOpen = false;
	export let title = 'Sanat';
	export let words: Word[] = [];
	export let showFrequency = false;

	const dispatch = createEventDispatcher<{ close: void }>();

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
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		<div 
			class="bg-base-100 w-full max-w-2xl max-h-[80vh] rounded-lg shadow-xl overflow-hidden flex flex-col"
			on:click|stopPropagation
			on:keydown|stopPropagation
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
					on:click={close}
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
					<div class="space-y-2">
						{#each words as word, index}
							<div class="bg-base-200 rounded-lg p-3 hover:bg-base-300 transition-colors">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1">
										<div class="font-semibold text-lg">
											{word.spanish}
										</div>
										<div class="text-sm text-base-content/70">
											{word.finnish}
										</div>
										{#if word.english}
											<div class="text-xs text-base-content/50 mt-1">
												{word.english}
											</div>
										{/if}
									</div>
									{#if showFrequency && word.frequency}
										<div class="flex flex-col items-end gap-1">
											<div class="badge badge-sm badge-primary">
												#{word.frequency.rank}
											</div>
											<div class="badge badge-sm badge-outline">
												{word.frequency.cefrLevel}
											</div>
										</div>
									{/if}
								</div>
							</div>
						{/each}
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
						on:click={close}
					>
						Sulje
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
