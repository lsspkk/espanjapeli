import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import StoryFilterSort from './StoryFilterSort.svelte';

describe('StoryFilterSort', () => {
	it('renders mobile dropdowns on small screens', () => {
		render(StoryFilterSort);
		
		// Mobile dropdowns should be visible
		const filterLabel = screen.getByText('Suodata tasolla');
		const sortLabel = screen.getByText('Järjestä');
		
		expect(filterLabel).toBeInTheDocument();
		expect(sortLabel).toBeInTheDocument();
	});

	it('renders all difficulty options in mobile dropdown', () => {
		render(StoryFilterSort);
		
		const options = screen.getAllByRole('option');
		const filterOptions = options.filter(opt => 
			opt.textContent?.includes('Kaikki tasot') ||
			opt.textContent?.includes('A1 - Aloittelija') ||
			opt.textContent?.includes('A2 - Perustaso') ||
			opt.textContent?.includes('B1 - Keskitaso')
		);
		
		expect(filterOptions.length).toBeGreaterThanOrEqual(4);
	});

	it('renders sort options in mobile dropdown', () => {
		render(StoryFilterSort);
		
		const options = screen.getAllByRole('option');
		const sortOptions = options.filter(opt => 
			opt.textContent?.includes('Aakkosjärjestys') ||
			opt.textContent?.includes('Vaikeustaso')
		);
		
		expect(sortOptions.length).toBeGreaterThanOrEqual(2);
	});

	it('calls onFilterChange when filter is changed', async () => {
		const onFilterChange = vi.fn();
		
		render(StoryFilterSort, {
			props: {
				filterDifficulty: 'all',
				onFilterChange
			}
		});
		
		// Find the filter select (first select)
		const selects = screen.getAllByRole('combobox');
		const filterSelect = selects[0];
		
		await fireEvent.change(filterSelect, { target: { value: 'A1' } });
		
		expect(onFilterChange).toHaveBeenCalledWith('A1');
	});

	it('calls onSortChange when sort is changed', async () => {
		const onSortChange = vi.fn();
		
		render(StoryFilterSort, {
			props: {
				sortBy: 'alphabet',
				onSortChange
			}
		});
		
		// Find the sort select (second select)
		const selects = screen.getAllByRole('combobox');
		const sortSelect = selects[1];
		
		await fireEvent.change(sortSelect, { target: { value: 'difficulty' } });
		
		expect(onSortChange).toHaveBeenCalledWith('difficulty');
	});

	it('displays current filter difficulty', () => {
		render(StoryFilterSort, {
			props: {
				filterDifficulty: 'A2'
			}
		});
		
		const selects = screen.getAllByRole('combobox');
		const filterSelect = selects[0] as HTMLSelectElement;
		
		expect(filterSelect.value).toBe('A2');
	});

	it('displays current sort option', () => {
		render(StoryFilterSort, {
			props: {
				sortBy: 'difficulty'
			}
		});
		
		const selects = screen.getAllByRole('combobox');
		const sortSelect = selects[1] as HTMLSelectElement;
		
		expect(sortSelect.value).toBe('difficulty');
	});

	it('defaults to "all" filter and "alphabet" sort', () => {
		render(StoryFilterSort);
		
		const selects = screen.getAllByRole('combobox');
		const filterSelect = selects[0] as HTMLSelectElement;
		const sortSelect = selects[1] as HTMLSelectElement;
		
		expect(filterSelect.value).toBe('all');
		expect(sortSelect.value).toBe('alphabet');
	});

	it('renders filter icon', () => {
		const { container } = render(StoryFilterSort);
		
		// Check for Filter icon (svg element)
		const svgs = container.querySelectorAll('svg');
		expect(svgs.length).toBeGreaterThan(0);
	});

	it('renders sort icon', () => {
		const { container } = render(StoryFilterSort);
		
		// Check for ArrowUpDown icon (svg element)
		const svgs = container.querySelectorAll('svg');
		expect(svgs.length).toBeGreaterThan(0);
	});
});
