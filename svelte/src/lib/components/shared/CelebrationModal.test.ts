/**
 * Tests for CelebrationModal component
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CelebrationModal from './CelebrationModal.svelte';
import type { MilestoneAchievement } from '$lib/services/milestoneService';

describe('CelebrationModal', () => {
	const mockAchievement: MilestoneAchievement = {
		milestone: {
			id: 'words_100',
			type: 'words_known',
			title: '100 sanaa opittu',
			description: 'Olet oppinut 100 sanaa! Loistava alku espanjan kielen opiskeluun.',
			icon: '🌱',
			target: 100,
			priority: 1
		},
		achievedAt: new Date().toISOString(),
		currentValue: 100
	};

	it('should not render when isOpen is false', () => {
		render(CelebrationModal, {
			props: {
				isOpen: false,
				achievement: mockAchievement
			}
		});

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});

	it('should render when isOpen is true and achievement is provided', () => {
		render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: mockAchievement
			}
		});

		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('should display milestone title and description', () => {
		render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: mockAchievement
			}
		});

		expect(screen.getByText('100 sanaa opittu')).toBeInTheDocument();
		expect(screen.getByText(/Olet oppinut 100 sanaa/)).toBeInTheDocument();
	});

	it('should display milestone icon', () => {
		render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: mockAchievement
			}
		});

		expect(screen.getByText('🌱')).toBeInTheDocument();
	});

	it('should display current value and target', () => {
		render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: mockAchievement
			}
		});

		// Check for the numbers
		const currentValueElements = screen.getAllByText('100');
		expect(currentValueElements.length).toBeGreaterThan(0);
	});

	it('should display congratulations header', () => {
		render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: mockAchievement
			}
		});

		expect(screen.getByText('Onnittelut!')).toBeInTheDocument();
	});

	it('should display continue button', () => {
		render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: mockAchievement
			}
		});

		expect(screen.getByText('Jatka oppimista')).toBeInTheDocument();
	});

	it('should have clickable continue button', async () => {
		render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: mockAchievement
			}
		});

		const button = screen.getByText('Jatka oppimista');
		expect(button).toBeInTheDocument();
		
		// Button should be clickable
		await fireEvent.click(button);
		
		// Modal should still be in DOM (parent handles actual closing)
		expect(button).toBeInTheDocument();
	});

	it('should have clickable backdrop', async () => {
		const { container } = render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: mockAchievement
			}
		});

		// Click the backdrop (the outer div)
		const backdrop = container.querySelector('.fixed.inset-0');
		expect(backdrop).toBeInTheDocument();
		
		if (backdrop) {
			await fireEvent.click(backdrop);
		}
		
		// Modal should still be in DOM (parent handles actual closing)
		expect(backdrop).toBeInTheDocument();
	});

	it('should display correct label for words_known type', () => {
		render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: mockAchievement
			}
		});

		expect(screen.getByText('Sanaa opittu')).toBeInTheDocument();
	});

	it('should display correct label for top_n_complete type', () => {
		const topNAchievement: MilestoneAchievement = {
			milestone: {
				id: 'top100_complete',
				type: 'top_n_complete',
				title: 'Top 100 täysi',
				description: 'Hallitset 100 yleisintä espanjan sanaa!',
				icon: '🎯',
				target: 100,
				topN: 100,
				priority: 2
			},
			achievedAt: new Date().toISOString(),
			currentValue: 100
		};

		render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: topNAchievement
			}
		});

		expect(screen.getByText('Top 100 sanaa')).toBeInTheDocument();
	});

	it('should display correct label for stories_read type', () => {
		const storiesAchievement: MilestoneAchievement = {
			milestone: {
				id: 'stories_5',
				type: 'stories_read',
				title: '5 tarinaa luettu',
				description: 'Olet lukenut 5 tarinaa!',
				icon: '📚',
				target: 5,
				priority: 6
			},
			achievedAt: new Date().toISOString(),
			currentValue: 5
		};

		render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: storiesAchievement
			}
		});

		expect(screen.getByText('Tarinaa luettu')).toBeInTheDocument();
	});

	it('should not render when achievement is null', () => {
		render(CelebrationModal, {
			props: {
				isOpen: true,
				achievement: null
			}
		});

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
	});
});
