<script lang="ts">
	export let start: { x: number; y: number } | null = null;
	export let end: { x: number; y: number } | null = null;
	export let visible: boolean = false;
	export let color: 'success' | 'error' = 'success';

	$: lineColor = color === 'success' ? 'stroke-success' : 'stroke-error';
</script>

{#if visible && start && end}
	<svg class="absolute inset-0 w-full h-full pointer-events-none z-10">
		<line 
			x1={start.x} 
			y1={start.y} 
			x2={end.x} 
			y2={end.y}
			class="{lineColor} animate-line"
			stroke-width="3"
			stroke-linecap="round"
		/>
	</svg>
{/if}
