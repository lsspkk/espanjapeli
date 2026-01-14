import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import StoryFilterSort from './StoryFilterSort.svelte';

describe('StoryFilterSort', () => {
	it('renders filter buttons', () => {
		render(StoryFilterSort);

		// Check filter buttons exist
		expect(screen.getByText('Kaikki')).toBeInTheDocument();
		expect(screen.getByText('Alkeet')).toBeInTheDocument();
		expect(screen.getByText('Perustaso')).toBeInTheDocument();
		expect(screen.getByText('Keskitaso')).toBeInTheDocument();
		expect(screen.getByText('Edistynyt')).toBeInTheDocument();
	});

	it('renders sort direction toggle', () => {
		render(StoryFilterSort);

		// Check for sort button with title
		const buttons = screen.getAllByRole('button');
		const sortButton = buttons.find((btn) => btn.title === 'A-Z');
		expect(sortButton).toBeTruthy();
	});

	it('calls onFilterChange when filter button is clicked', async () => {
		const onFilterChange = vi.fn();

		render(StoryFilterSort, {
			props: {
				filterDifficulty: 'all',
				onFilterChange
			}
		});

		// Click on Alkeet button
		const alkeetButton = screen.getByText('Alkeet');
		await fireEvent.click(alkeetButton);

		expect(onFilterChange).toHaveBeenCalledWith('A1');
	});

	it('calls onSortDirectionChange when sort button is clicked', async () => {
		const onSortDirectionChange = vi.fn();

		render(StoryFilterSort, {
			props: {
				sortDirection: 'asc',
				onSortDirectionChange
			}
		});

		// Click on sort direction button
		const buttons = screen.getAllByRole('button');
		const sortButton = buttons.find((btn) => btn.title === 'A-Z');

		if (sortButton) {
			await fireEvent.click(sortButton);
			expect(onSortDirectionChange).toHaveBeenCalledWith('desc');
		}
	});

	it('displays current filter with primary styling', () => {
		const { container } = render(StoryFilterSort, {
			props: {
				filterDifficulty: 'A1'
			}
		});

		// Check that Alkeet button (parent) has btn-primary class
		const alkeetSpan = screen.getByText('Alkeet');
		const alkeetButton = alkeetSpan.closest('button');
		expect(alkeetButton?.classList.contains('btn-primary')).toBe(true);
	});

	it('displays non-active filters with ghost styling', () => {
		const { container } = render(StoryFilterSort, {
			props: {
				filterDifficulty: 'A1'
			}
		});

		// Check that Kaikki button (parent) has btn-ghost class
		const kaikkiSpan = screen.getByText('Kaikki');
		const kaikkiButton = kaikkiSpan.closest('button');
		expect(kaikkiButton?.classList.contains('btn-ghost')).toBe(true);
	});

	it('shows A-Z icon when sortDirection is asc', () => {
		render(StoryFilterSort, {
			props: {
				sortDirection: 'asc'
			}
		});

		const buttons = screen.getAllByRole('button');
		const sortButton = buttons.find((btn) => btn.title === 'A-Z');
		expect(sortButton).toBeTruthy();
	});

	it('shows Z-A icon when sortDirection is desc', () => {
		render(StoryFilterSort, {
			props: {
				sortDirection: 'desc'
			}
		});

		const buttons = screen.getAllByRole('button');
		const sortButton = buttons.find((btn) => btn.title === 'Z-A');
		expect(sortButton).toBeTruthy();
	});

	it('renders icons', () => {
		const { container } = render(StoryFilterSort);

		// Check for SVG icons
		const svgs = container.querySelectorAll('svg');
		expect(svgs.length).toBeGreaterThan(0);
	});
});
