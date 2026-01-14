import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import FrequencySummary from './FrequencySummary.svelte';
import type { Word } from '$lib/data/words';
import * as vocabularyService from '$lib/services/vocabularyService';

// Mock the vocabulary service
vi.mock('$lib/services/vocabularyService', () => ({
	getWordsMetadata: vi.fn()
}));

describe('FrequencySummary', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders loading state initially', () => {
		const words: Word[] = [
			{ spanish: 'hola', english: 'hello', finnish: 'hei' }
		];

		// Mock a delayed response
		vi.mocked(vocabularyService.getWordsMetadata).mockImplementation(
			() => new Promise(resolve => setTimeout(() => resolve(new Map()), 1000))
		);

		render(FrequencySummary, { props: { words } });
		
		expect(screen.getByText(/Lasketaan sanojen yleisyyttä/i)).toBeInTheDocument();
	});

	it('renders nothing when no words provided', async () => {
		const { container } = render(FrequencySummary, { props: { words: [] } });
		
		await waitFor(() => {
			expect(container.querySelector('.bg-base-200')).not.toBeInTheDocument();
		});
	});

	it('displays frequency summary with top 100 words', async () => {
		const words: Word[] = [
			{ spanish: 'el', english: 'the', finnish: 'se' },
			{ spanish: 'de', english: 'of', finnish: 'josta' }
		];

		// Mock metadata for top 100 words
		const mockMetadata = new Map([
			['el', {
				spanish: 'el',
				frequencyRank: 1,
				cefrLevel: 'A1',
				isTop100: true,
				isTop500: true,
				isTop1000: true,
				isTop3000: true,
				isTop5000: true,
				isInFrequencyData: true
			}],
			['de', {
				spanish: 'de',
				frequencyRank: 2,
				cefrLevel: 'A1',
				isTop100: true,
				isTop500: true,
				isTop1000: true,
				isTop3000: true,
				isTop5000: true,
				isInFrequencyData: true
			}]
		]);

		vi.mocked(vocabularyService.getWordsMetadata).mockResolvedValue(mockMetadata);

		render(FrequencySummary, { props: { words } });

		await waitFor(() => {
			expect(screen.getByText(/Sanojen yleisyys/i)).toBeInTheDocument();
		});

		expect(screen.getByText(/Harjoittelit 2 sanaa/i)).toBeInTheDocument();
		expect(screen.getByText('100 yleisintä')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	it('displays mixed frequency tiers', async () => {
		const words: Word[] = [
			{ spanish: 'el', english: 'the', finnish: 'se' },
			{ spanish: 'casa', english: 'house', finnish: 'talo' },
			{ spanish: 'raro', english: 'rare', finnish: 'harvinainen' }
		];

		const mockMetadata = new Map([
			['el', {
				spanish: 'el',
				frequencyRank: 1,
				cefrLevel: 'A1',
				isTop100: true,
				isTop500: true,
				isTop1000: true,
				isTop3000: true,
				isTop5000: true,
				isInFrequencyData: true
			}],
			['casa', {
				spanish: 'casa',
				frequencyRank: 250,
				cefrLevel: 'A1',
				isTop100: false,
				isTop500: true,
				isTop1000: true,
				isTop3000: true,
				isTop5000: true,
				isInFrequencyData: true
			}],
			['raro', {
				spanish: 'raro',
				frequencyRank: null,
				cefrLevel: null,
				isTop100: false,
				isTop500: false,
				isTop1000: false,
				isTop3000: false,
				isTop5000: false,
				isInFrequencyData: false
			}]
		]);

		vi.mocked(vocabularyService.getWordsMetadata).mockResolvedValue(mockMetadata);

		render(FrequencySummary, { props: { words } });

		await waitFor(() => {
			expect(screen.getByText(/Sanojen yleisyys/i)).toBeInTheDocument();
		});

		expect(screen.getByText('100 yleisintä')).toBeInTheDocument();
		expect(screen.getByText('500 yleisintä')).toBeInTheDocument();
		expect(screen.getByText('Muut')).toBeInTheDocument();
	});

	it('shows helpful tip about common words', async () => {
		const words: Word[] = [
			{ spanish: 'hola', english: 'hello', finnish: 'hei' }
		];

		const mockMetadata = new Map([
			['hola', {
				spanish: 'hola',
				frequencyRank: 50,
				cefrLevel: 'A1',
				isTop100: true,
				isTop500: true,
				isTop1000: true,
				isTop3000: true,
				isTop5000: true,
				isInFrequencyData: true
			}]
		]);

		vi.mocked(vocabularyService.getWordsMetadata).mockResolvedValue(mockMetadata);

		render(FrequencySummary, { props: { words } });

		await waitFor(() => {
			expect(screen.getByText(/Yleisimmät sanat.*tärkeimpiä/i)).toBeInTheDocument();
		});
	});

	it('handles words not in frequency data', async () => {
		const words: Word[] = [
			{ spanish: 'xyzabc', english: 'nonsense', finnish: 'hölynpöly' }
		];

		const mockMetadata = new Map([
			['xyzabc', {
				spanish: 'xyzabc',
				frequencyRank: null,
				cefrLevel: null,
				isTop100: false,
				isTop500: false,
				isTop1000: false,
				isTop3000: false,
				isTop5000: false,
				isInFrequencyData: false
			}]
		]);

		vi.mocked(vocabularyService.getWordsMetadata).mockResolvedValue(mockMetadata);

		render(FrequencySummary, { props: { words } });

		await waitFor(() => {
			// Component should not render if no words have frequency data
			expect(screen.queryByText(/Sanojen yleisyys/i)).not.toBeInTheDocument();
		});
	});
});
