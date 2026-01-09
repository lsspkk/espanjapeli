<script lang="ts">
	export let options: Array<{ id: string; text: string }>;
	export let disabledIds: Set<string>;
	export let onSelect: (id: string, event: MouseEvent) => void;
	export let disabled: boolean;
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 flex-1 content-center">
	{#each options as option}
		<button
			class="btn h-auto min-h-[2.5rem] md:min-h-[3.5rem] py-2 md:py-3 px-3 md:px-4 text-sm md:text-base lg:text-lg font-medium normal-case whitespace-normal break-words leading-tight transition-all"
			class:btn-outline={!disabledIds.has(option.id)}
			class:btn-disabled={disabledIds.has(option.id)}
			class:btn-error={disabledIds.has(option.id)}
			class:opacity-40={disabledIds.has(option.id)}
			disabled={disabledIds.has(option.id) || disabled}
			on:click={(e) => onSelect(option.id, e)}
		>
			{option.text}
		</button>
	{/each}
</div>
