import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import { dataSources, softwareLicenses, appInfo } from '$lib/data/licenses';

/**
 * Integration tests for Tietoja (About) page
 *
 * Test Coverage:
 * - Task 4.1: /tietoja route and license data display
 */

describe('Tietoja Page Integration', () => {
	describe('License Data Structure', () => {
		it('should have app info with all required fields', () => {
			expect(appInfo).toBeDefined();
			expect(appInfo.name).toBe('Espanjapeli');
			expect(appInfo.version).toBeTruthy();
			expect(appInfo.description).toBeTruthy();
			expect(appInfo.storage).toBeTruthy();
			expect(appInfo.privacy).toBeTruthy();
			expect(appInfo.offline).toBeTruthy();
		});

		it('should have at least one data source', () => {
			expect(dataSources).toBeDefined();
			expect(dataSources.length).toBeGreaterThan(0);
		});

		it('should have data sources with all required fields', () => {
			dataSources.forEach((source) => {
				expect(source.name).toBeTruthy();
				expect(source.description).toBeTruthy();
				expect(source.source).toBeTruthy();
				expect(source.sourceUrl).toBeTruthy();
				expect(source.license).toBeTruthy();
				expect(source.licenseUrl).toBeTruthy();
				expect(source.attribution).toBeTruthy();
			});
		});

		it('should have valid URLs for data sources', () => {
			dataSources.forEach((source) => {
				expect(source.sourceUrl).toMatch(/^https?:\/\//);
				expect(source.licenseUrl).toMatch(/^https?:\/\//);
			});
		});

		it('should have OpenSubtitles frequency data attributed', () => {
			const openSubtitles = dataSources.find((s) => s.name.includes('OpenSubtitles'));
			expect(openSubtitles).toBeDefined();
			expect(openSubtitles?.license).toBe('CC-BY-SA-4.0');
		});
	});

	describe('Software Licenses', () => {
		it('should have at least 5 software licenses', () => {
			expect(softwareLicenses).toBeDefined();
			expect(softwareLicenses.length).toBeGreaterThanOrEqual(5);
		});

		it('should have software licenses with all required fields', () => {
			softwareLicenses.forEach((software) => {
				expect(software.name).toBeTruthy();
				expect(software.license).toBeTruthy();
				expect(software.url).toBeTruthy();
			});
		});

		it('should have valid URLs for software licenses', () => {
			softwareLicenses.forEach((software) => {
				expect(software.url).toMatch(/^https?:\/\//);
			});
		});

		it('should include core dependencies', () => {
			const names = softwareLicenses.map((s) => s.name.toLowerCase());
			expect(names).toContain('sveltekit');
			expect(names).toContain('svelte');
			expect(names).toContain('tailwind css');
			expect(names).toContain('daisyui');
		});
	});

	describe('Page Component', () => {
		it('should have tietoja page component available', async () => {
			const { default: TietojaPage } = await import('../../routes/tietoja/+page.svelte');
			expect(TietojaPage).toBeDefined();
		});

		it('should render tietoja page with app info', async () => {
			const { default: TietojaPage } = await import('../../routes/tietoja/+page.svelte');
			const { getByText } = render(TietojaPage);

			expect(getByText('ℹ️ Tietoja')).toBeTruthy();
			expect(getByText(`📱 ${appInfo.name}`)).toBeTruthy();
		});

		it('should display data sources section', async () => {
			const { default: TietojaPage } = await import('../../routes/tietoja/+page.svelte');
			const { getByText } = render(TietojaPage);

			expect(getByText('📊 Tietolähteet')).toBeTruthy();
		});

		it('should display software licenses section', async () => {
			const { default: TietojaPage } = await import('../../routes/tietoja/+page.svelte');
			const { getByText } = render(TietojaPage);

			expect(getByText('⚙️ Ohjelmistolisenssit')).toBeTruthy();
		});

		it('should display open source notice', async () => {
			const { default: TietojaPage } = await import('../../routes/tietoja/+page.svelte');
			const { getByText } = render(TietojaPage);

			expect(getByText('🌐 Avoin lähdekoodi')).toBeTruthy();
		});

		it('should display back navigation link', async () => {
			const { default: TietojaPage } = await import('../../routes/tietoja/+page.svelte');
			const { getByText } = render(TietojaPage);

			expect(getByText('← Takaisin valikkoon')).toBeTruthy();
		});
	});
});
