<script lang="ts">
	export let answers: Array<{ spanish: string; finnish: string; userAnswer?: string }> = [];
</script>

{#if answers.length > 0}
	<div class="mb-4">
		<h3 class="text-lg font-bold mb-2 text-error">Väärät vastaukset:</h3>
		<div class="space-y-2">
			{#each answers as wrong}
				<div class="bg-base-200 border-l-4 border-error rounded-r-lg p-2">
					<div class="flex-1">
						<div class="font-bold text-base">
							<span class="text-primary">{wrong.spanish}</span> = <span class="text-secondary">{wrong.finnish}</span>
						</div>
						{#if wrong.userAnswer}
							<div class="text-sm text-base-content/70">
								Vastasit: {wrong.userAnswer}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
