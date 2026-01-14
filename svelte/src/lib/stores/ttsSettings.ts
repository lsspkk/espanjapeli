/**
 * TTS Settings Store - Manages Text-to-Speech preferences
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface TTSSettings {
	rate: number; // 0.5 - 2.0, default 0.8
	pitch: number; // 0.5 - 2.0, default 1.0
	volume: number; // 0 - 1, default 1.0
	autoSpeak: boolean; // Auto-speak new words
}

const STORAGE_KEY = 'espanjapeli-tts-settings';

const defaultSettings: TTSSettings = {
	rate: 0.8,
	pitch: 1.0,
	volume: 1.0,
	autoSpeak: true
};

function getInitialSettings(): TTSSettings {
	if (browser) {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				return { ...defaultSettings, ...parsed };
			} catch {
				return defaultSettings;
			}
		}
	}
	return defaultSettings;
}

function createTTSSettingsStore() {
	const { subscribe, set, update } = writable<TTSSettings>(getInitialSettings());

	return {
		subscribe,
		setRate: (rate: number) => {
			update((s) => {
				const newSettings = { ...s, rate: Math.max(0.5, Math.min(2.0, rate)) };
				if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
				return newSettings;
			});
		},
		setPitch: (pitch: number) => {
			update((s) => {
				const newSettings = { ...s, pitch: Math.max(0.5, Math.min(2.0, pitch)) };
				if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
				return newSettings;
			});
		},
		setVolume: (volume: number) => {
			update((s) => {
				const newSettings = { ...s, volume: Math.max(0, Math.min(1, volume)) };
				if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
				return newSettings;
			});
		},
		setAutoSpeak: (autoSpeak: boolean) => {
			update((s) => {
				const newSettings = { ...s, autoSpeak };
				if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
				return newSettings;
			});
		},
		reset: () => {
			if (browser) localStorage.removeItem(STORAGE_KEY);
			set(defaultSettings);
		},
		get: () => get({ subscribe })
	};
}

export const ttsSettings = createTTSSettingsStore();
