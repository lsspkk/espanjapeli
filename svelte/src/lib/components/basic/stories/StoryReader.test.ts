import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StoryReader from './StoryReader.svelte';
import type { DialogueLine, VocabularyWord } from '$lib/types/story';

// Mock speechSynthesis
const mockSpeechSynthesis = {
	speak: vi.fn(),
	cancel: vi.fn(),
	pause: vi.fn(),
	resume: vi.fn(),
	getVoices: vi.fn(() => [])
};

Object.defineProperty(window, 'speechSynthesis', {
	writable: true,
	value: mockSpeechSynthesis
});

describe('StoryReader', () => {
	const mockDialogue: DialogueLine[] = [
		{ speaker: 'María', spanish: 'Buenos días', finnish: 'Hyvää huomenta' },
		{ speaker: 'Pedro', spanish: '¿Cómo estás?', finnish: 'Mitä kuuluu?' }
	];

	const mockVocabulary: VocabularyWord[] = [
		{ spanish: 'buenos días', finnish: 'hyvää huomenta' },
		{ spanish: 'cómo', finnish: 'miten' }
	];

	const mockOnContinue = vi.fn();

	beforeEach(() => {
		mockOnContinue.mockClear();
		vi.clearAllMocks();
	});

	it('renders dialogue lines', () => {
		render(StoryReader, {
			dialogue: mockDialogue,
			vocabulary: mockVocabulary,
			title: 'Test Story',
			titleSpanish: 'Historia de Prueba',
			onContinue: mockOnContinue
		});

		expect(screen.getByText('Buenos días')).toBeInTheDocument();
		expect(screen.getByText('¿Cómo estás?')).toBeInTheDocument();
		expect(screen.getByText('María')).toBeInTheDocument();
		expect(screen.getByText('Pedro')).toBeInTheDocument();
	});


	it('toggles all translations with button', async () => {
		render(StoryReader, {
			dialogue: mockDialogue,
			vocabulary: mockVocabulary,
			title: 'Test Story',
			titleSpanish: 'Historia de Prueba',
			onContinue: mockOnContinue
		});

		// Click "Käännökset" button to show all translations
		const translationsButton = screen.getByText('Käännökset');
		await fireEvent.click(translationsButton);

		// All translations should be visible
		expect(screen.getByText('Hyvää huomenta')).toBeInTheDocument();
		expect(screen.getByText('Mitä kuuluu?')).toBeInTheDocument();

		// Click again to hide all
		await fireEvent.click(translationsButton);

		// Translations should be hidden
		expect(screen.queryByText('Hyvää huomenta')).not.toBeInTheDocument();
		expect(screen.queryByText('Mitä kuuluu?')).not.toBeInTheDocument();
	});

	it('shows vocabulary when button is clicked', async () => {
		render(StoryReader, {
			dialogue: mockDialogue,
			vocabulary: mockVocabulary,
			title: 'Test Story',
			titleSpanish: 'Historia de Prueba',
			onContinue: mockOnContinue
		});

		// Click "Sanasto" button
		const vocabularyButton = screen.getByText('Sanasto');
		await fireEvent.click(vocabularyButton);

		// Vocabulary should be visible
		expect(screen.getByText('📚 Sanasto')).toBeInTheDocument();
		expect(screen.getByText('buenos días')).toBeInTheDocument();
		expect(screen.getByText('cómo')).toBeInTheDocument();

		// Dialogue should not be visible
		expect(screen.queryByText('Buenos días')).not.toBeInTheDocument();
	});

	it('returns to dialogue from vocabulary', async () => {
		render(StoryReader, {
			dialogue: mockDialogue,
			vocabulary: mockVocabulary,
			title: 'Test Story',
			titleSpanish: 'Historia de Prueba',
			onContinue: mockOnContinue
		});

		// Go to vocabulary
		await fireEvent.click(screen.getByText('Sanasto'));
		expect(screen.getByText('📚 Sanasto')).toBeInTheDocument();

		// Click "Takaisin" button
		await fireEvent.click(screen.getByText('Takaisin'));

		// Should be back to dialogue
		expect(screen.getByText('Buenos días')).toBeInTheDocument();
		expect(screen.queryByText('📚 Sanasto')).not.toBeInTheDocument();
	});

	it('calls onContinue when button is clicked', async () => {
		render(StoryReader, {
			dialogue: mockDialogue,
			vocabulary: mockVocabulary,
			title: 'Test Story',
			titleSpanish: 'Historia de Prueba',
			onContinue: mockOnContinue
		});

		// Click "Kysymyksiin" button
		await fireEvent.click(screen.getByText('Kysymyksiin'));

		expect(mockOnContinue).toHaveBeenCalledTimes(1);
	});

	it('renders vocabulary with examples', () => {
		const vocabWithExample: VocabularyWord[] = [
			{
				spanish: 'buenos días',
				finnish: 'hyvää huomenta',
				example: 'Buenos días, señora'
			}
		];

		render(StoryReader, {
			dialogue: mockDialogue,
			vocabulary: vocabWithExample,
			title: 'Test Story',
			titleSpanish: 'Historia de Prueba',
			onContinue: mockOnContinue
		});

		// Go to vocabulary
		fireEvent.click(screen.getByText('Sanasto'));

		expect(screen.getByText('Buenos días, señora')).toBeInTheDocument();
	});

	it('controls are visible by default', () => {
		const { container } = render(StoryReader, {
			dialogue: mockDialogue,
			vocabulary: mockVocabulary,
			title: 'Test Story',
			titleSpanish: 'Historia de Prueba',
			onContinue: mockOnContinue
		});

		// Bottom bar should be visible (not translated down)
		const bottomBar = container.querySelector('.fixed.bottom-0');
		expect(bottomBar).toBeInTheDocument();
		expect(bottomBar?.classList.contains('translate-y-full')).toBe(false);
	});

	it('toggles controls visibility on tap', async () => {
		const { container } = render(StoryReader, {
			dialogue: mockDialogue,
			vocabulary: mockVocabulary,
			title: 'Test Story',
			titleSpanish: 'Historia de Prueba',
			onContinue: mockOnContinue
		});

		const contentArea = container.querySelector('.overflow-y-auto');
		expect(contentArea).toBeInTheDocument();

		// Initially controls should be visible
		let bottomBar = container.querySelector('.fixed.bottom-0');
		expect(bottomBar?.classList.contains('translate-y-full')).toBe(false);

		// Tap to hide
		if (contentArea) {
			await fireEvent.click(contentArea);
		}

		// Controls should be hidden
		bottomBar = container.querySelector('.fixed.bottom-0');
		expect(bottomBar?.classList.contains('translate-y-full')).toBe(true);

		// Tap again to show
		if (contentArea) {
			await fireEvent.click(contentArea);
		}

		// Controls should be visible again
		bottomBar = container.querySelector('.fixed.bottom-0');
		expect(bottomBar?.classList.contains('translate-y-full')).toBe(false);
	});
});
