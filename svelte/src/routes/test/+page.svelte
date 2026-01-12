<script lang="ts">
	import CharacterAnimation from '$lib/components/CharacterAnimation.svelte';
	import type { AnimationConfig } from '$lib/types/animation';

	let showAnimations = false;
	let activeAnimations: AnimationConfig[] = [];
	let animationIdCounter = 0;

	const characters: Array<{ name: 'peppa' | 'george' | 'mummy' | 'daddy'; label: string }> = [
		{ name: 'peppa', label: '🐷 Peppa' },
		{ name: 'george', label: '🐷 George' },
		{ name: 'mummy', label: '🐷 Mummy Pig' },
		{ name: 'daddy', label: '🐷 Daddy Pig' }
	];

	const allCharacterNames: Array<'peppa' | 'george' | 'mummy' | 'daddy'> = ['peppa', 'george', 'mummy', 'daddy'];

	function openAnimations() {
		showAnimations = true;
	}

	function closeAnimations() {
		showAnimations = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeAnimations();
		}
	}

	function startAnimation(characterName: 'peppa' | 'george' | 'mummy' | 'daddy') {
		// Random vertical position between 30% and 70%
		const verticalPosition = Math.random() * 40 + 30;

		// Random direction
		const direction = Math.random() > 0.5 ? 'left-to-right' : 'right-to-left';

		const newAnimation: AnimationConfig & { id: number } = {
			id: animationIdCounter++,
			characterName,
			direction,
			speed: 200, // 200 pixels per second
			verticalPosition,
			scale: 1.0,
			background: {
				type: 'grass',
				height: 150,
				width: 80
			},
			frameRate: 20
		};

		activeAnimations = [...activeAnimations, newAnimation];
	}

	function startMultiCharacterAnimation(count: 2 | 3 | 4) {
		// Randomly select characters
		const shuffled = [...allCharacterNames].sort(() => Math.random() - 0.5);
		const selectedCharacters = shuffled.slice(0, count);

		// Random vertical position between 30% and 70%
		const verticalPosition = Math.random() * 40 + 30;

		// Random direction
		const direction = Math.random() > 0.5 ? 'left-to-right' : 'right-to-left';

		const newAnimation: AnimationConfig & { id: number } = {
			id: animationIdCounter++,
			characterName: selectedCharacters[0], // Required but not used in multi-char mode
			characters: selectedCharacters,
			characterSpacing: 120, // Distance between characters
			direction,
			speed: 200,
			verticalPosition,
			scale: 1.0,
			background: {
				type: 'grass',
				height: 150,
				width: 80
			},
			frameRate: 20
		};

		activeAnimations = [...activeAnimations, newAnimation];
	}

	function handleAnimationComplete(animationId: number) {
		activeAnimations = activeAnimations.filter(anim => (anim as any).id !== animationId);
	}
</script>

<div class="test-page">
	<h1>Test Page</h1>

	<div class="button-grid">
		<button class="test-button" on:click={openAnimations}>Animations</button>
		<button class="test-button">Button 2</button>
		<button class="test-button">Button 3</button>
		<button class="test-button">Button 4</button>
	</div>
</div>

{#if showAnimations}
	<div
		class="fixed inset-0 bg-neutral/50 z-50"
		on:click={closeAnimations}
		on:keydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		<div
			class="bg-base-100 w-full h-full sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:shadow-xl overflow-hidden"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="bg-primary text-primary-content p-4 flex items-center justify-between">
				<h2 class="text-xl font-bold">🎬 Character Animations</h2>
				<button class="btn btn-ghost btn-sm btn-circle text-primary-content" on:click={closeAnimations}>
					✕
				</button>
			</div>

			<div class="overflow-y-auto h-[calc(100vh-64px)] sm:h-auto sm:max-h-[calc(90vh-64px)] p-4">
				<div class="space-y-4">
					<div>
						<h3 class="text-lg font-semibold mb-2">Single Character</h3>
						<div class="space-y-3">
							{#each characters as character}
								<button
									class="character-button w-full"
									on:click={() => startAnimation(character.name)}
								>
									{character.label}
								</button>
							{/each}
						</div>
					</div>

					<div class="divider">OR</div>

					<div>
						<h3 class="text-lg font-semibold mb-2">Multiple Characters in Row</h3>
						<div class="space-y-3">
							<button
								class="multi-char-button w-full"
								on:click={() => startMultiCharacterAnimation(2)}
							>
								🐷🐷 2 Characters
							</button>
							<button
								class="multi-char-button w-full"
								on:click={() => startMultiCharacterAnimation(3)}
							>
								🐷🐷🐷 3 Characters
							</button>
							<button
								class="multi-char-button w-full"
								on:click={() => startMultiCharacterAnimation(4)}
							>
								🐷🐷🐷🐷 4 Characters
							</button>
						</div>
					</div>
				</div>

				<div class="fixed bottom-4 right-4">
					<button class="btn btn-primary btn-lg" on:click={closeAnimations}>
						Sulje
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#each activeAnimations as animation ((animation as any).id)}
	<CharacterAnimation 
		config={animation} 
		onComplete={() => handleAnimationComplete((animation as any).id)} 
	/>
{/each}

<style>
	.test-page {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}

	h1 {
		text-align: center;
		margin-bottom: 2rem;
		color: #333;
	}

	.button-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		max-width: 400px;
		margin: 0 auto;
	}

	.test-button {
		padding: 2rem 1rem;
		font-size: 1.2rem;
		font-weight: bold;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.test-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	.test-button:active {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.character-button {
		padding: 1.5rem 1rem;
		font-size: 1.3rem;
		font-weight: bold;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.character-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	.character-button:active {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.multi-char-button {
		padding: 1.5rem 1rem;
		font-size: 1.3rem;
		font-weight: bold;
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
		color: white;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		text-align: center;
	}

	.multi-char-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
	}

	.multi-char-button:active {
		transform: translateY(0);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.divider {
		display: flex;
		align-items: center;
		text-align: center;
		margin: 1.5rem 0;
		color: #666;
		font-weight: 600;
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-bottom: 2px solid #ddd;
	}

	.divider::before {
		margin-right: 1rem;
	}

	.divider::after {
		margin-left: 1rem;
	}
</style>
