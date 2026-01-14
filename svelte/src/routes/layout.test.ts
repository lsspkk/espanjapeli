import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import Layout from './+layout.svelte';

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

vi.mock('$lib/stores/theme', () => {
	const { readable } = require('svelte/store');
	return {
		theme: readable('light')
	};
});

vi.mock('$lib/assets/favicon.svg', () => ({
	default: '/favicon.svg'
}));

describe('Root Layout', () => {
	it('renders Navbar component', () => {
		const { container } = render(Layout, {
			props: {
				children: (() => {}) as any
			}
		});
		const navbar = container.querySelector('nav.navbar');
		expect(navbar).toBeTruthy();
	});

	it('renders main element for content', () => {
		const { container } = render(Layout, {
			props: {
				children: (() => {}) as any
			}
		});
		const main = container.querySelector('main');
		expect(main).toBeTruthy();
	});

	it('applies theme to container', () => {
		const { container } = render(Layout, {
			props: {
				children: (() => {}) as any
			}
		});
		const themedDiv = container.querySelector('[data-theme="light"]');
		expect(themedDiv).toBeTruthy();
	});
});
