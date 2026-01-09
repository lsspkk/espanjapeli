import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import KidsSanakirja from './KidsSanakirja.svelte';

describe('KidsSanakirja', () => {
	const upcomingPhrases = [
		{ spanish: 'el perro', finnish: 'koira' },
		{ spanish: 'el gato', finnish: 'kissa' }
	];

	const previousGames = [
		[
			{ spanish: 'la casa', finnish: 'talo' },
			{ spanish: 'el coche', finnish: 'auto' }
		],
		[
			{ spanish: 'el agua', finnish: 'vesi' }
		]
	];

	const defaultProps = {
		isOpen: true,
		upcomingPhrases,
		previousGames,
		onClose: vi.fn(),
		onSpeak: vi.fn()
	};

	it('does not render when isOpen is false', () => {
		const { container } = render(KidsSanakirja, {
			...defaultProps,
			isOpen: false
		});
		
		expect(container.querySelector('.fixed')).toBeFalsy();
	});

	it('renders when isOpen is true', () => {
		const { getByText } = render(KidsSanakirja, defaultProps);
		
		expect(getByText('Sanakirja')).toBeTruthy();
	});

	it('displays upcoming phrases with pink gradient background', () => {
		const { getByText, container } = render(KidsSanakirja, defaultProps);
		
		expect(getByText('el perro')).toBeTruthy();
		expect(getByText('koira')).toBeTruthy();
		expect(getByText('el gato')).toBeTruthy();
		expect(getByText('kissa')).toBeTruthy();
		
		const pinkCards = container.querySelectorAll('.from-pink-50');
		expect(pinkCards.length).toBeGreaterThan(0);
	});

	it('displays previous games with separators', () => {
		const { getByText } = render(KidsSanakirja, defaultProps);
		
		expect(getByText('Edellisen pelin sanat')).toBeTruthy();
		expect(getByText('2. viimeisen pelin sanat')).toBeTruthy();
		
		expect(getByText('la casa')).toBeTruthy();
		expect(getByText('talo')).toBeTruthy();
		expect(getByText('el agua')).toBeTruthy();
		expect(getByText('vesi')).toBeTruthy();
	});

	it('calls onClose when close button is clicked', async () => {
		const onClose = vi.fn();
		const { container } = render(KidsSanakirja, {
			...defaultProps,
			onClose
		});
		
		const closeButton = container.querySelector('.btn-circle');
		await fireEvent.click(closeButton!);
		
		expect(onClose).toHaveBeenCalled();
	});

	it('calls onClose when bottom close button is clicked', async () => {
		const onClose = vi.fn();
		const { getByText } = render(KidsSanakirja, {
			...defaultProps,
			onClose
		});
		
		const closeButton = getByText('Sulje').closest('button');
		await fireEvent.click(closeButton!);
		
		expect(onClose).toHaveBeenCalled();
	});

	it('calls onSpeak when TTS button is clicked', async () => {
		const onSpeak = vi.fn();
		const { container } = render(KidsSanakirja, {
			...defaultProps,
			onSpeak
		});
		
		const ttsButtons = container.querySelectorAll('.btn-circle.btn-xs');
		await fireEvent.click(ttsButtons[0]);
		
		expect(onSpeak).toHaveBeenCalledWith('el perro', 'koira');
	});

	it('has gradient header with book emoji', () => {
		const { container } = render(KidsSanakirja, defaultProps);
		
		const header = container.querySelector('.bg-gradient-to-r');
		expect(header?.classList.contains('from-pink-500')).toBe(true);
		expect(header?.classList.contains('to-purple-500')).toBe(true);
		expect(container.textContent).toContain('📖');
	});

	it('renders TTS buttons for all phrases', () => {
		const { container } = render(KidsSanakirja, defaultProps);
		
		const ttsButtons = container.querySelectorAll('.btn-circle.btn-xs');
		// 2 upcoming + 2 in first previous game + 1 in second previous game = 5
		expect(ttsButtons.length).toBe(5);
	});

	it('handles empty finnish translation', () => {
		const { getByText } = render(KidsSanakirja, {
			...defaultProps,
			upcomingPhrases: [{ spanish: 'hola', finnish: undefined }]
		});
		
		expect(getByText('hola')).toBeTruthy();
	});

	it('closes on Escape key', async () => {
		const onClose = vi.fn();
		const { container } = render(KidsSanakirja, {
			...defaultProps,
			onClose
		});
		
		const backdrop = container.querySelector('.fixed');
		await fireEvent.keyDown(backdrop!, { key: 'Escape' });
		
		expect(onClose).toHaveBeenCalled();
	});

	it('prevents backdrop click from closing modal content', async () => {
		const onClose = vi.fn();
		const { container } = render(KidsSanakirja, {
			...defaultProps,
			onClose
		});
		
		const modalContent = container.querySelector('[role="dialog"]');
		await fireEvent.click(modalContent!);
		
		// Should not close when clicking modal content
		expect(onClose).not.toHaveBeenCalled();
	});
});
