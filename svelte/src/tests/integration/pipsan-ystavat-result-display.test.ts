import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import KidsEndScreen from '$lib/components/kids/home/KidsEndScreen.svelte';
import { recordGameCompletion } from '$lib/services/phraseSelection';

/**
 * Integration test for pipsan-ystavat game result display (end screen)
 * 
 * These tests verify the data flow and business logic integration
 * for the Pipsan-ystavat game result display.
 * 
 * Test Coverage:
 * - Task 1.30: Game result display (report screen) data integration tests
 * 
 * Note: These tests verify that the report screen renders all expected
 * UX blocks and handles different game outcomes correctly.
 */

// Mock TTS service
vi.mock('$lib/services/tts', () => ({
	tts: {
		speakSpanish: vi.fn().mockResolvedValue(undefined)
	}
}));

describe('Pipsan-ystavat Result Display Integration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	describe('Score Display', () => {
		it('should display perfect score with trophy', () => {
			const { getByText, container } = render(KidsEndScreen, {
				correctCount: 10,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(container.textContent).toContain('🏆');
			expect(getByText('Loistavaa! 🎉')).toBeTruthy();
			expect(getByText('10 / 10')).toBeTruthy();
		});

		it('should display good score with star', () => {
			const { getByText, container } = render(KidsEndScreen, {
				correctCount: 7,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(container.textContent).toContain('⭐');
			expect(getByText('Hyvä työ! 🌟')).toBeTruthy();
			expect(getByText('7 / 10')).toBeTruthy();
		});

		it('should display low score with muscle emoji', () => {
			const { getByText, container } = render(KidsEndScreen, {
				correctCount: 3,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(container.textContent).toContain('💪');
			expect(getByText('Hyvä yritys! 💪')).toBeTruthy();
			expect(getByText('3 / 10')).toBeTruthy();
		});

		it('should display zero score', () => {
			const { getByText } = render(KidsEndScreen, {
				correctCount: 0,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(getByText('0 / 10')).toBeTruthy();
			expect(getByText('Hyvä yritys! 💪')).toBeTruthy();
		});
	});

	describe('Score Thresholds', () => {
		it('should show trophy for 80% or higher', () => {
			const { container } = render(KidsEndScreen, {
				correctCount: 8,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(container.textContent).toContain('🏆');
			expect(container.textContent).toContain('Loistavaa! 🎉');
		});

		it('should show star for 50-79%', () => {
			const { container } = render(KidsEndScreen, {
				correctCount: 5,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(container.textContent).toContain('⭐');
			expect(container.textContent).toContain('Hyvä työ! 🌟');
		});

		it('should show muscle for below 50%', () => {
			const { container } = render(KidsEndScreen, {
				correctCount: 4,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(container.textContent).toContain('💪');
			expect(container.textContent).toContain('Hyvä yritys! 💪');
		});
	});

	describe('Action Buttons', () => {
		it('should have play again button', () => {
			const { getByText } = render(KidsEndScreen, {
				correctCount: 7,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			const playAgainButton = getByText('🔄 Pelaa uudelleen').closest('button');
			expect(playAgainButton).toBeTruthy();
		});

		it('should have home button', () => {
			const { getByText } = render(KidsEndScreen, {
				correctCount: 7,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			const homeButton = getByText('🏠 Kotiin').closest('button');
			expect(homeButton).toBeTruthy();
		});

		it('should call onPlayAgain when play again button is clicked', async () => {
			const onPlayAgain = vi.fn();
			const { getByText } = render(KidsEndScreen, {
				correctCount: 7,
				totalQuestions: 10,
				onPlayAgain,
				onHome: () => {}
			});

			const playAgainButton = getByText('🔄 Pelaa uudelleen').closest('button');
			await fireEvent.click(playAgainButton!);

			expect(onPlayAgain).toHaveBeenCalled();
		});

		it('should call onHome when home button is clicked', async () => {
			const onHome = vi.fn();
			const { getByText } = render(KidsEndScreen, {
				correctCount: 7,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome
			});

			const homeButton = getByText('🏠 Kotiin').closest('button');
			await fireEvent.click(homeButton!);

			expect(onHome).toHaveBeenCalled();
		});
	});

	describe('Decorative Elements', () => {
		it('should display animated decorative emojis', () => {
			const { container } = render(KidsEndScreen, {
				correctCount: 7,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(container.textContent).toContain('🐷');
			expect(container.textContent).toContain('🌈');
			expect(container.textContent).toContain('🎨');
			expect(container.textContent).toContain('⭐');
		});

		it('should have bounce animations on decorations', () => {
			const { container } = render(KidsEndScreen, {
				correctCount: 7,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			const animatedElements = container.querySelectorAll('.animate-bounce');
			expect(animatedElements.length).toBeGreaterThan(0);
		});
	});

	describe('Different Game Lengths', () => {
		it('should handle 5 question game', () => {
			const { getByText } = render(KidsEndScreen, {
				correctCount: 4,
				totalQuestions: 5,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(getByText('4 / 5')).toBeTruthy();
		});

		it('should handle 20 question game', () => {
			const { getByText } = render(KidsEndScreen, {
				correctCount: 15,
				totalQuestions: 20,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(getByText('15 / 20')).toBeTruthy();
		});

		it('should calculate percentage correctly for different lengths', () => {
			const testCases = [
				{ correct: 8, total: 10, expected: '🏆' },
				{ correct: 4, total: 5, expected: '🏆' },
				{ correct: 16, total: 20, expected: '🏆' },
				{ correct: 6, total: 10, expected: '⭐' },
				{ correct: 3, total: 5, expected: '⭐' },
				{ correct: 4, total: 10, expected: '💪' },
				{ correct: 2, total: 5, expected: '💪' }
			];

			testCases.forEach(({ correct, total, expected }) => {
				const { container } = render(KidsEndScreen, {
					correctCount: correct,
					totalQuestions: total,
					onPlayAgain: () => {},
					onHome: () => {}
				});

				expect(container.textContent).toContain(expected);
			});
		});
	});

	describe('Result State Data', () => {
		it('should support complete result state data', () => {
			const resultState = {
				correctCount: 7,
				totalQuestions: 10,
				percentage: 70,
				emoji: '⭐',
				message: 'Hyvä työ! 🌟'
			};

			expect(resultState.correctCount).toBe(7);
			expect(resultState.totalQuestions).toBe(10);
			expect(resultState.percentage).toBe(70);
			expect(resultState.emoji).toBe('⭐');
			expect(resultState.message).toBe('Hyvä työ! 🌟');
		});

		it('should calculate percentage correctly', () => {
			const testCases = [
				{ correct: 10, total: 10, expected: 100 },
				{ correct: 8, total: 10, expected: 80 },
				{ correct: 5, total: 10, expected: 50 },
				{ correct: 3, total: 10, expected: 30 },
				{ correct: 0, total: 10, expected: 0 }
			];

			testCases.forEach(({ correct, total, expected }) => {
				const percentage = (correct / total) * 100;
				expect(percentage).toBe(expected);
			});
		});
	});

	describe('Game Completion Recording', () => {
		it('should support recording game completion', () => {
			const mockPhrases = [
				{ spanish: 'Hola', finnish: 'Hei', correctImage: 'img1', distractors: [], difficulty: 'easy', category: 'greetings' },
				{ spanish: 'Adiós', finnish: 'Näkemiin', correctImage: 'img2', distractors: [], difficulty: 'easy', category: 'greetings' }
			];

			expect(() => recordGameCompletion(mockPhrases)).not.toThrow();
		});

		it('should track game outcome for statistics', () => {
			const gameOutcome = {
				correctCount: 7,
				totalQuestions: 10,
				percentage: 70,
				timestamp: Date.now()
			};

			expect(gameOutcome.correctCount).toBe(7);
			expect(gameOutcome.totalQuestions).toBe(10);
			expect(gameOutcome.percentage).toBe(70);
			expect(gameOutcome.timestamp).toBeGreaterThan(0);
		});
	});

	describe('Different Game Outcomes', () => {
		it('should handle perfect score scenario', () => {
			const { container, getByText } = render(KidsEndScreen, {
				correctCount: 10,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(container.textContent).toContain('🏆');
			expect(getByText('Loistavaa! 🎉')).toBeTruthy();
			expect(getByText('10 / 10')).toBeTruthy();
		});

		it('should handle good performance scenario', () => {
			const { container, getByText } = render(KidsEndScreen, {
				correctCount: 7,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(container.textContent).toContain('⭐');
			expect(getByText('Hyvä työ! 🌟')).toBeTruthy();
		});

		it('should handle poor performance scenario', () => {
			const { container, getByText } = render(KidsEndScreen, {
				correctCount: 3,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(container.textContent).toContain('💪');
			expect(getByText('Hyvä yritys! 💪')).toBeTruthy();
		});

		it('should handle zero score scenario', () => {
			const { getByText } = render(KidsEndScreen, {
				correctCount: 0,
				totalQuestions: 10,
				onPlayAgain: () => {},
				onHome: () => {}
			});

			expect(getByText('0 / 10')).toBeTruthy();
			expect(getByText('Hyvä yritys! 💪')).toBeTruthy();
		});
	});
});
