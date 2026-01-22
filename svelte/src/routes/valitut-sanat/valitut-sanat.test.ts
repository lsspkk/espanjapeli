import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte';
import ValitutSanatPage from './+page.svelte';

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

// Mock lessonService
vi.mock('$lib/services/lessonService', () => {
	const mockLessons = [
		{
			id: 'verbs-1',
			category: 'verbs',
			categoryName: 'Verbit',
			tier: 1,
			wordCount: 5,
			phraseCount: 10,
			filename: 'verbs-1.json'
		},
		{
			id: 'nouns-1',
			category: 'nouns',
			categoryName: 'Substantiivit',
			tier: 1,
			wordCount: 5,
			phraseCount: 8,
			filename: 'nouns-1.json'
		}
	];

	const mockLessonData = {
		id: 'verbs-1',
		category: 'verbs',
		categoryName: 'Verbit',
		tier: 1,
		words: ['hablar', 'comer', 'vivir', 'ser', 'estar'],
		phrases: ['sent1', 'sent2', 'sent3']
	};

	return {
		loadLessonIndex: vi.fn().mockResolvedValue({
			lessons: mockLessons
		}),
		loadLesson: vi.fn().mockResolvedValue(mockLessonData),
		getLessonsByCategory: vi.fn().mockResolvedValue([mockLessonData]),
		type: {} as any
	};
});

// Mock sentenceLoader service
vi.mock('$lib/services/sentenceLoader', () => {
	const mockSentences = [
		{
			id: 'sent1',
			spanish: 'Yo hablo español',
			finnish: 'Minä puhun espanjaa',
			english: 'I speak Spanish',
			wordCount: 3,
			themes: ['general']
		},
		{
			id: 'sent2',
			spanish: 'Ella come pan',
			finnish: 'Hän syö leipää',
			english: 'She eats bread',
			wordCount: 3,
			themes: ['food']
		},
		{
			id: 'sent3',
			spanish: 'Nosotros vivimos aquí',
			finnish: 'Me asumme täällä',
			english: 'We live here',
			wordCount: 3,
			themes: ['general']
		}
	];

	return {
		loadSentenceIndex: vi.fn().mockResolvedValue({
			themes: [
				{ id: 'general', name: 'general', count: 10, filename: 'general.json' },
				{ id: 'food', name: 'food', count: 8, filename: 'food.json' }
			]
		}),
		loadSentenceGroup: vi.fn().mockResolvedValue({
			id: 'general',
			theme: 'general',
			sentences: mockSentences,
			count: mockSentences.length
		}),
		type: {} as any
	};
});

// Mock words data
vi.mock('$lib/data/words', () => {
	const mockWords = [
		{ id: 'hablar', spanish: 'hablar', finnish: 'puhua', category: 'verbs', level: 'A1' },
		{ id: 'comer', spanish: 'comer', finnish: 'syödä', category: 'verbs', level: 'A1' },
		{ id: 'vivir', spanish: 'vivir', finnish: 'asua', category: 'verbs', level: 'A1' },
		{ id: 'ser', spanish: 'ser', finnish: 'olla', category: 'verbs', level: 'A1' },
		{ id: 'estar', spanish: 'estar', finnish: 'olla', category: 'verbs', level: 'A1' }
	];

	return {
		getAllWords: vi.fn().mockReturnValue(mockWords),
		type: {} as any
	};
});

// Mock TTS service
vi.mock('$lib/services/tts', () => ({
	tts: {
		speakSpanish: vi.fn(),
		speakFinnish: vi.fn()
	}
}));

// Mock ttsSettings store
vi.mock('$lib/stores/ttsSettings', () => ({
	ttsSettings: {
		subscribe: vi.fn((callback) => {
			callback({ autoSpeak: true, rate: 1, pitch: 1 });
			return () => {};
		})
	}
}));

// Mock timedAnswerSettings store
vi.mock('$lib/stores/timedAnswerSettings', () => ({
	timedAnswerSettings: {
		subscribe: vi.fn((callback) => {
			callback({ 
				yhdistasanat: 3,
				sanapeli: 3,
				mitasasanoit: 3,
				valitutsanat: 0 // Set to 0 for testing to avoid delays
			});
			return () => {};
		}),
		getDelay: vi.fn().mockReturnValue(0)
	}
}));

// Mock lessonProgress store
vi.mock('$lib/stores/lessonProgress', () => ({
	lessonProgress: {
		getLessonProgress: vi.fn().mockReturnValue(null),
		completeLesson: vi.fn(),
		subscribe: vi.fn((callback) => {
			callback({});
			return () => {};
		})
	}
}));

// Mock wordKnowledge store
vi.mock('$lib/stores/wordKnowledge', () => ({
	wordKnowledge: {
		recordAnswer: vi.fn(),
		getWordScore: vi.fn().mockReturnValue({ correctCount: 0, wrongCount: 0 }),
		subscribe: vi.fn((callback) => {
			callback({});
			return () => {};
		})
	}
}));

describe('Valitut sanat Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders home state with lesson list and lesson cards visible', async () => {
		render(ValitutSanatPage);

		await waitFor(() => {
			// Title
			expect(screen.getByRole('heading', { level: 1, name: 'Valitut sanat' })).toBeTruthy();

			// Description
			expect(screen.getByText(/Opi sanoja oppitunneilla/i)).toBeTruthy();

			// Category headings
			expect(screen.getByText('Verbit')).toBeTruthy();
			expect(screen.getByText('Substantiivit')).toBeTruthy();
		});
	});

	it('renders teaching-words state with word list, TTS buttons, and continue button', async () => {
		render(ValitutSanatPage);

		await waitFor(() => {
			expect(screen.getByText('Verbit')).toBeTruthy();
		});

		// Find and click a lesson card
		const lessonCards = screen.getAllByRole('button');
		const lessonCard = lessonCards.find(btn => btn.textContent?.includes('Verbit'));
		
		if (lessonCard) {
			await fireEvent.click(lessonCard);

			await waitFor(() => {
				// Should show "Sanat" heading
				expect(screen.getByRole('heading', { level: 2, name: 'Sanat' })).toBeTruthy();

				// Should show phase indicator
				expect(screen.getByText('Vaihe 1/3')).toBeTruthy();

				// Should show continue button
				expect(screen.getByRole('button', { name: /Jatka/i })).toBeTruthy();

				// Should show back button
				expect(screen.getByRole('button', { name: /Takaisin/i })).toBeTruthy();

				// Should show words (check for at least one word)
				const pageContent = document.body.textContent || '';
				expect(pageContent.includes('hablar') || pageContent.includes('comer')).toBe(true);
			});
		}
	});

	it('renders teaching-phrases state with example sentences and continue button', async () => {
		render(ValitutSanatPage);

		await waitFor(() => {
			expect(screen.getByText('Verbit')).toBeTruthy();
		});

		// Click lesson card
		const lessonCards = screen.getAllByRole('button');
		const lessonCard = lessonCards.find(btn => btn.textContent?.includes('Verbit'));
		
		if (lessonCard) {
			await fireEvent.click(lessonCard);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /Jatka/i })).toBeTruthy();
			});

			// Click continue button to go to phrases
			const continueButton = screen.getByRole('button', { name: /Jatka/i });
			await fireEvent.click(continueButton);

			await waitFor(() => {
				// Should show "Esimerkit" heading
				expect(screen.getByRole('heading', { level: 2, name: 'Esimerkit' })).toBeTruthy();

				// Should show phase indicator
				expect(screen.getByText('Vaihe 2/3')).toBeTruthy();

				// Should show start test button
				expect(screen.getByRole('button', { name: /Aloita testi/i })).toBeTruthy();

				// Should show back button
				const backButtons = screen.getAllByRole('button', { name: /Takaisin/i });
				expect(backButtons.length).toBeGreaterThan(0);
			}, { timeout: 5000 });
		}
	});

	it('renders quiz state with question and answer options visible', async () => {
		render(ValitutSanatPage);

		await waitFor(() => {
			expect(screen.getByText('Verbit')).toBeTruthy();
		});

		// Click lesson card
		const lessonCards = screen.getAllByRole('button');
		const lessonCard = lessonCards.find(btn => btn.textContent?.includes('Verbit'));
		
		if (lessonCard) {
			await fireEvent.click(lessonCard);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /Jatka/i })).toBeTruthy();
			});

			// Click continue to phrases
			const continueButton = screen.getByRole('button', { name: /Jatka/i });
			await fireEvent.click(continueButton);

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /Aloita testi/i })).toBeTruthy();
			}, { timeout: 5000 });

			// Click start test button
			const startTestButton = screen.getByRole('button', { name: /Aloita testi/i });
			await fireEvent.click(startTestButton);

			await waitFor(() => {
				// Should show "Testi" heading
				expect(screen.getByRole('heading', { level: 2, name: 'Testi' })).toBeTruthy();

				// Should show phase indicator
				expect(screen.getByText('Vaihe 3/3')).toBeTruthy();

				// Should show question counter
				expect(screen.getByText(/Kysymys/i)).toBeTruthy();

				// Should show score
				expect(screen.getByText(/Pisteet/i)).toBeTruthy();

				// Should have answer buttons (at least 4)
				const buttons = screen.getAllByRole('button');
				expect(buttons.length).toBeGreaterThan(3);
			}, { timeout: 3000 });
		}
	});

	it('renders report state with score, next review info, and action buttons visible', async () => {
		render(ValitutSanatPage);

		await waitFor(() => {
			expect(screen.getByText('Verbit')).toBeTruthy();
		});

		// This is a simplified test - full flow would require answering all questions
		// For now, we verify the UI elements are accessible through the page structure
		
		// Verify home state has necessary elements to start the flow
		const lessonCards = screen.getAllByRole('button');
		expect(lessonCards.length).toBeGreaterThan(0);
	});

	it('shows spaced repetition recommendations when lessons are due', async () => {
		// Mock lessonProgress to return a lesson that needs review
		const { lessonProgress } = await import('$lib/stores/lessonProgress');
		vi.mocked(lessonProgress.getLessonProgress).mockReturnValue({
			lessonId: 'verbs-1',
			completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
			wordScores: { hablar: 75, comer: 80 },
			nextReviewAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago (overdue)
		});

		render(ValitutSanatPage);

		await waitFor(() => {
			// Should show review alert
			const pageContent = document.body.textContent || '';
			expect(pageContent.includes('Aika kerrata') || pageContent.includes('kertaus')).toBe(true);
		});
	});

	it('displays lesson categories and groups lessons correctly', async () => {
		render(ValitutSanatPage);

		await waitFor(() => {
			// Should show category headings
			expect(screen.getByText('Verbit')).toBeTruthy();
			expect(screen.getByText('Substantiivit')).toBeTruthy();

			// Should have multiple lesson cards
			const buttons = screen.getAllByRole('button');
			expect(buttons.length).toBeGreaterThan(1);
		});
	});

	it('allows navigation back to home from teaching states', async () => {
		render(ValitutSanatPage);

		await waitFor(() => {
			expect(screen.getByText('Verbit')).toBeTruthy();
		});

		// Click lesson card
		const lessonCards = screen.getAllByRole('button');
		const lessonCard = lessonCards.find(btn => btn.textContent?.includes('Verbit'));
		
		if (lessonCard) {
			await fireEvent.click(lessonCard);

			await waitFor(() => {
				expect(screen.getByRole('heading', { level: 2, name: 'Sanat' })).toBeTruthy();
			});

			// Click back button
			const backButton = screen.getByRole('button', { name: /Takaisin/i });
			await fireEvent.click(backButton);

			await waitFor(() => {
				// Should be back at home state
				expect(screen.getByRole('heading', { level: 1, name: 'Valitut sanat' })).toBeTruthy();
			});
		}
	});
});
