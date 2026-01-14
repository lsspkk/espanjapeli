/// <reference types="vitest/globals" />
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./src/setupTests.ts'],
		pool: 'threads',
		maxThreads: 4,
		minThreads: 2,
		maxConcurrency: 5,
		isolate: false,
		// Test categorization for better parallelization
		// Unit tests: services, utils, stores, types, config
		// Component tests: UI components
		// Integration tests: routes and full page flows
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/.svelte-kit/**',
			'**/build/**'
		]
	},
	resolve: {
		alias: {
			$lib: '/src/lib',
			$tests: '/src/tests'
		},
		conditions: ['browser']
	}
});
