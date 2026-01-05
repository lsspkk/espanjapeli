import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/svelte';

// Clean up after each test
afterEach(() => {
	cleanup();
});
