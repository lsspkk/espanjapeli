import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Navbar from './Navbar.svelte';

// Mock SvelteKit modules
vi.mock('$app/paths', () => ({
	base: ''
}));

vi.mock('$app/stores', () => {
	const { readable } = require('svelte/store');
	return {
		page: readable({
			url: new URL('http://localhost/')
		})
	};
});

describe('Navbar', () => {
	describe('Basic rendering', () => {
		it('renders brand logo with link to home', () => {
			const { getByText } = render(Navbar);
			const brand = getByText('🇪🇸 Espanjapeli');
			expect(brand).toBeTruthy();
			expect(brand.closest('a')?.getAttribute('href')).toBe('/');
		});

		it('renders navigation items', () => {
			const { getByText } = render(Navbar);
			expect(getByText('Koti')).toBeTruthy();
			expect(getByText('Sanasto')).toBeTruthy();
			expect(getByText('Tietoja')).toBeTruthy();
			expect(getByText('Asetukset')).toBeTruthy();
		});

		it('renders with navbar class', () => {
			const { container } = render(Navbar);
			const nav = container.querySelector('nav.navbar');
			expect(nav).toBeTruthy();
		});
	});

	describe('Mobile hamburger menu', () => {
		it('renders hamburger button for mobile', () => {
			const { container } = render(Navbar);
			const hamburger = container.querySelector('button[aria-label="Avaa valikko"]');
			expect(hamburger).toBeTruthy();
		});

		it('hamburger button toggles menu visibility', async () => {
			const { container, getByLabelText } = render(Navbar);
			const hamburger = getByLabelText('Avaa valikko');

			// Menu should be closed initially (no dropdown-content visible)
			let dropdownMenu = container.querySelector('.dropdown-content');
			expect(dropdownMenu).toBeFalsy();

			// Click to open
			await fireEvent.click(hamburger);
			dropdownMenu = container.querySelector('.dropdown-content');
			expect(dropdownMenu).toBeTruthy();

			// Click again to close
			await fireEvent.click(hamburger);
			dropdownMenu = container.querySelector('.dropdown-content');
			expect(dropdownMenu).toBeFalsy();
		});

		it('has correct aria-expanded state', async () => {
			const { getByLabelText } = render(Navbar);
			const hamburger = getByLabelText('Avaa valikko');

			expect(hamburger.getAttribute('aria-expanded')).toBe('false');

			await fireEvent.click(hamburger);
			expect(hamburger.getAttribute('aria-expanded')).toBe('true');
		});
	});

	describe('Desktop menu', () => {
		it('renders desktop navigation links', () => {
			const { container } = render(Navbar);
			const desktopMenu = container.querySelector('.navbar-end .menu-horizontal');
			expect(desktopMenu).toBeTruthy();
		});

		it('has correct hrefs for navigation links', () => {
			const { container } = render(Navbar);
			const desktopLinks = container.querySelectorAll('.navbar-end a');

			const hrefs = Array.from(desktopLinks).map((link) => link.getAttribute('href'));
			expect(hrefs).toContain('/');
			expect(hrefs).toContain('/sanasto');
			expect(hrefs).toContain('/tietoja');
			expect(hrefs).toContain('/asetukset');
		});
	});

	describe('Navigation icons', () => {
		it('renders icons for each nav item', () => {
			const { getAllByText } = render(Navbar);

			// Each icon appears twice (mobile + desktop)
			expect(getAllByText('🏠').length).toBeGreaterThanOrEqual(1);
			expect(getAllByText('📚').length).toBeGreaterThanOrEqual(1);
			expect(getAllByText('ℹ️').length).toBeGreaterThanOrEqual(1);
			expect(getAllByText('⚙️').length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('Active page highlighting', () => {
		it('marks home link as active when on home page', () => {
			const { container } = render(Navbar);
			const desktopLinks = container.querySelectorAll('.navbar-end a');
			const homeLink = Array.from(desktopLinks).find((link) => link.getAttribute('href') === '/');
			expect(homeLink?.classList.contains('active')).toBe(true);
		});

		it('does not mark other links as active when on home page', () => {
			const { container } = render(Navbar);
			const desktopLinks = container.querySelectorAll('.navbar-end a');
			const otherLinks = Array.from(desktopLinks).filter(
				(link) => link.getAttribute('href') !== '/'
			);
			otherLinks.forEach((link) => {
				expect(link.classList.contains('active')).toBe(false);
			});
		});
	});
});
