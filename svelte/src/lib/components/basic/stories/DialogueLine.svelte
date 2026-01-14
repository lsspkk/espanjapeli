<script lang="ts">
	import type { DialogueLine as DialogueLineType } from '$lib/types/story';
	import { tts } from '$lib/services/tts';

	export let line: DialogueLineType;
	export let expanded: boolean = false;
	export let onToggle: () => void;

	function speakLine() {
		tts.speakSpanish(line.spanish);
	}
</script>

<div class="bg-base-100 rounded-lg border border-base-300 overflow-hidden shadow-sm">
	<!-- Speaker name and TTS button -->
	<div class="flex items-center justify-between px-3 py-2 bg-base-200">
		<span class="font-semibold text-sm text-primary">{line.speaker}</span>
		<button 
			class="btn btn-ghost btn-circle btn-sm"
			on:click={speakLine}
			title="Kuuntele"
			aria-label="Kuuntele lause"
		>
			🔊
		</button>
	</div>
	
	<!-- Spanish text - always visible, larger on mobile -->
	<div class="px-3 py-3">
		<p class="text-base md:text-lg leading-relaxed">{line.spanish}</p>
	</div>
	
	<!-- Translation toggle button and translation -->
	{#if expanded}
		<div class="border-t border-base-300">
			<button 
				class="w-full px-3 py-1.5 text-xs text-primary hover:bg-base-200 transition-colors flex items-center justify-center gap-1"
				on:click={onToggle}
				aria-label="Piilota käännös"
			>
				<span>▲</span>
				<span>Piilota käännös</span>
			</button>
			<div class="px-3 py-3 bg-base-50">
				<p class="text-sm md:text-base leading-relaxed text-base-content/70">{line.finnish}</p>
			</div>
		</div>
	{:else}
		<div class="border-t border-base-300">
			<button 
				class="w-full px-3 py-1.5 text-xs text-primary hover:bg-base-200 transition-colors flex items-center justify-center gap-1"
				on:click={onToggle}
				aria-label="Näytä käännös"
			>
				<span>▼</span>
				<span>Näytä käännös</span>
			</button>
		</div>
	{/if}
</div>
