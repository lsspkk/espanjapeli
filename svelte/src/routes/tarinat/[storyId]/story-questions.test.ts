import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import StoryQuestion from '$lib/components/basic/stories/StoryQuestion.svelte';
import type { Story, StoryQuestionResult } from '$lib/types/story';
import storiesData from '../../../../static/stories/stories.json';

describe('Story Questions Integration Test', () => {
	const stories = storiesData.stories as Story[];
	const testStory = stories[0]; // Use first story from real data

	it('should have valid question data with correctIndex', () => {
		expect(testStory).toBeDefined();
		expect(testStory.questions).toBeDefined();
		expect(testStory.questions.length).toBeGreaterThan(0);

		// Verify each question has correctIndex
		testStory.questions.forEach((question, i) => {
			expect(question.correctIndex).toBeDefined();
			expect(question.correctIndex).toBeGreaterThanOrEqual(0);
			expect(question.correctIndex).toBeLessThan(question.options.length);
			expect(question.options.length).toBeGreaterThan(0);
		});
	});

	it('should correctly identify correct answer', async () => {
		const question = testStory.questions[0];
		const results: StoryQuestionResult[] = [];

		const handleAnswer = (selectedIndex: number, correct: boolean) => {
			results.push({
				questionId: question.id,
				correct,
				selectedIndex,
				correctIndex: question.correctIndex,
				attempts: 1
			});
		};

		const { container } = render(StoryQuestion, {
			props: {
				question,
				questionNumber: 1,
				totalQuestions: testStory.questions.length,
				onAnswer: handleAnswer
			}
		});

		// Find all option buttons
		const buttons = container.querySelectorAll('button.btn');
		expect(buttons.length).toBe(question.options.length);

		// Click the correct answer
		await fireEvent.click(buttons[question.correctIndex]);

		// Verify result
		expect(results.length).toBe(1);
		expect(results[0].correct).toBe(true);
		expect(results[0].selectedIndex).toBe(question.correctIndex);
		expect(results[0].correctIndex).toBe(question.correctIndex);
	});

	it('should correctly identify wrong answer', async () => {
		const question = testStory.questions[0];
		const results: StoryQuestionResult[] = [];

		const handleAnswer = (selectedIndex: number, correct: boolean) => {
			results.push({
				questionId: question.id,
				correct,
				selectedIndex,
				correctIndex: question.correctIndex,
				attempts: 1
			});
		};

		const { container } = render(StoryQuestion, {
			props: {
				question,
				questionNumber: 1,
				totalQuestions: testStory.questions.length,
				onAnswer: handleAnswer
			}
		});

		// Find a wrong answer index
		const wrongIndex = question.correctIndex === 0 ? 1 : 0;

		const buttons = container.querySelectorAll('button.btn');
		await fireEvent.click(buttons[wrongIndex]);

		// Verify result
		expect(results.length).toBe(1);
		expect(results[0].correct).toBe(false);
		expect(results[0].selectedIndex).toBe(wrongIndex);
		expect(results[0].correctIndex).toBe(question.correctIndex);
	});

	it('should process all questions in a story correctly', async () => {
		const results: StoryQuestionResult[] = [];

		// Simulate answering all questions
		for (let i = 0; i < testStory.questions.length; i++) {
			const question = testStory.questions[i];

			const handleAnswer = (selectedIndex: number, correct: boolean) => {
				results.push({
					questionId: question.id,
					correct,
					selectedIndex,
					correctIndex: question.correctIndex,
					attempts: 1
				});
			};

			const { container, unmount } = render(StoryQuestion, {
				props: {
					question,
					questionNumber: i + 1,
					totalQuestions: testStory.questions.length,
					onAnswer: handleAnswer
				}
			});

			// Answer correctly
			const buttons = container.querySelectorAll('button.btn');
			await fireEvent.click(buttons[question.correctIndex]);

			unmount();
		}

		// Verify all results
		expect(results.length).toBe(testStory.questions.length);
		results.forEach((result, i) => {
			expect(result.correct).toBe(true);
			expect(result.questionId).toBe(testStory.questions[i].id);
		});
	});

	it('should calculate game score correctly', () => {
		const results: StoryQuestionResult[] = [];

		// Simulate mixed correct/incorrect answers
		testStory.questions.forEach((question, i) => {
			const isCorrect = i % 2 === 0; // Every other answer correct
			const selectedIndex = isCorrect ? question.correctIndex : (question.correctIndex + 1) % question.options.length;

			results.push({
				questionId: question.id,
				correct: isCorrect,
				selectedIndex,
				correctIndex: question.correctIndex,
				attempts: 1
			});
		});

		// Calculate score
		const totalCorrect = results.filter(r => r.correct).length;
		const totalQuestions = results.length;
		const percentage = Math.round((totalCorrect / totalQuestions) * 100);

		expect(totalCorrect).toBe(Math.ceil(testStory.questions.length / 2));
		expect(totalQuestions).toBe(testStory.questions.length);
		expect(percentage).toBeGreaterThanOrEqual(0);
		expect(percentage).toBeLessThanOrEqual(100);
	});

	it('should verify all stories have valid question data', () => {
		stories.forEach((story) => {
			expect(story.questions).toBeDefined();
			expect(story.questions.length).toBeGreaterThan(0);

			story.questions.forEach((question) => {
				expect(question.id).toBeDefined();
				expect(question.question).toBeDefined();
				expect(question.options).toBeDefined();
				expect(question.options.length).toBeGreaterThanOrEqual(2);
				expect(question.correctIndex).toBeDefined();
				expect(question.correctIndex).toBeGreaterThanOrEqual(0);
				expect(question.correctIndex).toBeLessThan(question.options.length);
			});
		});
	});
});
