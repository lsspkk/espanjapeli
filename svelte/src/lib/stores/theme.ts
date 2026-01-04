/**
 * Theme Store - Manages DaisyUI theme selection
 */

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Available DaisyUI themes
export const availableThemes = [
	{ value: 'light', name: 'Light', emoji: '☀️' },
	{ value: 'cupcake', name: 'Cupcake', emoji: '🧁' },
	{ value: 'bumblebee', name: 'Bumblebee', emoji: '🐝' },
	{ value: 'emerald', name: 'Emerald', emoji: '💚' },
	{ value: 'corporate', name: 'Corporate', emoji: '💼' },
	{ value: 'retro', name: 'Retro', emoji: '🕹️' },
	{ value: 'garden', name: 'Garden', emoji: '🌸' },
	{ value: 'forest', name: 'Forest', emoji: '🌲' },
	{ value: 'lofi', name: 'Lo-Fi', emoji: '🎧' },
	{ value: 'pastel', name: 'Pastel', emoji: '🎨' },
	{ value: 'fantasy', name: 'Fantasy', emoji: '🦄' },
	{ value: 'wireframe', name: 'Wireframe', emoji: '📐' },
	{ value: 'autumn', name: 'Autumn', emoji: '🍂' },
	{ value: 'winter', name: 'Winter', emoji: '❄️' }
] as const;

export type Theme = typeof availableThemes[number]['value'];

const STORAGE_KEY = 'espanjapeli-theme';

// Get initial theme from localStorage or default to 'light'
function getInitialTheme(): Theme {
	if (browser) {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored && availableThemes.some(t => t.value === stored)) {
			return stored as Theme;
		}
	}
	return 'light';
}

// Create the store
function createThemeStore() {
	const { subscribe, set, update } = writable<Theme>(getInitialTheme());

	return {
		subscribe,
		set: (value: Theme) => {
			if (browser) {
				localStorage.setItem(STORAGE_KEY, value);
			}
			set(value);
		},
		reset: () => {
			if (browser) {
				localStorage.removeItem(STORAGE_KEY);
			}
			set('light');
		}
	};
}

export const theme = createThemeStore();

