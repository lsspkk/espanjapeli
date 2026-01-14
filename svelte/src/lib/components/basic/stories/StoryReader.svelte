<script lang="ts">
	import type { DialogueLine, VocabularyWord } from '$lib/types/story';
	import { tts } from '$lib/services/tts';
	import TTSPlayer from '$lib/components/shared/TTSPlayer.svelte';
	import DialogueLineComponent from './DialogueLine.svelte';
	import { wordKnowledge } from '$lib/stores/wordKnowledge';

	export let dialogue: DialogueLine[];
	export let vocabulary: VocabularyWord[];
	export let title: string;
	export let titleSpanish: string;
	export let onContinue: () => void;
	
	// Get story encounter counts for vocabulary words
	$: vocabularyWithStories = vocabulary.map(word => ({
		...word,
		storyCount: wordKnowledge.getWordStories(word.spanish).length
	}));

	let showAllTranslations = false;
	let showVocabulary = false;
	let expandedLines = new Set<number>();
	let showControls = true;
	let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
	let lastScrollY = 0;
	let contentElement: HTMLDivElement;

	function speakLine(text: string) {
		tts.speakSpanish(text);
	}

	function toggleAllTranslations() {
		showAllTranslations = !showAllTranslations;
		if (showAllTranslations) {
			expandedLines = new Set(dialogue.map((_, i) => i));
		} else {
			expandedLines = new Set();
		}
	}

	function toggleLineTranslation(index: number) {
		if (expandedLines.has(index)) {
			expandedLines.delete(index);
		} else {
			expandedLines.add(index);
		}
		expandedLines = expandedLines;
	}

	function toggleVocabulary() {
		showVocabulary = !showVocabulary;
	}

	function closeVocabulary() {
		showVocabulary = false;
	}

	function handleScroll(event: Event) {
		const target = event.target as HTMLDivElement;
		const currentScrollY = target.scrollTop;

		// Show controls when scrolling up or at top
		if (currentScrollY < lastScrollY || currentScrollY < 10) {
			showControls = true;
		} else if (currentScrollY > lastScrollY && currentScrollY > 50) {
			// Hide controls when scrolling down (after 50px)
			showControls = false;
		}

		lastScrollY = currentScrollY;

		// Auto-show controls after 3 seconds of no scrolling
		if (scrollTimeout) {
			clearTimeout(scrollTimeout);
		}
		scrollTimeout = setTimeout(() => {
			showControls = true;
		}, 3000);
	}

	function handleTap() {
		// Toggle controls on tap
		showControls = !showControls;
	}

	// Prepare full story text for TTS player
	$: fullStoryText = dialogue.map(line => line.spanish).join('. ');

	// Calculate reading progress based on expanded lines
	$: readingProgress = dialogue.length > 0 ? (expandedLines.size / dialogue.length) * 100 : 0;
</script>

<div class="flex flex-col h-full">
	<!-- Compact Header with Progress Bar -->
	<div class="border-b border-base-200 bg-base-100">
		<div class="px-2 py-1.5">
			<TTSPlayer text={fullStoryText} language="spanish" title={titleSpanish} subtitle={title} />
		</div>
		{#if !showVocabulary}
			<!-- Reading Progress Bar -->
			<div class="px-2 pb-1.5">
				<div class="flex items-center gap-2">
					<div class="flex-1 h-2 bg-base-300 rounded-full overflow-hidden">
						<div 
							class="h-full bg-primary transition-all duration-300"
							style="width: {readingProgress}%"
						></div>
					</div>
					<span class="text-xs text-base-content/60 min-w-[3rem] text-right">
						{Math.round(readingProgress)}%
					</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Content area with bottom padding for fixed buttons -->
	<div 
		class="flex-1 overflow-y-auto px-3 py-3 pb-20 md:px-4"
		on:scroll={handleScroll}
		on:click={handleTap}
		on:keydown={(e) => e.key === 'Enter' && handleTap()}
		role="button"
		tabindex="0"
		aria-label="Sisältöalue - napauta piilottaaksesi tai näyttääksesi painikkeet"
		bind:this={contentElement}
	>
		{#if showVocabulary}
			<!-- Vocabulary view - compact -->
			<div class="space-y-2">
				<h3 class="font-bold text-base mb-2 text-primary">📚 Sanasto</h3>
				{#each vocabularyWithStories as word}
					<div class="bg-base-100 rounded border border-base-300 px-3 py-2 flex items-center gap-2">
						<button 
							class="btn btn-ghost btn-circle btn-sm flex-shrink-0"
							on:click={() => speakLine(word.spanish)}
							title="Kuuntele"
						>
							🔊
						</button>
						<div class="flex-1 min-w-0">
							<div class="flex items-baseline gap-2 flex-wrap">
								<span class="font-semibold text-base">{word.spanish}</span>
								<span class="text-base-content/50 text-sm">=</span>
								<span class="text-base text-base-content/80">{word.finnish}</span>
								{#if word.storyCount > 0}
									<span class="badge badge-sm badge-ghost" title="Nähty {word.storyCount} tarinassa">
										📖 {word.storyCount}
									</span>
								{/if}
							</div>
							{#if word.example}
								<p class="text-sm text-base-content/60 italic mt-1">{word.example}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Dialogue view - stacked layout with expandable translations -->
			<div class="space-y-3">
				{#each dialogue as line, index}
					<DialogueLineComponent 
						{line}
						expanded={expandedLines.has(index)}
						onToggle={() => toggleLineTranslation(index)}
					/>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Fixed bottom bar with buttons - auto-hiding -->
	<div 
		class="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-200 shadow-lg z-10 p-3 transition-transform duration-300"
		class:translate-y-full={!showControls}
	>
		{#if showVocabulary}
			<!-- Only "Takaisin" button when vocabulary is shown -->
			<div class="flex justify-end">
				<button 
					class="btn btn-sm md:btn-md btn-primary"
					on:click={closeVocabulary}
				>
					Takaisin
				</button>
			</div>
		{:else}
			<!-- Three buttons when dialogue is shown -->
			<div class="flex justify-between items-center gap-2">
				<div class="flex gap-2 md:gap-3">
					<button 
						class="btn btn-sm md:btn-md"
						class:btn-primary={showAllTranslations}
						class:btn-outline={!showAllTranslations}
						on:click={toggleAllTranslations}
						title={showAllTranslations ? 'Piilota kaikki käännökset' : 'Näytä kaikki käännökset'}
					>
						Käännökset
					</button>
					<button 
						class="btn btn-sm md:btn-md btn-outline"
						on:click={toggleVocabulary}
					>
						Sanasto
					</button>
				</div>
				<button 
					class="btn btn-sm md:btn-md btn-primary"
					on:click={onContinue}
				>
					Kysymyksiin
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	:global(.leading-snug) {
		line-height: 1.25;
	}
	:global(.leading-tight) {
		line-height: 1.15;
	}
</style>
