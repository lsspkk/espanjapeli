import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import FeedbackOverlay from './FeedbackOverlay.svelte';

describe('FeedbackOverlay', () => {
	it('renders correct feedback with exclamation', () => {
		const { getByText } = render(FeedbackOverlay, {
			props: {
				visible: true,
				isCorrect: true,
				exclamation: '¡Muy bien!',
				primaryWord: 'hola',
				secondaryWord: 'hei',
				pointsEarned: 10,
				animationIn: 'animate-pop-in',
				animationOut: 'animate-pop-out',
				closing: false,
				onContinue: () => {}
			}
		});

		expect(getByText('¡Muy bien!')).toBeTruthy();
		expect(getByText('hola = hei')).toBeTruthy();
		expect(getByText('+10 pistettä')).toBeTruthy();
	});

	it('renders wrong feedback without exclamation', () => {
		const { getByText, queryByText } = render(FeedbackOverlay, {
			props: {
				visible: true,
				isCorrect: false,
				exclamation: '',
				primaryWord: 'casa',
				secondaryWord: 'talo',
				pointsEarned: 0,
				animationIn: 'animate-pop-in',
				animationOut: 'animate-pop-out',
				closing: false,
				onContinue: () => {}
			}
		});

		expect(getByText('casa = talo')).toBeTruthy();
		expect(queryByText(/¡/)).toBeNull();
	});

	it('shows continue button for wrong answers', () => {
		const { getByText } = render(FeedbackOverlay, {
			props: {
				visible: true,
				isCorrect: false,
				exclamation: '',
				primaryWord: 'perro',
				secondaryWord: 'koira',
				pointsEarned: 0,
				animationIn: 'animate-pop-in',
				animationOut: 'animate-pop-out',
				closing: false,
				onContinue: () => {}
			}
		});

		expect(getByText('Seuraava')).toBeTruthy();
	});

	it('does not render when not visible', () => {
		const { container } = render(FeedbackOverlay, {
			props: {
				visible: false,
				isCorrect: true,
				exclamation: '¡Bien!',
				primaryWord: 'test',
				secondaryWord: 'testi',
				pointsEarned: 10,
				animationIn: 'animate-pop-in',
				animationOut: 'animate-pop-out',
				closing: false,
				onContinue: () => {}
			}
		});

		expect(container.querySelector('.fixed')).toBeNull();
	});
});
