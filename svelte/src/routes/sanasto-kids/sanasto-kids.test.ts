import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SanastoKidsPage from './+page.svelte';
import type { KidsVocabularyStatistics } from '$lib/services/statisticsService';
import * as statisticsService from '$lib/services/statisticsService';
import { createMockKidsVocabularyStats } from '$tests/mocks/commonMocks';

// Mock the statistics service
vi.mock('$lib/services/statisticsService', async () => {
	const actual = await vi.importActual<typeof import('$lib/services/statisticsService')>('$lib/services/statisticsService');
	return {
		...actual,
		calculateKidsVocabularyStats: vi.fn()
	};
});

// Mock the base path
vi.mock('$app/paths', () => ({
	base: ''
}));

describe('Sanasto Kids Page', () => {
	const mockStats = createMockKidsVocabularyStats();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders loading state initially', () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockImplementation(() => new Promise(() => {}));

		render(SanastoKidsPage);

		// Check for loading spinner
		const spinner = document.querySelector('.loading-spinner');
		expect(spinner).toBeTruthy();
	});

	it('renders error state when stats fail to load', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockRejectedValue(new Error('Failed to load'));

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText(/Tilastojen lataus epäonnistui/i)).toBeTruthy();
		});
	});

	it('renders all main content elements with default stats', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			// Page title and subtitle
			expect(screen.getByText('Sanastosi')).toBeTruthy();
			expect(screen.getByText('Katso kuinka paljon olet oppinut!')).toBeTruthy();
			
			// Back button
			expect(screen.getByText('← Takaisin')).toBeTruthy();
			
			// Encouragement message
			expect(screen.getByText(mockStats.encouragementMessage)).toBeTruthy();
			expect(screen.getByText('Jatka samaan malliin!')).toBeTruthy();
			
			// Statistics cards
			expect(screen.getByText('Harjoitellut sanat')).toBeTruthy();
			expect(screen.getByText('25')).toBeTruthy();
			expect(screen.getByText('Osaat sanoja')).toBeTruthy();
			expect(screen.getByText('15')).toBeTruthy();
			expect(screen.getByText('Hallitset sanoja')).toBeTruthy();
			expect(screen.getByText('8')).toBeTruthy();
			expect(screen.getByText('Pelit pelattu')).toBeTruthy();
			expect(screen.getByText('12')).toBeTruthy();
			expect(screen.getByText('Hienoa työtä!')).toBeTruthy();
			
			// Recent progress
			expect(screen.getByText('Viimeiset 7 päivää')).toBeTruthy();
			expect(screen.getByText('5')).toBeTruthy();
			expect(screen.getByText('Viimeiset 30 päivää')).toBeTruthy();
			expect(screen.getByText('18')).toBeTruthy();
			
			// Next milestone
			expect(screen.getByText('Seuraava tavoite')).toBeTruthy();
			expect(screen.getByText(mockStats.nextMilestone.description)).toBeTruthy();
			expect(screen.getByText('25 / 30')).toBeTruthy();
			expect(screen.getByText('83% valmiina!')).toBeTruthy();
			
			// Average score
			expect(screen.getByText('Keskimääräinen osaaminen')).toBeTruthy();
			expect(screen.getByText('72%')).toBeTruthy();
		});
	});

	it('shows encouraging message for high average score (>= 80)', async () => {
		const highScoreStats = { ...mockStats, averageScore: 85 };
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(highScoreStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText(/Erinomaista! Olet todellinen tähti!/i)).toBeTruthy();
		});
	});

	it('shows encouraging message for good average score (>= 60)', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText(/Hienoa työtä! Olet oppimassa nopeasti!/i)).toBeTruthy();
		});
	});

	it('shows encouraging message for medium average score (>= 40)', async () => {
		const mediumScoreStats = { ...mockStats, averageScore: 50 };
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mediumScoreStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText(/Hyvää työtä! Jatka harjoittelua!/i)).toBeTruthy();
		});
	});

	it('shows encouraging message for low average score (< 40)', async () => {
		const lowScoreStats = { ...mockStats, averageScore: 30 };
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(lowScoreStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText(/Loistava alku! Jatka samaan malliin!/i)).toBeTruthy();
		});
	});

	it('renders footer message and visual elements', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		const { container } = render(SanastoKidsPage);

		await vi.waitFor(() => {
			// Footer message
			expect(screen.getByText(/Tilastot päivittyvät kun pelaat pelejä/i)).toBeTruthy();
			
			// Gradient background
			const bgDiv = container.querySelector('.bg-gradient-to-b');
			expect(bgDiv).toBeTruthy();
			
			// Icon components (Lucide renders as SVG)
			const svgs = container.querySelectorAll('svg');
			expect(svgs.length).toBeGreaterThan(0);
		});
	});

	describe('Achievement emoji display', () => {
		it('shows trophy emoji for high mastered words (>= 50)', async () => {
			const highMasteredStats = { ...mockStats, wordsMastered: 55 };
			vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(highMasteredStats);

			const { container } = render(SanastoKidsPage);

			await vi.waitFor(() => {
				expect(container.textContent).toContain('🏆');
			});
		});

		it('shows star emoji for good known words (>= 30)', async () => {
			const goodKnownStats = { ...mockStats, wordsKnown: 35, wordsMastered: 10 };
			vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(goodKnownStats);

			const { container } = render(SanastoKidsPage);

			await vi.waitFor(() => {
				expect(container.textContent).toContain('⭐');
			});
		});

		it('shows rainbow emoji for beginner (>= 10 practiced)', async () => {
			const beginnerStats = { 
				...mockStats, 
				totalWordsPracticed: 12, 
				wordsKnown: 8, 
				wordsMastered: 3 
			};
			vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(beginnerStats);

			const { container } = render(SanastoKidsPage);

			await vi.waitFor(() => {
				expect(container.textContent).toContain('🌈');
			});
		});
	});
});
