/**
 * License and attribution data for Espanjapeli
 *
 * This file contains all data source attributions and software licenses
 * that must be displayed on the /tietoja (About) page.
 */

export interface DataSource {
	name: string;
	description: string;
	source: string;
	sourceUrl: string;
	license: string;
	licenseUrl: string;
	attribution: string;
}

export interface SoftwareLicense {
	name: string;
	version?: string;
	license: string;
	url: string;
}

export const dataSources: DataSource[] = [
	{
		name: 'OpenSubtitles Frequency Data',
		description: 'Sanataajuusdata perustuu tekstitysaineistojen analyysiin',
		source: 'hermitdave/FrequencyWords',
		sourceUrl: 'https://github.com/hermitdave/FrequencyWords',
		license: 'CC-BY-SA-4.0',
		licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
		attribution: 'Frequency data from OpenSubtitles via FrequencyWords'
	}
];

export const softwareLicenses: SoftwareLicense[] = [
	{
		name: 'SvelteKit',
		license: 'MIT',
		url: 'https://kit.svelte.dev/'
	},
	{
		name: 'Svelte',
		license: 'MIT',
		url: 'https://svelte.dev/'
	},
	{
		name: 'Tailwind CSS',
		license: 'MIT',
		url: 'https://tailwindcss.com/'
	},
	{
		name: 'DaisyUI',
		license: 'MIT',
		url: 'https://daisyui.com/'
	},
	{
		name: 'Vite',
		license: 'MIT',
		url: 'https://vitejs.dev/'
	},
	{
		name: 'TypeScript',
		license: 'Apache-2.0',
		url: 'https://www.typescriptlang.org/'
	},
	{
		name: 'Vitest',
		license: 'MIT',
		url: 'https://vitest.dev/'
	},
	{
		name: 'Lucide Icons',
		license: 'ISC',
		url: 'https://lucide.dev/'
	},
	{
		name: 'Phosphor Icons',
		license: 'MIT',
		url: 'https://phosphoricons.com/'
	}
];

export const appInfo = {
	name: 'Espanjapeli',
	version: '4.0.0',
	description: 'Mobiiliystävällinen espanjan kielen oppimissovellus',
	repository: 'https://github.com/your-username/espanjapeli',
	storage: 'Paikallinen (selaimen localStorage)',
	privacy: 'Kaikki tiedot pysyvät laitteellasi',
	offline: 'Toimii ilman internet-yhteyttä'
};
