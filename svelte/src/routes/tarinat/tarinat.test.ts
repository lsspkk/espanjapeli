import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import TarinatPage from './+page.svelte';
import type { Story } from '$lib/types/story';
import type { StoryMetadata } from '$lib/services/storyLoader';
import { createMockStories } from '../../tests/mocks/commonMocks';

// Mock the storyLoader service
vi.mock('$lib/services/storyLoader', () => ({
	getStoryMetadata: vi.fn(),
	loadStoryById: vi.fn(),
	categoryNames: {
		travel: 'Matkailu',
		food: 'Ruoka',
		shopping: 'Ostokset',
		everyday: 'Arkipäivä',
		culture: 'Kulttuuri'
	},
	getLevelColor: vi.fn((level: string) => {
		const colors: Record<string, string> = {
			A1: 'badge-success',
			A2: 'badge-info',
			B1: 'badge-warning',
			B2: 'badge-error'
		};
		return colors[level] || 'badge-neutral';
	})
}));

// Mock $app/paths
vi.mock('$app/paths', () => ({
	base: ''
}));

const mockStories = createMockStories();

// Create metadata from stories
const mockMetadata: StoryMetadata[] = mockStories.map((story: Story) => ({
	id: story.id,
	title: story.title,
	titleSpanish: story.titleSpanish,
	description: story.description,
	level: story.level,
	category: story.category,
	icon: story.icon,
	wordCount: story.wordCount ?? 100,
	estimatedMinutes: story.estimatedMinutes ?? 3,
	vocabularyCount: story.vocabulary?.length ?? 10,
	questionCount: story.questions?.length ?? 5,
	dialogueCount: story.dialogue?.length ?? 8
}));

describe('Tarinat Page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		const { getStoryMetadata, loadStoryById } = await import('$lib/services/storyLoader');
		vi.mocked(getStoryMetadata).mockResolvedValue(mockMetadata);
		// Mock loadStoryById to return the full story when called
		vi.mocked(loadStoryById).mockImplementation(async (id: string) => {
			return mockStories.find((s: Story) => s.id === id) ?? null;
		});
	});

	it('renders loading state initially', () => {
		render(TarinatPage);
		expect(screen.getByText(/Tarinat ja dialogit/i)).toBeInTheDocument();
		// Loading spinner is shown
		const spinner = document.querySelector('.loading-spinner');
		expect(spinner).toBeInTheDocument();
	});

	it('renders story list with filter and sort controls after loading', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText(/Tarinat ja dialogit/i)).toBeInTheDocument();
			// Stories are shown with Spanish titles
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
			expect(screen.getByText('En el supermercado')).toBeInTheDocument();
			expect(screen.getByText('En la estación')).toBeInTheDocument();

			// Check for filter buttons
			const kaikkiButtons = screen.getAllByText(/Kaikki/i);
			expect(kaikkiButtons.length).toBeGreaterThan(0);
			expect(screen.getAllByText(/Alkeet/i).length).toBeGreaterThan(0);
			expect(screen.getAllByText(/Perustaso/i).length).toBeGreaterThan(0);
			expect(screen.getAllByText(/Keskitaso/i).length).toBeGreaterThan(0);
			expect(screen.getAllByText(/Edistynyt/i).length).toBeGreaterThan(0);

			// Check for sort direction button
			const sortButtons = screen.getAllByRole('button');
			const sortButton = sortButtons.find((btn) => btn.title === 'A-Z' || btn.title === 'Z-A');
			expect(sortButton).toBeDefined();
		});
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

	it('sorts stories by level then alphabetically by default', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// Get all story titles (Spanish titles in cards)
		const elements = screen.getAllByRole('heading', { level: 3 });
		const titles = elements.map((el) => el.textContent);

		// Stories should be sorted by level: A1 < A2 < B1 < B2, then alphabetically
		const aamuIndex = titles.findIndex((t) => t?.includes('La mañana'));
		const kahviIndex = titles.findIndex((t) => t?.includes('En la cafetería'));
		const ruokaIndex = titles.findIndex((t) => t?.includes('En el supermercado'));
		const asemaIndex = titles.findIndex((t) => t?.includes('En la estación'));
		const museoIndex = titles.findIndex((t) => t?.includes('El museo'));

		// Verify order: Aamu < Kahvilassa < Ruokakaupassa < Asemalla < Museo
		expect(aamuIndex).toBeLessThan(kahviIndex);
		expect(kahviIndex).toBeLessThan(ruokaIndex);
		expect(ruokaIndex).toBeLessThan(asemaIndex);
		expect(asemaIndex).toBeLessThan(museoIndex);

		// All five stories should be visible
		expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		expect(screen.getByText('En el supermercado')).toBeInTheDocument();
		expect(screen.getByText('En la estación')).toBeInTheDocument();
		expect(screen.getByText('La mañana')).toBeInTheDocument();
		expect(screen.getByText('El museo')).toBeInTheDocument();
	});

	it('reverses alphabetical order when sort direction is Z-A', async () => {
		render(TarinatPage);

		await waitFor(() => {
			expect(screen.getByText('En la cafetería')).toBeInTheDocument();
		});

		// Click sort direction toggle
		const sortButtons = screen.getAllByRole('button');
		const sortButton = sortButtons.find((btn) => btn.title === 'A-Z');
		if (sortButton) {
			await fireEvent.click(sortButton);
		}

		await waitFor(() => {
			const elements = screen.getAllByRole('heading', { level: 3 });
			const titles = elements.map((el) => el.textContent);

			// Within each level group, order should be reversed (Z-A alphabetically)
			const kahviIndex = titles.findIndex((t) => t?.includes('En la cafetería'));
			const aamuIndex = titles.findIndex((t) => t?.includes('La mañana'));
			expect(kahviIndex).toBeLessThan(aamuIndex);

			// Order between level groups should be unchanged
			const ruokaIndex = titles.findIndex((t) => t?.includes('En el supermercado'));
			expect(aamuIndex).toBeLessThan(ruokaIndex);
		});
	});

	it('shows empty state message when no stories available', async () => {
		const { getStoryMetadata } = await import('$lib/services/storyLoader');
		vi.mocked(getStoryMetadata).mockResolvedValue([]); // No stories

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
