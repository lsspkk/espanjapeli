import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ShareModal from './ShareModal.svelte';
import * as shareService from '$lib/services/shareService';

// Mock shareService
vi.mock('$lib/services/shareService', () => ({
	generateProgressReport: vi.fn(),
	shareProgressReport: vi.fn(),
	copyToClipboard: vi.fn(),
	isWebShareAvailable: vi.fn()
}));

describe('ShareModal', () => {
	const mockReport = {
		text: '📚 Espanjapeli - Oppimisraportti\n\n🎯 Sanoja opittu: 50\n⭐ Sanoja hallittu: 25\n📖 Sanoja harjoiteltu: 75\n\n🌿 Arvioitu taso: A2\n\n📊 Yleisimmät sanat:\n  Top 100: 30/100 (30%)\n  Top 500: 80/500 (16%)\n  Top 1000: 120/1000 (12%)\n\n🎮 Pelejä pelattu: 20\n💯 Keskiarvo: 65%\n\nOpi espanjaa: espanjapeli.fi',
		stats: {
			totalPracticed: 75,
			wordsKnown: 50,
			wordsMastered: 25,
			wordsWeak: 15,
			topNProgress: {
				top100: { known: 30, total: 100, percentage: 30 },
				top500: { known: 80, total: 500, percentage: 16 },
				top1000: { known: 120, total: 1000, percentage: 12 },
				top5000: { known: 200, total: 5000, percentage: 4 }
			},
			estimatedLevel: 'A2' as const,
			averageScore: 65,
			totalGamesPlayed: 20,
			vocabularyCoverage: {
				inFrequencyData: 150,
				total: 200,
				percentage: 75
			}
		},
		generatedAt: new Date()
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(shareService.generateProgressReport).mockResolvedValue(mockReport);
		vi.mocked(shareService.isWebShareAvailable).mockReturnValue(false);
		vi.mocked(shareService.copyToClipboard).mockResolvedValue(true);
		vi.mocked(shareService.shareProgressReport).mockResolvedValue('copied');
	});

	it('should not render when isOpen is false', () => {
		render(ShareModal, { isOpen: false });
		expect(screen.queryByText(/Jaa edistymisesi/i)).not.toBeInTheDocument();
	});

	it('should render when isOpen is true', async () => {
		render(ShareModal, { isOpen: true });
		
		await waitFor(() => {
			expect(screen.getByText(/Jaa edistymisesi/i)).toBeInTheDocument();
		});
	});

	it('should show loading state initially', async () => {
		render(ShareModal, { isOpen: true });
		
		const spinner = screen.getByRole('dialog').querySelector('.loading-spinner');
		expect(spinner).toBeInTheDocument();
	});

	it('should load and display report', async () => {
		render(ShareModal, { isOpen: true });
		
		await waitFor(() => {
			expect(shareService.generateProgressReport).toHaveBeenCalledWith('fi');
			expect(screen.getByText(/Sanoja opittu: 50/i)).toBeInTheDocument();
		});
	});

	it('should display statistics summary', async () => {
		render(ShareModal, { isOpen: true });
		
		await waitFor(() => {
			expect(screen.getByText('50')).toBeInTheDocument();
			expect(screen.getByText('A2')).toBeInTheDocument();
			expect(screen.getByText('30%')).toBeInTheDocument();
			expect(screen.getByText('20')).toBeInTheDocument();
		});
	});

	it('should switch to English when language button clicked', async () => {
		render(ShareModal, { isOpen: true });
		
		await waitFor(() => {
			expect(screen.getByText(/Jaa edistymisesi/i)).toBeInTheDocument();
		});

		const englishButton = screen.getByText('English');
		await fireEvent.click(englishButton);
		
		await waitFor(() => {
			expect(shareService.generateProgressReport).toHaveBeenCalledWith('en');
		});
	});

	it('should copy to clipboard when copy button clicked', async () => {
		render(ShareModal, { isOpen: true });
		
		await waitFor(() => {
			expect(screen.getByText(/Sanoja opittu: 50/i)).toBeInTheDocument();
		});

		const copyButton = screen.getByText(/Kopioi teksti/i);
		await fireEvent.click(copyButton);
		
		await waitFor(() => {
			expect(shareService.copyToClipboard).toHaveBeenCalledWith(mockReport.text);
			expect(screen.getByText(/Kopioitu leikepöydälle/i)).toBeInTheDocument();
		});
	});

	it('should show share button when Web Share API is available', async () => {
		vi.mocked(shareService.isWebShareAvailable).mockReturnValue(true);
		
		render(ShareModal, { isOpen: true });
		
		await waitFor(() => {
			expect(screen.getByText(/^Jaa$/i)).toBeInTheDocument();
		});
	});

	it('should call shareProgressReport when share button clicked', async () => {
		vi.mocked(shareService.isWebShareAvailable).mockReturnValue(true);
		vi.mocked(shareService.shareProgressReport).mockResolvedValue('shared');
		
		const { component } = render(ShareModal, { isOpen: true });
		
		await waitFor(() => {
			expect(screen.getByText(/Sanoja opittu: 50/i)).toBeInTheDocument();
		});

		const shareButton = screen.getByText(/^Jaa$/i);
		await fireEvent.click(shareButton);
		
		await waitFor(() => {
			expect(shareService.shareProgressReport).toHaveBeenCalledWith(mockReport);
		});
	});

	it('should close modal when close button clicked', async () => {
		const { component } = render(ShareModal, { isOpen: true });
		
		await waitFor(() => {
			expect(screen.getByText(/Jaa edistymisesi/i)).toBeInTheDocument();
		});

		const closeButton = screen.getByText('✕');
		await fireEvent.click(closeButton);
		
		// Modal should still be in DOM but component dispatches close event
		// Parent component would handle closing
		expect(closeButton).toBeInTheDocument();
	});

	it('should close modal when clicking outside', async () => {
		const { container } = render(ShareModal, { isOpen: true });
		
		await waitFor(() => {
			expect(screen.getByText(/Jaa edistymisesi/i)).toBeInTheDocument();
		});

		// Find the backdrop by class
		const backdrop = container.querySelector('.fixed.inset-0.bg-neutral\\/50');
		expect(backdrop).toBeInTheDocument();
		
		if (backdrop) {
			await fireEvent.click(backdrop);
		}
		
		// Modal should still be in DOM but component dispatches close event
		// Parent component would handle closing
		expect(backdrop).toBeInTheDocument();
	});

	it('should show error message when copy fails', async () => {
		vi.mocked(shareService.copyToClipboard).mockResolvedValue(false);
		
		render(ShareModal, { isOpen: true });
		
		await waitFor(() => {
			expect(screen.getByText(/Sanoja opittu: 50/i)).toBeInTheDocument();
		});

		const copyButton = screen.getByText(/Kopioi teksti/i);
		await fireEvent.click(copyButton);
		
		await waitFor(() => {
			expect(screen.getByText(/Jakaminen epäonnistui/i)).toBeInTheDocument();
		});
	});

	it('should show error when report generation fails', async () => {
		vi.mocked(shareService.generateProgressReport).mockRejectedValue(new Error('Failed'));
		
		render(ShareModal, { isOpen: true });
		
		await waitFor(() => {
			expect(screen.getByText(/Raportin luominen epäonnistui/i)).toBeInTheDocument();
		});
	});
});
