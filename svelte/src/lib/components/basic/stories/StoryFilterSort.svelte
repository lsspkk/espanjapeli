<script lang="ts">
	import { ArrowDownAZ, ArrowUpZA } from 'lucide-svelte';
	import { getCEFRLabel } from '$lib/services/vocabularyService';

	interface Props {
		filterDifficulty?: string;
		sortDirection?: 'asc' | 'desc';
		onFilterChange?: (difficulty: string) => void;
		onSortDirectionChange?: (direction: 'asc' | 'desc') => void;
	}

	let {
		filterDifficulty = 'all',
		sortDirection = 'asc',
		onFilterChange,
		onSortDirectionChange
	}: Props = $props();

	const difficultyOptions = [
		{ value: 'all', labelDesktop: 'Kaikki tasot', labelMobile: 'Kaikki' },
		{ value: 'A1', labelDesktop: getCEFRLabel('A1', 'full'), labelMobile: getCEFRLabel('A1', 'short') },
		{ value: 'A2', labelDesktop: getCEFRLabel('A2', 'full'), labelMobile: getCEFRLabel('A2', 'short') },
		{ value: 'B1', labelDesktop: getCEFRLabel('B1', 'full'), labelMobile: getCEFRLabel('B1', 'short') },
		{ value: 'B2', labelDesktop: getCEFRLabel('B2', 'full'), labelMobile: getCEFRLabel('B2', 'short') }
	];

	function handleFilterChange(value: string) {
		if (onFilterChange) {
			onFilterChange(value);
		}
	}

	function toggleSortDirection() {
		if (onSortDirectionChange) {
			onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc');
		}
	}
</script>

<!-- Single row layout for both mobile and desktop -->
<div class="flex items-center justify-between gap-3">
	<!-- Filter buttons (left side) -->
	<div class="btn-group">
		{#each difficultyOptions as option}
			<button
				class="btn btn-xs md:btn-sm"
				class:btn-primary={filterDifficulty === option.value}
				class:btn-ghost={filterDifficulty !== option.value}
				onclick={() => handleFilterChange(option.value)}
			>
				<span class="md:hidden">{option.labelMobile}</span>
				<span class="hidden md:inline">{option.labelDesktop}</span>
			</button>
		{/each}
	</div>

	<!-- Sort direction toggle (right side) -->
	<button
		class="btn btn-sm btn-ghost gap-1 shrink-0"
		onclick={toggleSortDirection}
		title={sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
	>
		{#if sortDirection === 'asc'}
			<ArrowDownAZ size={18} class="shrink-0" />
			<span class="hidden md:inline">A-Z</span>
		{:else}
			<ArrowUpZA size={18} class="shrink-0" />
			<span class="hidden md:inline">Z-A</span>
		{/if}
	</button>
</div>
