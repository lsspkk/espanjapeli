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

	export function reset() {
		if (timerId !== null) {
			clearTimeout(timerId);
		}
		revealed = false;
		if (delaySeconds === 0) {
			revealed = true;
			onReveal?.();
		} else {
			timerId = window.setTimeout(() => {
				revealed = true;
				onReveal?.();
			}, delaySeconds * 1000);
		}
	}
</script>

<div class="question-content contents">
	{@render children?.()}
</div>

<div class="answers-content contents" style="opacity: {revealed ? 1 : 0}; transition: opacity 300ms ease-in-out;">
	{@render answers?.()}
</div>
