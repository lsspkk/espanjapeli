<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { CharacterAnimationService } from '$lib/services/characterAnimation';
	import type { AnimationConfig } from '$lib/types/animation';
	import '$lib/styles/character-animation.css';

	export let config: AnimationConfig;
	export let onComplete: (() => void) | undefined = undefined;

	let animationService: CharacterAnimationService;
	let currentFrame = 0;
	let horizontalPosition = 0;
	let backgroundOpacity = 0;
	let animationFrameId: number;
	let lastTimestamp = 0;
	let currentFramePath = '';
	
	// Multi-character support
	let isMultiCharacter = false;
	let characterStates: Array<{
		characterName: string;
		currentFrame: number;
		position: number;
		framePath: string;
	}> = [];

	onMount(async () => {
		animationService = new CharacterAnimationService();
		const initialState = animationService.initialize(config);
		await animationService.start();

		isMultiCharacter = !!(config.characters && config.characters.length > 0);
		
		if (isMultiCharacter) {
			characterStates = initialState.characterStates!.map((charState, index) => ({
				...charState,
				framePath: animationService.getCharacterFramePath(index)
			}));
		} else {
			currentFramePath = animationService.getCurrentFramePath();
		}

		// Start animation loop
		lastTimestamp = performance.now();
		animationFrameId = requestAnimationFrame(animate);
	});

	function animate(timestamp: number) {
		const deltaTime = timestamp - lastTimestamp;
		lastTimestamp = timestamp;

		const state = animationService.update(deltaTime);
		backgroundOpacity = state.backgroundOpacity;
		
		if (isMultiCharacter) {
			characterStates = state.characterStates!.map((charState, index) => ({
				...charState,
				framePath: animationService.getCharacterFramePath(index)
			}));
		} else {
			currentFrame = state.currentFrame;
			horizontalPosition = state.position;
			currentFramePath = animationService.getCurrentFramePath();
		}

		if (!animationService.isComplete()) {
			animationFrameId = requestAnimationFrame(animate);
		} else {
			cleanup();
			if (onComplete) {
				onComplete();
			}
		}
	}

	async function cleanup() {
		if (animationService) {
			await animationService.stop();
		}
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
		}
	}

	onDestroy(() => {
		cleanup();
	});
</script>

{#if config.background.type !== 'none'}
	<div
		class="animation-background background-{config.background.type}"
		class:visible={backgroundOpacity > 0}
		style="
			--vertical-position: {config.verticalPosition}%;
			--character-height: 5rem;
			--pattern-width: {config.background.width}px;
			opacity: {backgroundOpacity};
		"
	></div>
{/if}

{#if isMultiCharacter}
	{#each characterStates as charState, index (index)}
		<div
			class="character-animation"
			class:mirrored={config.direction === 'right-to-left'}
			style="
				--vertical-position: {config.verticalPosition}%;
				--horizontal-position: {charState.position}px;
				--character-scale: {config.scale};
			"
		>
		<div class="character-frame">
			<img src={charState.framePath} alt="" />
		</div>
		</div>
	{/each}
{:else}
	<div
		class="character-animation"
		class:mirrored={config.direction === 'right-to-left'}
		style="
			--vertical-position: {config.verticalPosition}%;
			--horizontal-position: {horizontalPosition}px;
			--character-scale: {config.scale};
		"
	>
	<div class="character-frame">
		<img src={currentFramePath} alt="" />
	</div>
	</div>
{/if}
