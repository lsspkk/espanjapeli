import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Navbar from './Navbar.svelte';
import { writable } from 'svelte/store';

// Mock SvelteKit modules
vi.mock('$app/paths', () => ({
	base: ''
}));

let mockPageStore = writable({
	url: new URL('http://localhost/')
});

vi.mock('$app/stores', () => {
	return {
		page: {
			subscribe: (fn: any) => mockPageStore.subscribe(fn)
		}
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
			expect(getByText('Kielten oppiminen')).toBeTruthy();
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
			expect(hrefs).toContain('/kielten-oppiminen');
			expect(hrefs).toContain('/tietoja');
			expect(hrefs).toContain('/asetukset');
		});
	});

	describe('Navigation icons', () => {
		it('renders icon components for each nav item', () => {
			const { container } = render(Navbar);

			// Check that SVG icons are rendered (Lucide icons render as SVG)
			const svgIcons = container.querySelectorAll('svg');
			// Desktop menu has 5 nav items with icons + 1 hamburger icon = 6 minimum
			// (Mobile menu icons only render when menu is opened)
			expect(svgIcons.length).toBeGreaterThanOrEqual(6);
		});

		it('renders more icons when mobile menu is opened', async () => {
			const { container, getByLabelText } = render(Navbar);
			const hamburger = getByLabelText('Avaa valikko');
			
			// Count icons before opening menu
			const iconsBefore = container.querySelectorAll('svg').length;
			
			// Open mobile menu
			await fireEvent.click(hamburger);
			
			// Count icons after opening menu
			const iconsAfter = container.querySelectorAll('svg').length;
			
			// Should have 5 additional nav item icons in mobile menu
			expect(iconsAfter).toBeGreaterThan(iconsBefore);
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

	describe('Game mode hiding on mobile', () => {
		beforeEach(() => {
			mockPageStore.set({
				url: new URL('http://localhost/')
			});
		});

		it('navbar is visible on home page', () => {
			const { container } = render(Navbar);
			const nav = container.querySelector('nav.navbar');
			expect(nav?.classList.contains('hidden')).toBe(false);
		});

		it('navbar is hidden on mobile in sanapeli game mode', () => {
			mockPageStore.set({
				url: new URL('http://localhost/sanapeli')
			});
			const { container } = render(Navbar);
			const nav = container.querySelector('nav.navbar');
			expect(nav?.classList.contains('hidden')).toBe(true);
		});

		it('navbar is hidden on mobile in yhdistasanat game mode', () => {
			mockPageStore.set({
				url: new URL('http://localhost/yhdistasanat')
			});
			const { container } = render(Navbar);
			const nav = container.querySelector('nav.navbar');
			expect(nav?.classList.contains('hidden')).toBe(true);
		});

		it('navbar is hidden on mobile in tarinat story view', () => {
			mockPageStore.set({
				url: new URL('http://localhost/tarinat/story-1')
			});
			const { container } = render(Navbar);
			const nav = container.querySelector('nav.navbar');
			expect(nav?.classList.contains('hidden')).toBe(true);
		});

		it('navbar is hidden on mobile in muisti game mode', () => {
			mockPageStore.set({
				url: new URL('http://localhost/muisti')
			});
			const { container } = render(Navbar);
			const nav = container.querySelector('nav.navbar');
			expect(nav?.classList.contains('hidden')).toBe(true);
		});

		it('navbar is hidden on mobile in pipsan-ystavat game mode', () => {
			mockPageStore.set({
				url: new URL('http://localhost/pipsan-ystavat')
			});
			const { container } = render(Navbar);
			const nav = container.querySelector('nav.navbar');
			expect(nav?.classList.contains('hidden')).toBe(true);
		});

		it('navbar is visible on non-game pages like sanasto', () => {
			mockPageStore.set({
				url: new URL('http://localhost/sanasto')
			});
			const { container } = render(Navbar);
			const nav = container.querySelector('nav.navbar');
			expect(nav?.classList.contains('hidden')).toBe(false);
		});

		it('navbar is visible on non-game pages like asetukset', () => {
			mockPageStore.set({
				url: new URL('http://localhost/asetukset')
			});
			const { container } = render(Navbar);
			const nav = container.querySelector('nav.navbar');
			expect(nav?.classList.contains('hidden')).toBe(false);
		});
	});
});
