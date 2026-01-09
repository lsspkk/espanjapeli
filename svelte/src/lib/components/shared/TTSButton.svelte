<script lang="ts">
	import { tts } from '$lib/services/tts';

	export let text: string = '';
	export let language: 'spanish' | 'finnish' = 'spanish';
	export let size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
	export let variant: 'ghost' | 'circle' | 'plain' = 'plain';
	export let title: string = 'Kuuntele';

	function handleClick() {
		if (language === 'spanish') {
			tts.speakSpanish(text);
		} else {
			tts.speakFinnish(text);
		}
	}

	$: sizeClass = {
		xs: 'text-xs',
		sm: 'text-2xl',
		md: 'text-4xl',
		lg: 'text-5xl'
	}[size];

	$: buttonClass = (() => {
		if (variant === 'ghost') {
			return `btn btn-ghost btn-${size === 'xs' ? 'xs' : 'sm'} ${size === 'xs' || size === 'sm' ? 'btn-circle' : ''}`;
		}
		if (variant === 'circle') {
			return `btn btn-circle btn-${size} flex-shrink-0`;
		}
		return '';
	})();

	$: wrapperClass = variant === 'plain' 
		? `${sizeClass} hover:scale-110 transition-transform cursor-pointer` 
		: buttonClass;
</script>

{#if variant === 'plain'}
	<button 
		class={wrapperClass}
		on:click={handleClick}
		{title}
	>
		🔊
	</button>
{:else}
	<button
		class={wrapperClass}
		on:click={handleClick}
		{title}
	>
		🔊
	</button>
{/if}
