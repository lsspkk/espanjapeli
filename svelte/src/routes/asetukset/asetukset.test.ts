import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AsetuksetPage from './+page.svelte';

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

// Mock TTS service
vi.mock('$lib/services/tts', () => ({
	tts: {
		speakSpanish: vi.fn()
	}
}));

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] || null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		})
	};
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Asetukset Page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorageMock.clear();
	});

	it('renders settings page title', () => {
		render(AsetuksetPage);
		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Asetukset');
	});

	it('renders back to menu link', () => {
		render(AsetuksetPage);
		const backLink = screen.getByText('← Takaisin');
		expect(backLink).toBeTruthy();
		expect(backLink.getAttribute('href')).toBe('/');
	});

	it('renders learning stats section', () => {
		render(AsetuksetPage);
		expect(screen.getByText('📊 Oppimisen tiedot')).toBeTruthy();
	});

	it('renders export data section', () => {
		render(AsetuksetPage);
		expect(screen.getByText('📤 Vie tiedot')).toBeTruthy();
	});

	it('renders import data section', () => {
		render(AsetuksetPage);
		expect(screen.getByText('📥 Tuo tiedot')).toBeTruthy();
	});

	it('renders reset data section', () => {
		render(AsetuksetPage);
		expect(screen.getByText('🗑️ Nollaa kaikki tiedot')).toBeTruthy();
	});

	it('has export button with share option', () => {
		render(AsetuksetPage);
		expect(screen.getByText('Jaa...')).toBeTruthy();
		expect(screen.getByText('Lataa tiedosto')).toBeTruthy();
	});

	it('has file input for import', () => {
		render(AsetuksetPage);
		const fileInput = document.querySelector('input[type="file"]');
		expect(fileInput).toBeTruthy();
		expect(fileInput?.getAttribute('accept')).toBe('.json');
	});

	it('has reset button', () => {
		render(AsetuksetPage);
		expect(screen.getByText('Nollaa kaikki tiedot')).toBeTruthy();
	});

	it('reads game history from localStorage on mount', () => {
		localStorageMock.getItem.mockImplementation((key: string) => {
			if (key === 'gameHistory') return '[]';
			if (key === 'practiceProgress') return '{}';
			if (key === 'preferences') return '{}';
			return null;
		});

		render(AsetuksetPage);
		expect(localStorageMock.getItem).toHaveBeenCalledWith('gameHistory');
	});

	it('renders TTS settings section', () => {
		render(AsetuksetPage);
		expect(screen.getByText('🔊 Puhesynteesi (TTS)')).toBeTruthy();
	});

	it('has TTS rate slider', () => {
		render(AsetuksetPage);
		const rateSlider = document.getElementById('tts-rate');
		expect(rateSlider).toBeTruthy();
		expect(rateSlider?.getAttribute('type')).toBe('range');
	});

	it('has TTS pitch slider', () => {
		render(AsetuksetPage);
		const pitchSlider = document.getElementById('tts-pitch');
		expect(pitchSlider).toBeTruthy();
		expect(pitchSlider?.getAttribute('type')).toBe('range');
	});

	it('has TTS volume slider', () => {
		render(AsetuksetPage);
		const volumeSlider = document.getElementById('tts-volume');
		expect(volumeSlider).toBeTruthy();
		expect(volumeSlider?.getAttribute('type')).toBe('range');
	});

	it('has auto-speak toggle', () => {
		render(AsetuksetPage);
		expect(screen.getByText('Automaattinen ääntäminen')).toBeTruthy();
	});

	it('has TTS test button', () => {
		render(AsetuksetPage);
		expect(screen.getByText('🔊 Testaa')).toBeTruthy();
	});

	it('renders theme selection section', () => {
		render(AsetuksetPage);
		expect(screen.getByText('🎨 Teema')).toBeTruthy();
	});

	it('has theme selection buttons', () => {
		render(AsetuksetPage);
		expect(screen.getByText('Light')).toBeTruthy();
		expect(screen.getByText('Cupcake')).toBeTruthy();
	});

	it('has reset theme button', () => {
		render(AsetuksetPage);
		expect(screen.getByText('Palauta oletusteema')).toBeTruthy();
	});
});
