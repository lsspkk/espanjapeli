<script lang="ts">
	export let remaining: number;
	export let max: number = 3;
</script>

<div class="flex gap-1">
	{#each Array(max) as _, i}
		<div 
			class="w-3 h-3 md:w-4 md:h-4 rounded-full transition-all"
			class:bg-success={i < remaining}
			class:bg-base-300={i >= remaining}
		></div>
	{/each}
</div>
