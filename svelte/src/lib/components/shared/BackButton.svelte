<script lang="ts">
	import { base } from '$app/paths';

	/**
	 * BackButton - Standard back button for all game modes
	 * - Kids mode: Shows cute home icon (🏠)
	 * - Basic mode: Shows back arrow with "Valikko" text
	 */
	
	type ButtonMode = 'kids' | 'basic';
	
	interface Props {
		/** Click handler - if not provided, navigates to home */
		onClick?: () => void;
		/** Custom href - defaults to base path */
		href?: string;
		/** Button mode - kids shows home icon, basic shows arrow + text */
		mode?: ButtonMode;
	}
	
	let {
		onClick,
		href = `${base}/`,
		mode = 'basic'
	}: Props = $props();
</script>

{#if onClick}
	<button class="btn btn-xs sm:btn-sm {mode === 'kids' ? 'btn-circle' : 'btn-ghost gap-1'}" onclick={onClick}>
		{#if mode === 'kids'}
			<span class="text-xl">🏠</span>
		{:else}
			<span class="text-base sm:text-lg">←</span>
			<span class="text-xs sm:text-sm">Valikko</span>
		{/if}
	</button>
{:else}
	<a href={href} class="btn btn-xs sm:btn-sm {mode === 'kids' ? 'btn-circle' : 'btn-ghost gap-1'}">
		{#if mode === 'kids'}
			<span class="text-xl">🏠</span>
		{:else}
			<span class="text-base sm:text-lg">←</span>
			<span class="text-xs sm:text-sm">Valikko</span>
		{/if}
	</a>
{/if}
