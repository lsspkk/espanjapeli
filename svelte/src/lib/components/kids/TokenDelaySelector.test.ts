import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import TokenDelaySelector from './TokenDelaySelector.svelte';
import { timedAnswerSettings } from '$lib/stores/timedAnswerSettings';

describe('TokenDelaySelector', () => {
	beforeEach(() => {
		// Reset store before each test
		timedAnswerSettings.reset();
		localStorage.clear();
	});

	it('displays current value correctly', () => {
		const { container } = render(TokenDelaySelector, {
			props: { value: 2, onChange: vi.fn() }
		});

		const slots = container.querySelectorAll('.token-slot');
		expect(slots).toHaveLength(4);

		// First 2 should be filled (value = 2)
		expect(slots[0].querySelector('.shadow-md')).toBeTruthy();
		expect(slots[1].querySelector('.shadow-md')).toBeTruthy();
		expect(slots[2].querySelector('.border-dashed')).toBeTruthy();
		expect(slots[3].querySelector('.border-dashed')).toBeTruthy();
	});

	it('displays value 0 correctly (all empty)', () => {
		const { container } = render(TokenDelaySelector, {
			props: { value: 0, onChange: vi.fn() }
		});

		const slots = container.querySelectorAll('.token-slot');
		slots.forEach(slot => {
			expect(slot.querySelector('.border-dashed')).toBeTruthy();
		});
	});

	it('displays value 3 correctly (all filled)', () => {
		const { container } = render(TokenDelaySelector, {
			props: { value: 3, onChange: vi.fn() }
		});

		const slots = container.querySelectorAll('.token-slot');
		expect(slots[0].querySelector('.shadow-md')).toBeTruthy();
		expect(slots[1].querySelector('.shadow-md')).toBeTruthy();
		expect(slots[2].querySelector('.shadow-md')).toBeTruthy();
		expect(slots[3].querySelector('.border-dashed')).toBeTruthy();
	});

	it('calls onChange when clicking to increase value', async () => {
		const onChange = vi.fn();
		const { container } = render(TokenDelaySelector, {
			props: { value: 1, onChange }
		});

		const slots = container.querySelectorAll('.token-slot');
		
		// Click second slot to increase to 2
		await fireEvent.click(slots[1]);
		expect(onChange).toHaveBeenCalledWith(2);
	});

	it('calls onChange when clicking to decrease value', async () => {
		const onChange = vi.fn();
		const { container } = render(TokenDelaySelector, {
			props: { value: 2, onChange }
		});

		const slots = container.querySelectorAll('.token-slot');
		
		// Click second slot (current position) to decrease to 1
		await fireEvent.click(slots[1]);
		expect(onChange).toHaveBeenCalledWith(1);
	});

	it('respects minimum value of 0', async () => {
		const onChange = vi.fn();
		const { container } = render(TokenDelaySelector, {
			props: { value: 1, onChange }
		});

		const slots = container.querySelectorAll('.token-slot');
		
		// Click first slot to decrease
		await fireEvent.click(slots[0]);
		expect(onChange).toHaveBeenCalledWith(0);
		
		// Value should not go below 0
		const call = onChange.mock.calls[0][0];
		expect(call).toBeGreaterThanOrEqual(0);
	});

	it('respects maximum value of 3', async () => {
		const onChange = vi.fn();
		const { container } = render(TokenDelaySelector, {
			props: { value: 2, onChange }
		});

		const slots = container.querySelectorAll('.token-slot');
		
		// Click fourth slot to increase to 3
		await fireEvent.click(slots[3]);
		expect(onChange).toHaveBeenCalledWith(3);
		
		// Value should not exceed 3
		const call = onChange.mock.calls[0][0];
		expect(call).toBeLessThanOrEqual(3);
	});

	it('renders different themes correctly', () => {
		const themes = ['dots', 'eggs', 'puddles', 'raindrops', 'suns'];
		
		themes.forEach(theme => {
			const { container } = render(TokenDelaySelector, {
				props: { value: 2, theme, onChange: vi.fn() }
			});

			const filledToken = container.querySelector('.shadow-md');
			expect(filledToken).toBeTruthy();
			// Each theme should have different styling
			expect(filledToken?.className).toBeTruthy();
		});
	});

	it('has accessible labels for each slot', () => {
		const { container } = render(TokenDelaySelector, {
			props: { value: 1, onChange: vi.fn() }
		});

		const slots = container.querySelectorAll('.token-slot');
		expect(slots[0].getAttribute('aria-label')).toBe('1 second');
		expect(slots[1].getAttribute('aria-label')).toBe('2 seconds');
		expect(slots[2].getAttribute('aria-label')).toBe('3 seconds');
		expect(slots[3].getAttribute('aria-label')).toBe('4 seconds');
	});

	it('updates visual state when clicking multiple times', async () => {
		const onChange = vi.fn();
		const { container, rerender } = render(TokenDelaySelector, {
			props: { value: 1, onChange }
		});

		const slots = container.querySelectorAll('.token-slot');
		
		// Click to increase
		await fireEvent.click(slots[2]);
		expect(onChange).toHaveBeenCalledWith(3);
		
		// Rerender with new value
		await rerender({ value: 3, onChange });
		
		// Now 3 tokens should be filled
		expect(container.querySelectorAll('.shadow-md')).toHaveLength(3);
	});

	it('uses store value when gameMode is provided', () => {
		// Set a value in the store
		timedAnswerSettings.setDelay('peppa', 2);

		const { container } = render(TokenDelaySelector, {
			props: { gameMode: 'peppa' }
		});

		// Should display 2 filled tokens
		const filledTokens = container.querySelectorAll('.shadow-md');
		expect(filledTokens).toHaveLength(2);
	});

	it('updates store when clicking with gameMode provided', async () => {
		timedAnswerSettings.setDelay('peppa', 1);

		const { container } = render(TokenDelaySelector, {
			props: { gameMode: 'peppa' }
		});

		const slots = container.querySelectorAll('.token-slot');
		
		// Click to increase to 2
		await fireEvent.click(slots[1]);
		
		// Store should be updated
		expect(timedAnswerSettings.getDelay('peppa')).toBe(2);
	});

	it('persists value to localStorage via store', async () => {
		// Start with value 1
		timedAnswerSettings.setDelay('peppa', 1);
		
		const { container } = render(TokenDelaySelector, {
			props: { gameMode: 'peppa' }
		});

		const slots = container.querySelectorAll('.token-slot');
		
		// Click slot 2 (third slot) to set value to 3
		await fireEvent.click(slots[2]);
		
		// Check localStorage
		const stored = localStorage.getItem('espanjapeli-timed-answer-settings');
		expect(stored).toBeTruthy();
		
		const parsed = JSON.parse(stored!);
		expect(parsed.peppa).toBe(3);
	});
});
