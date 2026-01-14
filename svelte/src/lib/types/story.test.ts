import { describe, it, expect } from 'vitest';
import type { 
	Story, 
	VocabularyWord, 
	DialogueLine, 
	StoryQuestion,
	StoryCategory,
	CulturalNote,
	StoryGameState,
	StoryQuestionResult,
	StoryGameResult
} from './story';
import { difficultyToLevel, migrateStoryToV4 } from './story';

describe('Story Types', () => {
	describe('Story interface', () => {
		it('accepts valid V4 story with CEFR level', () => {
			const story: Story = {
				id: 'test-story',
				title: 'Test Story',
				titleSpanish: 'Historia de Prueba',
				description: 'A test story',
				level: 'A2',
				category: 'shopping',
				icon: '🛒',
				dialogue: [],
				vocabulary: [],
				questions: []
			};

			expect(story.level).toBe('A2');
			expect(story.category).toBe('shopping');
		});

		it('accepts story with optional V4 fields', () => {
			const story: Story = {
				id: 'test-story',
				title: 'Test Story',
				titleSpanish: 'Historia de Prueba',
				description: 'A test story',
				level: 'B1',
				category: 'travel',
				icon: '✈️',
				dialogue: [],
				vocabulary: [],
				questions: [],
				estimatedMinutes: 5,
				wordCount: 150,
				prerequisiteStories: ['story-1', 'story-2'],
				relatedStories: ['story-3'],
				keyGrammar: ['present tense', 'ser vs estar'],
				thumbnailEmoji: '🌍',
				culturalNotes: [
					{
						topic: 'Greetings',
						note: 'In Spain, people often greet with two kisses',
						region: 'spain'
					}
				],
				version: 1,
				createdAt: '2026-01-14',
				updatedAt: '2026-01-14'
			};

			expect(story.estimatedMinutes).toBe(5);
			expect(story.wordCount).toBe(150);
			expect(story.culturalNotes).toHaveLength(1);
		});

		it('accepts story with deprecated difficulty field', () => {
			const story: Story = {
				id: 'test-story',
				title: 'Test Story',
				titleSpanish: 'Historia de Prueba',
				description: 'A test story',
				difficulty: 'beginner',
				level: 'A1',
				category: 'greetings',
				icon: '👋',
				dialogue: [],
				vocabulary: [],
				questions: []
			};

			expect(story.difficulty).toBe('beginner');
			expect(story.level).toBe('A1');
		});

		it('validates CEFR levels', () => {
			const levels: Array<Story['level']> = ['A1', 'A2', 'B1', 'B2'];
			
			levels.forEach(level => {
				const story: Story = {
					id: 'test',
					title: 'Test',
					titleSpanish: 'Test',
					description: 'Test',
					level,
					category: 'food',
					icon: '🍕',
					dialogue: [],
					vocabulary: [],
					questions: []
				};
				
				expect(story.level).toBe(level);
			});
		});

		it('validates story categories', () => {
			const categories: StoryCategory[] = [
				'greetings', 'food', 'shopping', 'travel',
				'health', 'work', 'home', 'social',
				'education', 'nature', 'culture', 'technology',
				'environment', 'entertainment'
			];
			
			categories.forEach(category => {
				const story: Story = {
					id: 'test',
					title: 'Test',
					titleSpanish: 'Test',
					description: 'Test',
					level: 'A2',
					category,
					icon: '📖',
					dialogue: [],
					vocabulary: [],
					questions: []
				};
				
				expect(story.category).toBe(category);
			});
		});
	});

	describe('VocabularyWord interface', () => {
		it('accepts basic vocabulary word', () => {
			const word: VocabularyWord = {
				spanish: 'hola',
				finnish: 'hei'
			};

			expect(word.spanish).toBe('hola');
			expect(word.finnish).toBe('hei');
		});

		it('accepts vocabulary word with V4 metadata', () => {
			const word: VocabularyWord = {
				spanish: 'el perro',
				finnish: 'koira',
				english: 'dog',
				example: 'El perro es grande',
				partOfSpeech: 'noun',
				gender: 'masculine',
				relatedWords: ['perrito', 'perrera'],
				frequencyRank: 500,
				cefrLevel: 'A1'
			};

			expect(word.partOfSpeech).toBe('noun');
			expect(word.gender).toBe('masculine');
			expect(word.frequencyRank).toBe(500);
			expect(word.cefrLevel).toBe('A1');
		});

		it('accepts verb with verb form', () => {
			const word: VocabularyWord = {
				spanish: 'como',
				finnish: 'syön',
				partOfSpeech: 'verb',
				verbForm: 'present tense, first person singular'
			};

			expect(word.verbForm).toBe('present tense, first person singular');
		});

		it('validates part of speech types', () => {
			const partsOfSpeech: Array<VocabularyWord['partOfSpeech']> = [
				'noun', 'verb', 'adjective', 'adverb', 'phrase'
			];
			
			partsOfSpeech.forEach(pos => {
				const word: VocabularyWord = {
					spanish: 'test',
					finnish: 'testi',
					partOfSpeech: pos
				};
				
				expect(word.partOfSpeech).toBe(pos);
			});
		});
	});

	describe('DialogueLine interface', () => {
		it('accepts valid dialogue line', () => {
			const line: DialogueLine = {
				speaker: 'María',
				spanish: 'Hola, ¿cómo estás?',
				finnish: 'Hei, mitä kuuluu?'
			};

			expect(line.speaker).toBe('María');
			expect(line.spanish).toBe('Hola, ¿cómo estás?');
		});
	});

	describe('StoryQuestion interface', () => {
		it('accepts valid question', () => {
			const question: StoryQuestion = {
				id: 'q1',
				question: 'Mikä on Maríán nimi?',
				options: ['María', 'Carmen', 'Isabel', 'Ana'],
				correctIndex: 0
			};

			expect(question.id).toBe('q1');
			expect(question.options).toHaveLength(4);
		});

		it('accepts question with optional fields', () => {
			const question: StoryQuestion = {
				id: 'q1',
				question: 'Mikä on Maríán nimi?',
				questionSpanish: '¿Cómo se llama María?',
				options: ['María', 'Carmen', 'Isabel', 'Ana'],
				correctIndex: 0,
				explanation: 'Tarinan päähenkilö on María'
			};

			expect(question.questionSpanish).toBe('¿Cómo se llama María?');
			expect(question.explanation).toBe('Tarinan päähenkilö on María');
		});
	});

	describe('CulturalNote interface', () => {
		it('accepts cultural note with all fields', () => {
			const note: CulturalNote = {
				topic: 'Greetings',
				note: 'In Spain, people greet with two kisses',
				region: 'spain'
			};

			expect(note.region).toBe('spain');
		});

		it('accepts cultural note without region', () => {
			const note: CulturalNote = {
				topic: 'Siesta',
				note: 'Many shops close in the afternoon'
			};

			expect(note.region).toBeUndefined();
		});

		it('validates region types', () => {
			const regions: Array<CulturalNote['region']> = ['spain', 'latin-america', 'all'];
			
			regions.forEach(region => {
				const note: CulturalNote = {
					topic: 'Test',
					note: 'Test note',
					region
				};
				
				expect(note.region).toBe(region);
			});
		});
	});

	describe('StoryGameState type', () => {
		it('validates game states', () => {
			const states: StoryGameState[] = ['home', 'reading', 'vocabulary', 'questions', 'report'];
			
			states.forEach(state => {
				const gameState: StoryGameState = state;
				expect(gameState).toBe(state);
			});
		});
	});

	describe('StoryQuestionResult interface', () => {
		it('accepts valid question result', () => {
			const result: StoryQuestionResult = {
				questionId: 'q1',
				correct: true,
				selectedIndex: 0,
				correctIndex: 0,
				attempts: 1
			};

			expect(result.correct).toBe(true);
			expect(result.attempts).toBe(1);
		});
	});

	describe('StoryGameResult interface', () => {
		it('accepts valid game result', () => {
			const result: StoryGameResult = {
				storyId: 'test-story',
				questionResults: [
					{
						questionId: 'q1',
						correct: true,
						selectedIndex: 0,
						correctIndex: 0,
						attempts: 1
					}
				],
				totalCorrect: 1,
				totalQuestions: 1,
				completedAt: new Date()
			};

			expect(result.totalCorrect).toBe(1);
			expect(result.totalQuestions).toBe(1);
		});
	});

	describe('Migration utilities', () => {
		describe('difficultyToLevel', () => {
			it('converts beginner to A2', () => {
				expect(difficultyToLevel('beginner')).toBe('A2');
			});

			it('converts intermediate to B1', () => {
				expect(difficultyToLevel('intermediate')).toBe('B1');
			});

			it('converts advanced to B1', () => {
				expect(difficultyToLevel('advanced')).toBe('B1');
			});
		});

		describe('migrateStoryToV4', () => {
			it('converts difficulty to level', () => {
				const oldStory: Story = {
					id: 'old-story',
					title: 'Old Story',
					titleSpanish: 'Historia Vieja',
					description: 'An old story',
					difficulty: 'beginner',
					level: 'A1', // Will be overridden
					category: 'food',
					icon: '🍕',
					dialogue: [],
					vocabulary: [],
					questions: []
				};

				const migrated = migrateStoryToV4(oldStory);
				expect(migrated.level).toBe('A2');
			});

			it('sets level from difficulty when level is missing', () => {
				const oldStory: Story = {
					id: 'old-story',
					title: 'Old Story',
					titleSpanish: 'Historia Vieja',
					description: 'An old story',
					difficulty: 'intermediate',
					level: 'A1', // Required by type but will be overridden
					category: 'travel',
					icon: '✈️',
					dialogue: [],
					vocabulary: [],
					questions: []
				};

				// Remove level to simulate old story
				const storyWithoutLevel = { ...oldStory };
				delete (storyWithoutLevel as any).level;

				const migrated = migrateStoryToV4(storyWithoutLevel as Story);
				expect(migrated.level).toBe('B1');
			});

			it('defaults to A2 when no difficulty or level', () => {
				const oldStory: Story = {
					id: 'old-story',
					title: 'Old Story',
					titleSpanish: 'Historia Vieja',
					description: 'An old story',
					level: 'A1', // Required by type
					category: 'food',
					icon: '🍕',
					dialogue: [],
					vocabulary: [],
					questions: []
				};

				// Remove level to simulate missing data
				const storyWithoutLevel = { ...oldStory };
				delete (storyWithoutLevel as any).level;

				const migrated = migrateStoryToV4(storyWithoutLevel as Story);
				expect(migrated.level).toBe('A2');
			});

			it('adds version metadata', () => {
				const oldStory: Story = {
					id: 'old-story',
					title: 'Old Story',
					titleSpanish: 'Historia Vieja',
					description: 'An old story',
					level: 'A2',
					category: 'food',
					icon: '🍕',
					dialogue: [],
					vocabulary: [],
					questions: []
				};

				const migrated = migrateStoryToV4(oldStory);
				expect(migrated.version).toBe(1);
			});

			it('adds createdAt and updatedAt dates', () => {
				const oldStory: Story = {
					id: 'old-story',
					title: 'Old Story',
					titleSpanish: 'Historia Vieja',
					description: 'An old story',
					level: 'A2',
					category: 'food',
					icon: '🍕',
					dialogue: [],
					vocabulary: [],
					questions: []
				};

				const migrated = migrateStoryToV4(oldStory);
				expect(migrated.createdAt).toBeDefined();
				expect(migrated.updatedAt).toBeDefined();
				expect(migrated.createdAt).toBe(migrated.updatedAt);
			});

			it('calculates word count from dialogue', () => {
				const oldStory: Story = {
					id: 'old-story',
					title: 'Old Story',
					titleSpanish: 'Historia Vieja',
					description: 'An old story',
					level: 'A2',
					category: 'food',
					icon: '🍕',
					dialogue: [
						{
							speaker: 'María',
							spanish: 'Hola, ¿cómo estás?',
							finnish: 'Hei, mitä kuuluu?'
						},
						{
							speaker: 'Juan',
							spanish: 'Muy bien, gracias.',
							finnish: 'Hyvin, kiitos.'
						}
					],
					vocabulary: [],
					questions: []
				};

				const migrated = migrateStoryToV4(oldStory);
				expect(migrated.wordCount).toBe(6); // "Hola, ¿cómo estás?" (3) + "Muy bien, gracias." (3)
			});

			it('calculates estimated reading time', () => {
				const oldStory: Story = {
					id: 'old-story',
					title: 'Old Story',
					titleSpanish: 'Historia Vieja',
					description: 'An old story',
					level: 'A2',
					category: 'food',
					icon: '🍕',
					dialogue: [
						{
							speaker: 'María',
							spanish: 'Hola, ¿cómo estás? Yo estoy muy bien hoy.',
							finnish: 'Hei, mitä kuuluu?'
						}
					],
					vocabulary: [],
					questions: []
				};

				const migrated = migrateStoryToV4(oldStory);
				// 8 words at 150 words/min = 1 minute (rounded up)
				expect(migrated.estimatedMinutes).toBe(1);
			});

			it('preserves existing V4 fields', () => {
				const oldStory: Story = {
					id: 'old-story',
					title: 'Old Story',
					titleSpanish: 'Historia Vieja',
					description: 'An old story',
					level: 'B1',
					category: 'food',
					icon: '🍕',
					dialogue: [],
					vocabulary: [],
					questions: [],
					version: 2,
					createdAt: '2025-01-01',
					updatedAt: '2025-06-01',
					wordCount: 200,
					estimatedMinutes: 3
				};

				const migrated = migrateStoryToV4(oldStory);
				expect(migrated.version).toBe(2);
				expect(migrated.createdAt).toBe('2025-01-01');
				expect(migrated.updatedAt).toBe('2025-06-01');
				expect(migrated.wordCount).toBe(200);
				expect(migrated.estimatedMinutes).toBe(3);
			});

			it('does not mutate original story', () => {
				const oldStory: Story = {
					id: 'old-story',
					title: 'Old Story',
					titleSpanish: 'Historia Vieja',
					description: 'An old story',
					difficulty: 'beginner',
					level: 'A1',
					category: 'food',
					icon: '🍕',
					dialogue: [],
					vocabulary: [],
					questions: []
				};

				const migrated = migrateStoryToV4(oldStory);
				expect(oldStory.version).toBeUndefined();
				expect(migrated.version).toBe(1);
			});
		});
	});
});
