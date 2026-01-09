import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import CategoryPicker from './CategoryPicker.svelte';

describe('CategoryPicker', () => {
	const mockCategories = [
		{ key: 'all', name: 'Kaikki sanat', emoji: '📚', tooltip: 'All words', tier: 0 },
		{ key: 'greetings', name: 'Tervehdykset', emoji: '👋', tooltip: 'Greetings', tier: 1 },
		{ key: 'numbers', name: 'Numerot', emoji: '🔢', tooltip: 'Numbers', tier: 1 },
		{ key: 'colors', name: 'Värit', emoji: '🎨', tooltip: 'Colors', tier: 2 }
	];

	it('renders when open', () => {
		const { getByText } = render(CategoryPicker, {
			props: {
				isOpen: true,
				selectedCategory: 'all',
				categories: mockCategories,
				onSelect: () => {},
				onClose: () => {}
			}
		});

		expect(getByText('Valitse kategoria')).toBeTruthy();
		expect(getByText('Kaikki sanat')).toBeTruthy();
	});

	it('does not render when closed', () => {
		const { container } = render(CategoryPicker, {
			props: {
				isOpen: false,
				selectedCategory: 'all',
				categories: mockCategories,
				onSelect: () => {},
				onClose: () => {}
			}
		});

		expect(container.querySelector('.fixed')).toBeNull();
	});

	it('displays all categories', () => {
		const { getByText } = render(CategoryPicker, {
			props: {
				isOpen: true,
				selectedCategory: 'all',
				categories: mockCategories,
				onSelect: () => {},
				onClose: () => {}
			}
		});

		expect(getByText('Tervehdykset')).toBeTruthy();
		expect(getByText('Numerot')).toBeTruthy();
		expect(getByText('Värit')).toBeTruthy();
	});

	it('highlights selected category', () => {
		const { container } = render(CategoryPicker, {
			props: {
				isOpen: true,
				selectedCategory: 'greetings',
				categories: mockCategories,
				onSelect: () => {},
				onClose: () => {}
			}
		});

		// Selected category should have bg-primary styling
		const buttons = container.querySelectorAll('button');
		const selectedButton = Array.from(buttons).find(btn => 
			btn.textContent?.includes('Tervehdykset')
		);
		expect(selectedButton?.className).toContain('bg-primary');
	});

	it('groups categories by tier', () => {
		const { container } = render(CategoryPicker, {
			props: {
				isOpen: true,
				selectedCategory: 'all',
				categories: mockCategories,
				onSelect: () => {},
				onClose: () => {}
			}
		});

		// Should have tier sections
		const tierSections = container.querySelectorAll('[class*="border-l-"]');
		expect(tierSections.length).toBeGreaterThan(0);
	});
});
