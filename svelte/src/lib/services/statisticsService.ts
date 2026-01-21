/**
 * Statistics Service for Espanjapeli V4
 * 
 * Calculates vocabulary learning statistics based on word knowledge
 * and frequency data. Provides progress metrics for user feedback.
 * 
 * Key features:
 * - Top N word coverage (how many of top 100/500/1000 words known)
 * - CEFR level estimation based on vocabulary
 * - Learning progress over time
 * - Integration with wordKnowledge store
 */

import { get } from 'svelte/store';
import { wordKnowledge, type WordKnowledgeData, type GameMode } from '$lib/stores/wordKnowledge';
import { getWordsMetadata, type WordMetadata } from './vocabularyService';
import { getAllWords, type Word } from '$lib/data/words';

/**
 * Extract Spanish word from word ID
 * Word IDs can be:
 * - Simple: "perro" (just the Spanish word)
 * - Polysemous: "tiempo#time" (Spanish word + sense)
 * 
 * @param wordId - The word ID (from word.id or word.spanish)
 * @returns The Spanish word portion
 */
function extractSpanishFromWordId(wordId: string): string {
	const hashIndex = wordId.indexOf('#');
	return hashIndex === -1 ? wordId : wordId.substring(0, hashIndex);
}

/** Progress for a top-N word set */
export interface TopNProgress {
	known: number;
	total: number;
	percentage: number;
}

/** Full vocabulary statistics */
export interface VocabularyStatistics {
	/** Total words practiced */
	totalPracticed: number;
	/** Words considered "known" (score >= 60) */
	wordsKnown: number;
	/** Words considered "mastered" (score >= 80) */
	wordsMastered: number;
	/** Words needing practice (score < 40) */
	wordsWeak: number;
	/** Progress through most common words */
	topNProgress: {
		top100: TopNProgress;
		top500: TopNProgress;
		top1000: TopNProgress;
		top5000: TopNProgress;
	};
	/** Estimated CEFR level based on vocabulary */
	estimatedLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
	/** Average knowledge score */
	averageScore: number;
	/** Total games played */
	totalGamesPlayed: number;
	/** Vocabulary coverage in game words */
	vocabularyCoverage: {
		inFrequencyData: number;
		total: number;
		percentage: number;
	};
}

/** Score threshold for considering a word "known" */
const KNOWN_THRESHOLD = 60;

/** Score threshold for considering a word "mastered" */
const MASTERED_THRESHOLD = 80;

/** Score threshold for weak words needing practice */
const WEAK_THRESHOLD = 40;

/**
 * Calculate Top-N progress for known words
 */
async function calculateTopNProgress(
	knowledgeData: WordKnowledgeData,
	n: number,
	wordMetadataMap: Map<string, WordMetadata>,
	mode?: GameMode
): Promise<TopNProgress> {
	let known = 0;
	
	// Count words in top N that user has practiced with good score
	for (const [wordId, wordData] of Object.entries(knowledgeData.words)) {
		// Extract Spanish word from word ID (handles polysemous words)
		const spanish = extractSpanishFromWordId(wordId);
		const metadata = wordMetadataMap.get(spanish);
		if (!metadata) continue;
		
		// Check if word is in top N
		let isInTopN = false;
		switch (n) {
			case 100: isInTopN = metadata.isTop100; break;
			case 500: isInTopN = metadata.isTop500; break;
			case 1000: isInTopN = metadata.isTop1000; break;
			case 5000: isInTopN = metadata.isTop5000; break;
			default: isInTopN = (metadata.frequencyRank ?? Infinity) <= n;
		}
		
		if (isInTopN) {
			// Check if user knows this word (either direction)
			// If mode specified, only check that mode; otherwise check all modes
			let bestScore = 0;
			
			if (mode) {
				const stfData = wordData.spanish_to_finnish[mode];
				const ftsData = wordData.finnish_to_spanish[mode];
				const stfScore = stfData?.score || 0;
				const ftsScore = ftsData?.score || 0;
				bestScore = Math.max(stfScore, ftsScore);
			} else {
				// Check all modes
				for (const m of ['basic', 'kids'] as GameMode[]) {
					const stfData = wordData.spanish_to_finnish[m];
					const ftsData = wordData.finnish_to_spanish[m];
					const stfScore = stfData?.score || 0;
					const ftsScore = ftsData?.score || 0;
					bestScore = Math.max(bestScore, stfScore, ftsScore);
				}
			}
			
			if (bestScore >= KNOWN_THRESHOLD) {
				known++;
			}
		}
	}
	
	return {
		known,
		total: n,
		percentage: Math.round((known / n) * 100)
	};
}

/**
 * Estimate CEFR level based on vocabulary knowledge
 * 
 * Rough mapping:
 * - A1: Know < 500 words or < 20% of top 1000
 * - A2: Know 500-1000 words or 20-40% of top 1000
 * - B1: Know 1000-2000 words or 40-60% of top 1000 + 20% of 1001-3000
 * - B2: Know 2000-4000 words or 60%+ of top 1000 + 40% of 1001-3000
 * - C1: Know 4000+ words with high mastery
 */
function estimateCEFRLevel(stats: {
	top100: TopNProgress;
	top500: TopNProgress;
	top1000: TopNProgress;
	top5000: TopNProgress;
	averageScore: number;
}): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' {
	const { top100, top500, top1000, top5000, averageScore } = stats;
	
	// C1: Know most of top 5000 with high scores
	if (top5000.percentage >= 70 && averageScore >= 75) {
		return 'C1';
	}
	
	// B2: Strong coverage of top 1000, good progress on top 5000
	if (top1000.percentage >= 60 && top5000.percentage >= 40 && averageScore >= 65) {
		return 'B2';
	}
	
	// B1: Know majority of top 500, good progress on top 1000
	if (top500.percentage >= 50 && top1000.percentage >= 30 && averageScore >= 55) {
		return 'B1';
	}
	
	// A2: Know most of top 100, working on top 500
	if (top100.percentage >= 40 && top500.percentage >= 20) {
		return 'A2';
	}
	
	// A1: Beginner
	return 'A1';
}

/**
 * Calculate full vocabulary statistics
 * 
 * This is the main function for getting user progress data.
 * It combines wordKnowledge store data with frequency metadata.
 */
export async function calculateVocabularyStats(mode?: GameMode): Promise<VocabularyStatistics> {
	const knowledgeData = get(wordKnowledge);
	const allWords = getAllWords();
	
	// Get metadata for all practiced words
	// Extract Spanish words from word IDs (handles polysemous words)
	const practicedWordIds = Object.keys(knowledgeData.words);
	const practicedSpanish = practicedWordIds.map(extractSpanishFromWordId);
	const wordMetadataMap = await getWordsMetadata(practicedSpanish);
	
	// Calculate basic stats
	let totalPracticed = 0;
	let wordsKnown = 0;
	let wordsMastered = 0;
	let wordsWeak = 0;
	let totalScore = 0;
	
	for (const wordData of Object.values(knowledgeData.words)) {
		// If mode specified, only check that mode; otherwise check all modes
		let bestScore = 0;
		let hasPracticed = false;
		
		if (mode) {
			const stfData = wordData.spanish_to_finnish[mode];
			const ftsData = wordData.finnish_to_spanish[mode];
			const stfPracticed = stfData && stfData.practiceCount > 0;
			const ftsPracticed = ftsData && ftsData.practiceCount > 0;
			
			if (stfPracticed || ftsPracticed) {
				hasPracticed = true;
				bestScore = Math.max(stfData?.score || 0, ftsData?.score || 0);
			}
		} else {
			// Check all modes
			for (const m of ['basic', 'kids'] as GameMode[]) {
				const stfData = wordData.spanish_to_finnish[m];
				const ftsData = wordData.finnish_to_spanish[m];
				const stfPracticed = stfData && stfData.practiceCount > 0;
				const ftsPracticed = ftsData && ftsData.practiceCount > 0;
				
				if (stfPracticed || ftsPracticed) {
					hasPracticed = true;
					bestScore = Math.max(bestScore, stfData?.score || 0, ftsData?.score || 0);
				}
			}
		}
		
		if (hasPracticed) {
			totalPracticed++;
			totalScore += bestScore;
			
			if (bestScore >= MASTERED_THRESHOLD) {
				wordsMastered++;
				wordsKnown++;
			} else if (bestScore >= KNOWN_THRESHOLD) {
				wordsKnown++;
			} else if (bestScore < WEAK_THRESHOLD) {
				wordsWeak++;
			}
		}
	}
	
	const averageScore = totalPracticed > 0 ? Math.round(totalScore / totalPracticed) : 0;
	
	// Calculate top-N progress
	const top100 = await calculateTopNProgress(knowledgeData, 100, wordMetadataMap, mode);
	const top500 = await calculateTopNProgress(knowledgeData, 500, wordMetadataMap, mode);
	const top1000 = await calculateTopNProgress(knowledgeData, 1000, wordMetadataMap, mode);
	const top5000 = await calculateTopNProgress(knowledgeData, 5000, wordMetadataMap, mode);
	
	// Estimate CEFR level
	const estimatedLevel = estimateCEFRLevel({
		top100,
		top500,
		top1000,
		top5000,
		averageScore
	});
	
	// Calculate vocabulary coverage (how many game words are in frequency data)
	const allWordsMetadata = await getWordsMetadata(allWords.map(w => w.spanish));
	let inFrequencyData = 0;
	for (const metadata of allWordsMetadata.values()) {
		if (metadata.isInFrequencyData) {
			inFrequencyData++;
		}
	}
	
	const totalGamesPlayed = mode === 'basic'
		? knowledgeData.meta.basicGamesPlayed
		: mode === 'kids'
			? knowledgeData.meta.kidsGamesPlayed
			: knowledgeData.meta.totalGamesPlayed;
	
	return {
		totalPracticed,
		wordsKnown,
		wordsMastered,
		wordsWeak,
		topNProgress: {
			top100,
			top500,
			top1000,
			top5000
		},
		estimatedLevel,
		averageScore,
		totalGamesPlayed,
		vocabularyCoverage: {
			inFrequencyData,
			total: allWords.length,
			percentage: Math.round((inFrequencyData / allWords.length) * 100)
		}
	};
}

/**
 * Get progress for top 100 words
 */
export async function getTop100Progress(mode?: GameMode): Promise<TopNProgress> {
	const knowledgeData = get(wordKnowledge);
	const practicedWordIds = Object.keys(knowledgeData.words);
	const practicedSpanish = practicedWordIds.map(extractSpanishFromWordId);
	const wordMetadataMap = await getWordsMetadata(practicedSpanish);
	return calculateTopNProgress(knowledgeData, 100, wordMetadataMap, mode);
}

/**
 * Get progress for top 500 words
 */
export async function getTop500Progress(mode?: GameMode): Promise<TopNProgress> {
	const knowledgeData = get(wordKnowledge);
	const practicedWordIds = Object.keys(knowledgeData.words);
	const practicedSpanish = practicedWordIds.map(extractSpanishFromWordId);
	const wordMetadataMap = await getWordsMetadata(practicedSpanish);
	return calculateTopNProgress(knowledgeData, 500, wordMetadataMap, mode);
}

/**
 * Get progress for top 1000 words
 */
export async function getTop1000Progress(mode?: GameMode): Promise<TopNProgress> {
	const knowledgeData = get(wordKnowledge);
	const practicedWordIds = Object.keys(knowledgeData.words);
	const practicedSpanish = practicedWordIds.map(extractSpanishFromWordId);
	const wordMetadataMap = await getWordsMetadata(practicedSpanish);
	return calculateTopNProgress(knowledgeData, 1000, wordMetadataMap, mode);
}

/**
 * Get estimated CEFR level
 */
export async function getEstimatedLevel(mode?: GameMode): Promise<'A1' | 'A2' | 'B1' | 'B2' | 'C1'> {
	const stats = await calculateVocabularyStats(mode);
	return stats.estimatedLevel;
}

/**
 * Get next learning milestone
 */
export async function getNextMilestone(mode?: GameMode): Promise<{
	type: 'top100' | 'top500' | 'top1000' | 'words_known';
	current: number;
	target: number;
	description: string;
} | null> {
	const stats = await calculateVocabularyStats(mode);
	
	// Check milestones in order
	if (stats.topNProgress.top100.percentage < 50) {
		return {
			type: 'top100',
			current: stats.topNProgress.top100.known,
			target: 50,
			description: 'Opi 50 sanaa 100 yleisimmästä'
		};
	}
	
	if (stats.topNProgress.top500.percentage < 50) {
		return {
			type: 'top500',
			current: stats.topNProgress.top500.known,
			target: 250,
			description: 'Opi 250 sanaa 500 yleisimmästä'
		};
	}
	
	if (stats.topNProgress.top1000.percentage < 50) {
		return {
			type: 'top1000',
			current: stats.topNProgress.top1000.known,
			target: 500,
			description: 'Opi 500 sanaa 1000 yleisimmästä'
		};
	}
	
	// All basic milestones reached
	return null;
}

/**
 * Get a summary message for current progress
 */
export async function getProgressSummary(mode?: GameMode): Promise<string> {
	const stats = await calculateVocabularyStats(mode);
	
	if (stats.totalPracticed === 0) {
		return 'Start learning! Practice your first words.';
	}
	
	if (stats.wordsKnown < 10) {
		return `Great start! You know ${stats.wordsKnown} words.`;
	}
	
	if (stats.wordsKnown < 50) {
		return `Good progress! ${stats.wordsKnown} words known. Keep going!`;
	}
	
	if (stats.wordsKnown < 100) {
		return `Impressive! ${stats.wordsKnown} words known. You're at ${stats.estimatedLevel} level.`;
	}
	
	return `Amazing! ${stats.wordsKnown} words known. Level: ${stats.estimatedLevel}. ${stats.wordsMastered} mastered!`;
}

/**
 * Kids-specific statistics interface
 */
export interface KidsVocabularyStatistics {
	totalWordsPracticed: number;
	wordsKnown: number;
	wordsMastered: number;
	totalGamesPlayed: number;
	averageScore: number;
	recentProgress: {
		last7Days: number;
		last30Days: number;
	};
	encouragementMessage: string;
	nextMilestone: {
		description: string;
		current: number;
		target: number;
		percentage: number;
	};
}

/**
 * Calculate kids-specific vocabulary statistics
 */
export async function calculateKidsVocabularyStats(): Promise<KidsVocabularyStatistics> {
	const stats = await calculateVocabularyStats('kids');
	
	// Generate encouragement message based on progress
	let encouragementMessage = 'Aloitetaan oppimaan!';
	if (stats.wordsKnown >= 50) {
		encouragementMessage = 'Mahtavaa! Olet oppinut paljon sanoja!';
	} else if (stats.wordsKnown >= 20) {
		encouragementMessage = 'Hienoa työtä! Jatka samaan malliin!';
	} else if (stats.wordsKnown >= 5) {
		encouragementMessage = 'Hyvä alku! Opit nopeasti!';
	} else if (stats.wordsKnown > 0) {
		encouragementMessage = 'Hienoa! Ensimmäiset sanat opittu!';
	}
	
	// Calculate next milestone
	let nextMilestone = {
		description: 'Opi 10 ensimmäistä sanaa',
		current: stats.wordsKnown,
		target: 10,
		percentage: Math.round((stats.wordsKnown / 10) * 100)
	};
	
	if (stats.wordsKnown >= 10) {
		nextMilestone = {
			description: 'Opi 25 sanaa',
			current: stats.wordsKnown,
			target: 25,
			percentage: Math.round((stats.wordsKnown / 25) * 100)
		};
	}
	
	if (stats.wordsKnown >= 25) {
		nextMilestone = {
			description: 'Opi 50 sanaa',
			current: stats.wordsKnown,
			target: 50,
			percentage: Math.round((stats.wordsKnown / 50) * 100)
		};
	}
	
	if (stats.wordsKnown >= 50) {
		nextMilestone = {
			description: 'Opi 100 sanaa',
			current: stats.wordsKnown,
			target: 100,
			percentage: Math.round((stats.wordsKnown / 100) * 100)
		};
	}
	
	// TODO: Calculate recent progress (requires timestamp tracking)
	// For now, return placeholder values
	const recentProgress = {
		last7Days: 0,
		last30Days: 0
	};
	
	return {
		totalWordsPracticed: stats.totalPracticed,
		wordsKnown: stats.wordsKnown,
		wordsMastered: stats.wordsMastered,
		totalGamesPlayed: stats.totalGamesPlayed,
		averageScore: stats.averageScore,
		recentProgress,
		encouragementMessage,
		nextMilestone
	};
}
