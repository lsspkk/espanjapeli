import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import KidsVocabularyWidget from './KidsVocabularyWidget.svelte';
import type { KidsVocabularyStatistics } from '$lib/services/statisticsService';
import * as statisticsService from '$lib/services/statisticsService';

// Mock $app/paths
vi.mock('$app/paths', () => ({
	base: ''
}));

describe('KidsVocabularyWidget', () => {
	const mockStats: KidsVocabularyStatistics = {
		totalWordsPracticed: 25,
		wordsKnown: 15,
		wordsMastered: 8,
		totalGamesPlayed: 10,
		averageScore: 75,
		recentProgress: {
			last7Days: 5,
			last30Days: 15
		},
		nextMilestone: {
			description: 'Opi 20 sanaa',
			current: 15,
			target: 20,
			percentage: 75
		},
		encouragementMessage: 'Hienoa työtä!'
	};

	beforeEach(() => {
		// Clear all mocks before each test
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Clean up after each test
		vi.restoreAllMocks();
	});

	it('renders nothing while loading', () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockImplementation(
			() => new Promise(() => {}) // Never resolves
		);

		render(KidsVocabularyWidget);

		expect(screen.queryByTestId('kids-vocabulary-widget')).not.toBeInTheDocument();
	});

	it('renders nothing on error', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockRejectedValue(
			new Error('Failed to load')
		);

		render(KidsVocabularyWidget);

		await waitFor(() => {
			expect(screen.queryByTestId('kids-vocabulary-widget')).not.toBeInTheDocument();
		});
	});

	it('renders nothing when no words practiced', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue({
			...mockStats,
			totalWordsPracticed: 0
		});

		render(KidsVocabularyWidget);

		await waitFor(() => {
			expect(screen.queryByTestId('kids-vocabulary-widget')).not.toBeInTheDocument();
		});
	});

	it('renders widget with stats when data loaded', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue(mockStats);

		render(KidsVocabularyWidget);

		await waitFor(() => {
			const widget = screen.getByTestId('kids-vocabulary-widget');
			expect(widget).toBeInTheDocument();
		});
	});

	it('displays correct number of known words', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue(mockStats);

		render(KidsVocabularyWidget);

		await waitFor(() => {
			expect(screen.getByText('15')).toBeInTheDocument();
			expect(screen.getByText('sanaa')).toBeInTheDocument();
		});
	});

	it('links to sanasto-kids page', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue(mockStats);

		render(KidsVocabularyWidget);

		await waitFor(() => {
			const link = screen.getByTestId('kids-vocabulary-widget');
			expect(link).toHaveAttribute('href', '/sanasto-kids');
		});
	});

	it('has correct title attribute', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue(mockStats);

		render(KidsVocabularyWidget);

		await waitFor(() => {
			const widget = screen.getByTestId('kids-vocabulary-widget');
			expect(widget).toHaveAttribute('title', 'Katso sanastosi!');
		});
	});

	it('shows star emoji for beginners (< 10 words)', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue({
			...mockStats,
			totalWordsPracticed: 5,
			wordsKnown: 3,
			wordsMastered: 0
		});

		render(KidsVocabularyWidget);

		await waitFor(() => {
			expect(screen.getByText('🌟')).toBeInTheDocument();
		});
	});

	it('shows rainbow emoji for learners (10+ words practiced)', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue({
			...mockStats,
			totalWordsPracticed: 15,
			wordsKnown: 10,
			wordsMastered: 3
		});

		render(KidsVocabularyWidget);

		await waitFor(() => {
			expect(screen.getByText('🌈')).toBeInTheDocument();
		});
	});

	it('shows star emoji for good learners (30+ words known)', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue({
			...mockStats,
			totalWordsPracticed: 40,
			wordsKnown: 35,
			wordsMastered: 20
		});

		render(KidsVocabularyWidget);

		await waitFor(() => {
			expect(screen.getByText('⭐')).toBeInTheDocument();
		});
	});

	it('shows trophy emoji for masters (50+ words mastered)', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue({
			...mockStats,
			totalWordsPracticed: 80,
			wordsKnown: 70,
			wordsMastered: 55
		});

		render(KidsVocabularyWidget);

		await waitFor(() => {
			expect(screen.getByText('🏆')).toBeInTheDocument();
		});
	});

	it('renders progress ring with correct percentage', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue(mockStats);

		render(KidsVocabularyWidget);

		await waitFor(() => {
			const circles = screen.getByTestId('kids-vocabulary-widget').querySelectorAll('circle');
			expect(circles).toHaveLength(2); // Background + progress
			
			// Progress circle should have stroke-dasharray based on percentage
			const progressCircle = circles[1];
			const dashArray = progressCircle.getAttribute('stroke-dasharray');
			// 75% of 226 (circumference) ≈ 169.5
			expect(dashArray).toContain('169.5');
		});
	});

	it('has fixed positioning in top-right corner', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue(mockStats);

		render(KidsVocabularyWidget);

		await waitFor(() => {
			const widget = screen.getByTestId('kids-vocabulary-widget');
			expect(widget).toHaveClass('fixed');
			expect(widget).toHaveClass('top-20');
			expect(widget).toHaveClass('right-4');
		});
	});

	it('has circular shape with gradient background', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue(mockStats);

		render(KidsVocabularyWidget);

		await waitFor(() => {
			const widget = screen.getByTestId('kids-vocabulary-widget');
			expect(widget).toHaveClass('rounded-full');
			expect(widget).toHaveClass('bg-gradient-to-br');
		});
	});

	it('has hover effects', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue(mockStats);

		render(KidsVocabularyWidget);

		await waitFor(() => {
			const widget = screen.getByTestId('kids-vocabulary-widget');
			expect(widget).toHaveClass('hover:scale-110');
			expect(widget).toHaveClass('hover:shadow-3xl');
		});
	});

	it('has high z-index to appear above other content', async () => {
		vi.spyOn(statisticsService, 'calculateKidsVocabularyStats').mockResolvedValue(mockStats);

		render(KidsVocabularyWidget);

		await waitFor(() => {
			const widget = screen.getByTestId('kids-vocabulary-widget');
			expect(widget).toHaveClass('z-40');
		});
	});
});
