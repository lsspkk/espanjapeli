<script lang="ts">
	interface Option {
		id: string;
		file: string;
		emojiDisplay: string;
		isCorrect: boolean;
	}

	interface Props {
		options: Option[];
		selectedAnswer: string | null;
		displayMode: 'svg' | 'emoji';
		onSelect: (id: string) => void;
	}

	let { options, selectedAnswer, displayMode, onSelect }: Props = $props();
</script>

<div class="grid grid-cols-2 gap-2 flex-1 min-h-0">
	{#each options as option}
		<button
			class="aspect-square rounded-2xl overflow-hidden shadow-xl transition-all duration-500 border-4
				{selectedAnswer === option.id 
					? option.isCorrect 
						? 'border-green-500 ring-4 ring-green-300 scale-105' 
						: 'border-red-500 ring-4 ring-red-300 opacity-70'
					: selectedAnswer !== null && option.isCorrect
						? 'border-green-500 ring-4 ring-green-300 animate-pulse'
						: 'border-white/50 hover:border-primary hover:scale-105 hover:shadow-2xl'
				}"
			disabled={selectedAnswer !== null}
			onclick={() => onSelect(option.id)}
		>
			<!-- Display mode: SVG or Emoji -->
			{#if displayMode === 'svg'}
				<!-- SVG Image Mode -->
				<img 
					src={option.file} 
					alt=""
					class="w-full h-full object-cover bg-white transition-all duration-500"
				/>
			{:else}
				<!-- Emoji Mode -->
				<div class="w-full h-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center transition-all duration-500">
					<span class="text-5xl sm:text-6xl tracking-wider">{option.emojiDisplay}</span>
				</div>
			{/if}
		</button>
	{/each}
</div>
