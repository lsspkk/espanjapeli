import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import TestWrapper from './StepwiseReveal.test.wrapper.svelte';

describe('StepwiseReveal', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('shows question slot immediately', () => {
		const { container } = render(TestWrapper, {
			props: {
				delaySeconds: 3
			}
		});

		const questionContent = container.querySelector('.question-content');
		expect(questionContent).toBeTruthy();
		expect(questionContent?.textContent).toContain('Question content');
	});

	it('hides answers slot initially when delay > 0', () => {
		const { container } = render(TestWrapper, {
			props: {
				delaySeconds: 3
			}
		});

		const answersContent = container.querySelector('.answers-content');
		expect(answersContent).toBeTruthy();
		expect(answersContent?.style.opacity).toBe('0');
	});

	it('shows answers slot after delay', async () => {
		const { container } = render(TestWrapper, {
			props: {
				delaySeconds: 3
			}
		});

		let answersContent = container.querySelector('.answers-content');
		expect(answersContent).toBeTruthy();
		expect(answersContent?.style.opacity).toBe('0');

		await vi.advanceTimersByTimeAsync(3000);

		answersContent = container.querySelector('.answers-content');
		expect(answersContent).toBeTruthy();
		expect(answersContent?.style.opacity).toBe('1');
		expect(answersContent?.textContent).toContain('Answer content');
	});

	it('calls onReveal callback when answers appear', () => {
		const onReveal = vi.fn();
		render(TestWrapper, {
			props: {
				delaySeconds: 3,
				onReveal
			}
		});

		expect(onReveal).not.toHaveBeenCalled();

		vi.advanceTimersByTime(3000);

		expect(onReveal).toHaveBeenCalledTimes(1);
	});

	it('shows answers immediately when delay is 0', () => {
		const { container } = render(TestWrapper, {
			props: {
				delaySeconds: 0
			}
		});

		const questionContent = container.querySelector('.question-content');
		const answersContent = container.querySelector('.answers-content');
		
		expect(questionContent).toBeTruthy();
		expect(questionContent?.textContent).toContain('Question content');
		expect(answersContent).toBeTruthy();
		expect(answersContent?.textContent).toContain('Answer content');
	});

	it('calls onReveal immediately when delay is 0', () => {
		const onReveal = vi.fn();
		render(TestWrapper, {
			props: {
				delaySeconds: 0,
				onReveal
			}
		});

		expect(onReveal).toHaveBeenCalledTimes(1);
	});

	it('cleans up timer on component destroy', () => {
		const { unmount } = render(TestWrapper, {
			props: {
				delaySeconds: 3
			}
		});

		const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

		unmount();

		expect(clearTimeoutSpy).toHaveBeenCalled();
	});
});
