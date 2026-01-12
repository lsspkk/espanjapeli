import type { AnimationConfig } from '$lib/types/animation';

/**
 * Generate random animation configurations for background entertainment
 * @param position 'top' | 'bottom' | 'random' - where to place the animation vertically
 */
export function generateRandomAnimation(position: 'top' | 'bottom' | 'random' = 'random'): AnimationConfig {
	const characters: Array<'peppa' | 'george' | 'mummy' | 'daddy'> = [
		'peppa',
		'george',
		'mummy',
		'daddy'
	];

	// Randomly decide: 1-4 characters (weighted: mostly 1, sometimes 2-4)
	const numCharacters = weightedRandomCharacterCount();

	// Randomly decide direction
	const direction = Math.random() < 0.5 ? 'left-to-right' : 'right-to-left';

	// Random speed (100-300 pixels per second)
	const speed = 100 + Math.random() * 200;

	// Vertical position based on parameter
	let verticalPosition: number;
	if (position === 'top') {
		verticalPosition = 5 + Math.random() * 15; // 5-20% from top
	} else if (position === 'bottom') {
		verticalPosition = 75 + Math.random() * 15; // 75-90% from top
	} else {
		verticalPosition = 20 + Math.random() * 50; // 20-70% random
	}

	// Random scale (0.8 - 1.2)
	const scale = 0.8 + Math.random() * 0.4;

	if (numCharacters === 1) {
		// Single character
		const characterName = characters[Math.floor(Math.random() * characters.length)];

		return {
			characterName,
			direction,
			speed,
			verticalPosition,
			scale,
			background: {
				type: 'grass',
				height: 80,
				width: 800
			},
			frameRate: 15
		};
	} else {
		// Multiple characters
		const selectedChars = selectRandomCharacters(characters, numCharacters);

		return {
			characterName: selectedChars[0], // Required for type but not used
			characters: selectedChars,
			characterSpacing: 80 + Math.random() * 60, // 80-140px spacing
			direction,
			speed,
			verticalPosition,
			scale,
			background: {
				type: 'grass',
				height: 80,
				width: 800
			},
			frameRate: 15
		};
	}
}

/**
 * Generate two simultaneous animations going opposite directions
 */
export function generateDualAnimation(): AnimationConfig[] {
	const characters: Array<'peppa' | 'george' | 'mummy' | 'daddy'> = [
		'peppa',
		'george',
		'mummy',
		'daddy'
	];

	// First animation: 1-3 characters going right
	const num1 = 1 + Math.floor(Math.random() * 3);
	const chars1 = selectRandomCharacters(characters, num1);
	const verticalPos1 = 25 + Math.random() * 20; // Upper area

	const animation1: AnimationConfig = {
		characterName: chars1[0],
		characters: num1 > 1 ? chars1 : undefined,
		characterSpacing: num1 > 1 ? 80 + Math.random() * 40 : undefined,
		direction: 'left-to-right',
		speed: 120 + Math.random() * 150,
		verticalPosition: verticalPos1,
		scale: 0.9 + Math.random() * 0.3,
		background: {
			type: 'grass',
			height: 80,
			width: 800
		},
		frameRate: 15
	};

	// Second animation: 1-3 characters going left
	const num2 = 1 + Math.floor(Math.random() * 3);
	const chars2 = selectRandomCharacters(characters, num2);
	const verticalPos2 = 55 + Math.random() * 20; // Lower area

	const animation2: AnimationConfig = {
		characterName: chars2[0],
		characters: num2 > 1 ? chars2 : undefined,
		characterSpacing: num2 > 1 ? 80 + Math.random() * 40 : undefined,
		direction: 'right-to-left',
		speed: 120 + Math.random() * 150,
		verticalPosition: verticalPos2,
		scale: 0.9 + Math.random() * 0.3,
		background: {
			type: 'grass',
			height: 80,
			width: 800
		},
		frameRate: 15
	};

	return [animation1, animation2];
}

/**
 * Weighted random: mostly 1 character, sometimes more
 * 60% = 1, 25% = 2, 10% = 3, 5% = 4
 */
function weightedRandomCharacterCount(): number {
	const rand = Math.random();
	if (rand < 0.6) return 1;
	if (rand < 0.85) return 2;
	if (rand < 0.95) return 3;
	return 4;
}

/**
 * Select N random unique characters from the array
 */
function selectRandomCharacters(
	characters: Array<'peppa' | 'george' | 'mummy' | 'daddy'>,
	count: number
): Array<'peppa' | 'george' | 'mummy' | 'daddy'> {
	const shuffled = [...characters].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}
