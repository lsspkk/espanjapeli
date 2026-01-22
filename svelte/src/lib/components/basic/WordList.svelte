<script lang="ts">
	import type { Word } from '$lib/data/words';
	import TTSButton from '$lib/components/shared/TTSButton.svelte';

	interface Props {
		words: Word[];
		currentIndex?: number;
	}

	let { words, currentIndex = 0 }: Props = $props();

	// Calculate progress percentage
	let progressPercentage = $derived(
		words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0
	);
</script>

<div class="space-y-4">
	<!-- Progress bar -->
	<div class="w-full">
		<div class="flex justify-between text-sm mb-2">
			<span>Sana {currentIndex + 1}/{words.length}</span>
			<span>{Math.round(progressPercentage)}%</span>
		</div>
		<progress 
			class="progress progress-primary w-full" 
			value={progressPercentage} 
			max="100"
		></progress>
	</div>

	<!-- Word list -->
	<div class="space-y-2">
		{#each words as word, index}
			<div 
				class="card bg-base-200 p-4 min-h-[44px] flex items-center"
				class:ring-2={index === currentIndex}
				class:ring-primary={index === currentIndex}
			>
				<div class="flex items-center justify-between gap-4 w-full">
					<div class="flex-1 min-w-0">
						<div class="text-lg font-semibold truncate">{word.spanish}</div>
						<div class="text-base-content/70 truncate">{word.finnish}</div>
					</div>
					<div class="flex-shrink-0">
						<TTSButton 
							text={word.spanish} 
							language="spanish" 
							size="sm"
							variant="circle"
							title="Kuuntele sana"
						/>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
