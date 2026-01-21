import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import TokenDelayAnimation from './TokenDelayAnimation.svelte';

describe('TokenDelayAnimation', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('shows first token immediately', () => {
		const onComplete = vi.fn();
		const { container } = render(TokenDelayAnimation, {
			props: { count: 3, onComplete }
		});

		const tokens = container.querySelectorAll('.token-container');
		expect(tokens).toHaveLength(3);
		
		// First token should be visible (scale-100 opacity-100)
		expect(tokens[0].classList.contains('scale-100')).toBe(true);
		expect(tokens[0].classList.contains('opacity-100')).toBe(true);
	});

	it('shows tokens sequentially with 1 second intervals', async () => {
		const onComplete = vi.fn();
		const { container } = render(TokenDelayAnimation, {
			props: { count: 3, onComplete }
		});

		// Initially only first token visible
		let tokens = container.querySelectorAll('.token-container');
		expect(tokens[0].classList.contains('scale-100')).toBe(true);
		expect(tokens[1].classList.contains('scale-0')).toBe(true);
		expect(tokens[2].classList.contains('scale-0')).toBe(true);

		// After 1 second, second token appears
		await vi.advanceTimersByTimeAsync(1000);
		tokens = container.querySelectorAll('.token-container');
		expect(tokens[1].classList.contains('scale-100')).toBe(true);
		expect(tokens[2].classList.contains('scale-0')).toBe(true);

		// After another second, third token appears
		await vi.advanceTimersByTimeAsync(1000);
		tokens = container.querySelectorAll('.token-container');
		expect(tokens[2].classList.contains('scale-100')).toBe(true);
	});

	it('calls onComplete after all tokens shown plus 200ms', () => {
		const onComplete = vi.fn();
		render(TokenDelayAnimation, {
			props: { count: 3, onComplete }
		});

		// First token shows immediately
		expect(onComplete).not.toHaveBeenCalled();

		// After 1 second, second token
		vi.advanceTimersByTime(1000);
		expect(onComplete).not.toHaveBeenCalled();

		// After another second, third token
		vi.advanceTimersByTime(1000);
		expect(onComplete).not.toHaveBeenCalled();

		// After 200ms more, onComplete fires
		vi.advanceTimersByTime(200);
		expect(onComplete).toHaveBeenCalledOnce();
	});

	it('handles single token correctly', () => {
		const onComplete = vi.fn();
		const { container } = render(TokenDelayAnimation, {
			props: { count: 1, onComplete }
		});

		const tokens = container.querySelectorAll('.token-container');
		expect(tokens).toHaveLength(1);
		expect(tokens[0].classList.contains('scale-100')).toBe(true);

		// Should call onComplete after 200ms
		expect(onComplete).not.toHaveBeenCalled();
		vi.advanceTimersByTime(200);
		expect(onComplete).toHaveBeenCalledOnce();
	});

	it('renders different themes correctly', () => {
		const themes = ['dots', 'eggs', 'puddles', 'raindrops', 'suns'];
		
		themes.forEach(theme => {
			const { container } = render(TokenDelayAnimation, {
				props: { count: 1, theme, onComplete: vi.fn() }
			});

			const token = container.querySelector('.token-container div');
			expect(token).toBeTruthy();
			// Each theme should have different styling
			expect(token?.className).toBeTruthy();
		});
	});

	it('renders with vertical layout', () => {
		const { container } = render(TokenDelayAnimation, {
			props: { count: 2, layout: 'vertical', onComplete: vi.fn() }
		});

		const wrapper = container.querySelector('.flex');
		expect(wrapper?.classList.contains('flex-col')).toBe(true);
	});

	it('renders with horizontal layout by default', () => {
		const { container } = render(TokenDelayAnimation, {
			props: { count: 2, onComplete: vi.fn() }
		});

		const wrapper = container.querySelector('.flex');
		expect(wrapper?.classList.contains('flex-row')).toBe(true);
		expect(wrapper?.classList.contains('flex-col')).toBe(false);
	});

	it('cleans up timers on unmount', () => {
		const onComplete = vi.fn();
		const { unmount } = render(TokenDelayAnimation, {
			props: { count: 3, onComplete }
		});

		// Unmount before completion
		unmount();

		// Advance time - onComplete should not be called
		vi.advanceTimersByTime(5000);
		expect(onComplete).not.toHaveBeenCalled();
	});
});
