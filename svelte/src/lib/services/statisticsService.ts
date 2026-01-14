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
import { wordKnowledge, type WordKnowledgeData } from '$lib/stores/wordKnowledge';
import { getWordsMetadata, type WordMetadata } from './vocabularyService';
import { getAllWords, type Word } from '$lib/data/words';

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
	wordMetadataMap: Map<string, WordMetadata>
): Promise<TopNProgress> {
	let known = 0;
	
	// Count words in top N that user has practiced with good score
	for (const [spanish, wordData] of Object.entries(knowledgeData.words)) {
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
			const stfScore = wordData.spanish_to_finnish.score;
			const ftsScore = wordData.finnish_to_spanish.score;
			const bestScore = Math.max(stfScore, ftsScore);
			
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
export async function calculateVocabularyStats(): Promise<VocabularyStatistics> {
	const knowledgeData = get(wordKnowledge);
	const allWords = getAllWords();
	
	// Get metadata for all practiced words
	const practicedSpanish = Object.keys(knowledgeData.words);
	const wordMetadataMap = await getWordsMetadata(practicedSpanish);
	
	// Calculate basic stats
	let totalPracticed = 0;
	let wordsKnown = 0;
	let wordsMastered = 0;
	let wordsWeak = 0;
	let totalScore = 0;
	
	for (const wordData of Object.values(knowledgeData.words)) {
		const stfPracticed = wordData.spanish_to_finnish.practiceCount > 0;
		const ftsPracticed = wordData.finnish_to_spanish.practiceCount > 0;
		
		if (stfPracticed || ftsPracticed) {
			totalPracticed++;
			
			// Use best score from either direction
			const bestScore = Math.max(
				wordData.spanish_to_finnish.score,
				wordData.finnish_to_spanish.score
			);
			
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
	const top100 = await calculateTopNProgress(knowledgeData, 100, wordMetadataMap);
	const top500 = await calculateTopNProgress(knowledgeData, 500, wordMetadataMap);
	const top1000 = await calculateTopNProgress(knowledgeData, 1000, wordMetadataMap);
	const top5000 = await calculateTopNProgress(knowledgeData, 5000, wordMetadataMap);
	
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
		totalGamesPlayed: knowledgeData.meta.totalGamesPlayed,
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
export async function getTop100Progress(): Promise<TopNProgress> {
	const knowledgeData = get(wordKnowledge);
	const practicedSpanish = Object.keys(knowledgeData.words);
	const wordMetadataMap = await getWordsMetadata(practicedSpanish);
	return calculateTopNProgress(knowledgeData, 100, wordMetadataMap);
}

/**
 * Get progress for top 500 words
 */
export async function getTop500Progress(): Promise<TopNProgress> {
	const knowledgeData = get(wordKnowledge);
	const practicedSpanish = Object.keys(knowledgeData.words);
	const wordMetadataMap = await getWordsMetadata(practicedSpanish);
	return calculateTopNProgress(knowledgeData, 500, wordMetadataMap);
}

/**
 * Get progress for top 1000 words
 */
export async function getTop1000Progress(): Promise<TopNProgress> {
	const knowledgeData = get(wordKnowledge);
	const practicedSpanish = Object.keys(knowledgeData.words);
	const wordMetadataMap = await getWordsMetadata(practicedSpanish);
	return calculateTopNProgress(knowledgeData, 1000, wordMetadataMap);
}

/**
 * Get estimated CEFR level
 */
export async function getEstimatedLevel(): Promise<'A1' | 'A2' | 'B1' | 'B2' | 'C1'> {
	const stats = await calculateVocabularyStats();
	return stats.estimatedLevel;
}

/**
 * Get next learning milestone
 */
export async function getNextMilestone(): Promise<{
	type: 'top100' | 'top500' | 'top1000' | 'words_known';
	current: number;
	target: number;
	description: string;
} | null> {
	const stats = await calculateVocabularyStats();
	
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
export async function getProgressSummary(): Promise<string> {
	const stats = await calculateVocabularyStats();
	
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
