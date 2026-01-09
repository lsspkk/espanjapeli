import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import GameHeader from './GameHeader.svelte';

describe('GameHeader', () => {
	it('renders current question and total questions', () => {
		const { getByText } = render(GameHeader, {
			props: {
				currentQuestion: 3,
				totalQuestions: 10,
				score: 45,
				onQuit: () => {}
			}
		});

		expect(getByText(/3\/10/)).toBeTruthy();
	});

	it('displays score correctly', () => {
		const { getByText } = render(GameHeader, {
			props: {
				currentQuestion: 5,
				totalQuestions: 10,
				score: 27,
				onQuit: () => {}
			}
		});

		expect(getByText(/27 p/)).toBeTruthy();
	});

	it('renders tries indicator when provided', () => {
		const { container } = render(GameHeader, {
			props: {
				currentQuestion: 1,
				totalQuestions: 10,
				score: 0,
				onQuit: () => {},
				triesRemaining: 2,
				maxTries: 3
			}
		});

		// Should render TriesIndicator component
		const triesIndicator = container.querySelector('[class*="flex gap-1"]');
		expect(triesIndicator).toBeTruthy();
	});

	it('renders quit button', () => {
		const { getByText } = render(GameHeader, {
			props: {
				currentQuestion: 1,
				totalQuestions: 10,
				score: 0,
				onQuit: () => {}
			}
		});

		expect(getByText('✕')).toBeTruthy();
	});
});
