import type { PageLoad, EntryGenerator } from './$types';
import type { Story } from '$lib/types/story';
import { error } from '@sveltejs/kit';
import { loadStoryById, getStoryMetadata } from '$lib/services/storyLoader';
// Import manifest directly for build-time prerendering
import manifestData from '../../../../static/stories/manifest.json';

// Helper to get level folder from CEFR level
function getLevelFolder(level: string): string {
	return level.toLowerCase();
}

export const load: PageLoad = async ({ params, fetch }) => {
	let story: Story | null = null;
	
	// During prerendering, use direct imports to avoid fetch() issues
	// In browser, use the service which handles fetch properly
	if (typeof window === 'undefined') {
		// SSR/prerendering: use direct imports
		const metadata = manifestData.stories.find((s) => s.id === params.storyId);
		if (metadata) {
			const levelFolder = getLevelFolder(metadata.level);
			try {
				const storyModule = await import(`../../../../static/stories/${levelFolder}/${params.storyId}.json`);
				story = storyModule.default;
			} catch (importError) {
				console.error(`Failed to import story ${params.storyId}:`, importError);
			}
		}
	} else {
		// Browser: use the service
		try {
			story = await loadStoryById(params.storyId);
		} catch (e) {
			console.error(`Failed to load story ${params.storyId}:`, e);
		}
	}

	if (!story) {
		error(404, {
			message: 'Tarinaa ei löytynyt'
		});
	}

	// Get navigation info from manifest
	const allMetadata = manifestData.stories;
	const currentIndex = allMetadata.findIndex((s) => s.id === params.storyId);
	const nextStory = currentIndex < allMetadata.length - 1 ? allMetadata[currentIndex + 1] : null;
	const prevStory = currentIndex > 0 ? allMetadata[currentIndex - 1] : null;

	return {
		story,
		nextStoryId: nextStory?.id || null,
		prevStoryId: prevStory?.id || null
	};
};

// Generate list of story IDs for prerendering
// Use direct import during build to avoid fetch() issues in Node.js
export const entries: EntryGenerator = () => {
	return manifestData.stories.map((story) => ({ storyId: story.id }));
};
