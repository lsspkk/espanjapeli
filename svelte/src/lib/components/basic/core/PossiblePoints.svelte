<script lang="ts">
	export let triesRemaining: number;
</script>

<div class="text-3xl md:text-4xl font-bold mb-4 md:mb-6"
	class:text-success={triesRemaining === 3}
	class:text-warning={triesRemaining === 2}
	class:text-error={triesRemaining === 1}
>
	{#if triesRemaining === 3}
		+10
	{:else if triesRemaining === 2}
		+3
	{:else if triesRemaining === 1}
		+1
	{:else}
		0
	{/if}
</div>
