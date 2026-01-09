<script lang="ts">
	export let direction: 'spanish' | 'finnish' = 'spanish';
	export let onChange: (direction: 'spanish' | 'finnish') => void = () => {};

	function handleChange(newDirection: 'spanish' | 'finnish') {
		onChange(newDirection);
	}

	$: helperText = direction === 'spanish' 
		? 'Näet espanjankielisen sanan, valitse suomenkielinen käännös'
		: 'Näet suomenkielisen sanan, valitse espanjankielinen käännös';
</script>

<div class="form-control mb-6">
	<div class="flex items-center justify-center gap-2 p-2 bg-base-200 rounded-lg">
		<button 
			class="btn btn-sm gap-2 flex-1"
			class:btn-primary={direction === 'spanish'}
			class:btn-ghost={direction !== 'spanish'}
			on:click={() => handleChange('spanish')}
		>
			<span class="text-xl">🇪🇸</span>
			<span>Espanja</span>
		</button>
		<div class="divider divider-horizontal mx-0">→</div>
		<button 
			class="btn btn-sm gap-2 flex-1"
			class:btn-primary={direction === 'finnish'}
			class:btn-ghost={direction !== 'finnish'}
			on:click={() => handleChange('finnish')}
		>
			<span class="text-xl">🇫🇮</span>
			<span>Suomi</span>
		</button>
	</div>
	<p class="text-xs text-center text-base-content/50 mt-1">
		{helperText}
	</p>
</div>
