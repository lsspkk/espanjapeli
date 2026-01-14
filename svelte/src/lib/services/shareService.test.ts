import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	generateProgressReport,
	copyToClipboard,
	shareProgressReport,
	generateMilestoneMessage,
	isWebShareAvailable,
	getQuickStatsSummary,
	type ReportLanguage
} from './shareService';
import * as statisticsService from './statisticsService';

// Mock statisticsService
vi.mock('./statisticsService', () => ({
	calculateVocabularyStats: vi.fn()
}));

// Mock wordKnowledge store
vi.mock('$lib/stores/wordKnowledge', () => ({
	wordKnowledge: {
		subscribe: vi.fn()
	}
}));

describe('shareService', () => {
	const mockStats = {
		totalPracticed: 150,
		wordsKnown: 85,
		wordsMastered: 42,
		wordsWeak: 20,
		topNProgress: {
			top100: { known: 45, total: 100, percentage: 45 },
			top500: { known: 120, total: 500, percentage: 24 },
			top1000: { known: 180, total: 1000, percentage: 18 },
			top5000: { known: 300, total: 5000, percentage: 6 }
		},
		estimatedLevel: 'A2' as const,
		averageScore: 72,
		totalGamesPlayed: 48,
		vocabularyCoverage: {
			inFrequencyData: 200,
			total: 250,
			percentage: 80
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(statisticsService.calculateVocabularyStats).mockResolvedValue(mockStats);
	});

	describe('generateProgressReport', () => {
		it('should generate Finnish report by default', async () => {
			const report = await generateProgressReport();
			
			expect(report.text).toContain('Espanjapeli - Oppimisraportti');
			expect(report.text).toContain('Sanoja opittu: 85');
			expect(report.text).toContain('Sanoja hallittu: 42');
			expect(report.text).toContain('Arvioitu taso: A2');
			expect(report.text).toContain('Top 100: 45/100 (45%)');
			expect(report.text).toContain('Pelejä pelattu: 48');
			expect(report.text).toContain('espanjapeli.fi');
			expect(report.stats).toEqual(mockStats);
			expect(report.generatedAt).toBeInstanceOf(Date);
		});

		it('should generate English report when specified', async () => {
			const report = await generateProgressReport('en');
			
			expect(report.text).toContain('Espanjapeli - Learning Report');
			expect(report.text).toContain('Words learned: 85');
			expect(report.text).toContain('Words mastered: 42');
			expect(report.text).toContain('Estimated level: A2');
			expect(report.text).toContain('Top 100: 45/100 (45%)');
			expect(report.text).toContain('Games played: 48');
			expect(report.text).toContain('espanjapeli.fi');
		});

		it('should include all CEFR levels with appropriate emojis', async () => {
			const levels = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
			
			for (const level of levels) {
				vi.mocked(statisticsService.calculateVocabularyStats).mockResolvedValue({
					...mockStats,
					estimatedLevel: level
				});
				
				const report = await generateProgressReport();
				expect(report.text).toContain(`Arvioitu taso: ${level}`);
			}
		});
	});

	describe('copyToClipboard', () => {
		it('should use modern clipboard API when available', async () => {
			const mockWriteText = vi.fn().mockResolvedValue(undefined);
			Object.defineProperty(navigator, 'clipboard', {
				value: { writeText: mockWriteText },
				writable: true,
				configurable: true
			});

			const result = await copyToClipboard('test text');
			
			expect(result).toBe(true);
			expect(mockWriteText).toHaveBeenCalledWith('test text');
		});

		it('should use fallback when clipboard API not available', async () => {
			// Remove clipboard API
			Object.defineProperty(navigator, 'clipboard', {
				value: undefined,
				writable: true,
				configurable: true
			});

			// Mock document.execCommand
			const mockExecCommand = vi.fn().mockReturnValue(true);
			document.execCommand = mockExecCommand;

			const result = await copyToClipboard('test text');
			
			expect(result).toBe(true);
			expect(mockExecCommand).toHaveBeenCalledWith('copy');
		});

		it('should return false on error', async () => {
			Object.defineProperty(navigator, 'clipboard', {
				value: { writeText: vi.fn().mockRejectedValue(new Error('Failed')) },
				writable: true,
				configurable: true
			});

			const result = await copyToClipboard('test text');
			
			expect(result).toBe(false);
		});
	});

	describe('shareProgressReport', () => {
		it('should use Web Share API when available', async () => {
			const mockShare = vi.fn().mockResolvedValue(undefined);
			Object.defineProperty(navigator, 'share', {
				value: mockShare,
				writable: true,
				configurable: true
			});

			const report = await generateProgressReport();
			const result = await shareProgressReport(report);
			
			expect(result).toBe('shared');
			expect(mockShare).toHaveBeenCalledWith({
				title: 'Espanjapeli - Learning Progress',
				text: report.text
			});
		});

		it('should fallback to clipboard when Web Share API not available', async () => {
			Object.defineProperty(navigator, 'share', {
				value: undefined,
				writable: true,
				configurable: true
			});

			const mockWriteText = vi.fn().mockResolvedValue(undefined);
			Object.defineProperty(navigator, 'clipboard', {
				value: { writeText: mockWriteText },
				writable: true,
				configurable: true
			});

			const report = await generateProgressReport();
			const result = await shareProgressReport(report);
			
			expect(result).toBe('copied');
			expect(mockWriteText).toHaveBeenCalledWith(report.text);
		});

		it('should return failed when both methods fail', async () => {
			Object.defineProperty(navigator, 'share', {
				value: undefined,
				writable: true,
				configurable: true
			});

			Object.defineProperty(navigator, 'clipboard', {
				value: { writeText: vi.fn().mockRejectedValue(new Error('Failed')) },
				writable: true,
				configurable: true
			});

			const report = await generateProgressReport();
			const result = await shareProgressReport(report);
			
			expect(result).toBe('failed');
		});
	});

	describe('generateMilestoneMessage', () => {
		it('should generate Finnish milestone messages', () => {
			expect(generateMilestoneMessage('words_known', 50, 'fi'))
				.toContain('Olet oppinut 50 sanaa');
			expect(generateMilestoneMessage('words_mastered', 25, 'fi'))
				.toContain('Olet hallinnut 25 sanaa');
			expect(generateMilestoneMessage('top100', 50, 'fi'))
				.toContain('Tunnet 50% yleisimmistä 100 sanasta');
			expect(generateMilestoneMessage('top500', 50, 'fi'))
				.toContain('Tunnet 50% yleisimmistä 500 sanasta');
			expect(generateMilestoneMessage('top1000', 50, 'fi'))
				.toContain('Tunnet 50% yleisimmistä 1000 sanasta');
			expect(generateMilestoneMessage('level_up', 'B1', 'fi'))
				.toContain('Uusi taso: B1');
		});

		it('should generate English milestone messages', () => {
			expect(generateMilestoneMessage('words_known', 50, 'en'))
				.toContain("You've learned 50 Spanish words");
			expect(generateMilestoneMessage('words_mastered', 25, 'en'))
				.toContain("You've mastered 25 words");
			expect(generateMilestoneMessage('top100', 50, 'en'))
				.toContain('You know 50% of the top 100');
			expect(generateMilestoneMessage('top500', 50, 'en'))
				.toContain('You know 50% of the top 500');
			expect(generateMilestoneMessage('top1000', 50, 'en'))
				.toContain('You know 50% of the top 1000');
			expect(generateMilestoneMessage('level_up', 'B1', 'en'))
				.toContain('New level: B1');
		});
	});

	describe('isWebShareAvailable', () => {
		it('should return true when Web Share API is available', () => {
			Object.defineProperty(navigator, 'share', {
				value: vi.fn(),
				writable: true,
				configurable: true
			});

			expect(isWebShareAvailable()).toBe(true);
		});

		it('should return false when Web Share API is not available', () => {
			Object.defineProperty(navigator, 'share', {
				value: undefined,
				writable: true,
				configurable: true
			});

			expect(isWebShareAvailable()).toBe(false);
		});
	});

	describe('getQuickStatsSummary', () => {
		it('should generate Finnish summary', async () => {
			const summary = await getQuickStatsSummary('fi');
			
			expect(summary).toContain('85 sanaa opittu');
			expect(summary).toContain('A2 taso');
			expect(summary).toContain('45% top 100');
		});

		it('should generate English summary', async () => {
			const summary = await getQuickStatsSummary('en');
			
			expect(summary).toContain('85 words learned');
			expect(summary).toContain('A2 level');
			expect(summary).toContain('45% top 100');
		});
	});
});
