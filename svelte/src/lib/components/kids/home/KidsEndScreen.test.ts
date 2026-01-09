import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import KidsEndScreen from './KidsEndScreen.svelte';

describe('KidsEndScreen', () => {
	const defaultProps = {
		correctCount: 7,
		totalQuestions: 10,
		onPlayAgain: vi.fn(),
		onHome: vi.fn()
	};

	it('displays correct score', () => {
		const { getByText } = render(KidsEndScreen, defaultProps);
		
		expect(getByText('7 / 10')).toBeTruthy();
		expect(getByText('oikein')).toBeTruthy();
	});

	it('shows trophy emoji for high score (≥80%)', () => {
		const { container } = render(KidsEndScreen, {
			...defaultProps,
			correctCount: 8,
			totalQuestions: 10
		});
		
		expect(container.textContent).toContain('🏆');
		expect(container.textContent).toContain('Loistavaa! 🎉');
	});

	it('shows star emoji for medium score (≥50%)', () => {
		const { container } = render(KidsEndScreen, {
			...defaultProps,
			correctCount: 6,
			totalQuestions: 10
		});
		
		expect(container.textContent).toContain('⭐');
		expect(container.textContent).toContain('Hyvä työ! 🌟');
	});

	it('shows muscle emoji for low score (<50%)', () => {
		const { container } = render(KidsEndScreen, {
			...defaultProps,
			correctCount: 3,
			totalQuestions: 10
		});
		
		expect(container.textContent).toContain('💪');
		expect(container.textContent).toContain('Hyvä yritys! 💪');
	});

	it('displays decorative bouncing emojis', () => {
		const { container } = render(KidsEndScreen, defaultProps);
		
		expect(container.textContent).toContain('🐷');
		expect(container.textContent).toContain('🌈');
		expect(container.textContent).toContain('🎨');
		expect(container.textContent).toContain('⭐');
		
		const bouncingElements = container.querySelectorAll('.animate-bounce');
		expect(bouncingElements.length).toBeGreaterThanOrEqual(4);
	});

	it('calls onPlayAgain when play again button is clicked', async () => {
		const onPlayAgain = vi.fn();
		const { getByText } = render(KidsEndScreen, {
			...defaultProps,
			onPlayAgain
		});
		
		const playAgainButton = getByText('🔄 Pelaa uudelleen').closest('button');
		await fireEvent.click(playAgainButton!);
		
		expect(onPlayAgain).toHaveBeenCalled();
	});

	it('calls onHome when home button is clicked', async () => {
		const onHome = vi.fn();
		const { getByText } = render(KidsEndScreen, {
			...defaultProps,
			onHome
		});
		
		const homeButton = getByText('🏠 Kotiin').closest('button');
		await fireEvent.click(homeButton!);
		
		expect(onHome).toHaveBeenCalled();
	});

	it('has play again button with primary styling', () => {
		const { getByText } = render(KidsEndScreen, defaultProps);
		
		const playAgainButton = getByText('🔄 Pelaa uudelleen').closest('button');
		expect(playAgainButton?.classList.contains('btn-primary')).toBe(true);
	});

	it('has home button with outline styling', () => {
		const { getByText } = render(KidsEndScreen, defaultProps);
		
		const homeButton = getByText('🏠 Kotiin').closest('button');
		expect(homeButton?.classList.contains('btn-outline')).toBe(true);
	});

	it('calculates percentage correctly for perfect score', () => {
		const { container } = render(KidsEndScreen, {
			...defaultProps,
			correctCount: 10,
			totalQuestions: 10
		});
		
		expect(container.textContent).toContain('🏆');
		expect(container.textContent).toContain('Loistavaa! 🎉');
	});

	it('calculates percentage correctly for zero score', () => {
		const { container } = render(KidsEndScreen, {
			...defaultProps,
			correctCount: 0,
			totalQuestions: 10
		});
		
		expect(container.textContent).toContain('💪');
		expect(container.textContent).toContain('Hyvä yritys! 💪');
	});
});
