<script lang="ts">
	import type { Story } from '$lib/types/story';
	import { difficultyNames, getDifficultyColor } from '$lib/services/storyLoader';
	import { base } from '$app/paths';

	export let story: Story;
	export let onSelect: ((story: Story) => void) | undefined = undefined;
	export let useLink: boolean = false;
</script>

{#if useLink}
	<a
		href="{base}/tarinat/{story.id}"
		class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer w-full text-left block"
	>
		<div class="card-body p-3">
			<div class="flex items-start gap-2">
				<span class="text-2xl">{story.icon}</span>
				<div class="flex-1 min-w-0">
					<h3 class="card-title text-base font-semibold">{story.titleSpanish}</h3>
					<p class="text-sm text-base-content/70 mt-0.5 line-clamp-2">{story.description}</p>
				</div>
			</div>
			<div class="flex gap-2 mt-2">
				<span class="badge {getDifficultyColor(story.difficulty)} badge-sm">
					{difficultyNames[story.difficulty]}
				</span>
				<span class="badge badge-ghost badge-sm">
					{story.dialogue.length} repliikkiä
				</span>
				<span class="badge badge-ghost badge-sm">
					{story.questions.length} kysymystä
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
				<span class="text-2xl">{story.icon}</span>
				<div class="flex-1 min-w-0">
					<h3 class="card-title text-base font-semibold">{story.titleSpanish}</h3>
					<p class="text-sm text-base-content/70 mt-0.5 line-clamp-2">{story.description}</p>
				</div>
			</div>
			<div class="flex gap-2 mt-2">
				<span class="badge {getDifficultyColor(story.difficulty)} badge-sm">
					{difficultyNames[story.difficulty]}
				</span>
				<span class="badge badge-ghost badge-sm">
					{story.dialogue.length} repliikkiä
				</span>
				<span class="badge badge-ghost badge-sm">
					{story.questions.length} kysymystä
				</span>
			</div>
		</div>
	</button>
{/if}
