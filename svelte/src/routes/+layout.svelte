<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { theme } from '$lib/stores/theme';

	let { children } = $props();
	
	// Subscribe to theme changes
	let currentTheme = $state('light');
	$effect(() => {
		currentTheme = $theme;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Apply selected DaisyUI theme -->
<div data-theme={currentTheme} class="min-h-screen">
	{@render children()}
</div>
