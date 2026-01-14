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
		difficulty: 'beginner',
		level: 'A1',
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
		difficulty: 'beginner',
		level: 'A2',
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
		difficulty: 'intermediate',
		level: 'B1',
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
	},
	{
		id: 'story-4',
		title: 'Aamu',
		titleSpanish: 'La mañana',
		description: 'Aamupäivän rutiinit',
		difficulty: 'beginner',
		level: 'A1',
		category: 'everyday',
		icon: '☀️',
		dialogue: [{ speaker: 'Ana', spanish: 'Buenos días', finnish: 'Hyvää huomenta' }],
		vocabulary: [{ spanish: 'mañana', finnish: 'aamu', english: 'morning' }],
		questions: [
			{
				id: 'q1',
				question: 'Mitä Ana tekee?',
				options: ['Nukkuu', 'Herää', 'Syö', 'Lukee'],
				correctIndex: 1
			}
		]
	},
	{
		id: 'story-5',
		title: 'Museo',
		titleSpanish: 'El museo',
		description: 'Vierailu museossa',
		difficulty: 'intermediate',
		level: 'B2',
		category: 'culture',
		icon: '🏛️',
		dialogue: [{ speaker: 'Guía', spanish: 'Buenas tardes', finnish: 'Hyvää iltapäivää' }],
		vocabulary: [{ spanish: 'museo', finnish: 'museo', english: 'museum' }],
		questions: [
			{
				id: 'q1',
				question: 'Missä he ovat?',
				options: ['Museossa', 'Kirjastossa', 'Kaupassa', 'Kahvilassa'],
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

		// Check for filter buttons (they have both mobile and desktop labels)
		const kaikkiButtons = screen.getAllByText(/Kaikki/i);
		expect(kaikkiButtons.length).toBeGreaterThan(0);

		// Check for sort direction button (with title A-Z or Z-A)
		const sortButtons = screen.getAllByRole('button');
		const sortButton = sortButtons.find((btn) => btn.title === 'A-Z' || btn.title === 'Z-A');
		expect(sortButton).toBeDefined();
	});

	it('has filter by difficulty options available', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// Check that filter buttons exist (they have labels visible as text content)
		const kaikkiButtons = screen.getAllByText(/Kaikki/i);
		expect(kaikkiButtons.length).toBeGreaterThan(0);

		const alkeetButtons = screen.getAllByText(/Alkeet/i);
		expect(alkeetButtons.length).toBeGreaterThan(0);

		const perustasoButtons = screen.getAllByText(/Perustaso/i);
		expect(perustasoButtons.length).toBeGreaterThan(0);

		const keskitasoButtons = screen.getAllByText(/Keskitaso/i);
		expect(keskitasoButtons.length).toBeGreaterThan(0);

		const edistyButtons = screen.getAllByText(/Edistynyt/i);
		expect(edistyButtons.length).toBeGreaterThan(0);
	});

	it('filters stories by A1 level', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// Click on Alkeet (A1) filter button
		const alkeetButtons = screen.getAllByText(/Alkeet/i);
		await fireEvent.click(alkeetButtons[0]);

		await waitFor(() => {
			// Should show only A1 stories
			expect(screen.getByText('En la cafetería')).toBeInTheDocument(); // A1
			expect(screen.getByText('La mañana')).toBeInTheDocument(); // A1

			// Should NOT show other level stories
			expect(screen.queryByText('En el supermercado')).not.toBeInTheDocument(); // A2
			expect(screen.queryByText('En la estación')).not.toBeInTheDocument(); // B1
			expect(screen.queryByText('El museo')).not.toBeInTheDocument(); // B2
		});
	});

	it('filters stories by B1 level', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// Click on Keskitaso (B1) filter button
		const keskitasoButtons = screen.getAllByText(/Keskitaso/i);
		await fireEvent.click(keskitasoButtons[0]);

		await waitFor(() => {
			// Should show only B1 stories
			expect(screen.getByText('En la estación')).toBeInTheDocument(); // B1

			// Should NOT show other level stories
			expect(screen.queryByText('En la cafetería')).not.toBeInTheDocument(); // A1
			expect(screen.queryByText('En el supermercado')).not.toBeInTheDocument(); // A2
			expect(screen.queryByText('La mañana')).not.toBeInTheDocument(); // A1
			expect(screen.queryByText('El museo')).not.toBeInTheDocument(); // B2
		});
	});

	it('filters stories by B2 level', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// Click on Edistynyt (B2) filter button
		const edistyButtons = screen.getAllByText(/Edistynyt/i);
		await fireEvent.click(edistyButtons[0]);

		await waitFor(() => {
			// Should show only B2 stories
			expect(screen.getByText('El museo')).toBeInTheDocument(); // B2

			// Should NOT show other level stories
			expect(screen.queryByText('En la cafetería')).not.toBeInTheDocument(); // A1
			expect(screen.queryByText('En el supermercado')).not.toBeInTheDocument(); // A2
			expect(screen.queryByText('La mañana')).not.toBeInTheDocument(); // A1
			expect(screen.queryByText('En la estación')).not.toBeInTheDocument(); // B1
		});
	});

	it('has sort direction toggle available', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText('En el supermercado')).toBeInTheDocument();
		});

		// Check that sort direction button exists
		const sortButtons = screen.getAllByRole('button');
		const sortButton = sortButtons.find((btn) => btn.title === 'A-Z' || btn.title === 'Z-A');
		expect(sortButton).toBeDefined();
	});

	it('sorts stories by level then alphabetically by default', async () => {
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

		// Stories should be sorted:
		// 1. By level: A1 < A2 < B1 < B2
		// 2. By title alphabetically (Finnish): Aamu, Kahvilassa, Ruokakaupassa, Asemalla, Museo

		// A1: Aamu, Kahvilassa (alphabetically by Finnish title)
		const aamuIndex = titles.findIndex((t) => t?.includes('La mañana'));
		const kahviIndex = titles.findIndex((t) => t?.includes('En la cafetería'));
		// A2: Ruokakaupassa
		const ruokaIndex = titles.findIndex((t) => t?.includes('En el supermercado'));
		// B1: Asemalla
		const asemaIndex = titles.findIndex((t) => t?.includes('En la estación'));
		// B2: Museo
		const museoIndex = titles.findIndex((t) => t?.includes('El museo'));

		// Verify order: Aamu < Kahvilassa < Ruokakaupassa < Asemalla < Museo
		expect(aamuIndex).toBeLessThan(kahviIndex);
		expect(kahviIndex).toBeLessThan(ruokaIndex);
		expect(ruokaIndex).toBeLessThan(asemaIndex);
		expect(asemaIndex).toBeLessThan(museoIndex);
	});

	it('reverses alphabetical order when sort direction is Z-A', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// Get initial order
		let elements = screen.getAllByRole('heading', { level: 3 });
		let titles = elements.map((el) => el.textContent);
		const initialOrder = titles.slice();

		// Click sort direction toggle
		const sortButtons = screen.getAllByRole('button');
		const sortButton = sortButtons.find((btn) => btn.title === 'A-Z');
		if (sortButton) {
			await fireEvent.click(sortButton);
		}

		await waitFor(() => {
			elements = screen.getAllByRole('heading', { level: 3 });
			titles = elements.map((el) => el.textContent);

			// Within each level group, order should be reversed
			// But level order should remain the same (A1, A2, B1, B2)
			// A1: should be Kahvilassa, Aamu (Z-A alphabetically)
			const kahviIndex = titles.findIndex((t) => t?.includes('En la cafetería'));
			const aamuIndex = titles.findIndex((t) => t?.includes('La mañana'));
			expect(kahviIndex).toBeLessThan(aamuIndex);

			// Order between level groups should be unchanged
			const ruokaIndex = titles.findIndex((t) => t?.includes('En el supermercado'));
			expect(aamuIndex).toBeLessThan(ruokaIndex);
		});
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

		// All five stories should be visible
		expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		expect(screen.getByText('En el supermercado')).toBeInTheDocument();
		expect(screen.getByText('En la estación')).toBeInTheDocument();
		expect(screen.getByText('La mañana')).toBeInTheDocument();
		expect(screen.getByText('El museo')).toBeInTheDocument();
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
