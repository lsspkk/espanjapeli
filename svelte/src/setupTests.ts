import '@testing-library/jest-dom/vitest';
import { afterEach, vi, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Mock global alert for tests
beforeAll(() => {
	global.alert = vi.fn();
});

// Clean up after each test
// Note: cleanup() is already optimized in @testing-library/svelte
// It only cleans up if there's something to clean
afterEach(() => {
	cleanup();
	// Clear all mocks to prevent test pollution
	// This is more efficient than individual vi.clearAllMocks() in each test
	vi.clearAllMocks();
});

// Shared test utilities to reduce duplication across test files
// These help reduce the overhead of recreating mocks in every test

export const mockLocalStorage = () => {
	const storage: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => storage[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			storage[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete storage[key];
		}),
		clear: vi.fn(() => {
			Object.keys(storage).forEach(key => delete storage[key]);
		}),
		get length() {
			return Object.keys(storage).length;
		},
		key: vi.fn((index: number) => Object.keys(storage)[index] || null)
	};
};

// Mock TTS for tests
export const mockTTS = () => {
	return {
		speak: vi.fn(),
		stop: vi.fn(),
		isSpeaking: vi.fn(() => false)
	};
};

// Mock fetch for tests
export const mockFetch = (response: any) => {
	return vi.fn(() => 
		Promise.resolve({
			ok: true,
			json: () => Promise.resolve(response),
			text: () => Promise.resolve(JSON.stringify(response))
		})
	);
};
