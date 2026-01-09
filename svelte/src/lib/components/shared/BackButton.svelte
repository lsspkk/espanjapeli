<script lang="ts">
	import { base } from '$app/paths';

	/**
	 * BackButton - Standard back button for all game modes
	 * Always shows "Takaisin" text
	 */
	
	interface Props {
		/** Click handler - if not provided, navigates to home */
		onClick?: () => void;
		/** Custom href - defaults to base path */
		href?: string;
	}
	
	let {
		onClick,
		href = `${base}/`
	}: Props = $props();
</script>

{#if onClick}
	<button class="btn btn-ghost btn-sm" onclick={onClick}>
		Takaisin
	</button>
{:else}
	<a href={href} class="btn btn-ghost btn-sm">
		Takaisin
	</a>
{/if}
