<script lang="ts">
	import type { DialogueLine as DialogueLineType } from '$lib/types/story';

	export let line: DialogueLineType;
	export let expanded: boolean = false;
</script>

<div class="py-1">
	<!-- Speaker name -->
	<div class="mb-0">
		<span class="text-xs text-primary">{line.speaker}</span>
	</div>
	
	<!-- Content area with Spanish and Finnish text -->
	<div class="flex gap-2 md:gap-4">
		<!-- Spanish text -->
		<div class="w-[60%] md:w-1/2">
			<p class="text-base md:text-lg leading-relaxed">{line.spanish}</p>
		</div>
		
		<!-- Finnish translation (when expanded) -->
		{#if expanded}
			<div class="w-[40%] md:w-1/2">
				<p class="text-[0.8em] md:text-base leading-relaxed">{line.finnish}</p>
			</div>
		{/if}
	</div>
</div>
