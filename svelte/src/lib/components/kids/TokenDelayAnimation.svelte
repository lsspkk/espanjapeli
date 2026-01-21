<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		count: number; // 1-3 tokens
		theme?: string; // "dots" | "eggs" | "puddles" | "raindrops" | "suns"
		onComplete: () => void;
		layout?: 'horizontal' | 'vertical';
	}

	let { count, theme = 'dots', onComplete, layout = 'horizontal' }: Props = $props();

	let visibleTokens = $state(0);
	let intervalId: number | undefined;
	let timeoutId: number | undefined;

	// Theme definitions
	const themes = {
		dots: {
			color: 'bg-primary',
			shape: 'rounded-full',
			size: 'w-12 h-12',
			animation: 'animate-bounce'
		},
		eggs: {
			color: 'bg-gradient-to-br from-pink-200 to-pink-400',
			shape: 'rounded-full',
			size: 'w-14 h-16',
			animation: 'animate-bounce'
		},
		puddles: {
			color: 'bg-gradient-to-br from-amber-600 to-amber-800',
			shape: 'rounded-full',
			size: 'w-16 h-10',
			animation: 'animate-pulse'
		},
		raindrops: {
			color: 'bg-gradient-to-b from-blue-300 to-blue-500',
			shape: 'rounded-full',
			size: 'w-10 h-14',
			animation: 'animate-bounce'
		},
		suns: {
			color: 'bg-gradient-to-br from-yellow-300 to-orange-400',
			shape: 'rounded-full',
			size: 'w-14 h-14',
			animation: 'animate-spin-slow'
		}
	};

	const currentTheme = $derived(themes[theme as keyof typeof themes] || themes.dots);

	onMount(() => {
		// Show first token immediately
		visibleTokens = 1;

		if (count > 1) {
			// Show remaining tokens with 1 second intervals
			intervalId = window.setInterval(() => {
				visibleTokens++;
				if (visibleTokens >= count) {
					clearInterval(intervalId);
					// Wait 200ms after last token, then call onComplete
					timeoutId = window.setTimeout(() => {
						onComplete();
					}, 200);
				}
			}, 1000);
		} else {
			// If only 1 token, wait 200ms then complete
			timeoutId = window.setTimeout(() => {
				onComplete();
			}, 200);
		}
	});

	onDestroy(() => {
		if (intervalId) clearInterval(intervalId);
		if (timeoutId) clearTimeout(timeoutId);
	});
</script>

<div 
	class="flex items-center justify-center gap-4 p-4
		{layout === 'vertical' ? 'flex-col' : 'flex-row'}"
>
	{#each Array(count) as _, index}
		<div 
			class="token-container transition-all duration-300
				{index < visibleTokens ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}"
		>
			<div 
				class="{currentTheme.size} {currentTheme.color} {currentTheme.shape} 
					{index < visibleTokens ? currentTheme.animation : ''} 
					shadow-lg transition-all duration-300"
			></div>
		</div>
	{/each}
</div>

<style>
	@keyframes spin-slow {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.animate-spin-slow {
		animation: spin-slow 3s linear infinite;
	}

	.token-container {
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
</style>
