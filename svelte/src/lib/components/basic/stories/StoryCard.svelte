<script lang="ts">
	import type { Story } from '$lib/types/story';
	import type { StoryMetadata } from '$lib/services/storyLoader';
	import { getCEFRLabel } from '$lib/services/vocabularyService';
	import { base } from '$app/paths';

	export let story: Story | StoryMetadata;
	export let onSelect: ((story: Story | StoryMetadata) => void) | undefined = undefined;
	export let useLink: boolean = false;
	
	// Helper to check if story has full data or just metadata
	function isFullStory(s: Story | StoryMetadata): s is Story {
		return 'dialogue' in s;
	}
	
	// Get dialogue count (from full story or metadata)
	$: dialogueCount = isFullStory(story) ? story.dialogue.length : (story.dialogueCount ?? 0);
	
	// Get question count (from full story or metadata)
	$: questionCount = isFullStory(story) ? story.questions.length : (story.questionCount ?? 0);
	
	function getLevelColor(level: string): string {
		switch (level) {
			case 'A1':
				return 'text-green-700/60';
			case 'A2':
				return 'text-amber-700/60';
			case 'B1':
				return 'text-orange-700/60';
			case 'B2':
				return 'text-red-700/60';
			default:
				return 'text-base-content/50';
		}
	}
</script>

{#if useLink}
	<a
		href="{base}/tarinat/{story.id}"
		class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer w-full text-left block"
	>
		<div class="card-body p-3">
			<div class="flex items-start gap-2">
				<span class="text-2xl saturate-50 opacity-80">{story.icon}</span>
				<div class="flex-1 min-w-0">
					<h3 class="card-title text-base font-semibold">{story.titleSpanish}</h3>
					<p class="text-sm text-base-content/70 mt-0.5 line-clamp-2">{story.description}</p>
				</div>
			</div>
			<div class="flex gap-1.5 mt-1.5 text-xs text-base-content/50">
				<span class="{getLevelColor(story.level)} md:px-1.5 md:py-0.5 md:rounded md:border md:border-current/20">
					{getCEFRLabel(story.level, 'short')}
				</span>
				<span>
					{dialogueCount} repliikkiä
				</span>
				<span>
					· {questionCount} kysymystä
				</span>
			</div>
		</div>
	</a>
{:else}
	<button
		class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer w-full text-left"
		on:click={() => onSelect?.(story)}
	>
		<div class="card-body p-3">
			<div class="flex items-start gap-2">
				<span class="text-2xl saturate-50 opacity-80">{story.icon}</span>
				<div class="flex-1 min-w-0">
					<h3 class="card-title text-base font-semibold">{story.titleSpanish}</h3>
					<p class="text-sm text-base-content/70 mt-0.5 line-clamp-2">{story.description}</p>
				</div>
			</div>
			<div class="flex gap-1.5 mt-1.5 text-xs text-base-content/50">
				<span class="{getLevelColor(story.level)} md:px-1.5 md:py-0.5 md:rounded md:border md:border-current/20">
					{getCEFRLabel(story.level, 'short')}
				</span>
				<span>
					{dialogueCount} repliikkiä
				</span>
				<span>
					· {questionCount} kysymystä
				</span>
			</div>
		</div>
	</button>
{/if}
