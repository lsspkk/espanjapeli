<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { MilestoneAchievement } from '$lib/services/milestoneService';

	export let isOpen = false;
	export let achievement: MilestoneAchievement | null = null;

	const dispatch = createEventDispatcher<{ close: void }>();

	let showConfetti = false;

	function close() {
		dispatch('close');
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			close();
		}
	}

	function handleBackdropClick() {
		close();
	}

	// Trigger confetti when modal opens
	$: if (isOpen && achievement) {
		showConfetti = true;
		// Stop confetti after animation completes
		setTimeout(() => {
			showConfetti = false;
		}, 3000);
	}
</script>

{#if isOpen && achievement}
	<div 
		class="fixed inset-0 bg-neutral/50 z-50 flex items-center justify-center p-4" 
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		role="button"
		tabindex="0"
	>
		<!-- Confetti animation -->
		{#if showConfetti}
			<div class="confetti-container">
				{#each Array(50) as _, i}
					<div 
						class="confetti" 
						style="left: {Math.random() * 100}%; animation-delay: {Math.random() * 0.5}s; animation-duration: {2 + Math.random() * 1}s;"
					></div>
				{/each}
			</div>
		{/if}

		<div 
			class="bg-base-100 w-full max-w-md rounded-lg shadow-xl overflow-hidden animate-bounce-in relative z-10"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<!-- Header with icon -->
			<div class="bg-gradient-to-br from-primary to-secondary text-primary-content p-6 text-center relative overflow-hidden">
				<!-- Decorative elements -->
				<div class="absolute inset-0 opacity-10">
					<div class="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
					<div class="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
				</div>
				
				<div class="relative z-10">
					<div class="text-6xl mb-3 animate-bounce">{achievement.milestone.icon}</div>
					<h2 class="text-2xl font-bold mb-1">Onnittelut!</h2>
					<p class="text-primary-content/90 text-sm">Saavutit uuden merkkipaalun</p>
				</div>
			</div>

			<!-- Content -->
			<div class="p-6">
				<!-- Milestone title -->
				<div class="text-center mb-4">
					<h3 class="text-xl font-bold text-base-content mb-2">
						{achievement.milestone.title}
					</h3>
					<p class="text-base-content/70">
						{achievement.milestone.description}
					</p>
				</div>

				<!-- Achievement stats -->
				<div class="bg-base-200 rounded-lg p-4 mb-4">
					<div class="flex items-center justify-center gap-4">
						<div class="text-center">
							<div class="text-3xl font-bold text-primary">
								{achievement.currentValue}
							</div>
							<div class="text-xs text-base-content/70">
								{#if achievement.milestone.type === 'words_known'}
									Sanaa opittu
								{:else if achievement.milestone.type === 'top_n_complete'}
									{achievement.milestone.topN} yleisintä sanaa
								{:else if achievement.milestone.type === 'stories_read'}
									Tarinaa luettu
								{/if}
							</div>
						</div>
						<div class="text-2xl text-base-content/50">→</div>
						<div class="text-center">
							<div class="text-3xl font-bold text-success">
								{achievement.milestone.target}
							</div>
							<div class="text-xs text-base-content/70">Tavoite</div>
						</div>
					</div>
				</div>

				<!-- Encouragement message -->
				<div class="text-center mb-4">
					<p class="text-sm text-base-content/70">
						Jatka hienoa työtä! Jokainen opittu sana vie sinua lähemmäs sujuvaa espanjan kielen osaamista.
					</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="p-4 border-t border-base-300">
				<button 
					class="btn btn-primary w-full gap-2" 
					on:click={close}
				>
					<span>🎉</span>
					<span>Jatka oppimista</span>
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes bounce-in {
		0% {
			transform: scale(0.3);
			opacity: 0;
		}
		50% {
			transform: scale(1.05);
		}
		70% {
			transform: scale(0.9);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.animate-bounce-in {
		animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
	}

	.confetti-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 5;
		overflow: hidden;
	}

	.confetti {
		position: absolute;
		width: 10px;
		height: 10px;
		top: -10px;
		opacity: 0;
		animation: confetti-fall linear forwards;
	}

	.confetti:nth-child(5n+1) {
		background-color: #ff6b6b;
		transform: rotate(45deg);
	}

	.confetti:nth-child(5n+2) {
		background-color: #4ecdc4;
		transform: rotate(90deg);
	}

	.confetti:nth-child(5n+3) {
		background-color: #ffe66d;
		border-radius: 50%;
	}

	.confetti:nth-child(5n+4) {
		background-color: #a8e6cf;
		transform: rotate(135deg);
	}

	.confetti:nth-child(5n+5) {
		background-color: #ff8b94;
		border-radius: 50%;
	}

	@keyframes confetti-fall {
		0% {
			top: -10px;
			opacity: 1;
		}
		100% {
			top: 100%;
			opacity: 0.7;
			transform: translateX(50px) rotate(360deg);
		}
	}
</style>
