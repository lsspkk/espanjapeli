<script lang="ts">
	import type { Snippet } from 'svelte';
	import BackButton from './BackButton.svelte';

	/**
	 * GameContainer - Standard layout wrapper for game modes
	 * 
	 * Provides consistent layout structure:
	 * - Back button positioned outside the card container
	 * - Centered card on desktop, full-screen on mobile
	 * - Proper padding and overflow handling
	 * 
	 * Used by: yhdistasanat, tarinat
	 */
	
	interface Props {
		/** Show back button */
		showBackButton?: boolean;
		/** Back button click handler */
		onBack?: () => void;
		/** Child content */
		children?: Snippet;
	}
	
	let {
		showBackButton = true,
		onBack,
		children
	}: Props = $props();
</script>

<div class="min-h-screen bg-base-200 flex flex-col md:items-center md:justify-center p-0 md:p-4">
	<!-- Back Button (outside container) -->
	{#if showBackButton && onBack}
		<div class="absolute top-2 left-2 z-10 md:relative md:top-0 md:left-0 md:mb-2">
			<BackButton onClick={onBack} />
		</div>
	{/if}

	<!-- Game Card Container -->
	<div class="card bg-base-100 shadow-xl w-full md:max-w-5xl h-full md:h-auto md:max-h-[90vh] flex flex-col relative overflow-hidden">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
