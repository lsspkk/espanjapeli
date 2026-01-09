<script lang="ts">
	export let correctCount: number;
	export let totalQuestions: number;
	export let onPlayAgain: () => void;
	export let onHome: () => void;

	$: percentage = correctCount / totalQuestions;
	$: emoji = percentage >= 0.8 ? '🏆' : percentage >= 0.5 ? '⭐' : '💪';
	$: message = percentage >= 0.8 ? 'Loistavaa! 🎉' : percentage >= 0.5 ? 'Hyvä työ! 🌟' : 'Hyvä yritys! 💪';
</script>

<div class="card bg-white/95 shadow-2xl backdrop-blur">
	<div class="card-body items-center text-center p-8">
		<div class="text-8xl mb-4">
			{emoji}
		</div>

		<h2 class="text-3xl font-bold mb-2">
			{message}
		</h2>

		<div class="text-6xl font-bold text-primary my-4">
			{correctCount} / {totalQuestions}
		</div>

		<div class="text-xl text-base-content/70 mb-6">
			oikein
		</div>

		<!-- Decorations -->
		<div class="flex gap-4 text-4xl mb-6">
			<span class="animate-bounce delay-100">🐷</span>
			<span class="animate-bounce delay-200">🌈</span>
			<span class="animate-bounce delay-300">🎨</span>
			<span class="animate-bounce delay-400">⭐</span>
		</div>

		<div class="flex flex-col sm:flex-row gap-3 w-full max-w-md">
			<button 
				class="btn btn-primary btn-lg flex-1 text-xl"
				onclick={onPlayAgain}
			>
				🔄 Pelaa uudelleen
			</button>
			<button 
				class="btn btn-outline btn-lg flex-1 text-xl"
				onclick={onHome}
			>
				🏠 Kotiin
			</button>
		</div>
	</div>
</div>
