import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import TarinatPage from './+page.svelte';
import type { Story } from '$lib/types/story';

// Mock the storyLoader service
vi.mock('$lib/services/storyLoader', () => ({
	loadStories: vi.fn(),
	categoryNames: {
		travel: 'Matkailu',
		food: 'Ruoka',
		shopping: 'Ostokset'
	},
	difficultyNames: {
		A1: 'Alkeet',
		A2: 'Perustaso',
		B1: 'Keskitaso'
	},
	getDifficultyColor: vi.fn((difficulty: string) => {
		const colors: Record<string, string> = {
			A1: 'badge-success',
			A2: 'badge-info',
			B1: 'badge-warning'
		};
		return colors[difficulty] || 'badge-neutral';
	})
}));

// Mock $app/paths
vi.mock('$app/paths', () => ({
	base: ''
}));

const mockStories: Story[] = [
	{
		id: 'story-1',
		title: 'Kahvilassa',
		titleSpanish: 'En la cafetería',
		description: 'Tilaa kahvia ja leivonnaisia',
		difficulty: 'A1',
		category: 'food',
		icon: '☕',
		dialogue: [{ speaker: 'María', spanish: 'Buenos días', finnish: 'Hyvää huomenta' }],
		vocabulary: [{ spanish: 'café', finnish: 'kahvi', english: 'coffee' }],
		questions: [
			{
				id: 'q1',
				question: 'Mitä María tilaa?',
				options: ['Kahvi', 'Tee', 'Mehu', 'Vesi'],
				correctIndex: 0
			}
		]
	},
	{
		id: 'story-2',
		title: 'Ruokakaupassa',
		titleSpanish: 'En el supermercado',
		description: 'Osta hedelmiä ja vihanneksia',
		difficulty: 'A2',
		category: 'shopping',
		icon: '🛒',
		dialogue: [{ speaker: 'Juan', spanish: 'Hola', finnish: 'Hei' }],
		vocabulary: [{ spanish: 'manzana', finnish: 'omena', english: 'apple' }],
		questions: [
			{
				id: 'q1',
				question: 'Mitä Juan ostaa?',
				options: ['Omena', 'Banaani', 'Appelsiini', 'Päärynä'],
				correctIndex: 0
			}
		]
	},
	{
		id: 'story-3',
		title: 'Asemalla',
		titleSpanish: 'En la estación',
		description: 'Osta junalippu',
		difficulty: 'B1',
		category: 'travel',
		icon: '🚂',
		dialogue: [{ speaker: 'Pedro', spanish: 'Buenas tardes', finnish: 'Hyvää iltapäivää' }],
		vocabulary: [{ spanish: 'tren', finnish: 'juna', english: 'train' }],
		questions: [
			{
				id: 'q1',
				question: 'Mihin Pedro matkustaa?',
				options: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'],
				correctIndex: 0
			}
		]
	}
];

describe('Tarinat Page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { loadStories } = await import('$lib/services/storyLoader');
		vi.mocked(loadStories).mockResolvedValue(mockStories);
	});

	it('renders loading state initially', () => {
		render(TarinatPage);
		expect(screen.getByText(/Tarinat ja dialogit/i)).toBeInTheDocument();
		// Loading spinner is shown
		const spinner = document.querySelector('.loading-spinner');
		expect(spinner).toBeInTheDocument();
	});

	it('renders story list after loading', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText(/Tarinat ja dialogit/i)).toBeInTheDocument();
		});

		// Stories are shown with Spanish titles
		expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		expect(screen.getByText('En el supermercado')).toBeInTheDocument();
		expect(screen.getByText('En la estación')).toBeInTheDocument();
	});

	it('renders filter and sort controls', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText(/Tarinat ja dialogit/i)).toBeInTheDocument();
		});

		// Wait for stories to load
		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// Check for filter controls (mobile or desktop)
		const filterElements = screen.queryAllByText(/Suodata/i);
		expect(filterElements.length).toBeGreaterThan(0);

		// Check for sort controls
		const sortElements = screen.queryAllByText(/Järjestä/i);
		expect(sortElements.length).toBeGreaterThan(0);
	});

	it('has filter by difficulty options available', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// Check that filter options exist (both mobile and desktop versions)
		const kaikkiTasot = screen.getAllByText('Kaikki tasot');
		expect(kaikkiTasot.length).toBeGreaterThan(0);

		const a1Options = screen.getAllByText(/A1 - Alkeet/i);
		expect(a1Options.length).toBeGreaterThan(0);

		const a2Options = screen.getAllByText(/A2 - Perustaso/i);
		expect(a2Options.length).toBeGreaterThan(0);

		const b1Options = screen.getAllByText(/B1 - Keskitaso/i);
		expect(b1Options.length).toBeGreaterThan(0);
	});

	it('has sort options available', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText('En el supermercado')).toBeInTheDocument();
		});

		// Check that sort options exist (both mobile and desktop versions)
		const alphabetOptions = screen.getAllByText('Aakkosjärjestys');
		expect(alphabetOptions.length).toBeGreaterThan(0);

		const difficultyOptions = screen.getAllByText('Vaikeustaso');
		expect(difficultyOptions.length).toBeGreaterThan(0);
	});

	it('sorts stories alphabetically by default', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText(/Tarinat ja dialogit/i)).toBeInTheDocument();
		});

		// Wait for stories to load
		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// Get all story titles (Spanish titles in cards)
		const elements = screen.getAllByRole('heading', { level: 3 });
		const titles = elements.map((el) => el.textContent);

		// Stories should be sorted alphabetically by Finnish title (Asemalla, Kahvilassa, Ruokakaupassa)
		// Which corresponds to Spanish titles: En la estación, En la cafetería, En el supermercado
		const asemaIndex = titles.findIndex((t) => t?.includes('En la estación'));
		const kahviIndex = titles.findIndex((t) => t?.includes('En la cafetería'));
		const ruokaIndex = titles.findIndex((t) => t?.includes('En el supermercado'));

		expect(asemaIndex).toBeLessThan(kahviIndex);
		expect(kahviIndex).toBeLessThan(ruokaIndex);
	});

	it('displays all stories when no filter is applied', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText(/Tarinat ja dialogit/i)).toBeInTheDocument();
		});

		// Wait for stories to load
		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// All three stories should be visible
		expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		expect(screen.getByText('En el supermercado')).toBeInTheDocument();
		expect(screen.getByText('En la estación')).toBeInTheDocument();
	});

	it('shows empty state message when no stories available', async () => {
		const { loadStories } = await import('$lib/services/storyLoader');
		vi.mocked(loadStories).mockResolvedValue([]); // No stories

		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText(/Tarinat ja dialogit/i)).toBeInTheDocument();
		});

		await waitFor(() => {
			expect(screen.getByText(/Ei tarinoita näillä suodattimilla/i)).toBeInTheDocument();
		});
	});

	it('opens story when card is clicked', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// Click on first story card
		const storyCards = screen.getAllByRole('button');
		const storyCard = storyCards.find((btn) => btn.textContent?.includes('En la cafetería'));
		if (storyCard) {
			await fireEvent.click(storyCard);
		}

		await waitFor(() => {
			// Should show story reader - check for close button or difficulty badge
			const closeButtons = screen.queryAllByTitle('Lopeta');
			expect(closeButtons.length).toBeGreaterThan(0);
		});
	});
});
