<script lang="ts">
	import type { Word } from '$lib/data/words';
	import type { Sentence } from '$lib/services/sentenceLoader';
	import TTSButton from '$lib/components/shared/TTSButton.svelte';

	interface WordWithPhrases {
		word: Word;
		phrases: Sentence[];
	}

	interface Props {
		wordsWithPhrases: WordWithPhrases[];
	}

	let { wordsWithPhrases }: Props = $props();

	// Function to highlight target word in sentence
	function highlightWord(sentence: string, targetWord: string): string {
		const wordLower = targetWord.toLowerCase();
		// Match whole word or word with common Spanish punctuation
		const wordPattern = new RegExp(`(\\b${wordLower}\\b|\\b${wordLower}[,.:;!?¿¡])`, 'gi');
		return sentence.replace(wordPattern, '<mark class="bg-primary/20 font-semibold">$1</mark>');
	}
</script>

<div class="space-y-6">
	{#each wordsWithPhrases as { word, phrases }}
		<div class="card bg-base-200">
			<div class="card-body">
				<h3 class="card-title text-lg">
					{word.spanish} - {word.finnish}
				</h3>
				
				{#if phrases.length === 0}
					<p class="text-base-content/60 text-sm italic">
						Ei esimerkkejä saatavilla
					</p>
				{:else}
					<div class="space-y-3 mt-2">
						{#each phrases as phrase}
							<div class="border-l-4 border-primary pl-2">
								<div class="flex items-start gap-2">
									<div class="flex-1">
										<p class="font-medium">
											{@html highlightWord(phrase.spanish, word.spanish)}
										</p>
										<p class="text-base-content/70 text-sm mt-1">
											{phrase.finnish}
										</p>
									</div>
									<div class="flex-shrink-0 pt-1">
										<TTSButton 
											text={phrase.spanish} 
											language="spanish" 
											size="xs"
											variant="ghost"
											title="Kuuntele lause"
										/>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/each}
</div>
