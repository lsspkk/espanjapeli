import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import KidsStartScreen from './KidsStartScreen.svelte';

describe('KidsStartScreen', () => {
	const defaultProps = {
		title: 'Pipsan ystävät',
		subtitle: 'Kuuntele ja valitse oikea kuva!',
		subtitleSpanish: 'Escucha y elige la imagen correcta',
		previewImages: ['/img1.svg', '/img2.svg'],
		autoPlayAudio: true,
		onToggleAudio: vi.fn(),
		onStart: vi.fn(),
		onOpenSanakirja: vi.fn()
	};

	it('renders title and subtitles', () => {
		const { getByText } = render(KidsStartScreen, defaultProps);
		
		expect(getByText('Pipsan ystävät')).toBeTruthy();
		expect(getByText('Kuuntele ja valitse oikea kuva!')).toBeTruthy();
		expect(getByText('Escucha y elige la imagen correcta')).toBeTruthy();
	});

	it('displays emoji header', () => {
		const { container } = render(KidsStartScreen, defaultProps);
		
		expect(container.textContent).toContain('🐷👫🇪🇸');
	});

	it('shows preview images', () => {
		const { container } = render(KidsStartScreen, defaultProps);
		
		const images = container.querySelectorAll('img');
		expect(images.length).toBe(2);
		expect(images[0].src).toContain('/img1.svg');
		expect(images[1].src).toContain('/img2.svg');
	});

	it('displays preview mode labels', () => {
		const { getByText } = render(KidsStartScreen, defaultProps);
		
		expect(getByText('🖼️ Kuvavinkki')).toBeTruthy();
		expect(getByText('😀 Emoji-vinkki')).toBeTruthy();
	});

	it('shows emoji preview examples', () => {
		const { container } = render(KidsStartScreen, defaultProps);
		
		expect(container.textContent).toContain('🐷💦🟤👢😄');
		expect(container.textContent).toContain('🐷👆💗✨');
	});

	it('renders audio toggle with correct state', () => {
		const { container } = render(KidsStartScreen, defaultProps);
		
		const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
		expect(checkbox).toBeTruthy();
		expect(checkbox.checked).toBe(true);
	});

	it('calls onToggleAudio when audio toggle is clicked', async () => {
		const onToggleAudio = vi.fn();
		const { container } = render(KidsStartScreen, {
			...defaultProps,
			onToggleAudio
		});
		
		const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
		await fireEvent.click(checkbox);
		
		expect(onToggleAudio).toHaveBeenCalledWith(false);
	});

	it('calls onStart when start button is clicked', async () => {
		const onStart = vi.fn();
		const { getByText } = render(KidsStartScreen, {
			...defaultProps,
			onStart
		});
		
		const startButton = getByText('Aloita').closest('button');
		await fireEvent.click(startButton!);
		
		expect(onStart).toHaveBeenCalled();
	});

	it('calls onOpenSanakirja when sanakirja button is clicked', async () => {
		const onOpenSanakirja = vi.fn();
		const { getByText } = render(KidsStartScreen, {
			...defaultProps,
			onOpenSanakirja
		});
		
		const sanakirjaButton = getByText('Sanakirja').closest('button');
		await fireEvent.click(sanakirjaButton!);
		
		expect(onOpenSanakirja).toHaveBeenCalled();
	});

	it('has gradient title styling', () => {
		const { container } = render(KidsStartScreen, defaultProps);
		
		const title = container.querySelector('h1');
		expect(title?.classList.contains('bg-gradient-to-r')).toBe(true);
		expect(title?.classList.contains('from-pink-500')).toBe(true);
		expect(title?.classList.contains('to-purple-500')).toBe(true);
	});

	it('has start button with game emoji', () => {
		const { container } = render(KidsStartScreen, defaultProps);
		
		expect(container.textContent).toContain('🎮');
	});

	it('has sanakirja button with book emoji', () => {
		const { container } = render(KidsStartScreen, defaultProps);
		
		expect(container.textContent).toContain('📖');
	});
});
