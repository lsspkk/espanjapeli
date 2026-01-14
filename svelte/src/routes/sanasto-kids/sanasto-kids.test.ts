import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SanastoKidsPage from './+page.svelte';
import type { KidsVocabularyStatistics } from '$lib/services/statisticsService';
import * as statisticsService from '$lib/services/statisticsService';

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
	const mockStats: KidsVocabularyStatistics = {
		totalWordsPracticed: 25,
		wordsKnown: 15,
		wordsMastered: 8,
		totalGamesPlayed: 12,
		averageScore: 72,
		recentProgress: {
			last7Days: 5,
			last30Days: 18
		},
		encouragementMessage: 'Olet oppimassa nopeasti!',
		nextMilestone: {
			description: 'Opettele 30 sanaa',
			current: 25,
			target: 30,
			percentage: 83.33
		}
	};

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

	it('renders page title and subtitle', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText('Sanastosi')).toBeTruthy();
			expect(screen.getByText('Katso kuinka paljon olet oppinut!')).toBeTruthy();
		});
	});

	it('renders back button', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			const backButton = screen.getByText('← Takaisin');
			expect(backButton).toBeTruthy();
		});
	});

	it('displays encouragement message', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText(mockStats.encouragementMessage)).toBeTruthy();
			expect(screen.getByText('Jatka samaan malliin!')).toBeTruthy();
		});
	});

	it('displays total words practiced', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText('Harjoitellut sanat')).toBeTruthy();
			expect(screen.getByText('25')).toBeTruthy();
		});
	});

	it('displays words known', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText('Osaat sanoja')).toBeTruthy();
			expect(screen.getByText('15')).toBeTruthy();
		});
	});

	it('displays words mastered', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText('Hallitset sanoja')).toBeTruthy();
			expect(screen.getByText('8')).toBeTruthy();
		});
	});

	it('displays total games played', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText('Pelit pelattu')).toBeTruthy();
			expect(screen.getByText('12')).toBeTruthy();
			expect(screen.getByText('Hienoa työtä!')).toBeTruthy();
		});
	});

	it('displays recent progress for 7 days', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText('Viimeiset 7 päivää')).toBeTruthy();
			expect(screen.getByText('5')).toBeTruthy();
		});
	});

	it('displays recent progress for 30 days', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText('Viimeiset 30 päivää')).toBeTruthy();
			expect(screen.getByText('18')).toBeTruthy();
		});
	});

	it('displays next milestone', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText('Seuraava tavoite')).toBeTruthy();
			expect(screen.getByText(mockStats.nextMilestone.description)).toBeTruthy();
			expect(screen.getByText('25 / 30')).toBeTruthy();
			expect(screen.getByText('83% valmiina!')).toBeTruthy();
		});
	});

	it('displays average score', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
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

	it('displays footer message', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		render(SanastoKidsPage);

		await vi.waitFor(() => {
			expect(screen.getByText(/Tilastot päivittyvät kun pelaat pelejä/i)).toBeTruthy();
		});
	});

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

	it('renders with gradient background', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		const { container } = render(SanastoKidsPage);

		await vi.waitFor(() => {
			const bgDiv = container.querySelector('.bg-gradient-to-b');
			expect(bgDiv).toBeTruthy();
		});
	});

	it('renders all icon components', async () => {
		vi.mocked(statisticsService.calculateKidsVocabularyStats).mockResolvedValue(mockStats);

		const { container } = render(SanastoKidsPage);

		await vi.waitFor(() => {
			// Check for SVG icons (Lucide components render as SVG)
			const svgs = container.querySelectorAll('svg');
			expect(svgs.length).toBeGreaterThan(0);
		});
	});
});
