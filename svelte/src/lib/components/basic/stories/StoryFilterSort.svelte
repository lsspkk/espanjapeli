<script lang="ts">
	import { Filter, ArrowUpDown } from 'lucide-svelte';

	interface Props {
		filterDifficulty?: string;
		sortBy?: 'alphabet' | 'difficulty';
		onFilterChange?: (difficulty: string) => void;
		onSortChange?: (sortBy: 'alphabet' | 'difficulty') => void;
	}

	let {
		filterDifficulty = 'all',
		sortBy = 'alphabet',
		onFilterChange,
		onSortChange
	}: Props = $props();

	const difficultyOptions = [
		{ value: 'all', label: 'Kaikki tasot' },
		{ value: 'A1', label: 'A1 - Alkeet' },
		{ value: 'A2', label: 'A2 - Perustaso' },
		{ value: 'B1', label: 'B1 - Keskitaso' }
	];

	const sortOptions = [
		{ value: 'alphabet', label: 'Aakkosjärjestys' },
		{ value: 'difficulty', label: 'Vaikeustaso' }
	];

	function handleFilterChange(value: string) {
		if (onFilterChange) {
			onFilterChange(value);
		}
	}

	function handleSortChange(value: 'alphabet' | 'difficulty') {
		if (onSortChange) {
			onSortChange(value);
		}
	}
</script>

<!-- Mobile: Dropdown selects -->
<div class="flex flex-col gap-3 lg:hidden">
	<div class="form-control">
		<label class="label">
			<span class="label-text flex items-center gap-2">
				<Filter size={16} />
				Suodata tasolla
			</span>
		</label>
		<select
			class="select select-bordered w-full"
			value={filterDifficulty}
			onchange={(e) => handleFilterChange(e.currentTarget.value)}
		>
			{#each difficultyOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</div>

	<div class="form-control">
		<label class="label">
			<span class="label-text flex items-center gap-2">
				<ArrowUpDown size={16} />
				Järjestä
			</span>
		</label>
		<select
			class="select select-bordered w-full"
			value={sortBy}
			onchange={(e) => handleSortChange(e.currentTarget.value as 'alphabet' | 'difficulty')}
		>
			{#each sortOptions as option}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
	</div>
</div>

<!-- Desktop: Button groups -->
<div class="hidden lg:flex flex-wrap gap-4 items-center">
	<!-- Filter buttons -->
	<div class="flex items-center gap-2">
		<span class="text-sm font-medium flex items-center gap-2">
			<Filter size={16} />
			Suodata:
		</span>
		<div class="join">
			{#each difficultyOptions as option}
				<button
					class="btn btn-sm join-item"
					class:btn-primary={filterDifficulty === option.value}
					class:btn-outline={filterDifficulty !== option.value}
					onclick={() => handleFilterChange(option.value)}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Sort buttons -->
	<div class="flex items-center gap-2">
		<span class="text-sm font-medium flex items-center gap-2">
			<ArrowUpDown size={16} />
			Järjestä:
		</span>
		<div class="join">
			{#each sortOptions as option}
				<button
					class="btn btn-sm join-item"
					class:btn-primary={sortBy === option.value}
					class:btn-outline={sortBy !== option.value}
					onclick={() => handleSortChange(option.value as 'alphabet' | 'difficulty')}
				>
					{option.label}
				</button>
			{/each}
		</div>
	</div>
</div>
