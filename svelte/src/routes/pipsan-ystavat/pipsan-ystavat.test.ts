import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Integration tests for Pipsan ystävät game data integrity
 *
 * These tests verify:
 * 1. Phrases from advanced material are correctly used
 * 2. Manifest file is valid and complete
 * 3. All phrases are properly linked to both emoji and SVG images
 */

interface EmojiTip {
	emojis: string[];
	display: string;
	description: string;
}

interface ImageItem {
	id: string;
	file: string;
	phrases: string[];
	category: string;
	keywords: string[];
	emojiTip?: EmojiTip;
}

interface DistractorItem {
	description: string;
	emojiTip?: EmojiTip;
	status: string;
}

interface GameQuestion {
	spanish: string;
	finnish?: string;
	english?: string;
	correctImage: string;
	distractors: string[];
	difficulty: string;
	category: string;
}

interface ImageManifest {
	images: ImageItem[];
	distractorImages: Record<string, DistractorItem>;
	phraseQueue: GameQuestion[];
}

interface PhraseData {
	spanish: string;
	finnish: string;
	english: string;
	image?: string;
}

interface AdvancedMaterial {
	[category: string]: PhraseData[];
}

let manifest: ImageManifest;
let advancedMaterial: AdvancedMaterial;

beforeAll(() => {
	// Load manifest from filesystem (relative to svelte/ directory)
	const manifestPath = resolve(
		__dirname,
		'../../../static/peppa_advanced_spanish_images/image_manifest.json'
	);
	const manifestContent = readFileSync(manifestPath, 'utf-8');
	manifest = JSON.parse(manifestContent);

	// Load advanced phrases from filesystem
	const phrasesPath = resolve(__dirname, '../../../static/themes/peppa_advanced_spanish.json');
	const phrasesContent = readFileSync(phrasesPath, 'utf-8');
	advancedMaterial = JSON.parse(phrasesContent);
});

describe('Pipsan ystävät Data Integrity', () => {
	describe('1. Advanced Material Usage', () => {
		it('should load manifest successfully', () => {
			expect(manifest).toBeDefined();
			expect(manifest.images).toBeInstanceOf(Array);
			expect(manifest.phraseQueue).toBeInstanceOf(Array);
			expect(manifest.distractorImages).toBeDefined();
		});

		it('should load advanced phrases successfully', () => {
			expect(advancedMaterial).toBeDefined();
			expect(Object.keys(advancedMaterial).length).toBeGreaterThan(0);
		});

		it('should have phrases in phraseQueue that exist in advanced material', () => {
			// Collect all Spanish phrases from advanced material
			const allAdvancedPhrases = new Set<string>();
			const categories = [
				'introduction_phrases',
				'common_phrases',
				'family_phrases',
				'school_phrases',
				'friendship_phrases',
				'activities_and_games',
				'emotions_and_reactions',
				'questions_and_answers',
				'weather_phrases',
				'time_phrases',
				'food_phrases'
			];

			categories.forEach((cat) => {
				const phrases = advancedMaterial[cat];
				if (phrases && Array.isArray(phrases)) {
					phrases.forEach((p: PhraseData) => {
						allAdvancedPhrases.add(p.spanish);
					});
				}
			});

			// Check that phraseQueue phrases match advanced material
			const missingPhrases: string[] = [];
			const totalPhrases = manifest.phraseQueue.length;
			let matchingPhrases = 0;

			manifest.phraseQueue.forEach((q) => {
				if (allAdvancedPhrases.has(q.spanish)) {
					matchingPhrases++;
				} else {
					missingPhrases.push(q.spanish);
				}
			});

			console.log(`✓ ${matchingPhrases}/${totalPhrases} phrases match advanced material`);

			if (missingPhrases.length > 0) {
				console.warn(
					'Phrases in phraseQueue not found in advanced material:',
					missingPhrases.slice(0, 5)
				);
			}

			// At least 80% should match
			expect(matchingPhrases / totalPhrases).toBeGreaterThan(0.8);
		});
	});

	describe('2. Manifest Data Integrity', () => {
		it('should have unique image IDs', () => {
			const ids = manifest.images.map((img) => img.id);
			const uniqueIds = new Set(ids);
			expect(ids.length).toBe(uniqueIds.size);
		});

		it('should have valid SVG file paths for all images', () => {
			manifest.images.forEach((img) => {
				expect(img.file).toBeDefined();
				expect(img.file).toMatch(/^svg\/.*\.svg$/);
			});
		});

		it('should have emoji display for all main images', () => {
			const missingEmoji: string[] = [];

			manifest.images.forEach((img) => {
				if (!img.emojiTip || !img.emojiTip.display) {
					missingEmoji.push(img.id);
				}
			});

			if (missingEmoji.length > 0) {
				console.warn('Images missing emoji tip:', missingEmoji.slice(0, 10));
			}

			expect(missingEmoji.length).toBe(0);
		});

		it('should have emoji display for all distractor images', () => {
			const missingEmoji: string[] = [];

			Object.entries(manifest.distractorImages).forEach(([id, distractor]) => {
				if (!distractor.emojiTip || !distractor.emojiTip.display) {
					missingEmoji.push(id);
				}
			});

			if (missingEmoji.length > 0) {
				console.warn('Distractor images missing emoji tip:', missingEmoji.slice(0, 10));
			}

			expect(missingEmoji.length).toBe(0);
		});
	});

	describe('3. Phrase-to-Image Mappings', () => {
		it('should have all correctImage IDs that exist in images array', () => {
			const imageIds = new Set(manifest.images.map((img) => img.id));
			const missingImages: Array<{ phrase: string; imageId: string }> = [];

			manifest.phraseQueue.forEach((q) => {
				if (!imageIds.has(q.correctImage)) {
					missingImages.push({ phrase: q.spanish, imageId: q.correctImage });
				}
			});

			if (missingImages.length > 0) {
				console.error('Phrases with missing correctImage mappings:', missingImages.slice(0, 10));
			}

			expect(missingImages.length).toBe(0);
		});

		it('should have all distractor IDs that exist in either images or distractorImages', () => {
			const imageIds = new Set(manifest.images.map((img) => img.id));
			const distractorIds = new Set(Object.keys(manifest.distractorImages));
			const allIds = new Set([...imageIds, ...distractorIds]);

			const missingDistractors: Array<{ phrase: string; distractorId: string }> = [];

			manifest.phraseQueue.forEach((q) => {
				q.distractors.forEach((d) => {
					if (!allIds.has(d)) {
						missingDistractors.push({ phrase: q.spanish, distractorId: d });
					}
				});
			});

			if (missingDistractors.length > 0) {
				console.error('Phrases with missing distractor mappings:', missingDistractors.slice(0, 10));
			}

			expect(missingDistractors.length).toBe(0);
		});

		it('should have emoji for every image referenced in phraseQueue', () => {
			const imageIds = new Set(manifest.images.map((img) => img.id));
			const distractorIds = new Set(Object.keys(manifest.distractorImages));

			const imagesWithoutEmoji: string[] = [];

			manifest.phraseQueue.forEach((q) => {
				// Check correct image
				if (imageIds.has(q.correctImage)) {
					const img = manifest.images.find((i) => i.id === q.correctImage);
					if (!img?.emojiTip?.display) {
						imagesWithoutEmoji.push(q.correctImage);
					}
				}

				// Check distractors
				q.distractors.forEach((d) => {
					if (imageIds.has(d)) {
						const img = manifest.images.find((i) => i.id === d);
						if (!img?.emojiTip?.display) {
							imagesWithoutEmoji.push(d);
						}
					} else if (distractorIds.has(d)) {
						const distractor = manifest.distractorImages[d];
						if (!distractor?.emojiTip?.display) {
							imagesWithoutEmoji.push(d);
						}
					}
				});
			});

			const uniqueMissing = [...new Set(imagesWithoutEmoji)];

			if (uniqueMissing.length > 0) {
				console.error(
					'Images referenced in phraseQueue without emoji:',
					uniqueMissing.slice(0, 10)
				);
			}

			expect(uniqueMissing.length).toBe(0);
		});

		it('should have SVG for every correctImage in phraseQueue', () => {
			const imageIds = new Set(manifest.images.map((img) => img.id));

			const missingImages: string[] = [];

			manifest.phraseQueue.forEach((q) => {
				if (imageIds.has(q.correctImage)) {
					const img = manifest.images.find((i) => i.id === q.correctImage);
					if (!img?.file || !img.file.endsWith('.svg')) {
						missingImages.push(q.correctImage);
					}
				} else {
					missingImages.push(q.correctImage);
				}
			});

			if (missingImages.length > 0) {
				console.error('Correct images without SVG files:', missingImages.slice(0, 10));
			}

			expect(missingImages.length).toBe(0);
		});

		it('should NOT have placeholder emojis (❓) for any phrase images', () => {
			const placeholderImages: Array<{
				phrase: string;
				imageId: string;
				type: 'correct' | 'distractor';
			}> = [];

			manifest.phraseQueue.forEach((q) => {
				// Check correctImage emoji
				const correctImg = manifest.images.find((i) => i.id === q.correctImage);
				const correctDistractor = manifest.distractorImages[q.correctImage];
				const correctEmoji = correctImg?.emojiTip?.display || correctDistractor?.emojiTip?.display;

				if (!correctEmoji || correctEmoji === '❓') {
					placeholderImages.push({
						phrase: q.spanish,
						imageId: q.correctImage,
						type: 'correct'
					});
				}

				// Check distractor emojis
				q.distractors.forEach((d) => {
					const distractorImg = manifest.images.find((i) => i.id === d);
					const distractorEntry = manifest.distractorImages[d];
					const distractorEmoji =
						distractorImg?.emojiTip?.display || distractorEntry?.emojiTip?.display;

					if (!distractorEmoji || distractorEmoji === '❓') {
						placeholderImages.push({
							phrase: q.spanish,
							imageId: d,
							type: 'distractor'
						});
					}
				});
			});

			if (placeholderImages.length > 0) {
				console.error('Images with placeholder emojis (❓):');
				placeholderImages.slice(0, 10).forEach((item) => {
					console.error(`  - ${item.type}: "${item.imageId}" in phrase "${item.phrase}"`);
				});
			}

			expect(placeholderImages.length).toBe(0);
		});

		it('should have valid emoji strings (not empty, not just ID text)', () => {
			const invalidEmojis: Array<{ imageId: string; emoji: string; reason: string }> = [];

			// Check all images
			manifest.images.forEach((img) => {
				if (img.emojiTip?.display) {
					const emoji = img.emojiTip.display;

					// Check if emoji is suspiciously long (might be ID text)
					if (emoji.length > 20) {
						invalidEmojis.push({
							imageId: img.id,
							emoji,
							reason: 'too long (>20 chars)'
						});
					}

					// Check if emoji contains underscore (likely an ID)
					if (emoji.includes('_')) {
						invalidEmojis.push({
							imageId: img.id,
							emoji,
							reason: 'contains underscore'
						});
					}

					// Check if emoji is all ASCII (real emojis have high Unicode values)
					if (/^[a-zA-Z0-9_\s]+$/.test(emoji)) {
						invalidEmojis.push({
							imageId: img.id,
							emoji,
							reason: 'only ASCII characters (not emoji)'
						});
					}
				}
			});

			// Check distractor images
			Object.entries(manifest.distractorImages).forEach(([id, distractor]) => {
				if (distractor.emojiTip?.display) {
					const emoji = distractor.emojiTip.display;

					if (emoji.length > 20) {
						invalidEmojis.push({
							imageId: id,
							emoji,
							reason: 'too long (>20 chars)'
						});
					}

					if (emoji.includes('_')) {
						invalidEmojis.push({
							imageId: id,
							emoji,
							reason: 'contains underscore'
						});
					}

					if (/^[a-zA-Z0-9_\s]+$/.test(emoji)) {
						invalidEmojis.push({
							imageId: id,
							emoji,
							reason: 'only ASCII characters (not emoji)'
						});
					}
				}
			});

			if (invalidEmojis.length > 0) {
				console.error('Invalid emoji displays found:');
				invalidEmojis.slice(0, 5).forEach((item) => {
					console.error(`  - "${item.imageId}": "${item.emoji}" (${item.reason})`);
				});
			}

			expect(invalidEmojis.length).toBe(0);
		});
	});

	describe('4. Game Functionality', () => {
		it('should have enough questions for a game (at least 5)', () => {
			expect(manifest.phraseQueue.length).toBeGreaterThanOrEqual(5);
		});

		it('should have enough distractors for each question', () => {
			manifest.phraseQueue.forEach((q, idx) => {
				expect(q.distractors.length, `Question ${idx + 1}: "${q.spanish}"`).toBeGreaterThanOrEqual(
					3
				);
			});
		});

		it('should have distractors that are different from correct image', () => {
			const issues: string[] = [];

			manifest.phraseQueue.forEach((q) => {
				if (q.distractors.includes(q.correctImage)) {
					issues.push(`"${q.spanish}" has correctImage in distractors`);
				}
			});

			if (issues.length > 0) {
				console.error('Questions with correctImage in distractors:', issues.slice(0, 5));
			}

			expect(issues.length).toBe(0);
		});
	});
});
