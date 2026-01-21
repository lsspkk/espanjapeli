<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		delaySeconds?: number;
		onReveal?: () => void;
		children?: Snippet;
		answers?: Snippet;
	}

	let { delaySeconds = 3, onReveal, children, answers }: Props = $props();

	let revealed = $state(false);
	let timerId: number | null = null;

	onMount(() => {
		if (delaySeconds === 0) {
			revealed = true;
			onReveal?.();
		} else {
			timerId = window.setTimeout(() => {
				revealed = true;
				onReveal?.();
			}, delaySeconds * 1000);
		}
	});

	onDestroy(() => {
		if (timerId !== null) {
			clearTimeout(timerId);
		}
	});
</script>

<div class="stepwise-reveal">
	<div class="question-content">
		{@render children?.()}
	</div>

	{#if revealed}
		<div class="answers-content">
			{@render answers?.()}
		</div>
	{/if}
</div>
