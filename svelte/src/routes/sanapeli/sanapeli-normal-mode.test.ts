import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import SanapeliPage from './+page.svelte';

/**
 * Frontend unit tests for NORMAL MODE (Mobile/Desktop)
 * Tests that normal mode UI elements are available in the component
 */
describe('Sanapeli - Normal Mode', () => {
	beforeEach(() => {
		// Reset localStorage before each test
		localStorage.clear();
		// Also clear session storage if used
		sessionStorage.clear();
	});

	it('should render home screen with start button', () => {
		render(SanapeliPage);
		
		// Check for start button
		const startButton = screen.getByRole('button', { name: /aloita/i });
		expect(startButton).toBeTruthy();
	});

	it('should have compact mode toggle available', () => {
		render(SanapeliPage);
		
		// Check for compact mode checkbox
		const compactCheckbox = screen.getByLabelText(/pieni näyttö/i);
		expect(compactCheckbox).toBeTruthy();
	});

	it('should have category selection available', () => {
		render(SanapeliPage);
		
		// Check for category button by its accessible name (from label)
		const categoryButton = screen.getByRole('button', { name: /valitse kategoria/i });
		expect(categoryButton).toBeTruthy();
		
		// Verify it contains the category text
		expect(categoryButton.textContent).toContain('Kaikki sanat');
	});

	it('should have game length selector available', () => {
		render(SanapeliPage);
		
		// Check for game length options
		const gameLengthLabel = screen.getByText(/kysymyksiä:/i);
		expect(gameLengthLabel).toBeTruthy();
	});

	it('should have sanakirja button available', () => {
		render(SanapeliPage);
		
		// Check for sanakirja button
		const sanakirjaButton = screen.getByRole('button', { name: /sanakirja/i });
		expect(sanakirjaButton).toBeTruthy();
	});
});
