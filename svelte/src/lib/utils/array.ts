/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param array - The array to shuffle
 * @returns A new shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * Spread out duplicate words to be at least minDistance apart
 * @param words - Array of words with a spanish property
 * @param minDistance - Minimum distance between duplicates (default 5)
 * @returns A new array with duplicates spread out
 */
export function spreadOutDuplicates<T extends { spanish: string }>(words: T[], minDistance = 5): T[] {
	const result = [...words];
	const wordPositions = new Map<string, number[]>();
	
	result.forEach((word, index) => {
		if (!wordPositions.has(word.spanish)) {
			wordPositions.set(word.spanish, []);
		}
		wordPositions.get(word.spanish)!.push(index);
	});
	
	for (const [spanish, positions] of wordPositions.entries()) {
		if (positions.length <= 1) continue;
		
		for (let i = 1; i < positions.length; i++) {
			const currentPos = positions[i];
			const prevPos = positions[i - 1];
			
			if (currentPos - prevPos < minDistance) {
				for (let newPos = prevPos + minDistance; newPos < result.length; newPos++) {
					const farEnough = positions.every((pos, idx) => {
						if (idx >= i) return true;
						return Math.abs(newPos - pos) >= minDistance;
					});
					
					const wordAtNewPos = result[newPos];
					const newPosInstances = wordPositions.get(wordAtNewPos.spanish) || [];
					const wouldCreateProblem = newPosInstances.some(pos => 
						pos !== newPos && Math.abs(currentPos - pos) < minDistance
					);
					
					if (farEnough && !wouldCreateProblem) {
						[result[currentPos], result[newPos]] = [result[newPos], result[currentPos]];
						positions[i] = newPos;
						const otherPositions = wordPositions.get(wordAtNewPos.spanish);
						if (otherPositions) {
							const otherIdx = otherPositions.indexOf(newPos);
							if (otherIdx !== -1) {
								otherPositions[otherIdx] = currentPos;
							}
						}
						break;
					}
				}
			}
		}
	}
	
	return result;
}
