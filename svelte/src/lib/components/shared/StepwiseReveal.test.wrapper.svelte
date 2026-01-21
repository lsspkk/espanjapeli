<script lang="ts">
	import StepwiseReveal from './StepwiseReveal.svelte';

	interface Props {
		delaySeconds?: number;
		onReveal?: () => void;
	}

	let { delaySeconds = 3, onReveal }: Props = $props();
</script>

<StepwiseReveal {delaySeconds} {onReveal}>
	{#snippet children()}
		<div>Question content</div>
	{/snippet}
	{#snippet answers()}
		<div>Answer content</div>
	{/snippet}
</StepwiseReveal>
