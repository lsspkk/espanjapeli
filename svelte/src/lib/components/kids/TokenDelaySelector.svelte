<script lang="ts">
	interface Props {
		value: number; // 0-3 seconds
		onChange: (value: number) => void;
		theme?: string; // matches TokenDelayAnimation themes
	}

	let { value, onChange, theme = 'dots' }: Props = $props();

	// Theme definitions matching TokenDelayAnimation
	const themes = {
		dots: {
			color: 'bg-primary',
			shape: 'rounded-full',
			size: 'w-12 h-12'
		},
		eggs: {
			color: 'bg-gradient-to-br from-pink-200 to-pink-400',
			shape: 'rounded-full',
			size: 'w-14 h-16'
		},
		puddles: {
			color: 'bg-gradient-to-br from-amber-600 to-amber-800',
			shape: 'rounded-full',
			size: 'w-16 h-10'
		},
		raindrops: {
			color: 'bg-gradient-to-b from-blue-300 to-blue-500',
			shape: 'rounded-full',
			size: 'w-10 h-14'
		},
		suns: {
			color: 'bg-gradient-to-br from-yellow-300 to-orange-400',
			shape: 'rounded-full',
			size: 'w-14 h-14'
		}
	};

	const currentTheme = $derived(themes[theme as keyof typeof themes] || themes.dots);

	function handleClick(index: number) {
		// Toggle: if clicking on current value, set to that value
		// If clicking beyond current, increase to that value
		// If clicking before current, decrease to that value
		const newValue = index + 1;
		
		// If clicking the same position as current value, decrease by 1
		if (newValue === value) {
			onChange(Math.max(0, value - 1));
		} else {
			onChange(Math.min(3, newValue));
		}
	}
</script>

<div class="flex items-center justify-center gap-3 p-4">
	{#each Array(4) as _, index}
		<button
			type="button"
			class="token-slot transition-all duration-200 hover:scale-110 active:scale-95
				{index < value ? 'opacity-100' : 'opacity-30'}"
			onclick={() => handleClick(index)}
			aria-label="{index + 1} second{index !== 0 ? 's' : ''}"
		>
			{#if index < value}
				<div 
					class="{currentTheme.size} {currentTheme.color} {currentTheme.shape} 
						shadow-md transition-all duration-200"
				></div>
			{:else}
				<div 
					class="{currentTheme.size} border-2 border-dashed border-gray-300 
						{currentTheme.shape} transition-all duration-200"
				></div>
			{/if}
		</button>
	{/each}
</div>

<style>
	.token-slot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}
</style>
