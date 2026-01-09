import type { PageLoad, EntryGenerator } from './$types';
import type { Story } from '$lib/types/story';
import { error } from '@sveltejs/kit';

// Import the stories data directly for build-time access
// Using relative path from src/routes/tarinat/[storyId] to static/stories
import storiesData from '../../../../static/stories/stories.json';

const stories = storiesData.stories as Story[];

export const load: PageLoad = async ({ params }) => {
	const story = stories.find((s) => s.id === params.storyId);

	if (!story) {
		error(404, {
			message: 'Tarinaa ei löytynyt'
		});
	}

	// Get navigation info
	const currentIndex = stories.findIndex((s) => s.id === params.storyId);
	const nextStory = currentIndex < stories.length - 1 ? stories[currentIndex + 1] : null;
	const prevStory = currentIndex > 0 ? stories[currentIndex - 1] : null;

	return {
		story,
		nextStoryId: nextStory?.id || null,
		prevStoryId: prevStory?.id || null
	};
};

// Generate list of story IDs for prerendering
export const entries: EntryGenerator = () => {
	return stories.map((story) => ({ storyId: story.id }));
};
