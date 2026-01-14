import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import BackButton from './BackButton.svelte';

describe('BackButton', () => {
	describe('Basic mode (default)', () => {
		it('renders with Finnish text and arrow', () => {
			const { getByText } = render(BackButton);
			expect(getByText('Takaisin')).toBeTruthy();
			expect(getByText('←')).toBeTruthy();
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
			const element = container.querySelector('.btn.btn-ghost');
			expect(element).toBeTruthy();
		});
	});

	describe('Kids mode', () => {
		it('renders with home icon', () => {
			const { container } = render(BackButton, { props: { mode: 'kids' } });
			const icon = container.querySelector('span.text-xl');
			expect(icon).toBeTruthy();
			expect(icon?.textContent).toBe('🏠');
		});

		it('has circular button style', () => {
			const { container } = render(BackButton, { props: { mode: 'kids' } });
			const element = container.querySelector('.btn.btn-circle');
			expect(element).toBeTruthy();
		});

		it('renders as link when no onClick provided', () => {
			const { container } = render(BackButton, { props: { mode: 'kids' } });
			const link = container.querySelector('a');
			expect(link).toBeTruthy();
		});

		it('renders as button when onClick provided', () => {
			const onClick = vi.fn();
			const { container } = render(BackButton, { props: { mode: 'kids', onClick } });
			const button = container.querySelector('button');
			expect(button).toBeTruthy();
		});

		it('calls onClick when clicked', () => {
			const onClick = vi.fn();
			const { container } = render(BackButton, { props: { mode: 'kids', onClick } });
			const button = container.querySelector('button');
			button?.click();
			expect(onClick).toHaveBeenCalledTimes(1);
		});
	});
});
