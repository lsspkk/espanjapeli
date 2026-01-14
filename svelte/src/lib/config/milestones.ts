/**
 * Milestone Configuration for Espanjapeli V4
 * 
 * Defines learning milestones that trigger celebrations when achieved.
 * Milestones are based on words learned, top-N progress, and stories read.
 */

export type MilestoneType = 'words_known' | 'top_n_complete' | 'stories_read';

export interface Milestone {
	/** Unique identifier for the milestone */
	id: string;
	/** Type of milestone */
	type: MilestoneType;
	/** Display title in Finnish */
	title: string;
	/** Description in Finnish */
	description: string;
	/** Emoji icon */
	icon: string;
	/** Target value to achieve */
	target: number;
	/** For top_n_complete: which set (100, 500, 1000) */
	topN?: 100 | 500 | 1000;
	/** Priority order (lower = shown first) */
	priority: number;
}

/**
 * All defined milestones
 * Ordered by priority (beginner to advanced)
 */
export const MILESTONES: Milestone[] = [
	// Words known milestones
	{
		id: 'words_100',
		type: 'words_known',
		title: '100 sanaa opittu',
		description: 'Olet oppinut 100 sanaa! Loistava alku espanjan kielen opiskeluun.',
		icon: '🌱',
		target: 100,
		priority: 1
	},
	{
		id: 'words_250',
		type: 'words_known',
		title: '250 sanaa opittu',
		description: 'Mahtavaa! 250 sanaa hallussa. Sanastosi kasvaa nopeasti.',
		icon: '🌿',
		target: 250,
		priority: 3
	},
	{
		id: 'words_500',
		type: 'words_known',
		title: '500 sanaa opittu',
		description: 'Upea saavutus! 500 sanaa hallussa. Olet jo A2-tasolla.',
		icon: '🌳',
		target: 500,
		priority: 5
	},
	{
		id: 'words_1000',
		type: 'words_known',
		title: '1000 sanaa opittu',
		description: 'Uskomaton! 1000 sanaa hallussa. Olet edennyt B1-tasolle.',
		icon: '🎓',
		target: 1000,
		priority: 8
	},
	
	// Top N completion milestones
	{
		id: 'top100_complete',
		type: 'top_n_complete',
		title: 'Top 100 täysi',
		description: 'Hallitset 100 yleisintä espanjan sanaa! Tämä on erinomainen perusta.',
		icon: '🎯',
		target: 100,
		topN: 100,
		priority: 2
	},
	{
		id: 'top500_complete',
		type: 'top_n_complete',
		title: 'Top 500 täysi',
		description: 'Kaikki 500 yleisintä sanaa hallussa! Ymmärrät jo suurimman osan tekstistä.',
		icon: '🏆',
		target: 500,
		topN: 500,
		priority: 4
	},
	{
		id: 'top1000_complete',
		type: 'top_n_complete',
		title: 'Top 1000 täysi',
		description: 'Kaikki 1000 yleisintä sanaa hallussa! Olet saavuttanut huippuosaamisen.',
		icon: '👑',
		target: 1000,
		topN: 1000,
		priority: 7
	},
	
	// Stories read milestones
	{
		id: 'stories_5',
		type: 'stories_read',
		title: '5 tarinaa luettu',
		description: 'Olet lukenut 5 tarinaa! Lukeminen on loistava tapa oppia uusia sanoja.',
		icon: '📚',
		target: 5,
		priority: 6
	},
	{
		id: 'stories_10',
		type: 'stories_read',
		title: '10 tarinaa luettu',
		description: 'Mahtavaa! 10 tarinaa luettu. Jatka lukemista, se parantaa ymmärrystäsi.',
		icon: '📖',
		target: 10,
		priority: 9
	},
	{
		id: 'stories_20',
		type: 'stories_read',
		title: '20 tarinaa luettu',
		description: 'Uskomaton lukuinto! 20 tarinaa luettu. Olet todellinen lukutoukka.',
		icon: '📕',
		target: 20,
		priority: 10
	}
];

/**
 * Get milestone by ID
 */
export function getMilestoneById(id: string): Milestone | undefined {
	return MILESTONES.find(m => m.id === id);
}

/**
 * Get all milestones of a specific type
 */
export function getMilestonesByType(type: MilestoneType): Milestone[] {
	return MILESTONES.filter(m => m.type === type);
}

/**
 * Get milestones sorted by priority
 */
export function getMilestonesByPriority(): Milestone[] {
	return [...MILESTONES].sort((a, b) => a.priority - b.priority);
}

/**
 * Get next milestone for a given type and current value
 */
export function getNextMilestone(
	type: MilestoneType,
	currentValue: number,
	topN?: 100 | 500 | 1000
): Milestone | null {
	const relevantMilestones = MILESTONES
		.filter(m => {
			if (m.type !== type) return false;
			if (type === 'top_n_complete' && m.topN !== topN) return false;
			return m.target > currentValue;
		})
		.sort((a, b) => a.target - b.target);
	
	return relevantMilestones[0] || null;
}
