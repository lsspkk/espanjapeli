import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StoryCard from './StoryCard.svelte';
import type { Story } from '$lib/types/story';

describe('StoryCard', () => {
	const mockStory: Story = {
		id: 'test-story',
		title: 'Test Story',
		titleSpanish: 'Historia de Prueba',
		description: 'A test story',
		level: 'A1',
		category: 'shopping',
		icon: '🛒',
		dialogue: [
			{ speaker: 'A', spanish: 'Hola', finnish: 'Hei' },
			{ speaker: 'B', spanish: 'Adiós', finnish: 'Heippa' }
		],
		vocabulary: [],
		questions: [
			{
				question: 'Test?',
				options: ['A', 'B', 'C', 'D'],
				correctAnswer: 0,
				explanation: ''
			}
		]
	};

	it('renders story title in Spanish', () => {
		render(StoryCard, { story: mockStory });
		expect(screen.getByText('Historia de Prueba')).toBeInTheDocument();
	});

	it('renders story description', () => {
		render(StoryCard, { story: mockStory });
		expect(screen.getByText('A test story')).toBeInTheDocument();
	});

	it('renders story icon', () => {
		render(StoryCard, { story: mockStory });
		expect(screen.getByText('🛒')).toBeInTheDocument();
	});

	it('displays CEFR level label with Finnish description', () => {
		render(StoryCard, { story: mockStory });
		// Should display "Alkeet" (short format)
		const badge = screen.getByText('Alkeet');
		expect(badge).toBeInTheDocument();
	});

	it('displays correct level for A2 stories', () => {
		const a2Story = { ...mockStory, level: 'A2' as const };
		render(StoryCard, { story: a2Story });
		// Should display "Perustaso" (short format)
		const badge = screen.getByText('Perustaso');
		expect(badge).toBeInTheDocument();
	});

	it('displays correct level for B1 stories', () => {
		const b1Story = { ...mockStory, level: 'B1' as const };
		render(StoryCard, { story: b1Story });
		// Should display "Keskitaso" (short format)
		const badge = screen.getByText('Keskitaso');
		expect(badge).toBeInTheDocument();
	});

	it('displays correct level for B2 stories', () => {
		const b2Story = { ...mockStory, level: 'B2' as const };
		render(StoryCard, { story: b2Story });
		// Should display "Edistynyt" (short format)
		const badge = screen.getByText('Edistynyt');
		expect(badge).toBeInTheDocument();
	});

	it('displays dialogue count', () => {
		render(StoryCard, { story: mockStory });
		expect(screen.getByText('2 repliikkiä')).toBeInTheDocument();
	});

	it('displays question count', () => {
		render(StoryCard, { story: mockStory });
		expect(screen.getByText(/1 kysymystä/)).toBeInTheDocument();
	});

	it('calls onSelect when clicked in button mode', async () => {
		let selectedStory: Story | null = null;
		const onSelect = (story: Story) => {
			selectedStory = story;
		};

		const { container } = render(StoryCard, {
			story: mockStory,
			onSelect,
			useLink: false
		});

		const button = container.querySelector('button');
		expect(button).toBeTruthy();
		button?.click();

		expect(selectedStory).toEqual(mockStory);
	});

	it('renders as link when useLink is true', () => {
		const { container } = render(StoryCard, {
			story: mockStory,
			useLink: true
		});

		const link = container.querySelector('a');
		expect(link).toBeTruthy();
		expect(link?.getAttribute('href')).toContain('/tarinat/test-story');
	});

	it('renders as button when useLink is false', () => {
		const { container } = render(StoryCard, {
			story: mockStory,
			useLink: false
		});

		const button = container.querySelector('button');
		expect(button).toBeTruthy();
	});

	it('has proper level styling for level A1', () => {
		const { container } = render(StoryCard, { story: mockStory });
		const levelSpan = screen.getByText('Alkeet');
		expect(levelSpan.classList.contains('text-green-700/60')).toBe(true);
	});

	it('has proper level styling for level A2', () => {
		const a2Story = { ...mockStory, level: 'A2' as const };
		const { container } = render(StoryCard, { story: a2Story });
		const levelSpan = screen.getByText('Perustaso');
		expect(levelSpan.classList.contains('text-amber-700/60')).toBe(true);
	});
});
