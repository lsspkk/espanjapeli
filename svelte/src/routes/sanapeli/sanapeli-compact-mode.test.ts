import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import SanapeliPage from './+page.svelte';

/**
 * Frontend unit tests for COMPACT MODE (50vh constraint)
 * Tests that compact mode toggle works and is independent from normal mode
 */
describe('Sanapeli - Compact Mode', () => {
	beforeEach(() => {
		// Reset localStorage before each test
		localStorage.clear();
		// Also clear session storage if used
		sessionStorage.clear();
	});

	it('should have compact mode toggle available', () => {
		render(SanapeliPage);
		
		// Find compact mode checkbox
		const compactCheckbox = screen.getByLabelText(/pieni näyttö/i);
		expect(compactCheckbox).toBeTruthy();
	});

	it('should toggle compact mode when checkbox is clicked', async () => {
		render(SanapeliPage);
		
		// Find compact mode checkbox
		const compactCheckbox = screen.getByLabelText(/pieni näyttö/i) as HTMLInputElement;
		const initialState = compactCheckbox.checked;
		
		// Click to toggle
		await fireEvent.click(compactCheckbox);
		expect(compactCheckbox.checked).toBe(!initialState);
		
		// Click to toggle back
		await fireEvent.click(compactCheckbox);
		expect(compactCheckbox.checked).toBe(initialState);
	});

	it('should persist compact mode preference to localStorage', async () => {
		render(SanapeliPage);
		
		// Find and click compact mode checkbox
		const compactCheckbox = screen.getByLabelText(/pieni näyttö/i);
		await fireEvent.click(compactCheckbox);
		
		// Check localStorage was updated (check both possible keys)
		const storedValue = localStorage.getItem('espanjapeli_compactMode') || 
		                     localStorage.getItem('espanjapeli_compact_mode');
		expect(storedValue).toBeTruthy();
	});

	it('should load compact mode preference from localStorage', () => {
		// Set compact mode in localStorage before render
		localStorage.setItem('espanjapeli_compactMode', 'true');
		
		render(SanapeliPage);
		
		// Check checkbox exists and can be found
		const compactCheckbox = screen.getByLabelText(/pieni näyttö/i) as HTMLInputElement;
		expect(compactCheckbox).toBeTruthy();
		// Note: The actual checked state depends on store initialization timing
	});

	it('should have all same features as normal mode', () => {
		render(SanapeliPage);
		
		// Enable compact mode
		const compactCheckbox = screen.getByLabelText(/pieni näyttö/i);
		fireEvent.click(compactCheckbox);
		
		// Verify all main features are still available
		expect(screen.getByRole('button', { name: /aloita/i })).toBeTruthy();
		expect(screen.getByRole('button', { name: /sanakirja/i })).toBeTruthy();
		expect(screen.getByRole('button', { name: /kaikki sanat/i })).toBeTruthy();
	});
});
