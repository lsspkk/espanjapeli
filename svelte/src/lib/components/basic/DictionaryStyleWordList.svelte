<script lang="ts">
	import type { Word } from '$lib/data/words';
	import TTSButton from '$lib/components/shared/TTSButton.svelte';

	interface Props {
		words: Word[];
		title?: string;
		showTitle?: boolean;
	}

	let { words, title = '', showTitle = true }: Props = $props();
</script>

<div class="space-y-4">
	{#if showTitle && title}
		<div class="px-2">
			<h3 class="text-lg font-semibold text-base-content">{title}</h3>
			<p class="text-sm text-base-content/60">{words.length} sanaa</p>
		</div>
	{/if}

	<!-- Word list in dictionary style -->
	<div class="space-y-2">
		{#each words as word (word.spanish)}
			<div
				class="flex items-center gap-2 p-3 bg-base-100 hover:bg-base-200 rounded-lg transition-colors cursor-default"
			>
				<div class="flex-1 min-w-0">
					<div class="flex items-baseline gap-2">
						<span class="font-semibold text-base text-primary truncate">{word.spanish}</span>
						<span class="text-sm text-base-content/60 truncate">{word.finnish}</span>
					</div>
				</div>
				<div class="flex-shrink-0">
					<TTSButton
						text={word.spanish}
						language="spanish"
						size="sm"
						variant="ghost"
						title="Kuuntele sana"
					/>
				</div>
			</div>
		{/each}
	</div>
</div>
