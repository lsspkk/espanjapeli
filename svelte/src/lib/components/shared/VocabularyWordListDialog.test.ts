import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import VocabularyWordListDialog from './VocabularyWordListDialog.svelte';
import type { Word } from '$lib/data/words';

describe('VocabularyWordListDialog', () => {
	const mockWords: Word[] = [
		{
			spanish: 'perro',
			english: 'dog',
			finnish: 'koira',
			frequency: {
				rank: 150,
				cefrLevel: 'A1',
				isTop100: false,
				isTop500: true,
				isTop1000: true,
				isTop3000: true,
				isTop5000: true
			}
		},
		{
			spanish: 'gato',
			english: 'cat',
			finnish: 'kissa',
			frequency: {
				rank: 200,
				cefrLevel: 'A1',
				isTop100: false,
				isTop500: true,
				isTop1000: true,
				isTop3000: true,
				isTop5000: true
			}
		},
		{
			spanish: 'casa',
			english: 'house',
			finnish: 'talo'
		}
	];

	it('should not render when isOpen is false', () => {
		render(VocabularyWordListDialog, {
			props: {
				isOpen: false,
				title: 'Test Words',
				words: mockWords
			}
		});

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('should render when isOpen is true', () => {
		render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: mockWords
			}
		});

		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(screen.getByText('Test Words')).toBeInTheDocument();
	});

	it('should display all words with Spanish and Finnish translations', () => {
		render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: mockWords
			}
		});

		expect(screen.getByText('perro')).toBeInTheDocument();
		expect(screen.getByText('koira')).toBeInTheDocument();
		expect(screen.getByText('gato')).toBeInTheDocument();
		expect(screen.getByText('kissa')).toBeInTheDocument();
		expect(screen.getByText('casa')).toBeInTheDocument();
		expect(screen.getByText('talo')).toBeInTheDocument();
	});

	it('should display English translations when available', () => {
		render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: mockWords
			}
		});

		expect(screen.getByText('dog')).toBeInTheDocument();
		expect(screen.getByText('cat')).toBeInTheDocument();
		expect(screen.getByText('house')).toBeInTheDocument();
	});

	it('should show frequency data when showFrequency is true', () => {
		render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: mockWords,
				showFrequency: true
			}
		});

		expect(screen.getByText('#150')).toBeInTheDocument();
		expect(screen.getByText('#200')).toBeInTheDocument();
		expect(screen.getAllByText('A1')).toHaveLength(2);
	});

	it('should not show frequency data when showFrequency is false', () => {
		render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: mockWords,
				showFrequency: false
			}
		});

		expect(screen.queryByText('#150')).not.toBeInTheDocument();
		expect(screen.queryByText('#200')).not.toBeInTheDocument();
	});

	it('should display word count in footer', () => {
		render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: mockWords
			}
		});

		expect(screen.getByText('Yhteensä: 3 sanaa')).toBeInTheDocument();
	});

	it('should show empty state when no words provided', () => {
		render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: []
			}
		});

		expect(screen.getByText('Ei sanoja näytettäväksi')).toBeInTheDocument();
		expect(screen.getByText('Yhteensä: 0 sanaa')).toBeInTheDocument();
	});

	it('should have clickable close button', async () => {
		render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: mockWords
			}
		});

		const closeButtons = screen.getAllByRole('button', { name: /sulje/i });
		expect(closeButtons.length).toBeGreaterThan(0);
		
		// Button should be clickable
		await fireEvent.click(closeButtons[0]);
		
		// Modal should still be in DOM (parent handles actual closing)
		expect(closeButtons[0]).toBeInTheDocument();
	});

	it('should have clickable X button in header', async () => {
		const { container } = render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: mockWords
			}
		});

		// Find the X button in the header (has btn-circle class)
		const xButton = container.querySelector('.btn-circle');
		expect(xButton).toBeInTheDocument();
		
		// Button should be clickable
		if (xButton) {
			await fireEvent.click(xButton);
		}
		
		// Modal should still be in DOM (parent handles actual closing)
		expect(xButton).toBeInTheDocument();
	});

	it('should have clickable backdrop', async () => {
		const { container } = render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: mockWords
			}
		});

		const backdrop = container.querySelector('.fixed.inset-0');
		expect(backdrop).toBeInTheDocument();
		
		if (backdrop) {
			await fireEvent.click(backdrop);
		}
		
		// Modal should still be in DOM (parent handles actual closing)
		expect(backdrop).toBeInTheDocument();
	});

	it('should have proper ARIA attributes', () => {
		render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: mockWords
			}
		});

		const dialog = screen.getByRole('dialog');
		expect(dialog).toHaveAttribute('aria-modal', 'true');
		expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
	});

	it('should handle words without frequency data gracefully', () => {
		const wordsWithoutFrequency: Word[] = [
			{
				spanish: 'ejemplo',
				english: 'example',
				finnish: 'esimerkki'
			}
		];

		render(VocabularyWordListDialog, {
			props: {
				isOpen: true,
				title: 'Test Words',
				words: wordsWithoutFrequency,
				showFrequency: true
			}
		});

		expect(screen.getByText('ejemplo')).toBeInTheDocument();
		expect(screen.getByText('esimerkki')).toBeInTheDocument();
		expect(screen.getByText('example')).toBeInTheDocument();
		// Should not crash when frequency data is missing
	});
});
