<script lang="ts">
	export let value: number = 10;
	export let options: number[] = [10, 21, 42];
	export let onChange: (length: number) => void = () => {};

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = parseInt(target.value, 10);
		onChange(newValue);
	}
</script>

<div class="form-control mb-4">
	<span class="label">
		<span class="label-text font-semibold text-lg">Kysymyksiä:</span>
	</span>
	<div class="flex gap-4">
		{#each options as option}
			<label class="label cursor-pointer gap-2">
				<input 
					type="radio" 
					name="game-length" 
					value={option}
					class="radio radio-primary"
					checked={value === option}
					on:change={handleChange}
				/>
				<span class="label-text text-base">{option}</span>
			</label>
		{/each}
	</div>
</div>
