import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import KidsCelebration from './KidsCelebration.svelte';

describe('KidsCelebration', () => {
	it('renders celebration emoji and text', () => {
		const { container } = render(KidsCelebration, {
			props: {
				emoji: '🎉',
				spanishPhrase: 'el perro',
				finnishPhrase: 'koira',
				displayMode: 'emoji',
				emojiDisplay: '🐶'
			}
		});

		expect(container.textContent).toContain('🎉');
		expect(container.textContent).toContain('¡Muy bien!');
		expect(container.textContent).toContain('el perro');
		expect(container.textContent).toContain('= koira');
	});

	it('displays emoji in emoji mode', () => {
		const { container } = render(KidsCelebration, {
			props: {
				emoji: '⭐',
				spanishPhrase: 'el gato',
				finnishPhrase: 'kissa',
				displayMode: 'emoji',
				emojiDisplay: '🐱'
			}
		});

		expect(container.textContent).toContain('🐱');
	});

	it('displays SVG image in svg mode', () => {
		const { container } = render(KidsCelebration, {
			props: {
				emoji: '🏆',
				spanishPhrase: 'el cerdo',
				finnishPhrase: 'sika',
				displayMode: 'svg',
				imageFile: '/test-pig.svg'
			}
		});

		const img = container.querySelector('img');
		expect(img).toBeTruthy();
		expect(img?.getAttribute('src')).toBe('/test-pig.svg');
		expect(img?.className).toContain('border-green-500');
	});

	it('has bounce animation', () => {
		const { container } = render(KidsCelebration, {
			props: {
				emoji: '🌟',
				spanishPhrase: 'la casa',
				finnishPhrase: 'talo',
				displayMode: 'emoji',
				emojiDisplay: '🏠'
			}
		});

		const mainDiv = container.querySelector('.animate-bounce');
		expect(mainDiv).toBeTruthy();
	});

	it('renders without optional imageFile', () => {
		const { container } = render(KidsCelebration, {
			props: {
				emoji: '🎊',
				spanishPhrase: 'el agua',
				finnishPhrase: 'vesi',
				displayMode: 'svg'
			}
		});

		expect(container.textContent).toContain('el agua');
		expect(container.textContent).toContain('= vesi');
	});
});
