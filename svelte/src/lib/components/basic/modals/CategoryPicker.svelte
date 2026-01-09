<script lang="ts">
	export let isOpen: boolean = false;
	export let selectedCategory: string = 'all';
	export let categories: Array<{ key: string; name: string; tier: number }> = [];
	export let onSelect: (key: string) => void = () => {};
	export let onClose: () => void = () => {};

	function handleSelect(key: string) {
		onSelect(key);
	}

	function handleClose() {
		onClose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
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
			class="bg-base-100 w-full h-full sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:shadow-xl overflow-hidden"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="bg-primary text-primary-content px-3 py-2 flex items-center justify-between">
				<h2 class="text-base font-bold">Valitse kategoria</h2>
				<button class="btn btn-ghost btn-xs btn-circle text-primary-content" on:click={handleClose}>✕</button>
			</div>

			<div class="overflow-y-auto h-[calc(100vh-44px)] sm:h-auto sm:max-h-[calc(90vh-44px)] p-2">
				<button
					class="w-full text-left px-2 py-1.5 rounded mb-2 flex items-center gap-2 transition-colors text-sm"
					class:bg-primary={selectedCategory === 'all'}
					class:text-primary-content={selectedCategory === 'all'}
					class:bg-base-200={selectedCategory !== 'all'}
					class:hover:bg-base-300={selectedCategory !== 'all'}
					on:click={() => handleSelect('all')}
				>
					<span>📚</span>
					<span class="font-medium">Kaikki sanat</span>
				</button>

				<!-- Tier 1: Foundation -->
				<div class="border-l-[3px] border-red-500 pl-2 mb-2">
					<div class="text-[10px] text-base-content/50 mb-0.5">Perusta</div>
					<div class="grid grid-cols-2 gap-1">
						{#each categories.filter(c => c.tier === 1) as cat}
							<button
								class="text-left px-2 py-1 rounded text-sm transition-colors"
								class:bg-primary={selectedCategory === cat.key}
								class:text-primary-content={selectedCategory === cat.key}
								class:bg-base-200={selectedCategory !== cat.key}
								class:hover:bg-base-300={selectedCategory !== cat.key}
								on:click={() => handleSelect(cat.key)}
							>
								{cat.name}
							</button>
						{/each}
					</div>
				</div>

				<!-- Tier 2: Concrete Basics -->
				<div class="border-l-[3px] border-yellow-500 pl-2 mb-2">
					<div class="text-[10px] text-base-content/50 mb-0.5">Perusasiat</div>
					<div class="grid grid-cols-2 gap-1">
						{#each categories.filter(c => c.tier === 2) as cat}
							<button
								class="text-left px-2 py-1 rounded text-sm transition-colors"
								class:bg-primary={selectedCategory === cat.key}
								class:text-primary-content={selectedCategory === cat.key}
								class:bg-base-200={selectedCategory !== cat.key}
								class:hover:bg-base-300={selectedCategory !== cat.key}
								on:click={() => handleSelect(cat.key)}
							>
								{cat.name}
							</button>
						{/each}
					</div>
				</div>

				<!-- Tier 3: Everyday Topics -->
				<div class="border-l-[3px] border-green-500 pl-2 mb-2">
					<div class="text-[10px] text-base-content/50 mb-0.5">Arkiaiheet</div>
					<div class="grid grid-cols-2 gap-1">
						{#each categories.filter(c => c.tier === 3) as cat}
							<button
								class="text-left px-2 py-1 rounded text-sm transition-colors"
								class:bg-primary={selectedCategory === cat.key}
								class:text-primary-content={selectedCategory === cat.key}
								class:bg-base-200={selectedCategory !== cat.key}
								class:hover:bg-base-300={selectedCategory !== cat.key}
								on:click={() => handleSelect(cat.key)}
							>
								{cat.name}
							</button>
						{/each}
					</div>
				</div>

				<!-- Tier 4: Practical Skills -->
				<div class="border-l-[3px] border-blue-500 pl-2 mb-2">
					<div class="text-[10px] text-base-content/50 mb-0.5">Käytäntö</div>
					<div class="grid grid-cols-2 gap-1">
						{#each categories.filter(c => c.tier === 4) as cat}
							<button
								class="text-left px-2 py-1 rounded text-sm transition-colors"
								class:bg-primary={selectedCategory === cat.key}
								class:text-primary-content={selectedCategory === cat.key}
								class:bg-base-200={selectedCategory !== cat.key}
								class:hover:bg-base-300={selectedCategory !== cat.key}
								on:click={() => handleSelect(cat.key)}
							>
								{cat.name}
							</button>
						{/each}
					</div>
				</div>

				<!-- Tier 5: Specialized -->
				<div class="border-l-[3px] border-purple-500 pl-2 mb-2">
					<div class="text-[10px] text-base-content/50 mb-0.5">Erikois</div>
					<div class="grid grid-cols-2 gap-1">
						{#each categories.filter(c => c.tier === 5) as cat}
							<button
								class="text-left px-2 py-1 rounded text-sm transition-colors"
								class:bg-primary={selectedCategory === cat.key}
								class:text-primary-content={selectedCategory === cat.key}
								class:bg-base-200={selectedCategory !== cat.key}
								class:hover:bg-base-300={selectedCategory !== cat.key}
								on:click={() => handleSelect(cat.key)}
							>
								{cat.name}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
