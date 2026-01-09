import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import BackButton from './BackButton.svelte';

describe('BackButton', () => {
	it('renders with Takaisin text', () => {
		const { getByText } = render(BackButton);
		expect(getByText('Takaisin')).toBeTruthy();
	});

	it('renders as link when no onClick provided', () => {
		const { container } = render(BackButton);
		const link = container.querySelector('a');
		expect(link).toBeTruthy();
		expect(link?.getAttribute('href')).toContain('/');
	});

	it('renders as button when onClick provided', () => {
		const onClick = vi.fn();
		const { container } = render(BackButton, { props: { onClick } });
		const button = container.querySelector('button');
		expect(button).toBeTruthy();
	});

	it('calls onClick when clicked', () => {
		const onClick = vi.fn();
		const { getByText } = render(BackButton, { props: { onClick } });
		const button = getByText('Takaisin');
		button.click();
		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('uses custom href', () => {
		const { container } = render(BackButton, { props: { href: '/custom' } });
		const link = container.querySelector('a');
		expect(link?.getAttribute('href')).toBe('/custom');
	});

	it('has correct button classes', () => {
		const { container } = render(BackButton);
		const element = container.querySelector('.btn.btn-ghost.btn-sm');
		expect(element).toBeTruthy();
	});
});
