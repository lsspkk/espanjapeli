import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import KidsWrongFeedback from './KidsWrongFeedback.svelte';

describe('KidsWrongFeedback', () => {
	it('renders wrong answer emoji and text', () => {
		const { container } = render(KidsWrongFeedback, {
			props: {
				wrongImageId: 'dog',
				wrongText: 'el perro',
				emojiDisplay: '🐶',
				displayMode: 'emoji'
			}
		});

		expect(container.textContent).toContain('❌');
		expect(container.textContent).toContain('el perro');
		expect(container.textContent).toContain('🐶');
	});

	it('displays emoji in emoji mode', () => {
		const { container } = render(KidsWrongFeedback, {
			props: {
				wrongImageId: 'cat',
				wrongText: 'el gato',
				emojiDisplay: '🐱',
				displayMode: 'emoji'
			}
		});

		expect(container.textContent).toContain('🐱');
	});

	it('displays SVG image in svg mode', () => {
		const { container } = render(KidsWrongFeedback, {
			props: {
				wrongImageId: 'pig',
				wrongText: 'el cerdo',
				emojiDisplay: '🐷',
				displayMode: 'svg',
				imageFile: '/test-pig.svg'
			}
		});

		const img = container.querySelector('img');
		expect(img).toBeTruthy();
		expect(img?.getAttribute('src')).toBe('/test-pig.svg');
		expect(img?.getAttribute('alt')).toBe('Wrong answer');
	});

	it('has fade-in animation', () => {
		const { container } = render(KidsWrongFeedback, {
			props: {
				wrongImageId: 'house',
				wrongText: 'la casa',
				emojiDisplay: '🏠',
				displayMode: 'emoji'
			}
		});

		const mainDiv = container.querySelector('.animate-fade-in');
		expect(mainDiv).toBeTruthy();
	});

	it('applies red color to wrong text', () => {
		const { container } = render(KidsWrongFeedback, {
			props: {
				wrongImageId: 'water',
				wrongText: 'el agua',
				emojiDisplay: '💧',
				displayMode: 'emoji'
			}
		});

		const wrongTextDiv = container.querySelector('.text-red-600');
		expect(wrongTextDiv).toBeTruthy();
		expect(wrongTextDiv?.textContent).toContain('el agua');
	});

	it('renders without optional imageFile in svg mode', () => {
		const { container } = render(KidsWrongFeedback, {
			props: {
				wrongImageId: 'tree',
				wrongText: 'el árbol',
				emojiDisplay: '🌳',
				displayMode: 'svg'
			}
		});

		// Should fall back to emoji display
		expect(container.textContent).toContain('🌳');
		const img = container.querySelector('img');
		expect(img).toBeFalsy();
	});
});
