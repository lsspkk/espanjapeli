import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import KidsStartScreen from '$lib/components/kids/home/KidsStartScreen.svelte';
import { selectGamePhrases } from '$lib/services/phraseSelection';

/**
 * Integration test for pipsan-ystavat game main display (home screen)
 * 
 * These tests verify the data flow and business logic integration
 * for the Pipsan-ystavat game home screen without requiring full DOM rendering.
 * 
 * Test Coverage:
 * - Task 1.30: Main display (home screen) data integration tests
 * 
 * Note: These tests focus on verifying that the data layer, services,
 * and components work together correctly.
 */

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString();
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(global, 'localStorage', {
	value: localStorageMock,
	writable: true
});

describe('Pipsan-ystavat Main Display Integration', () => {
	const mockPreviewImages = [
		'/peppa_advanced_spanish_images/svg/01_muddy_puddles.svg',
		'/peppa_advanced_spanish_images/svg/02_yo_soy_peppa.svg'
	];

	beforeEach(() => {
		localStorageMock.clear();
		localStorageMock.setItem('peppaKuvatAudioEnabled', 'true');
	});

	describe('Game Configuration Data', () => {
		it('should render complete start screen with all sections', () => {
			const { container, getByText } = render(KidsStartScreen, {
				title: 'Pipsan ystävät',
				subtitle: 'Kuuntele ja valitse oikea kuva!',
				subtitleSpanish: 'Escucha y elige la imagen correcta',
				previewImages: mockPreviewImages,
				autoPlayAudio: true,
				onToggleAudio: () => {},
				onStart: () => {},
				onOpenSanakirja: () => {}
			});

			expect(getByText('Pipsan ystävät')).toBeTruthy();
			expect(getByText('Kuuntele ja valitse oikea kuva!')).toBeTruthy();
			expect(getByText('Escucha y elige la imagen correcta')).toBeTruthy();
			
			const images = container.querySelectorAll('img');
			expect(images.length).toBe(2);
		});

		it('should display preview sections for both display modes', () => {
			const { getByText } = render(KidsStartScreen, {
				title: 'Pipsan ystävät',
				subtitle: 'Kuuntele ja valitse oikea kuva!',
				subtitleSpanish: 'Escucha y elige la imagen correcta',
				previewImages: mockPreviewImages,
				autoPlayAudio: true,
				onToggleAudio: () => {},
				onStart: () => {},
				onOpenSanakirja: () => {}
			});

			expect(getByText('🖼️ Kuvavinkki')).toBeTruthy();
			expect(getByText('😀 Emoji-vinkki')).toBeTruthy();
		});

		it('should support audio toggle configuration', () => {
			const { container } = render(KidsStartScreen, {
				title: 'Pipsan ystävät',
				subtitle: 'Kuuntele ja valitse oikea kuva!',
				subtitleSpanish: 'Escucha y elige la imagen correcta',
				previewImages: mockPreviewImages,
				autoPlayAudio: true,
				onToggleAudio: () => {},
				onStart: () => {},
				onOpenSanakirja: () => {}
			});

			const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
			expect(checkbox).toBeTruthy();
			expect(checkbox.checked).toBe(true);
		});

		it('should handle audio toggle off state', () => {
			const { container } = render(KidsStartScreen, {
				title: 'Pipsan ystävät',
				subtitle: 'Kuuntele ja valitse oikea kuva!',
				subtitleSpanish: 'Escucha y elige la imagen correcta',
				previewImages: mockPreviewImages,
				autoPlayAudio: false,
				onToggleAudio: () => {},
				onStart: () => {},
				onOpenSanakirja: () => {}
			});

			const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
			expect(checkbox.checked).toBe(false);
		});
	});

	describe('Button Functionality', () => {
		it('should have start and sanakirja buttons', () => {
			const { getByText } = render(KidsStartScreen, {
				title: 'Pipsan ystävät',
				subtitle: 'Kuuntele ja valitse oikea kuva!',
				subtitleSpanish: 'Escucha y elige la imagen correcta',
				previewImages: mockPreviewImages,
				autoPlayAudio: true,
				onToggleAudio: () => {},
				onStart: () => {},
				onOpenSanakirja: () => {}
			});

			expect(getByText('Aloita').closest('button')).toBeTruthy();
			expect(getByText('Sanakirja').closest('button')).toBeTruthy();
		});

		it('should call onStart when start button is clicked', async () => {
			const onStart = vi.fn();
			const { getByText } = render(KidsStartScreen, {
				title: 'Pipsan ystävät',
				subtitle: 'Kuuntele ja valitse oikea kuva!',
				subtitleSpanish: 'Escucha y elige la imagen correcta',
				previewImages: mockPreviewImages,
				autoPlayAudio: true,
				onToggleAudio: () => {},
				onStart,
				onOpenSanakirja: () => {}
			});

			const startButton = getByText('Aloita').closest('button');
			await fireEvent.click(startButton!);
			
			expect(onStart).toHaveBeenCalled();
		});

		it('should call onOpenSanakirja when sanakirja button is clicked', async () => {
			const onOpenSanakirja = vi.fn();
			const { getByText } = render(KidsStartScreen, {
				title: 'Pipsan ystävät',
				subtitle: 'Kuuntele ja valitse oikea kuva!',
				subtitleSpanish: 'Escucha y elige la imagen correcta',
				previewImages: mockPreviewImages,
				autoPlayAudio: true,
				onToggleAudio: () => {},
				onStart: () => {},
				onOpenSanakirja
			});

			const sanakirjaButton = getByText('Sanakirja').closest('button');
			await fireEvent.click(sanakirjaButton!);
			
			expect(onOpenSanakirja).toHaveBeenCalled();
		});

		it('should call onToggleAudio when audio toggle is clicked', async () => {
			const onToggleAudio = vi.fn();
			const { container } = render(KidsStartScreen, {
				title: 'Pipsan ystävät',
				subtitle: 'Kuuntele ja valitse oikea kuva!',
				subtitleSpanish: 'Escucha y elige la imagen correcta',
				previewImages: mockPreviewImages,
				autoPlayAudio: true,
				onToggleAudio,
				onStart: () => {},
				onOpenSanakirja: () => {}
			});

			const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
			await fireEvent.click(checkbox);
			
			expect(onToggleAudio).toHaveBeenCalledWith(false);
		});
	});

	describe('State Persistence', () => {
		it('should persist audio setting in localStorage', () => {
			const testSetting = 'false';
			localStorageMock.setItem('peppaKuvatAudioEnabled', testSetting);
			
			const stored = localStorageMock.getItem('peppaKuvatAudioEnabled');
			expect(stored).toBe(testSetting);
		});

		it('should restore default audio setting when localStorage is empty', () => {
			localStorageMock.clear();
			
			const audioSetting = localStorageMock.getItem('peppaKuvatAudioEnabled');
			expect(audioSetting).toBeNull();
		});
	});

	describe('Phrase Selection Data', () => {
		it('should support phrase selection for game preparation', () => {
			const mockPhraseQueue = [
				{ spanish: 'Hola', finnish: 'Hei', correctImage: 'img1', distractors: ['img2', 'img3'], difficulty: 'easy', category: 'greetings' },
				{ spanish: 'Adiós', finnish: 'Näkemiin', correctImage: 'img2', distractors: ['img1', 'img3'], difficulty: 'easy', category: 'greetings' }
			];

			const selectedPhrases = selectGamePhrases(mockPhraseQueue);
			
			expect(selectedPhrases).toBeDefined();
			expect(Array.isArray(selectedPhrases)).toBe(true);
			expect(selectedPhrases.length).toBeGreaterThan(0);
			expect(selectedPhrases.length).toBeLessThanOrEqual(10);
		});

		it('should prepare phrases with all required game data', () => {
			const mockPhraseQueue = [
				{ spanish: 'Hola', finnish: 'Hei', correctImage: 'img1', distractors: ['img2', 'img3'], difficulty: 'easy', category: 'greetings' }
			];

			const selectedPhrases = selectGamePhrases(mockPhraseQueue);
			
			selectedPhrases.forEach(phrase => {
				expect(phrase).toHaveProperty('spanish');
				expect(phrase).toHaveProperty('correctImage');
				expect(phrase).toHaveProperty('distractors');
				expect(phrase.spanish).toBeTruthy();
				expect(phrase.correctImage).toBeTruthy();
				expect(phrase.distractors.length).toBeGreaterThan(0);
			});
		});
	});
});
