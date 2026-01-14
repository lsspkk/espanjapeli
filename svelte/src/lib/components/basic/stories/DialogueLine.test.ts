import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DialogueLine from './DialogueLine.svelte';
import type { DialogueLine as DialogueLineType } from '$lib/types/story';

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

describe('DialogueLine', () => {
	const mockLine: DialogueLineType = {
		speaker: 'María',
		spanish: 'Buenos días, señora',
		finnish: 'Hyvää huomenta, rouva'
	};

	const mockOnToggle = vi.fn();

	beforeEach(() => {
		mockOnToggle.mockClear();
		vi.clearAllMocks();
	});

	it('renders speaker name and Spanish text', () => {
		render(DialogueLine, {
			line: mockLine,
			expanded: false,
			onToggle: mockOnToggle
		});

		expect(screen.getByText('María')).toBeInTheDocument();
		expect(screen.getByText('Buenos días, señora')).toBeInTheDocument();
	});

	it('shows "Näytä käännös" button when collapsed', () => {
		render(DialogueLine, {
			line: mockLine,
			expanded: false,
			onToggle: mockOnToggle
		});

		expect(screen.getByText('Näytä käännös')).toBeInTheDocument();
		expect(screen.queryByText('Hyvää huomenta, rouva')).not.toBeInTheDocument();
	});

	it('shows translation when expanded', () => {
		render(DialogueLine, {
			line: mockLine,
			expanded: true,
			onToggle: mockOnToggle
		});

		expect(screen.getByText('Piilota käännös')).toBeInTheDocument();
		expect(screen.getByText('Hyvää huomenta, rouva')).toBeInTheDocument();
	});

	it('calls onToggle when toggle button is clicked', async () => {
		render(DialogueLine, {
			line: mockLine,
			expanded: false,
			onToggle: mockOnToggle
		});

		const toggleButton = screen.getByText('Näytä käännös');
		await fireEvent.click(toggleButton);

		expect(mockOnToggle).toHaveBeenCalledTimes(1);
	});

	it('calls onToggle when expanded and hide button is clicked', async () => {
		render(DialogueLine, {
			line: mockLine,
			expanded: true,
			onToggle: mockOnToggle
		});

		const toggleButton = screen.getByText('Piilota käännös');
		await fireEvent.click(toggleButton);

		expect(mockOnToggle).toHaveBeenCalledTimes(1);
	});

	it('has TTS button that can be clicked', async () => {
		render(DialogueLine, {
			line: mockLine,
			expanded: false,
			onToggle: mockOnToggle
		});

		const ttsButtons = screen.getAllByLabelText('Kuuntele lause');
		expect(ttsButtons.length).toBeGreaterThan(0);
		
		// Just verify the button exists and can be clicked without error
		await fireEvent.click(ttsButtons[0]);
		
		// Button click should not throw error
		expect(ttsButtons[0]).toBeInTheDocument();
	});

	it('renders correctly with different speaker names', () => {
		const differentLine: DialogueLineType = {
			speaker: 'Pedro',
			spanish: '¿Cómo estás?',
			finnish: 'Mitä kuuluu?'
		};

		render(DialogueLine, {
			line: differentLine,
			expanded: false,
			onToggle: mockOnToggle
		});

		expect(screen.getByText('Pedro')).toBeInTheDocument();
		expect(screen.getByText('¿Cómo estás?')).toBeInTheDocument();
	});
});
