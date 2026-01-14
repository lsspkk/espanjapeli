import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import SanastoPage from './+page.svelte';

// Mock SvelteKit modules
vi.mock('$app/paths', () => ({
	base: ''
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('svelte', async () => {
	const actual = await vi.importActual('svelte');
	return {
		...actual,
		onMount: (fn: () => void) => fn()
	};
});

// Mock statistics service
vi.mock('$lib/services/statisticsService', () => ({
	calculateVocabularyStats: vi.fn().mockResolvedValue({
		totalPracticed: 50,
		wordsKnown: 35,
		wordsMastered: 20,
		wordsWeak: 5,
		topNProgress: {
			top100: { known: 25, total: 100, percentage: 25 },
			top500: { known: 50, total: 500, percentage: 10 },
			top1000: { known: 75, total: 1000, percentage: 7 },
			top5000: { known: 100, total: 5000, percentage: 2 }
		},
		estimatedLevel: 'A2',
		averageScore: 65,
		totalGamesPlayed: 15,
		vocabularyCoverage: {
			inFrequencyData: 450,
			total: 500,
			percentage: 90
		}
	}),
	getNextMilestone: vi.fn().mockResolvedValue({
		type: 'top100',
		current: 25,
		target: 50,
		description: 'Learn 50 of the 100 most common words'
	})
}));

// Mock vocabulary service
vi.mock('$lib/services/vocabularyService', () => ({
	getCEFRDescription: vi.fn((level: string) => {
		const descriptions: Record<string, string> = {
			A1: 'Absolute Beginner',
			A2: 'Beginner',
			B1: 'Intermediate',
			B2: 'Upper Intermediate',
			C1: 'Advanced'
		};
		return descriptions[level] || level;
	})
}));

describe('Sanasto Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders page title', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sanasto');
		});
	});

	it('renders back link', async () => {
		render(SanastoPage);
		const backLink = screen.getByText('← Takaisin valikkoon');
		expect(backLink).toBeTruthy();
		expect(backLink.getAttribute('href')).toBe('/');
	});

	it('displays summary section', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('📊 Yhteenveto')).toBeTruthy();
		});
	});

	it('displays total practiced words', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('50')).toBeTruthy();
		});
	});

	it('displays words known', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('35')).toBeTruthy();
		});
	});

	it('displays CEFR level section', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('🎓 Arvioitu taso')).toBeTruthy();
			expect(screen.getByText('A2')).toBeTruthy();
		});
	});

	it('displays progress bars section', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('📈 Yleisimpien sanojen edistyminen')).toBeTruthy();
		});
	});

	it('displays top 100 progress', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('Top 100')).toBeTruthy();
			expect(screen.getByText('25/100')).toBeTruthy();
		});
	});

	it('displays top 500 progress', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('Top 500')).toBeTruthy();
			expect(screen.getByText('50/500')).toBeTruthy();
		});
	});

	it('displays next milestone section', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('🎯 Seuraava tavoite')).toBeTruthy();
		});
	});

	it('displays vocabulary coverage section', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('📖 Pelin sanasto')).toBeTruthy();
		});
	});
});
