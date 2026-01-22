/**
 * Theme Store Tests - Verify theme selection and persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { theme, availableThemes, type Theme } from './theme';

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

// Mock browser environment
vi.stubGlobal('localStorage', localStorageMock);

describe('Theme Store', () => {
	beforeEach(() => {
		localStorageMock.clear();
		// Reset theme store to default after clearing localStorage
		theme.reset();
	});

	describe('Available Themes', () => {
		it('should have exactly 14 themes', () => {
			expect(availableThemes).toHaveLength(14);
		});

		it('should include all expected themes', () => {
			const themeValues = availableThemes.map(t => t.value);
			expect(themeValues).toEqual([
				'light',
				'cupcake',
				'bumblebee',
				'emerald',
				'corporate',
				'retro',
				'garden',
				'forest',
				'lofi',
				'pastel',
				'fantasy',
				'wireframe',
				'autumn',
				'winter'
			]);
		});

		it('should have name and emoji for each theme', () => {
			availableThemes.forEach(theme => {
				expect(theme).toHaveProperty('value');
				expect(theme).toHaveProperty('name');
				expect(theme).toHaveProperty('emoji');
				expect(typeof theme.value).toBe('string');
				expect(typeof theme.name).toBe('string');
				expect(typeof theme.emoji).toBe('string');
			});
		});

		it('should have unique theme values', () => {
			const values = availableThemes.map(t => t.value);
			const uniqueValues = new Set(values);
			expect(uniqueValues.size).toBe(availableThemes.length);
		});
	});

	describe('Theme Initialization', () => {
		it('should default to light theme', () => {
			const currentTheme = get(theme);
			expect(currentTheme).toBe('light');
		});

		it('should validate theme from localStorage', () => {
			// Test that valid themes would be accepted
			const validTheme = 'cupcake';
			expect(availableThemes.some(t => t.value === validTheme)).toBe(true);
			
			// Test that invalid themes would be rejected
			const invalidTheme = 'invalid-theme';
			expect(availableThemes.some(t => t.value === invalidTheme)).toBe(false);
		});

		it('should have light as default fallback', () => {
			// Verify light theme exists and is the default
			expect(availableThemes.some(t => t.value === 'light')).toBe(true);
			const currentTheme = get(theme);
			expect(currentTheme).toBe('light');
		});
	});

	describe('Theme Setting', () => {
		it('should update theme when set is called', () => {
			theme.set('cupcake');
			const currentTheme = get(theme);
			expect(currentTheme).toBe('cupcake');
		});

		it('should persist theme to localStorage', () => {
			theme.set('emerald');
			expect(localStorageMock.getItem('espanjapeli-theme')).toBe('emerald');
		});

		it('should allow setting any valid theme', () => {
			const validThemes: Theme[] = [
				'light',
				'cupcake',
				'bumblebee',
				'emerald',
				'corporate',
				'retro',
				'garden',
				'forest',
				'lofi',
				'pastel',
				'fantasy',
				'wireframe',
				'autumn',
				'winter'
			];

			validThemes.forEach(themeName => {
				theme.set(themeName);
				expect(get(theme)).toBe(themeName);
				expect(localStorageMock.getItem('espanjapeli-theme')).toBe(themeName);
			});
		});
	});

	describe('Theme Reset', () => {
		it('should reset theme to light', () => {
			theme.set('forest');
			theme.reset();
			expect(get(theme)).toBe('light');
		});

		it('should remove theme from localStorage', () => {
			theme.set('autumn');
			expect(localStorageMock.getItem('espanjapeli-theme')).toBe('autumn');
			theme.reset();
			expect(localStorageMock.getItem('espanjapeli-theme')).toBeNull();
		});
	});

	describe('Theme Categories', () => {
		it('should have light themes', () => {
			const lightThemes = ['light', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'pastel', 'fantasy', 'wireframe'];
			lightThemes.forEach(themeName => {
				const themeExists = availableThemes.some(t => t.value === themeName);
				expect(themeExists).toBe(true);
			});
		});

		it('should have dark themes', () => {
			const darkThemes = ['forest', 'autumn', 'winter'];
			darkThemes.forEach(themeName => {
				const themeExists = availableThemes.some(t => t.value === themeName);
				expect(themeExists).toBe(true);
			});
		});

		it('should have colorful themes', () => {
			const colorfulThemes = ['retro', 'garden', 'lofi'];
			colorfulThemes.forEach(themeName => {
				const themeExists = availableThemes.some(t => t.value === themeName);
				expect(themeExists).toBe(true);
			});
		});
	});

	describe('Theme Metadata', () => {
		it('should have appropriate emojis for themes', () => {
			const emojiMap: Record<string, string> = {
				light: '☀️',
				cupcake: '🧁',
				bumblebee: '🐝',
				emerald: '💚',
				corporate: '💼',
				retro: '🕹️',
				garden: '🌸',
				forest: '🌲',
				lofi: '🎧',
				pastel: '🎨',
				fantasy: '🦄',
				wireframe: '📐',
				autumn: '🍂',
				winter: '❄️'
			};

			availableThemes.forEach(theme => {
				expect(theme.emoji).toBe(emojiMap[theme.value]);
			});
		});

		it('should have readable names for all themes', () => {
			availableThemes.forEach(theme => {
				expect(theme.name.length).toBeGreaterThan(0);
				expect(theme.name).toMatch(/^[A-Z]/); // Starts with capital letter
			});
		});
	});
});
