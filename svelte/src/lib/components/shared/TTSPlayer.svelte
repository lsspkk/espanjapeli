<script lang="ts">
	import { tts } from '$lib/services/tts';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let text: string;
	export let language: 'spanish' | 'finnish' = 'spanish';
	export let title: string = '';
	export let subtitle: string = '';

	let isPlaying = false;
	let currentIndex = 0;
	let sentences: string[] = [];
	let currentUtterance: SpeechSynthesisUtterance | null = null;

	$: sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
	$: progress = sentences.length > 0 ? (currentIndex / sentences.length) * 100 : 0;

	function play() {
		if (isPlaying || !browser) return;
		
		isPlaying = true;
		currentIndex = 0;
		speakNext();
	}

	function speakNext() {
		if (!browser || currentIndex >= sentences.length) {
			stop();
			return;
		}

		const sentence = sentences[currentIndex].trim();
		const utterance = new SpeechSynthesisUtterance(sentence);
		
		if (language === 'spanish') {
			utterance.lang = 'es-ES';
			utterance.rate = 0.8;
		} else {
			utterance.lang = 'fi-FI';
			utterance.rate = 0.9;
		}

		utterance.pitch = 1.0;
		utterance.volume = 1.0;

		// Wait for this utterance to finish before speaking next
		utterance.onend = () => {
			currentIndex++;
			speakNext();
		};

		utterance.onerror = () => {
			console.error('TTS error, moving to next sentence');
			currentIndex++;
			speakNext();
		};

		currentUtterance = utterance;
		window.speechSynthesis.speak(utterance);
	}

	function stop() {
		if (browser) {
			window.speechSynthesis.cancel();
		}
		if (currentUtterance) {
			currentUtterance.onend = null;
			currentUtterance.onerror = null;
		}
		isPlaying = false;
		currentIndex = 0;
		currentUtterance = null;
	}

	onDestroy(() => {
		stop();
	});
</script>

<div class="flex items-center justify-between gap-2 w-full">
	{#if isPlaying}
		<div class="flex items-center gap-2 flex-1">
			<div class="flex-1">
				<progress class="progress progress-primary w-full h-2" value={progress} max="100"></progress>
			</div>
			<span class="text-sm font-semibold flex-shrink-0">{currentIndex}/{sentences.length}</span>
		</div>
		<button 
			class="btn btn-circle btn-lg flex-shrink-0"
			on:click={stop}
			title="Pysäytä"
		>
			⏸️
		</button>
	{:else}
		<div class="flex-1 min-w-0">
			{#if title}
				<h2 class="text-lg font-bold text-base-content leading-tight">{title}</h2>
			{/if}
			{#if subtitle}
				<p class="text-xs text-base-content/60 leading-tight mt-1">{subtitle}</p>
			{/if}
		</div>
		<button 
			class="btn btn-circle btn-lg flex-shrink-0"
			on:click={play}
			title="Lue koko tarina"
		>
			🔊
		</button>
	{/if}
</div>
