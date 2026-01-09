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
		
		// Check card container has correct classes
		const cardDiv = container.querySelector('.card.bg-base-100.shadow-xl');
		expect(cardDiv).toBeTruthy();
		expect(cardDiv?.classList.contains('w-full')).toBe(true);
		expect(cardDiv?.classList.contains('md:max-w-5xl')).toBe(true);
		expect(cardDiv?.classList.contains('flex')).toBe(true);
		expect(cardDiv?.classList.contains('flex-col')).toBe(true);
	});
});
