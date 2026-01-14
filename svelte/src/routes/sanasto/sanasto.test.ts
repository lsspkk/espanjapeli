import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
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

// Mock word data
vi.mock('$lib/data/words', () => ({
	getAllWords: vi.fn(() => [
		{ spanish: 'hola', finnish: 'hei', english: 'hello' },
		{ spanish: 'adiós', finnish: 'näkemiin', english: 'goodbye' },
		{ spanish: 'gracias', finnish: 'kiitos', english: 'thanks' }
	])
}));

// Mock word knowledge store
vi.mock('$lib/stores/wordKnowledge', () => ({
	wordKnowledge: {
		subscribe: vi.fn((callback) => {
			callback({
				version: 1,
				words: {
					'hola': {
						spanish_to_finnish: { score: 85, practiceCount: 5 },
						finnish_to_spanish: { score: 75, practiceCount: 3 }
					},
					'adiós': {
						spanish_to_finnish: { score: 65, practiceCount: 4 },
						finnish_to_spanish: { score: 55, practiceCount: 2 }
					},
					'gracias': {
						spanish_to_finnish: { score: 45, practiceCount: 2 },
						finnish_to_spanish: { score: 35, practiceCount: 1 }
					}
				},
				gameHistory: [],
				meta: {
					createdAt: '2024-01-01',
					updatedAt: '2024-01-01',
					totalGamesPlayed: 0
				}
			});
			return () => {};
		})
	}
}));

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
		description: 'Opi 50 sanaa 100 yleisimmästä'
	})
}));

// Mock vocabulary service
vi.mock('$lib/services/vocabularyService', () => ({
	getCEFRDescription: vi.fn((level: string) => {
		const descriptions: Record<string, string> = {
			A1: 'Aloittelija',
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
		const backLink = screen.getByText('← Takaisin');
		expect(backLink).toBeTruthy();
		expect(backLink.getAttribute('href')).toBe('/');
	});

	it('displays summary section', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('Yhteenveto')).toBeTruthy();
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
			expect(screen.getByText('Arvioitu taso')).toBeTruthy();
			expect(screen.getByText('A2')).toBeTruthy();
		});
	});

	it('displays progress bars section', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('Yleisimpien sanojen edistyminen')).toBeTruthy();
		});
	});

	it('displays top 100 progress', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('100 yleisintä')).toBeTruthy();
			expect(screen.getByText('25/100')).toBeTruthy();
		});
	});

	it('displays top 500 progress', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('500 yleisintä')).toBeTruthy();
			expect(screen.getByText('50/500')).toBeTruthy();
		});
	});

	it('displays next milestone section', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('Seuraava tavoite')).toBeTruthy();
		});
	});

	it('displays vocabulary coverage section', async () => {
		render(SanastoPage);
		await waitFor(() => {
			expect(screen.getByText('Pelin sanasto')).toBeTruthy();
		});
	});

	it('makes practiced words count clickable', async () => {
		render(SanastoPage);
		await waitFor(() => {
			const practicedButton = screen.getByRole('button', { name: /Harjoitellut sanat/i });
			expect(practicedButton).toBeTruthy();
		});
	});

	it('makes known words count clickable', async () => {
		render(SanastoPage);
		await waitFor(() => {
			const knownButton = screen.getByRole('button', { name: /Osatut sanat/i });
			expect(knownButton).toBeTruthy();
		});
	});

	it('makes mastered words count clickable', async () => {
		render(SanastoPage);
		await waitFor(() => {
			const masteredButton = screen.getByRole('button', { name: /Hallitut sanat/i });
			expect(masteredButton).toBeTruthy();
		});
	});

	it('opens dialog when practiced words is clicked', async () => {
		render(SanastoPage);
		
		await waitFor(() => {
			const practicedButton = screen.getByRole('button', { name: /Harjoitellut sanat/i });
			expect(practicedButton).toBeTruthy();
		});
		
		const practicedButton = screen.getByRole('button', { name: /Harjoitellut sanat/i });
		await fireEvent.click(practicedButton);
		
		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeTruthy();
			// Check for dialog title specifically
			const dialogTitle = screen.getByRole('heading', { level: 2, name: 'Harjoitellut sanat' });
			expect(dialogTitle).toBeTruthy();
		});
	});

	it('opens dialog when known words is clicked', async () => {
		render(SanastoPage);
		
		await waitFor(() => {
			const knownButton = screen.getByRole('button', { name: /Osatut sanat/i });
			expect(knownButton).toBeTruthy();
		});
		
		const knownButton = screen.getByRole('button', { name: /Osatut sanat/i });
		await fireEvent.click(knownButton);
		
		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeTruthy();
			// Check for dialog title specifically
			const dialogTitle = screen.getByRole('heading', { level: 2, name: 'Osatut sanat' });
			expect(dialogTitle).toBeTruthy();
		});
	});

	it('opens dialog when mastered words is clicked', async () => {
		render(SanastoPage);
		
		await waitFor(() => {
			const masteredButton = screen.getByRole('button', { name: /Hallitut sanat/i });
			expect(masteredButton).toBeTruthy();
		});
		
		const masteredButton = screen.getByRole('button', { name: /Hallitut sanat/i });
		await fireEvent.click(masteredButton);
		
		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeTruthy();
			// Check for dialog title specifically
			const dialogTitle = screen.getByRole('heading', { level: 2, name: 'Hallitut sanat' });
			expect(dialogTitle).toBeTruthy();
		});
	});
});
