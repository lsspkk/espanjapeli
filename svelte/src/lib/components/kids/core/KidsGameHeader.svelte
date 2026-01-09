<script lang="ts">
	interface Props {
		currentQuestion: number;
		totalQuestions: number;
		correctCount: number;
		onClose: () => void;
	}

	let { currentQuestion, totalQuestions, correctCount, onClose }: Props = $props();
</script>

<div class="card bg-white/90 shadow-lg">
	<div class="card-body p-2">
		<div class="flex items-center justify-between text-sm">
			<span class="font-bold text-base">Kysymys {currentQuestion}/{totalQuestions}</span>
			<div class="flex items-center gap-2">
				<span class="font-bold text-base text-success">✅ {correctCount}</span>
				<button onclick={onClose} class="btn btn-ghost btn-xs" title="Sulje peli">
					✕
				</button>
			</div>
		</div>
		<progress 
			class="progress progress-primary w-full h-2" 
			value={currentQuestion} 
			max={totalQuestions}
		></progress>
	</div>
</div>
