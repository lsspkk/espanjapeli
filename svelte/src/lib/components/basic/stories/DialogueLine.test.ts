import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import DialogueLine from './DialogueLine.svelte';
import type { DialogueLine as DialogueLineType } from '$lib/types/story';

describe('DialogueLine', () => {
	const mockLine: DialogueLineType = {
		speaker: 'María',
		spanish: 'Buenos días, señora',
		finnish: 'Hyvää huomenta, rouva'
	};

	it('renders speaker name and Spanish text', () => {
		render(DialogueLine, {
			line: mockLine,
			expanded: false
		});

		expect(screen.getByText('María')).toBeInTheDocument();
		expect(screen.getByText('Buenos días, señora')).toBeInTheDocument();
	});

	it('does not show translation when collapsed', () => {
		render(DialogueLine, {
			line: mockLine,
			expanded: false
		});

		expect(screen.queryByText('Hyvää huomenta, rouva')).not.toBeInTheDocument();
	});

	it('shows translation when expanded', () => {
		render(DialogueLine, {
			line: mockLine,
			expanded: true
		});

		expect(screen.getByText('Hyvää huomenta, rouva')).toBeInTheDocument();
	});

	it('renders correctly with different speaker names', () => {
		const differentLine: DialogueLineType = {
			speaker: 'Pedro',
			spanish: '¿Cómo estás?',
			finnish: 'Mitä kuuluu?'
		};

		render(DialogueLine, {
			line: differentLine,
			expanded: false
		});

		expect(screen.getByText('Pedro')).toBeInTheDocument();
		expect(screen.getByText('¿Cómo estás?')).toBeInTheDocument();
	});
});
