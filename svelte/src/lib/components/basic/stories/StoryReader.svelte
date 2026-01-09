<script lang="ts">
	import type { DialogueLine, VocabularyWord } from '$lib/types/story';
	import { tts } from '$lib/services/tts';
	import TTSPlayer from '$lib/components/shared/TTSPlayer.svelte';

	export let dialogue: DialogueLine[];
	export let vocabulary: VocabularyWord[];
	export let title: string;
	export let titleSpanish: string;
	export let onContinue: () => void;

	let showTranslation = false;
	let showVocabulary = false;

	function speakLine(text: string) {
		tts.speakSpanish(text);
	}

	function toggleTranslation() {
		showTranslation = !showTranslation;
	}

	function toggleVocabulary() {
		showVocabulary = !showVocabulary;
	}

	function closeVocabulary() {
		showVocabulary = false;
	}

	// Prepare full story text for TTS player
	$: fullStoryText = dialogue.map(line => line.spanish).join('. ');
</script>

<div class="flex flex-col h-full">
	<!-- Compact Header -->
	<div class="px-2 py-1.5 border-b border-base-200 bg-base-100">
		<TTSPlayer text={fullStoryText} language="spanish" title={titleSpanish} subtitle={title} />
	</div>

	<!-- Content area with bottom padding for fixed buttons -->
	<div class="flex-1 overflow-y-auto px-2 py-2 pb-20">
		{#if showVocabulary}
			<!-- Vocabulary view - compact -->
			<div class="space-y-1">
				<h3 class="font-bold text-sm mb-1 text-primary">📚 Sanasto</h3>
				{#each vocabulary as word}
					<div class="bg-base-100 rounded border border-base-300 px-2 py-1 flex items-center gap-1.5">
						<button 
							class="btn btn-ghost btn-circle btn-xs flex-shrink-0"
							on:click={() => speakLine(word.spanish)}
							title="Kuuntele"
						>
							🔊
						</button>
						<div class="flex-1 min-w-0">
							<div class="flex items-baseline gap-1.5 flex-wrap">
								<span class="font-semibold text-sm">{word.spanish}</span>
								<span class="text-base-content/50 text-xs">=</span>
								<span class="text-sm text-base-content/80">{word.finnish}</span>
							</div>
							{#if word.example}
								<p class="text-xs text-base-content/60 italic mt-0.5">{word.example}</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Dialogue view - side-by-side when translation shown -->
			<div class="space-y-1.5">
				{#each dialogue as line}
					<div class="bg-base-100 rounded border border-base-300 overflow-hidden">
						<!-- Speaker name and TTS button -->
						<div class="flex items-center justify-between px-2 py-0.5 bg-base-200">
							<span class="font-semibold text-xs text-primary">{line.speaker}</span>
							<button 
								class="btn btn-ghost btn-circle btn-xs"
								on:click={() => speakLine(line.spanish)}
								title="Kuuntele"
							>
								🔊
							</button>
						</div>
						<!-- Content: Spanish only or Spanish | Finnish side-by-side -->
						{#if showTranslation}
							<div class="grid grid-cols-2 gap-1 px-2 py-1">
								<!-- Spanish -->
								<div class="pr-1 border-r border-base-300">
									<p class="text-xs leading-snug">{line.spanish}</p>
								</div>
								<!-- Finnish -->
								<div class="pl-1">
									<p class="text-xs leading-snug text-base-content/70">{line.finnish}</p>
								</div>
							</div>
						{:else}
							<div class="px-2 py-1">
								<p class="text-xs leading-snug">{line.spanish}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Fixed bottom bar with buttons -->
	<div class="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-200 shadow-lg z-10 p-3">
		{#if showVocabulary}
			<!-- Only "Takaisin" button when vocabulary is shown -->
			<div class="flex justify-end">
				<button 
					class="btn btn-primary"
					on:click={closeVocabulary}
				>
					Takaisin
				</button>
			</div>
		{:else}
			<!-- Three buttons when dialogue is shown -->
			<div class="flex justify-between items-center">
				<div class="flex gap-3">
					<button 
						class="btn"
						class:btn-primary={showTranslation}
						class:btn-outline={!showTranslation}
						on:click={toggleTranslation}
					>
						{showTranslation ? 'Käännös' : 'Käännös'}
					</button>
					<button 
						class="btn btn-outline"
						on:click={toggleVocabulary}
					>
						Sanasto
					</button>
				</div>
				<button 
					class="btn btn-primary"
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
