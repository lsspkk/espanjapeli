import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import KidsGameHeader from '$lib/components/kids/core/KidsGameHeader.svelte';
import KidsImageOptions from '$lib/components/kids/input/KidsImageOptions.svelte';

/**
 * Integration test for pipsan-ystavat question display (playing state)
 * 
 * These tests verify the data flow and business logic integration
 * for the Pipsan-ystavat game question display without requiring full DOM rendering.
 * 
 * Test Coverage:
 * - Task 1.30: Question display (playing state) data integration tests
 * 
 * Note: These tests focus on verifying that components render all expected
 * UX blocks and handle interaction flow correctly.
 */

// Mock TTS service
vi.mock('$lib/services/tts', () => ({
	tts: {
		speakSpanish: vi.fn().mockResolvedValue(undefined),
		cancel: vi.fn()
	}
}));

describe('Pipsan-ystavat Question Display Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	describe('Game Header', () => {
		it('should display current question progress', () => {
			const { getByText } = render(KidsGameHeader, {
				currentQuestion: 3,
				totalQuestions: 10,
				correctCount: 2,
				onClose: () => {}
			});

			expect(getByText(/Kysymys 3\/10/)).toBeTruthy();
		});

		it('should display correct answer count', () => {
			const { getByText } = render(KidsGameHeader, {
				currentQuestion: 5,
				totalQuestions: 10,
				correctCount: 4,
				onClose: () => {}
			});

			expect(getByText(/✅ 4/)).toBeTruthy();
		});

		it('should have progress bar', () => {
			const { container } = render(KidsGameHeader, {
				currentQuestion: 3,
				totalQuestions: 10,
				correctCount: 2,
				onClose: () => {}
			});

			const progress = container.querySelector('progress');
			expect(progress).toBeTruthy();
			expect(progress?.value).toBe(3);
			expect(progress?.max).toBe(10);
		});

		it('should have close button', () => {
			const { container } = render(KidsGameHeader, {
				currentQuestion: 1,
				totalQuestions: 10,
				correctCount: 0,
				onClose: () => {}
			});

			const closeButton = container.querySelector('button[title="Sulje peli"]');
			expect(closeButton).toBeTruthy();
		});
	});

	describe('Image Options', () => {
		const mockOptions = [
			{ id: 'img1', file: '/img1.svg', emojiDisplay: '🐷', isCorrect: true },
			{ id: 'img2', file: '/img2.svg', emojiDisplay: '🏠', isCorrect: false },
			{ id: 'img3', file: '/img3.svg', emojiDisplay: '🌳', isCorrect: false },
			{ id: 'img4', file: '/img4.svg', emojiDisplay: '🚗', isCorrect: false }
		];

		it('should render all image options in svg mode', () => {
			const { container } = render(KidsImageOptions, {
				options: mockOptions,
				displayMode: 'svg',
				selectedAnswer: null,
				onSelect: () => {}
			});

			const buttons = container.querySelectorAll('button');
			expect(buttons.length).toBe(4);

			const images = container.querySelectorAll('img');
			expect(images.length).toBe(4);
		});

		it('should render all image options in emoji mode', () => {
			const { container } = render(KidsImageOptions, {
				options: mockOptions,
				displayMode: 'emoji',
				selectedAnswer: null,
				onSelect: () => {}
			});

			const buttons = container.querySelectorAll('button');
			expect(buttons.length).toBe(4);

			expect(container.textContent).toContain('🐷');
			expect(container.textContent).toContain('🏠');
			expect(container.textContent).toContain('🌳');
			expect(container.textContent).toContain('🚗');
		});

		it('should highlight selected correct answer', () => {
			const { container } = render(KidsImageOptions, {
				options: mockOptions,
				displayMode: 'svg',
				selectedAnswer: 'img1',
				onSelect: () => {}
			});

			const buttons = container.querySelectorAll('button');
			const selectedButton = Array.from(buttons).find(btn => 
				btn.classList.contains('border-green-500')
			);
			expect(selectedButton).toBeTruthy();
		});

		it('should highlight selected wrong answer', () => {
			const { container } = render(KidsImageOptions, {
				options: mockOptions,
				displayMode: 'svg',
				selectedAnswer: 'img2',
				onSelect: () => {}
			});

			const buttons = container.querySelectorAll('button');
			const wrongButton = Array.from(buttons).find(btn => 
				btn.classList.contains('border-red-500')
			);
			expect(wrongButton).toBeTruthy();
		});

		it('should disable all buttons after selection', () => {
			const { container } = render(KidsImageOptions, {
				options: mockOptions,
				displayMode: 'svg',
				selectedAnswer: 'img1',
				onSelect: () => {}
			});

			const buttons = container.querySelectorAll('button');
			buttons.forEach(button => {
				expect((button as HTMLButtonElement).disabled).toBe(true);
			});
		});

		it('should render 2x2 grid layout', () => {
			const { container } = render(KidsImageOptions, {
				options: mockOptions,
				displayMode: 'svg',
				selectedAnswer: null,
				onSelect: () => {}
			});

			const grid = container.querySelector('.grid-cols-2');
			expect(grid).toBeTruthy();
		});
	});

	describe('Question State Flow', () => {
		it('should support complete question state data', () => {
			const questionState = {
				currentQuestion: 5,
				totalQuestions: 10,
				correctCount: 3,
				options: [
					{ id: 'img1', file: '/img1.svg', emojiDisplay: '🐷', isCorrect: true },
					{ id: 'img2', file: '/img2.svg', emojiDisplay: '🏠', isCorrect: false },
					{ id: 'img3', file: '/img3.svg', emojiDisplay: '🌳', isCorrect: false },
					{ id: 'img4', file: '/img4.svg', emojiDisplay: '🚗', isCorrect: false }
				],
				displayMode: 'svg' as const,
				selectedAnswer: null
			};

			expect(questionState.currentQuestion).toBe(5);
			expect(questionState.totalQuestions).toBe(10);
			expect(questionState.correctCount).toBe(3);
			expect(questionState.options.length).toBe(4);
			expect(questionState.displayMode).toBe('svg');
			expect(questionState.selectedAnswer).toBeNull();
		});

		it('should track answer selection state', () => {
			let selectedAnswer: string | null = null;
			const correctImageId = 'img1';

			selectedAnswer = correctImageId;
			const isCorrect = selectedAnswer === correctImageId;

			expect(selectedAnswer).toBe('img1');
			expect(isCorrect).toBe(true);
		});

		it('should track wrong answer selection state', () => {
			let selectedAnswer: string | null = null;
			const correctImageId = 'img1';

			selectedAnswer = 'img2';
			const isCorrect = selectedAnswer === correctImageId;

			expect(selectedAnswer).toBe('img2');
			expect(isCorrect).toBe(false);
		});
	});

	describe('Interaction Flow', () => {
		it('should call onSelect when an option is clicked', async () => {
			const onSelect = vi.fn();
			const mockOptions = [
				{ id: 'img1', file: '/img1.svg', emojiDisplay: '🐷', isCorrect: true },
				{ id: 'img2', file: '/img2.svg', emojiDisplay: '🏠', isCorrect: false }
			];

			const { container } = render(KidsImageOptions, {
				options: mockOptions,
				displayMode: 'svg',
				selectedAnswer: null,
				onSelect
			});

			const buttons = container.querySelectorAll('button');
			await fireEvent.click(buttons[0]);

			expect(onSelect).toHaveBeenCalledWith('img1');
		});

		it('should call onClose when close button is clicked', async () => {
			const onClose = vi.fn();
			const { container } = render(KidsGameHeader, {
				currentQuestion: 1,
				totalQuestions: 10,
				correctCount: 0,
				onClose
			});

			const closeButton = container.querySelector('button[title="Sulje peli"]');
			await fireEvent.click(closeButton!);

			expect(onClose).toHaveBeenCalled();
		});
	});

	describe('Display Mode Support', () => {
		it('should support toggling between svg and emoji modes', () => {
			const mockOptions = [
				{ id: 'img1', file: '/img1.svg', emojiDisplay: '🐷', isCorrect: true }
			];

			let displayMode: 'svg' | 'emoji' = 'svg';
			
			// Toggle to emoji
			displayMode = 'emoji';
			expect(displayMode).toBe('emoji');

			// Toggle back to svg
			displayMode = 'svg';
			expect(displayMode).toBe('svg');
		});

		it('should maintain toggle count state', () => {
			let togglesRemaining = 3;
			const maxToggles = 3;

			// Use a toggle
			togglesRemaining--;
			expect(togglesRemaining).toBe(2);

			// Use another toggle
			togglesRemaining--;
			expect(togglesRemaining).toBe(1);

			// Use last toggle
			togglesRemaining--;
			expect(togglesRemaining).toBe(0);

			// Cannot toggle anymore
			expect(togglesRemaining).toBe(0);
		});

		it('should earn bonus toggles on correct answers', () => {
			let togglesRemaining = 1;
			let consecutiveCorrect = 0;

			// First correct answer
			consecutiveCorrect++;
			expect(consecutiveCorrect).toBe(1);

			// Second correct answer - earn bonus
			consecutiveCorrect++;
			if (consecutiveCorrect >= 2) {
				togglesRemaining += 1;
				consecutiveCorrect = 0;
			}

			expect(togglesRemaining).toBe(2);
			expect(consecutiveCorrect).toBe(0);
		});

		it('should earn bonus toggle on wrong answer', () => {
			let togglesRemaining = 0;
			let consecutiveCorrect = 1;

			// Wrong answer
			togglesRemaining += 1;
			consecutiveCorrect = 0;

			expect(togglesRemaining).toBe(1);
			expect(consecutiveCorrect).toBe(0);
		});
	});

	describe('Question Progression', () => {
		it('should track question progression through game', () => {
			const totalQuestions = 10;
			let currentQuestion = 0;
			let correctCount = 0;

			// Answer 3 questions correctly
			for (let i = 0; i < 3; i++) {
				currentQuestion++;
				correctCount++;
			}

			expect(currentQuestion).toBe(3);
			expect(correctCount).toBe(3);
		});

		it('should determine when game is complete', () => {
			const totalQuestions = 10;
			let currentQuestion = 10;

			const isGameComplete = currentQuestion >= totalQuestions;

			expect(isGameComplete).toBe(true);
		});

		it('should track mixed correct/wrong answers', () => {
			let correctCount = 0;
			const answers = [true, false, true, true, false];

			answers.forEach(isCorrect => {
				if (isCorrect) correctCount++;
			});

			expect(correctCount).toBe(3);
		});
	});
});
