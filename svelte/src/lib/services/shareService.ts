/**
 * Share Service for Espanjapeli V4
 * 
 * Generates shareable progress reports for users to share their learning achievements
 * via WhatsApp, email, or other messaging platforms.
 * 
 * Key features:
 * - Generate formatted text reports with statistics
 * - Support for multiple languages (Finnish, English)
 * - Copy to clipboard functionality
 * - Web Share API integration with fallback
 */

import { calculateVocabularyStats, type VocabularyStatistics } from './statisticsService';
import { get } from 'svelte/store';
import { wordKnowledge } from '$lib/stores/wordKnowledge';

/** Language options for progress reports */
export type ReportLanguage = 'fi' | 'en';

/** Progress report data */
export interface ProgressReport {
	text: string;
	stats: VocabularyStatistics;
	generatedAt: Date;
}

/**
 * Generate a shareable progress report in Finnish
 */
function generateFinnishReport(stats: VocabularyStatistics): string {
	const lines: string[] = [];
	
	lines.push('📚 Espanjapeli - Oppimisraportti');
	lines.push('');
	
	// Basic stats
	lines.push(`🎯 Sanoja opittu: ${stats.wordsKnown}`);
	lines.push(`⭐ Sanoja hallittu: ${stats.wordsMastered}`);
	lines.push(`📖 Sanoja harjoiteltu: ${stats.totalPracticed}`);
	lines.push('');
	
	// CEFR level
	const levelEmoji = getLevelEmoji(stats.estimatedLevel);
	lines.push(`${levelEmoji} Arvioitu taso: ${stats.estimatedLevel}`);
	lines.push('');
	
	// Top N progress
	lines.push('📊 Yleisimmät sanat:');
	lines.push(`  100 yleisintä: ${stats.topNProgress.top100.known}/100 (${stats.topNProgress.top100.percentage}%)`);
	lines.push(`  500 yleisintä: ${stats.topNProgress.top500.known}/500 (${stats.topNProgress.top500.percentage}%)`);
	lines.push(`  1000 yleisintä: ${stats.topNProgress.top1000.known}/1000 (${stats.topNProgress.top1000.percentage}%)`);
	lines.push('');
	
	// Games played
	lines.push(`🎮 Pelejä pelattu: ${stats.totalGamesPlayed}`);
	lines.push(`💯 Keskiarvo: ${stats.averageScore}%`);
	lines.push('');
	
	// Footer
	lines.push('Opi espanjaa: espanjapeli.fi');
	
	return lines.join('\n');
}

/**
 * Generate a shareable progress report in English
 */
function generateEnglishReport(stats: VocabularyStatistics): string {
	const lines: string[] = [];
	
	lines.push('📚 Espanjapeli - Learning Report');
	lines.push('');
	
	// Basic stats
	lines.push(`🎯 Words learned: ${stats.wordsKnown}`);
	lines.push(`⭐ Words mastered: ${stats.wordsMastered}`);
	lines.push(`📖 Words practiced: ${stats.totalPracticed}`);
	lines.push('');
	
	// CEFR level
	const levelEmoji = getLevelEmoji(stats.estimatedLevel);
	lines.push(`${levelEmoji} Estimated level: ${stats.estimatedLevel}`);
	lines.push('');
	
	// Top N progress
	lines.push('📊 Most common words:');
	lines.push(`  Top 100: ${stats.topNProgress.top100.known}/100 (${stats.topNProgress.top100.percentage}%)`);
	lines.push(`  Top 500: ${stats.topNProgress.top500.known}/500 (${stats.topNProgress.top500.percentage}%)`);
	lines.push(`  Top 1000: ${stats.topNProgress.top1000.known}/1000 (${stats.topNProgress.top1000.percentage}%)`);
	lines.push('');
	
	// Games played
	lines.push(`🎮 Games played: ${stats.totalGamesPlayed}`);
	lines.push(`💯 Average score: ${stats.averageScore}%`);
	lines.push('');
	
	// Footer
	lines.push('Learn Spanish: espanjapeli.fi');
	
	return lines.join('\n');
}

/**
 * Get emoji for CEFR level
 */
function getLevelEmoji(level: string): string {
	switch (level) {
		case 'A1': return '🌱';
		case 'A2': return '🌿';
		case 'B1': return '🌳';
		case 'B2': return '🏆';
		case 'C1': return '👑';
		default: return '📚';
	}
}

/**
 * Generate a progress report
 * 
 * @param language - Language for the report (default: Finnish)
 * @returns Progress report with formatted text and statistics
 */
export async function generateProgressReport(
	language: ReportLanguage = 'fi'
): Promise<ProgressReport> {
	const stats = await calculateVocabularyStats();
	
	const text = language === 'fi' 
		? generateFinnishReport(stats)
		: generateEnglishReport(stats);
	
	return {
		text,
		stats,
		generatedAt: new Date()
	};
}

/**
 * Copy text to clipboard
 * 
 * @param text - Text to copy
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
	try {
		// Modern clipboard API
		if (navigator.clipboard && navigator.clipboard.writeText) {
			await navigator.clipboard.writeText(text);
			return true;
		}
		
		// Fallback for older browsers
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.appendChild(textarea);
		textarea.select();
		
		const success = document.execCommand('copy');
		document.body.removeChild(textarea);
		
		return success;
	} catch (error) {
		console.error('Failed to copy to clipboard:', error);
		return false;
	}
}

/**
 * Share progress report using Web Share API
 * 
 * Falls back to copy-to-clipboard if Web Share API is not available.
 * 
 * @param report - Progress report to share
 * @returns Promise that resolves to 'shared' if shared via Web Share API,
 *          'copied' if copied to clipboard, or 'failed' if both methods failed
 */
export async function shareProgressReport(
	report: ProgressReport
): Promise<'shared' | 'copied' | 'failed'> {
	// Try Web Share API first (available on mobile)
	if (navigator.share) {
		try {
			await navigator.share({
				title: 'Espanjapeli - Learning Progress',
				text: report.text
			});
			return 'shared';
		} catch (error) {
			// User cancelled or share failed
			console.log('Share cancelled or failed:', error);
			// Fall through to clipboard
		}
	}
	
	// Fallback to clipboard
	const copied = await copyToClipboard(report.text);
	return copied ? 'copied' : 'failed';
}

/**
 * Generate a milestone achievement message
 * 
 * @param milestoneType - Type of milestone achieved
 * @param value - Achievement value (e.g., number of words)
 * @param language - Language for the message
 * @returns Formatted milestone message
 */
export function generateMilestoneMessage(
	milestoneType: 'words_known' | 'words_mastered' | 'top100' | 'top500' | 'top1000' | 'level_up',
	value: number | string,
	language: ReportLanguage = 'fi'
): string {
	if (language === 'fi') {
		switch (milestoneType) {
			case 'words_known':
				return `🎉 Onneksi olkoon! Olet oppinut ${value} sanaa espanjaksi!`;
			case 'words_mastered':
				return `⭐ Mahtavaa! Olet hallinnut ${value} sanaa!`;
			case 'top100':
				return `🏆 Hienoa! Tunnet ${value}% yleisimmistä 100 sanasta!`;
			case 'top500':
				return `🎯 Upeaa! Tunnet ${value}% yleisimmistä 500 sanasta!`;
			case 'top1000':
				return `👑 Loistavaa! Tunnet ${value}% yleisimmistä 1000 sanasta!`;
			case 'level_up':
				return `📈 Taitotaso nousi! Uusi taso: ${value}`;
			default:
				return `🎉 Saavutus avattu!`;
		}
	} else {
		switch (milestoneType) {
			case 'words_known':
				return `🎉 Congratulations! You've learned ${value} Spanish words!`;
			case 'words_mastered':
				return `⭐ Amazing! You've mastered ${value} words!`;
			case 'top100':
				return `🏆 Great! You know ${value}% of the top 100 most common words!`;
			case 'top500':
				return `🎯 Awesome! You know ${value}% of the top 500 most common words!`;
			case 'top1000':
				return `👑 Excellent! You know ${value}% of the top 1000 most common words!`;
			case 'level_up':
				return `📈 Level up! New level: ${value}`;
			default:
				return `🎉 Achievement unlocked!`;
		}
	}
}

/**
 * Check if Web Share API is available
 */
export function isWebShareAvailable(): boolean {
	return typeof navigator !== 'undefined' && !!navigator.share;
}

/**
 * Get a quick stats summary for display
 */
export async function getQuickStatsSummary(language: ReportLanguage = 'fi'): Promise<string> {
	const stats = await calculateVocabularyStats();
	
	if (language === 'fi') {
		return `${stats.wordsKnown} sanaa opittu • ${stats.estimatedLevel} taso • ${stats.topNProgress.top100.percentage}% top 100`;
	} else {
		return `${stats.wordsKnown} words learned • ${stats.estimatedLevel} level • ${stats.topNProgress.top100.percentage}% top 100`;
	}
}
