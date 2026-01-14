import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import StoryPageTest from './StoryPageTest.svelte';
import type { Story } from '$lib/types/story';
import storiesData from '../../../../static/stories/stories.json';

describe('Story Page Complete Flow', () => {
	const stories = storiesData.stories as Story[];
	const testStory = stories[0];

	it('should complete full story game flow with correct answers', async () => {
		const { container, component } = render(StoryPageTest, {
			props: {
				story: testStory
			}
		});

		// Verify initial state is 'reading'
		let state = component.gameState;
		expect(state).toBe('reading');

		// Start questions
		component.startQuestions();
		state = component.gameState;
		expect(state).toBe('questions');

		// Answer all questions correctly
		for (let i = 0; i < testStory.questions.length; i++) {
			const question = testStory.questions[i];
			component.handleAnswer(question.correctIndex, true);
		}

		// Should be in report state
		state = component.gameState;
		expect(state).toBe('report');

		// Check results
		const results = component.questionResults;
		expect(results.length).toBe(testStory.questions.length);
		
		results.forEach((result, i) => {
			expect(result.correct).toBe(true);
			expect(result.selectedIndex).toBe(testStory.questions[i].correctIndex);
			expect(result.correctIndex).toBe(testStory.questions[i].correctIndex);
		});
	});

	it('should handle mixed correct/incorrect answers', async () => {
		const { component } = render(StoryPageTest, {
			props: {
				story: testStory
			}
		});

		component.startQuestions();

		// Answer questions with alternating correct/incorrect
		for (let i = 0; i < testStory.questions.length; i++) {
			const question = testStory.questions[i];
			const isCorrect = i % 2 === 0;
			const selectedIndex = isCorrect 
				? question.correctIndex 
				: (question.correctIndex + 1) % question.options.length;
			
			component.handleAnswer(selectedIndex, isCorrect);
		}

		expect(component.gameState).toBe('report');

		const results = component.questionResults;
		const correctCount = results.filter(r => r.correct).length;
		const expectedCorrect = Math.ceil(testStory.questions.length / 2);
		
		expect(correctCount).toBe(expectedCorrect);
	});

	it('should verify correctIndex exists in all story questions', () => {
		stories.forEach((story, storyIdx) => {
			story.questions.forEach((question, qIdx) => {
				expect(
					question.correctIndex,
					`Story ${storyIdx} (${story.id}), Question ${qIdx} (${question.id}) missing correctIndex`
				).toBeDefined();
				
				expect(
					question.correctIndex,
					`Story ${storyIdx} (${story.id}), Question ${qIdx} (${question.id}) has invalid correctIndex: ${question.correctIndex}`
				).toBeGreaterThanOrEqual(0);
				
				expect(
					question.correctIndex,
					`Story ${storyIdx} (${story.id}), Question ${qIdx} (${question.id}) correctIndex ${question.correctIndex} >= options.length ${question.options.length}`
				).toBeLessThan(question.options.length);
			});
		});
	});

	it('should show correct answer in report even if user answered wrong', async () => {
		const { component } = render(StoryPageTest, {
			props: {
				story: testStory
			}
		});

		component.startQuestions();

		// Answer first question incorrectly
		const question = testStory.questions[0];
		const wrongIndex = (question.correctIndex + 1) % question.options.length;
		component.handleAnswer(wrongIndex, false);

		// Answer remaining questions correctly to reach report
		for (let i = 1; i < testStory.questions.length; i++) {
			const q = testStory.questions[i];
			component.handleAnswer(q.correctIndex, true);
		}

		expect(component.gameState).toBe('report');

		const results = component.questionResults;
		const firstResult = results[0];
		
		expect(firstResult.correct).toBe(false);
		expect(firstResult.selectedIndex).toBe(wrongIndex);
		expect(firstResult.correctIndex).toBe(question.correctIndex);
		
		// Verify the correct answer is stored
		expect(firstResult.correctIndex).toBeGreaterThanOrEqual(0);
		expect(firstResult.correctIndex).toBeLessThan(question.options.length);
	});
});
