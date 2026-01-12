<script lang="ts">
	import type { Snippet } from 'svelte';
	import BackButton from './BackButton.svelte';

	/**
	 * GameContainer - Standard layout wrapper for game modes
	 * 
	 * Provides consistent layout structure:
	 * - Back button positioned outside the card container with visible background
	 * - Centered card on desktop, full-screen on mobile
	 * - Proper padding and overflow handling
	 * 
	 * Game types:
	 * - basic: max-w-4xl (896px), scrollable content
	 * - story: max-w-3xl (768px), optimal for reading text
	 * - viewport-fitted: max-w-4xl, constrained height, no scroll
	 * 
	 * Button modes:
	 * - kids: Shows home icon (🏠) for kids games
	 * - basic: Shows "Pelimuodon valinta" text for basic games
	 * 
	 * Used by: yhdistasanat, tarinat, sanapeli, pipsan-*
	 */

	type GameType = 'basic' | 'story' | 'viewport-fitted';
	type ButtonMode = 'kids' | 'basic';

	interface Props {
		/** Game layout type - controls width and height behavior */
		gameType?: GameType;
		/** Show back button */
		showBackButton?: boolean;
		/** Back button click handler */
		onBack?: () => void;
		/** Button mode - kids shows home icon, basic shows Finnish text */
		buttonMode?: ButtonMode;
		/** Custom background class (e.g., gradient for kids mode) */
		backgroundClass?: string;
		/** Hide card background (useful when using custom background) */
		transparentCard?: boolean;
		/** Child content */
		children?: Snippet;
	}

	const layoutConfig = {
		basic: {
			container: 'min-h-screen',
			card: 'md:max-w-4xl h-full md:h-auto'
		},
		story: {
			container: 'min-h-screen',
			card: 'md:max-w-3xl h-full md:h-auto'
		},
		'viewport-fitted': {
			container: 'h-screen',
			card: 'md:max-w-4xl min-h-[600px] max-h-screen'
		}
	};
	
	let {
		gameType = 'basic',
		showBackButton = true,
		onBack,
		buttonMode = 'basic',
		backgroundClass = 'bg-base-200',
		transparentCard = false,
		children
	}: Props = $props();

	let layout = $derived(layoutConfig[gameType]);
	let cardBgClass = $derived(transparentCard ? '' : 'bg-base-100 shadow-xl');
</script>

<div class="{layout.container} {backgroundClass} flex flex-col md:items-center md:justify-center p-0 md:p-[1vw]">
	<!-- Top Row: Back Button (navbar-like, full width) -->
	{#if showBackButton && onBack}
		<div class="w-full flex items-center px-2 py-1 md:px-0 md:max-w-4xl">
			<BackButton onClick={onBack} mode={buttonMode} />
		</div>
		<!-- Small Gap -->
		<div class="h-0.5"></div>
	{/if}

	<!-- Game Card Container -->
	<div class="card {cardBgClass} w-full {layout.card} flex flex-col relative overflow-hidden">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>
