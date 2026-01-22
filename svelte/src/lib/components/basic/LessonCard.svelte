<script lang="ts">
	import type { LessonMetadata } from '$lib/services/lessonService';
	
	interface Props {
		lesson: LessonMetadata;
		status: 'not-started' | 'in-progress' | 'completed';
		needsReview: boolean;
		onclick: () => void;
	}
	
	let { lesson, status, needsReview, onclick }: Props = $props();
</script>

<button
	class="card bg-base-200 hover:bg-base-300 transition-colors text-left p-4 relative"
	{onclick}
>
	{#if needsReview}
		<div class="badge badge-warning absolute top-2 right-2">
			Aika kerrata!
		</div>
	{/if}
	
	<div class="flex items-start justify-between gap-2">
		<div class="flex-1">
			<h3 class="font-semibold text-lg">
				{#if lesson.tier > 1}
					Taso {lesson.tier}
				{:else}
					Perustaso
				{/if}
			</h3>
			<p class="text-sm text-base-content/70 mt-1">
				{lesson.wordCount} sanaa • {lesson.phraseCount} esimerkkiä
			</p>
		</div>
		
		<div class="flex flex-col items-end gap-1">
			{#if status === 'completed'}
				<span class="badge badge-success badge-sm">Valmis</span>
			{:else if status === 'in-progress'}
				<span class="badge badge-info badge-sm">Kesken</span>
			{:else}
				<span class="badge badge-ghost badge-sm">Ei aloitettu</span>
			{/if}
		</div>
	</div>
</button>
