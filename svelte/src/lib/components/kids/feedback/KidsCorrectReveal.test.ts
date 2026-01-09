import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import KidsCorrectReveal from './KidsCorrectReveal.svelte';

describe('KidsCorrectReveal', () => {
	it('renders checkmark emoji', () => {
		const { container } = render(KidsCorrectReveal, {
			spanishPhrase: 'el perro',
			finnishPhrase: 'koira',
			imageFile: '/test.svg',
			emojiDisplay: '🐕',
			displayMode: 'svg'
		});
		
		expect(container.textContent).toContain('✅');
	});

	it('displays Spanish and Finnish phrases', () => {
		const { getByText } = render(KidsCorrectReveal, {
			spanishPhrase: 'el perro',
			finnishPhrase: 'koira',
			imageFile: '/test.svg',
			emojiDisplay: '🐕',
			displayMode: 'svg'
		});
		
		expect(getByText('el perro')).toBeTruthy();
		expect(getByText('= koira')).toBeTruthy();
	});

	it('shows SVG image when displayMode is svg', () => {
		const { container } = render(KidsCorrectReveal, {
			spanishPhrase: 'el perro',
			finnishPhrase: 'koira',
			imageFile: '/test.svg',
			emojiDisplay: '🐕',
			displayMode: 'svg'
		});
		
		const img = container.querySelector('img');
		expect(img).toBeTruthy();
		expect(img?.src).toContain('/test.svg');
		expect(img?.classList.contains('border-green-500')).toBe(true);
	});

	it('shows emoji when displayMode is emoji', () => {
		const { container } = render(KidsCorrectReveal, {
			spanishPhrase: 'el perro',
			finnishPhrase: 'koira',
			imageFile: '/test.svg',
			emojiDisplay: '🐕',
			displayMode: 'emoji'
		});
		
		expect(container.textContent).toContain('🐕');
		const img = container.querySelector('img');
		expect(img).toBeFalsy();
	});

	it('applies fade-in animation class', () => {
		const { container } = render(KidsCorrectReveal, {
			spanishPhrase: 'el perro',
			finnishPhrase: 'koira',
			imageFile: '/test.svg',
			emojiDisplay: '🐕',
			displayMode: 'svg'
		});
		
		const mainDiv = container.querySelector('.animate-fade-in');
		expect(mainDiv).toBeTruthy();
	});
});
