import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import KidsImageOptions from './KidsImageOptions.svelte';

describe('KidsImageOptions', () => {
	const mockOptions = [
		{ id: '1', file: '/test1.svg', emojiDisplay: '🐷', isCorrect: true },
		{ id: '2', file: '/test2.svg', emojiDisplay: '🐶', isCorrect: false },
		{ id: '3', file: '/test3.svg', emojiDisplay: '🐱', isCorrect: false },
		{ id: '4', file: '/test4.svg', emojiDisplay: '🐭', isCorrect: false }
	];

	it('renders all options in 2x2 grid', () => {
		const { container } = render(KidsImageOptions, {
			props: {
				options: mockOptions,
				selectedAnswer: null,
				displayMode: 'emoji',
				onSelect: () => {}
			}
		});

		const buttons = container.querySelectorAll('button');
		expect(buttons).toHaveLength(4);
	});

	it('displays emojis in emoji mode', () => {
		const { container } = render(KidsImageOptions, {
			props: {
				options: mockOptions,
				selectedAnswer: null,
				displayMode: 'emoji',
				onSelect: () => {}
			}
		});

		expect(container.textContent).toContain('🐷');
		expect(container.textContent).toContain('🐶');
	});

	it('displays SVG images in svg mode', () => {
		const { container } = render(KidsImageOptions, {
			props: {
				options: mockOptions,
				selectedAnswer: null,
				displayMode: 'svg',
				onSelect: () => {}
			}
		});

		const images = container.querySelectorAll('img');
		expect(images).toHaveLength(4);
		expect(images[0].getAttribute('src')).toBe('/test1.svg');
	});

	it('applies correct styling when correct answer is selected', () => {
		const { container } = render(KidsImageOptions, {
			props: {
				options: mockOptions,
				selectedAnswer: '1',
				displayMode: 'emoji',
				onSelect: () => {}
			}
		});

		const buttons = container.querySelectorAll('button');
		expect(buttons[0].className).toContain('border-green-500');
		expect(buttons[0].className).toContain('ring-green-300');
		expect(buttons[0].className).toContain('scale-105');
	});

	it('applies wrong styling when wrong answer is selected', () => {
		const { container } = render(KidsImageOptions, {
			props: {
				options: mockOptions,
				selectedAnswer: '2',
				displayMode: 'emoji',
				onSelect: () => {}
			}
		});

		const buttons = container.querySelectorAll('button');
		expect(buttons[1].className).toContain('border-red-500');
		expect(buttons[1].className).toContain('opacity-70');
	});

	it('reveals correct answer with pulse animation after wrong selection', () => {
		const { container } = render(KidsImageOptions, {
			props: {
				options: mockOptions,
				selectedAnswer: '2',
				displayMode: 'emoji',
				onSelect: () => {}
			}
		});

		const buttons = container.querySelectorAll('button');
		// First button (correct answer) should have pulse animation
		expect(buttons[0].className).toContain('animate-pulse');
		expect(buttons[0].className).toContain('border-green-500');
	});

	it('disables all buttons after selection', () => {
		const { container } = render(KidsImageOptions, {
			props: {
				options: mockOptions,
				selectedAnswer: '1',
				displayMode: 'emoji',
				onSelect: () => {}
			}
		});

		const buttons = container.querySelectorAll('button');
		buttons.forEach(button => {
			expect(button).toBeDisabled();
		});
	});
});
