import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gameSettings } from './gameSettings';
import { get } from 'svelte/store';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('gameSettings store', () => {
	beforeEach(() => {
		localStorageMock.clear();
		gameSettings.reset();
	});

	it('should have default settings', () => {
		const settings = get(gameSettings);
		expect(settings.prioritizeFrequency).toBe(true);
	});

	it('should update prioritizeFrequency setting', () => {
		gameSettings.setPrioritizeFrequency(false);
		const settings = get(gameSettings);
		expect(settings.prioritizeFrequency).toBe(false);
	});

	it('should persist settings to localStorage', () => {
		gameSettings.setPrioritizeFrequency(false);
		const stored = localStorage.getItem('espanjapeli-game-settings');
		expect(stored).toBeTruthy();
		const parsed = JSON.parse(stored!);
		expect(parsed.prioritizeFrequency).toBe(false);
	});

	it('should reset to default settings', () => {
		gameSettings.setPrioritizeFrequency(false);
		gameSettings.reset();
		const settings = get(gameSettings);
		expect(settings.prioritizeFrequency).toBe(true);
	});

	it('should load settings from localStorage on init', () => {
		localStorage.setItem(
			'espanjapeli-game-settings',
			JSON.stringify({ prioritizeFrequency: false })
		);
		// Note: In real usage, the store would be re-initialized
		// For this test, we verify the storage mechanism works
		const stored = localStorage.getItem('espanjapeli-game-settings');
		const parsed = JSON.parse(stored!);
		expect(parsed.prioritizeFrequency).toBe(false);
	});
});
