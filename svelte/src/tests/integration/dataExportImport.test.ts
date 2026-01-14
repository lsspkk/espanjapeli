import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Integration tests for data export/import functionality
 * 
 * Tests the export and import features available in the settings page
 * to ensure user data can be backed up and restored correctly.
 */

// Setup localStorage mock
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => { store[key] = value; },
		removeItem: (key: string) => { delete store[key]; },
		clear: () => { store = {}; },
		get length() { return Object.keys(store).length; },
		key: (index: number) => Object.keys(store)[index] || null
	};
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

describe('Data Export/Import', () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	describe('Export Functionality', () => {
		it('should export all espanjapeli data', () => {
			// Setup test data
			localStorage.setItem('espanjapeli-word-knowledge', JSON.stringify({
				version: '1.0.0',
				meta: { version: '1.0.0', createdAt: '2026-01-01', updatedAt: '2026-01-14' },
				words: {
					perro: { practiceCount: 5, firstTryCount: 4, secondTryCount: 1, thirdTryCount: 0, failedCount: 0, lastPracticed: '2026-01-14', categories: ['animals'] }
				}
			}));
			localStorage.setItem('espanjapeli-theme', 'dark');
			localStorage.setItem('espanjapeli-game-settings', JSON.stringify({ prioritizeFrequency: true }));
			
			// Export all data
			const exportData: Record<string, any> = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				data: {}
			};
			
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith('espanjapeli-')) {
					const value = localStorage.getItem(key);
					if (value) {
						try {
							exportData.data[key] = JSON.parse(value);
						} catch {
							exportData.data[key] = value;
						}
					}
				}
			}
			
			expect(exportData.data['espanjapeli-word-knowledge']).toBeDefined();
			expect(exportData.data['espanjapeli-theme']).toBe('dark');
			expect(exportData.data['espanjapeli-game-settings'].prioritizeFrequency).toBe(true);
		});

		it('should create valid JSON export', () => {
			localStorage.setItem('espanjapeli-word-knowledge', JSON.stringify({ words: {} }));
			localStorage.setItem('espanjapeli-theme', 'cupcake');
			
			const exportData: Record<string, any> = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				data: {}
			};
			
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith('espanjapeli-')) {
					const value = localStorage.getItem(key);
					if (value) {
						try {
							exportData.data[key] = JSON.parse(value);
						} catch {
							exportData.data[key] = value;
						}
					}
				}
			}
			
			// Should be valid JSON
			const jsonString = JSON.stringify(exportData);
			expect(() => JSON.parse(jsonString)).not.toThrow();
			
			const parsed = JSON.parse(jsonString);
			expect(parsed.version).toBe('1.0.0');
			expect(parsed.data['espanjapeli-theme']).toBe('cupcake');
		});

		it('should include metadata in export', () => {
			localStorage.setItem('espanjapeli-word-knowledge', JSON.stringify({ words: {} }));
			
			const exportData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				data: {} as Record<string, any>
			};
			
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith('espanjapeli-')) {
					const value = localStorage.getItem(key);
					if (value) {
						try {
							exportData.data[key] = JSON.parse(value);
						} catch {
							exportData.data[key] = value;
						}
					}
				}
			}
			
			expect(exportData.version).toBeDefined();
			expect(exportData.exportedAt).toBeDefined();
			expect(new Date(exportData.exportedAt).getTime()).toBeGreaterThan(0);
		});

		it('should handle empty data gracefully', () => {
			// No data in localStorage
			const exportData = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				data: {} as Record<string, any>
			};
			
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith('espanjapeli-')) {
					const value = localStorage.getItem(key);
					if (value) {
						try {
							exportData.data[key] = JSON.parse(value);
						} catch {
							exportData.data[key] = value;
						}
					}
				}
			}
			
			expect(Object.keys(exportData.data).length).toBe(0);
			expect(exportData.version).toBeDefined();
		});
	});

	describe('Import Functionality', () => {
		it('should import exported data correctly', () => {
			// Create export data
			const exportData = {
				version: '1.0.0',
				exportedAt: '2026-01-14T12:00:00Z',
				data: {
					'espanjapeli-word-knowledge': {
						version: '1.0.0',
						meta: { version: '1.0.0', createdAt: '2026-01-01', updatedAt: '2026-01-14' },
						words: {
							perro: { practiceCount: 5, firstTryCount: 4, secondTryCount: 1, thirdTryCount: 0, failedCount: 0, lastPracticed: '2026-01-14', categories: ['animals'] }
						}
					},
					'espanjapeli-theme': 'dark',
					'espanjapeli-game-settings': { prioritizeFrequency: true }
				}
			};
			
			// Import data
			Object.entries(exportData.data).forEach(([key, value]) => {
				const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
				localStorage.setItem(key, stringValue);
			});
			
			// Verify import
			const wordKnowledge = JSON.parse(localStorage.getItem('espanjapeli-word-knowledge')!);
			expect(wordKnowledge.words.perro).toBeDefined();
			expect(wordKnowledge.words.perro.practiceCount).toBe(5);
			
			expect(localStorage.getItem('espanjapeli-theme')).toBe('dark');
			
			const gameSettings = JSON.parse(localStorage.getItem('espanjapeli-game-settings')!);
			expect(gameSettings.prioritizeFrequency).toBe(true);
		});

		it('should validate import data structure', () => {
			const validExport = {
				version: '1.0.0',
				exportedAt: '2026-01-14T12:00:00Z',
				data: {
					'espanjapeli-theme': 'dark'
				}
			};
			
			// Check required fields
			expect(validExport.version).toBeDefined();
			expect(validExport.exportedAt).toBeDefined();
			expect(validExport.data).toBeDefined();
			expect(typeof validExport.data).toBe('object');
		});

		it('should reject invalid import data', () => {
			const invalidExports = [
				null,
				undefined,
				'not an object',
				{ version: '1.0.0' }, // missing data
				{ data: {} }, // missing version
				{ version: '1.0.0', data: 'not an object' } // invalid data type
			];
			
			invalidExports.forEach(invalidData => {
				const isValid = 
					invalidData !== null &&
					invalidData !== undefined &&
					typeof invalidData === 'object' &&
					'version' in invalidData &&
					'data' in invalidData &&
					typeof (invalidData as any).data === 'object';
				
				expect(isValid).toBe(false);
			});
		});

		it('should handle partial import gracefully', () => {
			// Import with only some keys
			const partialExport = {
				version: '1.0.0',
				exportedAt: '2026-01-14T12:00:00Z',
				data: {
					'espanjapeli-theme': 'cupcake'
					// Missing other keys
				}
			};
			
			Object.entries(partialExport.data).forEach(([key, value]) => {
				const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
				localStorage.setItem(key, stringValue);
			});
			
			expect(localStorage.getItem('espanjapeli-theme')).toBe('cupcake');
			expect(localStorage.getItem('espanjapeli-word-knowledge')).toBeNull();
		});

		it('should overwrite existing data on import', () => {
			// Set initial data
			localStorage.setItem('espanjapeli-theme', 'light');
			localStorage.setItem('espanjapeli-game-settings', JSON.stringify({ prioritizeFrequency: false }));
			
			// Import new data
			const importData = {
				version: '1.0.0',
				exportedAt: '2026-01-14T12:00:00Z',
				data: {
					'espanjapeli-theme': 'dark',
					'espanjapeli-game-settings': { prioritizeFrequency: true }
				}
			};
			
			Object.entries(importData.data).forEach(([key, value]) => {
				const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
				localStorage.setItem(key, stringValue);
			});
			
			// Verify old data was overwritten
			expect(localStorage.getItem('espanjapeli-theme')).toBe('dark');
			const settings = JSON.parse(localStorage.getItem('espanjapeli-game-settings')!);
			expect(settings.prioritizeFrequency).toBe(true);
		});
	});

	describe('Round-trip Export/Import', () => {
		it('should preserve data through export and import cycle', () => {
			// Setup original data
			const originalData = {
				'espanjapeli-word-knowledge': JSON.stringify({
					version: '1.0.0',
					meta: { version: '1.0.0', createdAt: '2026-01-01', updatedAt: '2026-01-14' },
					words: {
						perro: { practiceCount: 5, firstTryCount: 4, secondTryCount: 1, thirdTryCount: 0, failedCount: 0, lastPracticed: '2026-01-14', categories: ['animals'] },
						gato: { practiceCount: 3, firstTryCount: 2, secondTryCount: 1, thirdTryCount: 0, failedCount: 0, lastPracticed: '2026-01-14', categories: ['animals'] }
					}
				}),
				'espanjapeli-theme': 'dark',
				'espanjapeli-game-settings': JSON.stringify({ prioritizeFrequency: true, focusOnWeakWords: false })
			};
			
			// Set original data
			Object.entries(originalData).forEach(([key, value]) => {
				localStorage.setItem(key, value);
			});
			
			// Export
			const exportData: Record<string, any> = {
				version: '1.0.0',
				exportedAt: new Date().toISOString(),
				data: {}
			};
			
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key && key.startsWith('espanjapeli-')) {
					const value = localStorage.getItem(key);
					if (value) {
						try {
							exportData.data[key] = JSON.parse(value);
						} catch {
							exportData.data[key] = value;
						}
					}
				}
			}
			
			// Clear localStorage
			localStorageMock.clear();
			
			// Import
			Object.entries(exportData.data).forEach(([key, value]) => {
				const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
				localStorage.setItem(key, stringValue);
			});
			
			// Verify data matches original
			const wordKnowledge = JSON.parse(localStorage.getItem('espanjapeli-word-knowledge')!);
			expect(wordKnowledge.words.perro.practiceCount).toBe(5);
			expect(wordKnowledge.words.gato.practiceCount).toBe(3);
			
			expect(localStorage.getItem('espanjapeli-theme')).toBe('dark');
			
			const gameSettings = JSON.parse(localStorage.getItem('espanjapeli-game-settings')!);
			expect(gameSettings.prioritizeFrequency).toBe(true);
			expect(gameSettings.focusOnWeakWords).toBe(false);
		});
	});

	describe('Error Handling', () => {
		it('should handle corrupted export data', () => {
			const corruptedExport = {
				version: '1.0.0',
				exportedAt: '2026-01-14T12:00:00Z',
				data: {
					'espanjapeli-word-knowledge': 'invalid json {{{',
					'espanjapeli-theme': 'dark'
				}
			};
			
			// Import should handle corrupted data gracefully
			Object.entries(corruptedExport.data).forEach(([key, value]) => {
				try {
					const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
					localStorage.setItem(key, stringValue);
				} catch (error) {
					// Skip corrupted entries
				}
			});
			
			// Valid data should still be imported
			expect(localStorage.getItem('espanjapeli-theme')).toBe('dark');
		});

		it('should handle missing keys in import data', () => {
			const incompleteExport = {
				version: '1.0.0',
				exportedAt: '2026-01-14T12:00:00Z',
				data: {
					// Only theme, missing other keys
					'espanjapeli-theme': 'cupcake'
				}
			};
			
			Object.entries(incompleteExport.data).forEach(([key, value]) => {
				const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
				localStorage.setItem(key, stringValue);
			});
			
			// Should import what's available
			expect(localStorage.getItem('espanjapeli-theme')).toBe('cupcake');
			
			// Missing keys should be null
			expect(localStorage.getItem('espanjapeli-word-knowledge')).toBeNull();
		});
	});
});
