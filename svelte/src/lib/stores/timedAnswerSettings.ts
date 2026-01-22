/**
 * Timed Answer Settings Store - Manages stepwise reveal delay preferences per game mode
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { GameType } from '$lib/types/game';

export interface TimedAnswerSettings {
	yhdistasanat: number;
	sanapeli: number;
	tarinat: number;
	peppa: number;
	mitasasanoit: number;
}

const STORAGE_KEY = 'espanjapeli-timed-answer-settings';

const defaultSettings: TimedAnswerSettings = {
	yhdistasanat: 3,
	sanapeli: 3,
	tarinat: 3,
	peppa: 3,
	mitasasanoit: 3
};

function getInitialSettings(): TimedAnswerSettings {
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

function createTimedAnswerSettingsStore() {
	const { subscribe, set, update } = writable<TimedAnswerSettings>(getInitialSettings());

	return {
		subscribe,
		getDelay: (gameMode: GameType): number => {
			const settings = get({ subscribe });
			return settings[gameMode];
		},
		setDelay: (gameMode: GameType, seconds: number) => {
			update((s) => {
				const newSettings = { ...s, [gameMode]: seconds };
				if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
				return newSettings;
			});
		},
		reset: () => {
			if (browser) localStorage.removeItem(STORAGE_KEY);
			set(defaultSettings);
		}
	};
}

export const timedAnswerSettings = createTimedAnswerSettingsStore();
