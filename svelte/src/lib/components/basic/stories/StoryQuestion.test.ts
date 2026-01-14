import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import StoryQuestion from './StoryQuestion.svelte';
import type { StoryQuestion as StoryQuestionType } from '$lib/types/story';

const mockQuestion: StoryQuestionType = {
	id: 'q1',
	question: 'Mitä María tilaa?',
	questionSpanish: '¿Qué pide María?',
	options: ['Kahvi', 'Tee', 'Mehu', 'Vesi'],
	correctIndex: 0
};

describe('StoryQuestion', () => {
	it('renders question text', () => {
		render(StoryQuestion, {
			props: {
				question: mockQuestion,
				questionNumber: 1,
				totalQuestions: 5,
				onAnswer: vi.fn()
			}
		});

		expect(screen.getByText('Mitä María tilaa?')).toBeInTheDocument();
	});

	it('renders Spanish question text when provided', () => {
		render(StoryQuestion, {
			props: {
				question: mockQuestion,
				questionNumber: 1,
				totalQuestions: 5,
				onAnswer: vi.fn()
			}
		});

		expect(screen.getByText('¿Qué pide María?')).toBeInTheDocument();
	});

	it('renders all answer options', () => {
		render(StoryQuestion, {
			props: {
				question: mockQuestion,
				questionNumber: 1,
				totalQuestions: 5,
				onAnswer: vi.fn()
			}
		});

		expect(screen.getByText('Kahvi')).toBeInTheDocument();
		expect(screen.getByText('Tee')).toBeInTheDocument();
		expect(screen.getByText('Mehu')).toBeInTheDocument();
		expect(screen.getByText('Vesi')).toBeInTheDocument();
	});

	it('renders answer options with letter badges (A, B, C, D)', () => {
		render(StoryQuestion, {
			props: {
				question: mockQuestion,
				questionNumber: 1,
				totalQuestions: 5,
				onAnswer: vi.fn()
			}
		});

		expect(screen.getByText('A')).toBeInTheDocument();
		expect(screen.getByText('B')).toBeInTheDocument();
		expect(screen.getByText('C')).toBeInTheDocument();
		expect(screen.getByText('D')).toBeInTheDocument();
	});

	it('displays question progress (1/5)', () => {
		render(StoryQuestion, {
			props: {
				question: mockQuestion,
				questionNumber: 1,
				totalQuestions: 5,
				onAnswer: vi.fn()
			}
		});

		expect(screen.getByText('Kysymys 1/5')).toBeInTheDocument();
	});

	it('displays progress dots for all questions', () => {
		const { container } = render(StoryQuestion, {
			props: {
				question: mockQuestion,
				questionNumber: 2,
				totalQuestions: 5,
				onAnswer: vi.fn()
			}
		});

		// Check for 5 progress dots
		const dots = container.querySelectorAll('.w-2.h-2.rounded-full');
		expect(dots.length).toBe(5);
	});

	it('calls onAnswer with correct parameters when option is selected', async () => {
		const onAnswerMock = vi.fn();
		render(StoryQuestion, {
			props: {
				question: mockQuestion,
				questionNumber: 1,
				totalQuestions: 5,
				onAnswer: onAnswerMock
			}
		});

		// Click on the first option (correct answer)
		const kahviButton = screen.getByText('Kahvi').closest('button');
		if (kahviButton) {
			await fireEvent.click(kahviButton);
		}

		expect(onAnswerMock).toHaveBeenCalledWith(0, true);
	});

	it('calls onAnswer with false when wrong option is selected', async () => {
		const onAnswerMock = vi.fn();
		render(StoryQuestion, {
			props: {
				question: mockQuestion,
				questionNumber: 1,
				totalQuestions: 5,
				onAnswer: onAnswerMock
			}
		});

		// Click on the second option (wrong answer)
		const teeButton = screen.getByText('Tee').closest('button');
		if (teeButton) {
			await fireEvent.click(teeButton);
		}

		expect(onAnswerMock).toHaveBeenCalledWith(1, false);
	});

	it('disables buttons after answer is selected', async () => {
		const onAnswerMock = vi.fn();
		render(StoryQuestion, {
			props: {
				question: mockQuestion,
				questionNumber: 1,
				totalQuestions: 5,
				onAnswer: onAnswerMock
			}
		});

		// Click on the first option
		const kahviButton = screen.getByText('Kahvi').closest('button');
		if (kahviButton) {
			await fireEvent.click(kahviButton);
		}

		// All buttons should be disabled
		const buttons = screen.getAllByRole('button');
		buttons.forEach(button => {
			expect(button).toBeDisabled();
		});
	});

	it('uses two-column grid layout on desktop', () => {
		const { container } = render(StoryQuestion, {
			props: {
				question: mockQuestion,
				questionNumber: 1,
				totalQuestions: 5,
				onAnswer: vi.fn()
			}
		});

		// Check for grid layout with md:grid-cols-2
		const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
		expect(gridContainer).toBeInTheDocument();
	});

	it('renders without Spanish question text when not provided', () => {
		const questionWithoutSpanish: StoryQuestionType = {
			id: 'q2',
			question: 'Mitä Juan ostaa?',
			options: ['Omena', 'Banaani', 'Appelsiini', 'Päärynä'],
			correctIndex: 0
		};

		render(StoryQuestion, {
			props: {
				question: questionWithoutSpanish,
				questionNumber: 2,
				totalQuestions: 5,
				onAnswer: vi.fn()
			}
		});

		expect(screen.getByText('Mitä Juan ostaa?')).toBeInTheDocument();
		// Spanish question should not be present
		expect(screen.queryByText(/¿/)).not.toBeInTheDocument();
	});
});
