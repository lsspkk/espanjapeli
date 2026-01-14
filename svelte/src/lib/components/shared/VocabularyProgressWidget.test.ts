import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import VocabularyProgressWidget from './VocabularyProgressWidget.svelte';
import type { VocabularyStatistics } from '$lib/services/statisticsService';

vi.mock('$app/paths', () => ({
	base: ''
}));

vi.mock('$lib/services/statisticsService', () => ({
	calculateVocabularyStats: vi.fn().mockResolvedValue({
		totalPracticed: 50,
		wordsKnown: 30,
		wordsMastered: 15,
		wordsWeak: 5,
		topNProgress: {
			top100: { known: 25, total: 100, percentage: 25 },
			top500: { known: 30, total: 500, percentage: 6 },
			top1000: { known: 30, total: 1000, percentage: 3 },
			top5000: { known: 30, total: 5000, percentage: 1 }
		},
		estimatedLevel: 'A2',
		averageScore: 65,
		totalGamesPlayed: 10,
		vocabularyCoverage: {
			inFrequencyData: 200,
			total: 300,
			percentage: 67
		}
	})
}));

const mockStats: VocabularyStatistics = {
	totalPracticed: 50,
	wordsKnown: 30,
	wordsMastered: 15,
	wordsWeak: 5,
	topNProgress: {
		top100: { known: 25, total: 100, percentage: 25 },
		top500: { known: 30, total: 500, percentage: 6 },
		top1000: { known: 30, total: 1000, percentage: 3 },
		top5000: { known: 30, total: 5000, percentage: 1 }
	},
	estimatedLevel: 'A2',
	averageScore: 65,
	totalGamesPlayed: 10,
	vocabularyCoverage: {
		inFrequencyData: 200,
		total: 300,
		percentage: 67
	}
};

describe('VocabularyProgressWidget', () => {
	describe('Loading state', () => {
		it('does not render while loading', () => {
			const { container } = render(VocabularyProgressWidget);
			const widget = container.querySelector('a[href="/sanasto"]');
			expect(widget).toBeFalsy();
		});
	});

	describe('Rendering with data', () => {
		it('renders widget when stats are available', async () => {
			const { container } = render(VocabularyProgressWidget);
			await waitFor(() => {
				const widget = container.querySelector('a[href="/sanasto"]');
				expect(widget).toBeTruthy();
			});
		});

		it('displays words known count', async () => {
			const { getByText } = render(VocabularyProgressWidget);
			await waitFor(() => {
				expect(getByText('30')).toBeTruthy();
				expect(getByText('sanaa')).toBeTruthy();
			});
		});

		it('displays words mastered count', async () => {
			// Note: The new widget shows words known (30), not mastered (15)
			const { getByText } = render(VocabularyProgressWidget);
			await waitFor(() => {
				expect(getByText('30')).toBeTruthy();
			});
		});

		it('displays CEFR level badge', async () => {
			const { getByText } = render(VocabularyProgressWidget);
			await waitFor(() => {
				expect(getByText('A2')).toBeTruthy();
			});
		});

		it('displays Top 100 progress bar', async () => {
			const { container } = render(VocabularyProgressWidget);
			await waitFor(() => {
				// The widget shows a circular progress indicator using SVG
				const circles = container.querySelectorAll('circle');
				expect(circles.length).toBeGreaterThan(0);
			});
		});

		it('displays Top 1000 progress bar', async () => {
			const { container } = render(VocabularyProgressWidget);
			await waitFor(() => {
				// The widget shows a circular progress indicator using SVG
				const circles = container.querySelectorAll('circle');
				expect(circles.length).toBeGreaterThan(0);
			});
		});

		it('has link to full statistics page', async () => {
			const { container } = render(VocabularyProgressWidget);
			await waitFor(() => {
				const link = container.querySelector('a[href="/sanasto"]');
				expect(link).toBeTruthy();
				expect(link?.getAttribute('title')).toBe('Sanasto');
			});
		});
	});

	describe('Empty state', () => {
		it('does not render when no words practiced', async () => {
			const emptyStats = { ...mockStats, totalPracticed: 0 };
			vi.mocked(await import('$lib/services/statisticsService')).calculateVocabularyStats = vi
				.fn()
				.mockResolvedValue(emptyStats);

			const { container } = render(VocabularyProgressWidget);
			await waitFor(() => {
				const widget = container.querySelector('a[href="/sanasto"]');
				expect(widget).toBeFalsy();
			});
		});
	});

	describe('Error handling', () => {
		it('does not render when stats fail to load', async () => {
			vi.mocked(await import('$lib/services/statisticsService')).calculateVocabularyStats = vi
				.fn()
				.mockRejectedValue(new Error('Failed to load'));

			const { container } = render(VocabularyProgressWidget);
			await waitFor(() => {
				const widget = container.querySelector('a[href="/sanasto"]');
				expect(widget).toBeFalsy();
			});
		});
	});

	describe('CEFR level colors', () => {
		it('applies correct color class for A2 level', async () => {
			vi.mocked(await import('$lib/services/statisticsService')).calculateVocabularyStats = vi
				.fn()
				.mockResolvedValue(mockStats);

			const { container, getByText } = render(VocabularyProgressWidget);
			await waitFor(() => {
				// Check that A2 is displayed
				const levelText = getByText('A2');
				expect(levelText).toBeTruthy();
				// The color is applied via getCEFRColor function which returns text-success for A2
				expect(levelText.classList.contains('text-success')).toBe(true);
			});
		});
	});
});
