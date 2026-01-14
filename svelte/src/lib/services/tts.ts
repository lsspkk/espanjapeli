// TTS (Text-to-Speech) Service
// Ported from vanilla JS to TypeScript for Svelte

import { browser } from '$app/environment';
import { ttsSettings, type TTSSettings } from '$lib/stores/ttsSettings';

class TTSService {
	private speechSynthesis: SpeechSynthesis | null = null;
	private spanishVoice: SpeechSynthesisVoice | null = null;
	private finnishVoice: SpeechSynthesisVoice | null = null;
	private initialized = false;
	private settings: TTSSettings = { rate: 0.8, pitch: 1.0, volume: 1.0, autoSpeak: true };

	constructor() {
		if (browser) {
			this.speechSynthesis = window.speechSynthesis;
			this.init();
			// Subscribe to settings changes
			ttsSettings.subscribe((s) => {
				this.settings = s;
			});
		}
	}

	/**
	 * Initialize voices - finds Spanish and Finnish voices
	 */
	private initializeVoices(): void {
		if (!this.speechSynthesis) return;

		const voices = this.speechSynthesis.getVoices();
		console.log(
			'🔊 Available voices:',
			voices.map((v) => `${v.name} (${v.lang})`)
		);

		// Find Spanish voice (prefer es-ES, fallback to any Spanish)
		this.spanishVoice =
			voices.find((v) => v.lang === 'es-ES') ||
			voices.find((v) => v.lang.startsWith('es')) ||
			voices.find((v) => v.lang === 'es-MX') ||
			voices.find((v) => v.lang === 'es-US') ||
			null;

		// Find Finnish voice (if available)
		this.finnishVoice =
			voices.find((v) => v.lang === 'fi-FI') || voices.find((v) => v.lang.startsWith('fi')) || null;

		if (this.spanishVoice) {
			console.log('✅ Spanish voice found:', this.spanishVoice.name);
		} else {
			console.warn('⚠️ No Spanish voice available, using default');
		}

		if (this.finnishVoice) {
			console.log('✅ Finnish voice found:', this.finnishVoice.name);
		} else {
			console.log('ℹ️ No Finnish voice available, will use default');
		}
	}

	/**
	 * Speak text in Spanish
	 * @param text - Text to speak
	 */
	speakSpanish(text: string): void {
		if (!this.speechSynthesis || !browser) return;

		// Cancel any ongoing speech
		this.speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = 'es-ES';
		utterance.rate = this.settings.rate;
		utterance.pitch = this.settings.pitch;
		utterance.volume = this.settings.volume;

		if (this.spanishVoice) {
			utterance.voice = this.spanishVoice;
		}

		console.log('🔊 Speaking in Spanish:', text);
		this.speechSynthesis.speak(utterance);
	}

	/**
	 * Speak text in Finnish
	 * @param text - Text to speak
	 */
	speakFinnish(text: string): void {
		if (!this.speechSynthesis || !browser) return;

		// Cancel any ongoing speech
		this.speechSynthesis.cancel();

		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = 'fi-FI';
		utterance.rate = this.settings.rate + 0.1; // Finnish slightly faster
		utterance.pitch = this.settings.pitch;
		utterance.volume = this.settings.volume;

		if (this.finnishVoice) {
			utterance.voice = this.finnishVoice;
		}

		console.log('🔊 Speaking in Finnish:', text);
		this.speechSynthesis.speak(utterance);
	}

	/**
	 * Speak Spanish word, then Finnish phrase sequentially
	 * @param spanishText - Spanish text to speak first
	 * @param finnishText - Finnish text to speak after Spanish finishes
	 */
	speakSpanishThenFinnish(spanishText: string, finnishText: string): void {
		if (!this.speechSynthesis || !browser) return;

		// Cancel any ongoing speech
		this.speechSynthesis.cancel();

		// Create Spanish utterance
		const spanishUtterance = new SpeechSynthesisUtterance(spanishText);
		spanishUtterance.lang = 'es-ES';
		spanishUtterance.rate = this.settings.rate;
		spanishUtterance.pitch = this.settings.pitch;
		spanishUtterance.volume = this.settings.volume;

		if (this.spanishVoice) {
			spanishUtterance.voice = this.spanishVoice;
		}

		// Create Finnish utterance
		const finnishUtterance = new SpeechSynthesisUtterance(finnishText);
		finnishUtterance.lang = 'fi-FI';
		finnishUtterance.rate = this.settings.rate + 0.1;
		finnishUtterance.pitch = this.settings.pitch;
		finnishUtterance.volume = this.settings.volume;

		if (this.finnishVoice) {
			finnishUtterance.voice = this.finnishVoice;
		}

		// Chain: when Spanish finishes, speak Finnish
		spanishUtterance.onend = () => {
			console.log('🔊 Speaking in Finnish:', finnishText);
			this.speechSynthesis!.speak(finnishUtterance);
		};

		console.log('🔊 Speaking in Spanish:', spanishText);
		this.speechSynthesis.speak(spanishUtterance);
	}

	/**
	 * Cancel any ongoing speech
	 */
	cancel(): void {
		if (!this.speechSynthesis || !browser) return;
		this.speechSynthesis.cancel();
	}

	/**
	 * Initialize the TTS service
	 * Sets up voices and listens for async voice loading
	 */
	private init(): void {
		if (!this.speechSynthesis || this.initialized) return;

		this.initializeVoices();

		// Voices may load asynchronously, so listen for when they're available
		if (this.speechSynthesis.onvoiceschanged !== undefined) {
			this.speechSynthesis.onvoiceschanged = () => this.initializeVoices();
		}

		this.initialized = true;
		console.log('🔊 TTS Service initialized');
	}
}

// Export singleton instance
export const tts = new TTSService();
