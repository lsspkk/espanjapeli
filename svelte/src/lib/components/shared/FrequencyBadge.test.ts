/**
 * Tests for FrequencyBadge component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import FrequencyBadge from './FrequencyBadge.svelte';
import * as vocabularyService from '$lib/services/vocabularyService';

// Mock vocabularyService
vi.mock('$lib/services/vocabularyService', () => ({
	getWordMetadata: vi.fn()
}));

describe('FrequencyBadge', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should not render when word is not in frequency data', async () => {
		vi.mocked(vocabularyService.getWordMetadata).mockResolvedValue({
			spanish: 'test',
			frequencyRank: null,
			cefrLevel: null,
			isTop100: false,
			isTop500: false,
			isTop1000: false,
			isTop3000: false,
			isTop5000: false,
			isInFrequencyData: false
		});

		render(FrequencyBadge, { spanish: 'test' });

		await waitFor(() => {
			expect(vocabularyService.getWordMetadata).toHaveBeenCalledWith('test');
		});

		// Badge should not be rendered
		expect(screen.queryByText(/Top/)).not.toBeInTheDocument();
	});

	it('should render Top 100 badge for top 100 words', async () => {
		vi.mocked(vocabularyService.getWordMetadata).mockResolvedValue({
			spanish: 'el',
			frequencyRank: 1,
			cefrLevel: 'A1',
			isTop100: true,
			isTop500: true,
			isTop1000: true,
			isTop3000: true,
			isTop5000: true,
			isInFrequencyData: true
		});

		render(FrequencyBadge, { spanish: 'el' });

		await waitFor(() => {
			expect(screen.getByText('Top 100')).toBeInTheDocument();
		});
	});

	it('should render Top 500 badge for top 500 words (not top 100)', async () => {
		vi.mocked(vocabularyService.getWordMetadata).mockResolvedValue({
			spanish: 'palabra',
			frequencyRank: 250,
			cefrLevel: 'A2',
			isTop100: false,
			isTop500: true,
			isTop1000: true,
			isTop3000: true,
			isTop5000: true,
			isInFrequencyData: true
		});

		render(FrequencyBadge, { spanish: 'palabra' });

		await waitFor(() => {
			expect(screen.getByText('Top 500')).toBeInTheDocument();
		});
	});

	it('should render Top 1000 badge for top 1000 words (not top 500)', async () => {
		vi.mocked(vocabularyService.getWordMetadata).mockResolvedValue({
			spanish: 'ejemplo',
			frequencyRank: 750,
			cefrLevel: 'A2',
			isTop100: false,
			isTop500: false,
			isTop1000: true,
			isTop3000: true,
			isTop5000: true,
			isInFrequencyData: true
		});

		render(FrequencyBadge, { spanish: 'ejemplo' });

		await waitFor(() => {
			expect(screen.getByText('Top 1000')).toBeInTheDocument();
		});
	});

	it('should render Top 3000 badge for top 3000 words (not top 1000)', async () => {
		vi.mocked(vocabularyService.getWordMetadata).mockResolvedValue({
			spanish: 'palabra',
			frequencyRank: 2000,
			cefrLevel: 'B1',
			isTop100: false,
			isTop500: false,
			isTop1000: false,
			isTop3000: true,
			isTop5000: true,
			isInFrequencyData: true
		});

		render(FrequencyBadge, { spanish: 'palabra' });

		await waitFor(() => {
			expect(screen.getByText('Top 3000')).toBeInTheDocument();
		});
	});

	it('should render Top 5000 badge for top 5000 words (not top 3000)', async () => {
		vi.mocked(vocabularyService.getWordMetadata).mockResolvedValue({
			spanish: 'palabra',
			frequencyRank: 4000,
			cefrLevel: 'B2',
			isTop100: false,
			isTop500: false,
			isTop1000: false,
			isTop3000: false,
			isTop5000: true,
			isInFrequencyData: true
		});

		render(FrequencyBadge, { spanish: 'palabra' });

		await waitFor(() => {
			expect(screen.getByText('Top 5000')).toBeInTheDocument();
		});
	});

	it('should render star icon', async () => {
		vi.mocked(vocabularyService.getWordMetadata).mockResolvedValue({
			spanish: 'el',
			frequencyRank: 1,
			cefrLevel: 'A1',
			isTop100: true,
			isTop500: true,
			isTop1000: true,
			isTop3000: true,
			isTop5000: true,
			isInFrequencyData: true
		});

		render(FrequencyBadge, { spanish: 'el' });

		await waitFor(() => {
			expect(screen.getByText('⭐')).toBeInTheDocument();
		});
	});

	it('should support different sizes', async () => {
		vi.mocked(vocabularyService.getWordMetadata).mockResolvedValue({
			spanish: 'el',
			frequencyRank: 1,
			cefrLevel: 'A1',
			isTop100: true,
			isTop500: true,
			isTop1000: true,
			isTop3000: true,
			isTop5000: true,
			isInFrequencyData: true
		});

		const { container } = render(FrequencyBadge, { spanish: 'el', size: 'lg' });

		await waitFor(() => {
			const badge = container.querySelector('.badge-lg');
			expect(badge).toBeInTheDocument();
		});
	});

	it('should handle errors gracefully', async () => {
		vi.mocked(vocabularyService.getWordMetadata).mockRejectedValue(new Error('Failed to load'));

		render(FrequencyBadge, { spanish: 'test' });

		await waitFor(() => {
			expect(vocabularyService.getWordMetadata).toHaveBeenCalled();
		});

		// Badge should not be rendered
		expect(screen.queryByText(/Top/)).not.toBeInTheDocument();
	});
});
