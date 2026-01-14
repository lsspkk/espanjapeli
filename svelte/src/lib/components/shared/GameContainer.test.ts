import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import GameContainer from './GameContainer.svelte';

describe('GameContainer', () => {
	it('shows back button by default when onBack is provided', () => {
		const onBack = vi.fn();
		const { getByText } = render(GameContainer, {
			props: {
				onBack
			}
		});

		expect(getByText('Takaisin')).toBeTruthy();
	});

	it('shows kids mode button when buttonMode is kids', () => {
		const onBack = vi.fn();
		const { container } = render(GameContainer, {
			props: {
				onBack,
				buttonMode: 'kids'
			}
		});

		const icon = container.querySelector('span.text-xl');
		expect(icon?.textContent).toBe('🏠');
	});

	it('hides back button when showBackButton is false', () => {
		const onBack = vi.fn();
		const { queryByText } = render(GameContainer, {
			props: {
				showBackButton: false,
				onBack
			}
		});

		expect(queryByText('Takaisin')).toBeNull();
	});

	it('does not show back button when onBack is not provided', () => {
		const { queryByText } = render(GameContainer, {
			props: {
				showBackButton: true
			}
		});

		expect(queryByText('Takaisin')).toBeNull();
	});

	it('calls onBack when back button is clicked', () => {
		const onBack = vi.fn();
		const { getByText } = render(GameContainer, {
			props: {
				onBack
			}
		});

		const backButton = getByText('Takaisin');
		backButton.click();

		expect(onBack).toHaveBeenCalledTimes(1);
	});

	it('has correct container structure with card classes', () => {
		const onBack = vi.fn();
		const { container } = render(GameContainer, {
			props: {
				onBack
			}
		});

		// Check outer container has correct classes
		const outerDiv = container.querySelector('.min-h-screen.bg-base-200');
		expect(outerDiv).toBeTruthy();

		// Check card container has correct classes (default gameType='basic' uses max-w-4xl)
		const cardDiv = container.querySelector('.card.bg-base-100.shadow-xl');
		expect(cardDiv).toBeTruthy();
		expect(cardDiv?.classList.contains('w-full')).toBe(true);
		expect(cardDiv?.classList.contains('md:max-w-4xl')).toBe(true);
		expect(cardDiv?.classList.contains('flex')).toBe(true);
		expect(cardDiv?.classList.contains('flex-col')).toBe(true);
	});

	it('applies correct layout for story gameType', () => {
		const { container } = render(GameContainer, {
			props: {
				gameType: 'story'
			}
		});

		const cardDiv = container.querySelector('.card.bg-base-100.shadow-xl');
		expect(cardDiv?.classList.contains('md:max-w-3xl')).toBe(true);
	});

	it('applies correct layout for viewport-fitted gameType', () => {
		const { container } = render(GameContainer, {
			props: {
				gameType: 'viewport-fitted'
			}
		});

		const outerDiv = container.querySelector('.h-screen.bg-base-200');
		expect(outerDiv).toBeTruthy();

		const cardDiv = container.querySelector('.card.bg-base-100.shadow-xl');
		expect(cardDiv?.classList.contains('md:max-w-4xl')).toBe(true);
		expect(cardDiv?.classList.contains('min-h-[600px]')).toBe(true);
		expect(cardDiv?.classList.contains('max-h-screen')).toBe(true);
	});
});
