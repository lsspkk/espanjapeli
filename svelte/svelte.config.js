import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Configure for GitHub Pages static deployment
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		}),
		paths: {
			// Set this to your GitHub repo name if deploying to github.io/<repo-name>
			// Leave empty if deploying to custom domain or username.github.io
			base: dev ? '' : process.env.BASE_PATH || '/espanjapeli'
		}
	}
};

export default config;
