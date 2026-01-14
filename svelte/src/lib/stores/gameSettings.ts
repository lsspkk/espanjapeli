/**
 * Game Settings Store - Manages game preferences
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface GameSettings {
	prioritizeFrequency: boolean; // Focus on most common words (top 1000)
}

const STORAGE_KEY = 'espanjapeli-game-settings';

const defaultSettings: GameSettings = {
	prioritizeFrequency: true // Default to ON for better learning outcomes
};

function getInitialSettings(): GameSettings {
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

function createGameSettingsStore() {
	const { subscribe, set, update } = writable<GameSettings>(getInitialSettings());

	return {
		subscribe,
		setPrioritizeFrequency: (prioritizeFrequency: boolean) => {
			update((s) => {
				const newSettings = { ...s, prioritizeFrequency };
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

export const gameSettings = createGameSettingsStore();
