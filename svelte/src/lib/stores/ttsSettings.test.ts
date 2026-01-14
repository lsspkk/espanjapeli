import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';

// Mock browser environment and localStorage before importing the store
vi.mock('$app/environment', () => ({
	browser: true
}));

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('TTS Settings Store', () => {
	beforeEach(async () => {
		vi.resetModules();
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it('has default values', async () => {
		const { ttsSettings } = await import('./ttsSettings');
		const settings = get(ttsSettings);

		expect(settings.rate).toBe(0.8);
		expect(settings.pitch).toBe(1.0);
		expect(settings.volume).toBe(1.0);
		expect(settings.autoSpeak).toBe(true);
	});

	it('setRate updates rate and persists', async () => {
		const { ttsSettings } = await import('./ttsSettings');

		ttsSettings.setRate(1.2);
		const settings = get(ttsSettings);

		expect(settings.rate).toBe(1.2);
		expect(localStorageMock.setItem).toHaveBeenCalled();
	});

	it('setRate clamps value to valid range', async () => {
		const { ttsSettings } = await import('./ttsSettings');

		ttsSettings.setRate(3.0);
		expect(get(ttsSettings).rate).toBe(2.0);

		ttsSettings.setRate(0.1);
		expect(get(ttsSettings).rate).toBe(0.5);
	});

	it('setPitch updates pitch', async () => {
		const { ttsSettings } = await import('./ttsSettings');

		ttsSettings.setPitch(1.5);
		expect(get(ttsSettings).pitch).toBe(1.5);
	});

	it('setVolume updates volume', async () => {
		const { ttsSettings } = await import('./ttsSettings');

		ttsSettings.setVolume(0.5);
		expect(get(ttsSettings).volume).toBe(0.5);
	});

	it('setVolume clamps value to valid range', async () => {
		const { ttsSettings } = await import('./ttsSettings');

		ttsSettings.setVolume(1.5);
		expect(get(ttsSettings).volume).toBe(1);

		ttsSettings.setVolume(-0.5);
		expect(get(ttsSettings).volume).toBe(0);
	});

	it('setAutoSpeak updates autoSpeak', async () => {
		const { ttsSettings } = await import('./ttsSettings');

		ttsSettings.setAutoSpeak(false);
		expect(get(ttsSettings).autoSpeak).toBe(false);
	});

	it('reset restores default values', async () => {
		const { ttsSettings } = await import('./ttsSettings');

		ttsSettings.setRate(1.5);
		ttsSettings.setPitch(0.7);
		ttsSettings.reset();

		const settings = get(ttsSettings);
		expect(settings.rate).toBe(0.8);
		expect(settings.pitch).toBe(1.0);
		expect(localStorageMock.removeItem).toHaveBeenCalled();
	});
});
