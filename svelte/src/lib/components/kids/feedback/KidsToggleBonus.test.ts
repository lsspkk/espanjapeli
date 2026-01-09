import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import KidsToggleBonus from './KidsToggleBonus.svelte';

describe('KidsToggleBonus', () => {
	it('renders when visible is true', () => {
		const { container } = render(KidsToggleBonus, {
			visible: true,
			amount: 1
		});
		
		expect(container.textContent).toContain('🔄');
		expect(container.textContent).toContain('+1 vaihtoa!');
	});

	it('does not render when visible is false', () => {
		const { container } = render(KidsToggleBonus, {
			visible: false,
			amount: 1
		});
		
		expect(container.textContent).not.toContain('🔄');
	});

	it('displays correct amount', () => {
		const { getByText } = render(KidsToggleBonus, {
			visible: true,
			amount: 3
		});
		
		expect(getByText('+3 vaihtoa!')).toBeTruthy();
	});

	it('has fixed position and bounce animation', () => {
		const { container } = render(KidsToggleBonus, {
			visible: true,
			amount: 1
		});
		
		const fixedDiv = container.querySelector('.fixed');
		expect(fixedDiv).toBeTruthy();
		expect(fixedDiv?.classList.contains('animate-bounce')).toBe(true);
		expect(fixedDiv?.classList.contains('top-24')).toBe(true);
	});

	it('has gradient background', () => {
		const { container } = render(KidsToggleBonus, {
			visible: true,
			amount: 1
		});
		
		const gradientDiv = container.querySelector('.bg-gradient-to-r');
		expect(gradientDiv).toBeTruthy();
		expect(gradientDiv?.classList.contains('from-blue-500')).toBe(true);
		expect(gradientDiv?.classList.contains('to-purple-500')).toBe(true);
	});

	it('is non-interactive (pointer-events-none)', () => {
		const { container } = render(KidsToggleBonus, {
			visible: true,
			amount: 1
		});
		
		const fixedDiv = container.querySelector('.fixed');
		expect(fixedDiv?.classList.contains('pointer-events-none')).toBe(true);
	});
});
