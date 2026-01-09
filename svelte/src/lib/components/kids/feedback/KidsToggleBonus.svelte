<script lang="ts">
	export let visible: boolean;
	export let amount: number;
</script>

{#if visible}
	<div class="fixed top-24 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-bounce">
		<div class="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-2xl shadow-2xl border-4 border-white">
			<div class="text-center">
				<div class="text-4xl mb-2">🔄</div>
				<div class="text-2xl font-bold">+{amount} vaihtoa!</div>
			</div>
		</div>
	</div>
{/if}
