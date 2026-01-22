<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import {
		loadLessonIndex,
		loadLesson,
		type Lesson,
		type LessonMetadata
	} from '$lib/services/lessonService';
	import { lessonProgress } from '$lib/stores/lessonProgress';
	import { wordKnowledge } from '$lib/stores/wordKnowledge';
	import { tts } from '$lib/services/tts';
	import { ttsSettings } from '$lib/stores/ttsSettings';
	import StepwiseReveal from '$lib/components/shared/StepwiseReveal.svelte';
	import GameContainer from '$lib/components/shared/GameContainer.svelte';
	import BackButton from '$lib/components/shared/BackButton.svelte';
	import GameHeader from '$lib/components/basic/core/GameHeader.svelte';
	import { timedAnswerSettings } from '$lib/stores/timedAnswerSettings';
	import LessonCard from '$lib/components/basic/LessonCard.svelte';
	import WordList from '$lib/components/basic/WordList.svelte';
	import ExamplePhraseList from '$lib/components/basic/ExamplePhraseList.svelte';
	import DictionaryStyleWordList from '$lib/components/basic/DictionaryStyleWordList.svelte';
	import { getAllWords, type Word } from '$lib/data/words';
	import {
		type Sentence
	} from '$lib/services/sentenceLoader';
	import { getExampleSentencesForWords } from '$lib/services/sentenceLookup';
	import GameLengthSelector from '$lib/components/basic/input/GameLengthSelector.svelte';
	import LanguageDirectionSwitch from '$lib/components/basic/input/LanguageDirectionSwitch.svelte';
	import { selectGameWords, recordGameCompletion } from '$lib/services/wordSelection';

	// Game states
	type GameState = 'home' | 'loading' | 'teaching-words' | 'teaching-phrases' | 'quiz' | 'report';
	type LanguageDirection = 'spanish_to_finnish' | 'finnish_to_spanish';
	type QuestionLanguage = 'spanish' | 'finnish';

	let gameState = $state<GameState>('home');
	let selectedGameLength = $state(10);
	let questionLanguage = $state<QuestionLanguage>('spanish');

	// Storage key for language preference
	const QUESTION_LANGUAGE_KEY = 'valitut-sanat_question_language';

	// Lesson data
	let availableLessons = $state<LessonMetadata[]>([]);
	let selectedLesson = $state<Lesson | null>(null);
	let lessonWords = $state<Word[]>([]);
	
	// Example phrases data
	interface WordWithPhrases {
		word: Word;
		phrases: Sentence[];
	}
	let wordsWithPhrases = $state<WordWithPhrases[]>([]);

	// Quiz state
	interface QuizQuestion {
		word: Word;
		direction: 'spanish_to_finnish' | 'finnish_to_spanish';
		prompt: string;
		correctAnswer: string;
		options: string[];
	}
	let quizQuestions = $state<QuizQuestion[]>([]);
	let currentQuestion = $state<QuizQuestion | null>(null);
	let selectedAnswer = $state<string | null>(null);
	let answersRevealed = $state(false);
	let disabledOptions = $state<Set<string>>(new Set());
	let tries = $state(0);
	
	// Game variables
	let score = $state(0);
	let questionIndex = $state(0);
	let totalQuestions = $state(0);
	let wrongWords = $state<Array<{ word: Word; userAnswer: string; correctAnswer: string }>>([]);

	// Grouped lessons by category
	let lessonsByCategory = $derived.by(() => {
		const grouped = new Map<string, LessonMetadata[]>();
		for (const lesson of availableLessons) {
			const category = lesson.categoryName;
			if (!grouped.has(category)) {
				grouped.set(category, []);
			}
			grouped.get(category)!.push(lesson);
		}
		return grouped;
	});

	// Get lesson status
	function getLessonStatus(lessonId: string): 'not-started' | 'in-progress' | 'completed' {
		const progress = lessonProgress.getLessonProgress(lessonId);
		if (!progress) {
			return 'not-started';
		}
		
		// Check if lesson is fully completed (all words scored well)
		const scores = Object.values(progress.wordScores);
		if (scores.length === 0) {
			return 'in-progress';
		}
		
		const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
		return avgScore >= 70 ? 'completed' : 'in-progress';
	}

	// Check if lesson needs review based on spaced repetition
	function needsReview(lessonId: string): boolean {
		const progress = lessonProgress.getLessonProgress(lessonId);
		if (!progress) {
			return false;
		}
		
		const now = new Date();
		const nextReview = new Date(progress.nextReviewAt);
		return nextReview <= now;
	}

	// Calculate next review interval based on performance
	// Intervals: 1 day, 3 days, 7 days, 14 days, 30 days
	function calculateNextReviewInterval(wordScores: Record<string, number>): number {
		const scores = Object.values(wordScores);
		if (scores.length === 0) {
			return 1; // Default to 1 day if no scores
		}
		
		const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
		
		// Determine interval based on average score
		if (avgScore >= 90) {
			return 30; // Excellent: review in 30 days
		} else if (avgScore >= 80) {
			return 14; // Good: review in 14 days
		} else if (avgScore >= 70) {
			return 7; // Fair: review in 7 days
		} else if (avgScore >= 60) {
			return 3; // Needs work: review in 3 days
		} else {
			return 1; // Poor: review in 1 day
		}
	}

	// Get lessons that need review (for prioritization)
	let lessonsDueForReview = $derived.by(() => {
		return availableLessons.filter(lesson => needsReview(lesson.id));
	});

	// Load available lessons on mount
	onMount(async () => {
		try {
			// Load language preference
			if (typeof localStorage !== 'undefined') {
				const savedLang = localStorage.getItem(QUESTION_LANGUAGE_KEY);
				if (savedLang === 'finnish' || savedLang === 'spanish') {
					questionLanguage = savedLang;
				}
			}

			const manifest = await loadLessonIndex();
			availableLessons = manifest.lessons;
		} catch (error) {
			console.error('Failed to load lessons:', error);
		}
	});

	// Handle language direction change
	function handleQuestionLanguageChange(lang: QuestionLanguage) {
		questionLanguage = lang;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(QUESTION_LANGUAGE_KEY, lang);
		}
	}

	// Get Word objects from word IDs
	function getWordsFromIds(wordIds: string[]): Word[] {
		const allWords = getAllWords();
		const wordMap = new Map<string, Word>();
		
		// Create a map for quick lookup by word ID or spanish
		for (const word of allWords) {
			const wordId = word.id ?? word.spanish;
			wordMap.set(wordId, word);
			// Also map by spanish for backwards compatibility
			wordMap.set(word.spanish, word);
		}
		
		// Get words in the order they appear in the lesson
		const words: Word[] = [];
		for (const wordId of wordIds) {
			const word = wordMap.get(wordId);
			if (word) {
				words.push(word);
			}
		}
		
		return words;
	}

	// Start lesson
	async function startLesson(lessonId: string) {
		gameState = 'loading';
		try {
			selectedLesson = await loadLesson(lessonId);
			
			// Load word objects from word IDs
			if (selectedLesson) {
				lessonWords = getWordsFromIds(selectedLesson.words);
			}
			
			gameState = 'teaching-words';
		} catch (error) {
			console.error('Failed to load lesson:', error);
			gameState = 'home';
		}
	}

	// Prepare quiz questions using the word selection algorithm
	async function prepareQuizQuestions(): Promise<QuizQuestion[]> {
		try {
			// Determine direction based on selected language
			const direction: LanguageDirection =
				questionLanguage === 'spanish' ? 'spanish_to_finnish' : 'finnish_to_spanish';

			// Use wordSelection algorithm to select and optimize words from the lesson
			// We use the lesson ID as the category key for history tracking
			const selectedWords = await selectGameWords(
				lessonWords,
				selectedGameLength,
				selectedLesson?.id || 'default',
				direction,
				true // prioritizeFrequency
			);

			// Generate quiz questions from selected words
			const questions: QuizQuestion[] = [];

			for (const word of selectedWords) {
				if (direction === 'spanish_to_finnish') {
					questions.push({
						word,
						direction: 'spanish_to_finnish',
						prompt: word.spanish,
						correctAnswer: word.finnish,
						options: []
					});
				} else {
					questions.push({
						word,
						direction: 'finnish_to_spanish',
						prompt: word.finnish,
						correctAnswer: word.spanish,
						options: []
					});
				}
			}

			// Randomize order
			const shuffled = [...questions].sort(() => Math.random() - 0.5);

			// Generate wrong answer options for each question
			for (const question of shuffled) {
				question.options = generateAnswerOptionsForWord(question, shuffled);
			}

			return shuffled;
		} catch (error) {
			console.error('Error preparing quiz questions:', error);
			// Fallback to simple generation if algorithm fails
			return generateQuizQuestions();
		}
	}

	// Load example phrases for lesson words
	async function loadExamplePhrases() {
		gameState = 'loading';

		try {
			// Get Spanish words from lesson
			const spanishWords = lessonWords.map(w => w.spanish);

			// Load example sentences for all words in batch
			const wordSentencesMap = await getExampleSentencesForWords(spanishWords);

			// Build result with phrases for each word
			const wordsWithPhrasesTemp: WordWithPhrases[] = [];

			for (const word of lessonWords) {
				const phrases = wordSentencesMap.get(word.spanish) || [];
				// Limit to 3 sentences per word for display
				const limitedPhrases = phrases.slice(0, 3);

				wordsWithPhrasesTemp.push({
					word,
					phrases: limitedPhrases
				});
			}

			wordsWithPhrases = wordsWithPhrasesTemp;
			gameState = 'teaching-phrases';
		} catch (error) {
			console.error('Failed to load example phrases:', error);
			// Fall back to teaching-phrases state even if loading fails
			gameState = 'teaching-phrases';
		}
	}

	// Generate quiz questions from lesson words based on selected language direction
	function generateQuizQuestions(): QuizQuestion[] {
		const questions: QuizQuestion[] = [];

		// Determine direction based on selected language
		const direction: 'spanish_to_finnish' | 'finnish_to_spanish' =
			questionLanguage === 'spanish' ? 'spanish_to_finnish' : 'finnish_to_spanish';

		// For each word, create a question in the selected direction
		for (const word of lessonWords) {
			if (direction === 'spanish_to_finnish') {
				questions.push({
					word,
					direction: 'spanish_to_finnish',
					prompt: word.spanish,
					correctAnswer: word.finnish,
					options: [] // Will be populated later
				});
			} else {
				questions.push({
					word,
					direction: 'finnish_to_spanish',
					prompt: word.finnish,
					correctAnswer: word.spanish,
					options: [] // Will be populated later
				});
			}
		}

		// Limit to selectedGameLength questions
		const limited = questions.slice(0, selectedGameLength);

		// Randomize order
		const shuffled = [...limited].sort(() => Math.random() - 0.5);

		// Generate wrong answer options for each question
		for (const question of shuffled) {
			question.options = generateAnswerOptionsForWord(question, shuffled);
		}

		return shuffled;
	}
	
	// Generate 4 answer options (1 correct + 3 wrong)
	function generateAnswerOptionsForWord(question: QuizQuestion, allQuestions: QuizQuestion[]): string[] {
		const correctAnswer = question.correctAnswer;
		const wrongAnswers: string[] = [];

		// Get candidates from other questions with same direction
		const candidates = allQuestions
			.filter(q => q.direction === question.direction && q.correctAnswer !== correctAnswer)
			.map(q => q.correctAnswer);

		// Shuffle and select 3 wrong answers
		const shuffledCandidates = [...candidates].sort(() => Math.random() - 0.5);
		for (let i = 0; i < Math.min(3, shuffledCandidates.length); i++) {
			wrongAnswers.push(shuffledCandidates[i]);
		}

		// If we don't have enough wrong answers, pad with generic ones
		while (wrongAnswers.length < 3) {
			wrongAnswers.push(`[Vaihtoehto ${wrongAnswers.length + 1}]`);
		}

		// Combine and shuffle
		const allOptions = [correctAnswer, ...wrongAnswers];
		return allOptions.sort(() => Math.random() - 0.5);
	}
	
	// Start quiz phase
	async function startQuiz() {
		gameState = 'loading';
		try {
			// Generate questions using word selection algorithm
			quizQuestions = await prepareQuizQuestions();
			totalQuestions = quizQuestions.length;

			// Reset game state
			score = 0;
			questionIndex = 0;
			wrongWords = [];

			// Load first question
			if (quizQuestions.length > 0) {
				loadNextQuizQuestion();
			} else {
				// No questions, skip to report
				gameState = 'report';
			}
		} catch (error) {
			console.error('Error starting quiz:', error);
			gameState = 'teaching-phrases';
		}
	}
	
	// Load next quiz question
	function loadNextQuizQuestion() {
		if (questionIndex >= quizQuestions.length) {
			// Quiz completed - update knowledge stores
			updateKnowledgeStores();
			gameState = 'report';
			return;
		}
		
		currentQuestion = quizQuestions[questionIndex];
		selectedAnswer = null;
		answersRevealed = false;
		disabledOptions = new Set();
		tries = 0;
		
		gameState = 'quiz';
		
		// Auto-speak prompt word if TTS is enabled
		if ($ttsSettings.autoSpeak && currentQuestion) {
			const language = currentQuestion.direction === 'spanish_to_finnish' ? 'spanish' : 'finnish';
			setTimeout(() => {
				if (currentQuestion) {
					if (language === 'spanish') {
						tts.speakSpanish(currentQuestion.prompt);
					} else {
						tts.speakFinnish(currentQuestion.prompt);
					}
				}
			}, 300);
		}
	}
	
	// Handle answer selection
	function handleAnswerSelection(answer: string) {
		if (!currentQuestion) {
			return;
		}

		tries++;

		const isCorrect = answer === currentQuestion.correctAnswer;

		if (isCorrect) {
			// Calculate points based on tries (10 for first try, 3 for second, 1 for third)
			const triesRemaining = 4 - tries; // 3, 2, or 1
			const pointsMap: Record<number, number> = { 3: 10, 2: 3, 1: 1 };
			const pointsEarned = pointsMap[triesRemaining] || 0;

			score += pointsEarned;

			// Determine answer quality for knowledge tracking
			const qualityMap: Record<number, 'first_try' | 'second_try' | 'third_try'> = {
				3: 'first_try',
				2: 'second_try',
				1: 'third_try'
			};
			const answerQuality = qualityMap[triesRemaining] || 'third_try';

			// Record answer to wordKnowledge store
			const wordId = currentQuestion.word.id ?? currentQuestion.word.spanish;
			const direction = currentQuestion.direction === 'spanish_to_finnish'
				? 'spanish_to_finnish' as const
				: 'finnish_to_spanish' as const;
			wordKnowledge.recordAnswer(wordId, currentQuestion.word.finnish, direction, answerQuality, 'basic');

			selectedAnswer = answer;

			// Auto-continue after brief delay
			setTimeout(() => {
				questionIndex++;
				loadNextQuizQuestion();
			}, 1500);
		} else {
			// Wrong answer - disable this option and allow retry
			disabledOptions = new Set([...disabledOptions, answer]);

			// Record wrong attempt if all options (except correct one) are disabled
			const wrongAnswerCount = disabledOptions.size;
			const totalOptions = currentQuestion.options.length;

			if (wrongAnswerCount >= totalOptions - 1) {
				// All wrong answers disabled, show correct answer
				wrongWords = [...wrongWords, {
					word: currentQuestion.word,
					userAnswer: answer,
					correctAnswer: currentQuestion.correctAnswer
				}];

				// Record as wrong answer
				const wordId = currentQuestion.word.id ?? currentQuestion.word.spanish;
				const direction = currentQuestion.direction === 'spanish_to_finnish'
					? 'spanish_to_finnish' as const
					: 'finnish_to_spanish' as const;
				wordKnowledge.recordAnswer(wordId, currentQuestion.word.finnish, direction, 'third_try', 'basic');

				selectedAnswer = currentQuestion.correctAnswer;

				// Move to next question after delay
				setTimeout(() => {
					questionIndex++;
					loadNextQuizQuestion();
				}, 2000);
			}
		}
	}
	
	// Handle answers revealed callback
	function handleAnswersRevealed() {
		answersRevealed = true;
	}
	
	// Get current delay setting for this game
	let currentDelay = $derived(timedAnswerSettings.getDelay('sanapeli'));
	
	// Calculate word scores from quiz results
	function calculateWordScores(): Record<string, number> {
		const wordScores: Record<string, number> = {};
		
		// Calculate score for each word based on quiz performance
		for (const word of lessonWords) {
			const wordId = word.id ?? word.spanish;
			
			// Get all questions for this word
			const wordQuestions = quizQuestions.filter(q => {
				const qWordId = q.word.id ?? q.word.spanish;
				return qWordId === wordId;
			});
			
			// Calculate average score for this word
			let totalPoints = 0;
			let maxPoints = 0;
			
			for (const question of wordQuestions) {
				// Check if this word was answered correctly
				const wasWrong = wrongWords.some(w => {
					const wWordId = w.word.id ?? w.word.spanish;
					return wWordId === wordId;
				});
				
				if (!wasWrong) {
					// Assume first try if not in wrongWords (simplified)
					totalPoints += 10;
				}
				maxPoints += 10;
			}
			
			// Calculate percentage score (0-100)
			const percentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
			wordScores[wordId] = Math.round(percentage);
		}
		
		return wordScores;
	}
	
	// Update knowledge stores after quiz completion
	function updateKnowledgeStores() {
		if (!selectedLesson) {
			return;
		}

		// Calculate word scores
		const wordScores = calculateWordScores();

		// Check if all words scored >80% for extended review interval
		const scores = Object.values(wordScores);
		const allWordsStrong = scores.length > 0 && scores.every(score => score > 80);

		// Calculate review delay
		// If all words >80%, extend the interval by 1.5x
		let reviewDelayDays: number | undefined = undefined;
		if (allWordsStrong) {
			const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
			// Use extended intervals for excellent performance
			if (avgScore >= 90) {
				reviewDelayDays = 45; // 30 * 1.5 = 45 days
			} else {
				reviewDelayDays = 21; // 14 * 1.5 = 21 days
			}
		}

		// Update lessonProgress store with calculated review delay
		lessonProgress.completeLesson(selectedLesson.id, wordScores, reviewDelayDays);

		// Record game completion for word selection history
		recordGameCompletion(quizQuestions.map(q => q.word), selectedLesson.id);
	}
	
	// Play lesson again
	function playAgain() {
		if (selectedLesson) {
			gameState = 'teaching-words';
			score = 0;
			questionIndex = 0;
			wrongWords = [];
		}
	}
	
	// Return to home
	function returnToHome() {
		gameState = 'home';
		selectedLesson = null;
		lessonWords = [];
		wordsWithPhrases = [];
		quizQuestions = [];
		currentQuestion = null;
		score = 0;
		questionIndex = 0;
		wrongWords = [];
	}
</script>

<svelte:head>
	<title>Valitut sanat - Espanjapeli</title>
</svelte:head>

{#if gameState === 'home'}
	<GameContainer gameType="basic" buttonMode="basic" onBack={() => window.location.href = `${base}/`}>
		<div class="card-body p-4 md:p-8">
			<h1 class="text-3xl font-bold mb-6">Valitut sanat</h1>

			<LanguageDirectionSwitch
				direction={questionLanguage}
				onChange={handleQuestionLanguageChange}
			/>

			<GameLengthSelector
				value={selectedGameLength}
				onChange={(length) => selectedGameLength = length}
			/>

			<!-- Spaced Repetition Recommendations -->
			{#if lessonsDueForReview.length > 0}
				<div class="alert alert-warning mb-6">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
					</svg>
					<div>
						<h3 class="font-bold">Aika kerrata!</h3>
						<div class="text-sm">
							{lessonsDueForReview.length} oppituntia odottaa kertausta. Säännöllinen kertaus auttaa muistamaan paremmin.
						</div>
					</div>
				</div>
			{/if}

			<div class="space-y-6">
				{#if availableLessons.length === 0}
					<p class="text-base-content/70">Ladataan oppitunteja...</p>
				{:else}
					{#each Array.from(lessonsByCategory) as [categoryName, lessons]}
						<div class="space-y-3">
							<h2 class="text-xl font-semibold">{categoryName}</h2>
							<div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(calc(33.333% - 1rem), 1fr))">
								{#each lessons as lesson}
									{@const status = getLessonStatus(lesson.id)}
									{@const needsReviewFlag = needsReview(lesson.id)}
									<LessonCard
										{lesson}
										{status}
										needsReview={needsReviewFlag}
										onclick={() => startLesson(lesson.id)}
									/>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</GameContainer>
{:else if gameState === 'loading'}
		<div class="flex items-center justify-center min-h-[50vh]">
			<div class="text-center">
				<div class="loading loading-spinner loading-lg"></div>
				<p class="mt-4">Ladataan oppituntia...</p>
			</div>
		</div>

	{:else if gameState === 'teaching-words'}
		<GameContainer gameType="basic" buttonMode="basic" showBackButton={false}>
			<div class="border-b border-base-200 flex justify-between items-center p-4 shrink-0">
				<h2 class="text-lg font-semibold">Vaihe 1/3: Sanat</h2>
				<button
					onclick={returnToHome}
					class="btn btn-ghost btn-circle btn-sm text-xl"
					title="Lopeta peli"
				>✕</button>
			</div>

			<div class="flex-1 overflow-y-auto p-4 md:p-6">
				<div class="max-w-2xl mx-auto">
					{#if selectedLesson}
						<DictionaryStyleWordList
							words={lessonWords}
							title={selectedLesson.categoryName}
							showTitle={true}
						/>

						<div class="mt-8 flex justify-end">
							<button class="btn btn-primary" onclick={loadExamplePhrases}>
								Jatka
							</button>
						</div>
					{/if}
				</div>
			</div>
		</GameContainer>

	{:else if gameState === 'teaching-phrases'}
		<GameContainer gameType="basic" buttonMode="basic" showBackButton={false}>
			<div class="border-b border-base-200 flex justify-between items-center p-4 shrink-0">
				<h2 class="text-lg font-semibold">Vaihe 2/3: Esimerkit</h2>
				<button
					onclick={returnToHome}
					class="btn btn-ghost btn-circle btn-sm text-xl"
					title="Lopeta peli"
				>✕</button>
			</div>

			<div class="flex-1 overflow-y-auto p-4 md:p-6">
				<div class="max-w-2xl mx-auto">
					{#if wordsWithPhrases.length === 0}
						<p class="text-base-content/70">Ladataan esimerkkejä...</p>
					{:else}
						<ExamplePhraseList {wordsWithPhrases} />

						<div class="mt-8 flex justify-end">
							<button class="btn btn-primary" onclick={startQuiz}>
								Aloita testi
							</button>
						</div>
					{/if}
				</div>
			</div>
		</GameContainer>

	{:else if gameState === 'quiz'}
		<GameContainer gameType="basic" buttonMode="basic" showBackButton={false}>
			<GameHeader
				currentQuestion={questionIndex + 1}
				totalQuestions={totalQuestions}
				score={score}
				onQuit={returnToHome}
			/>

			{#if currentQuestion}
				<div class="flex-1 overflow-y-auto p-4 md:p-6">
					<div class="max-w-2xl mx-auto">
						<div class="card bg-base-200 shadow-lg">
							<div class="card-body">
								<StepwiseReveal delaySeconds={currentDelay} onReveal={handleAnswersRevealed}>
									{#snippet children()}
										<div class="text-center">
											<div class="text-4xl font-bold">
												{currentQuestion.prompt}
											</div>

											<button
												class="btn btn-circle btn-ghost mt-4"
												onclick={() => {
													if (currentQuestion) {
														const language = currentQuestion.direction === 'spanish_to_finnish' ? 'spanish' : 'finnish';
														if (language === 'spanish') {
															tts.speakSpanish(currentQuestion.prompt);
														} else {
															tts.speakFinnish(currentQuestion.prompt);
														}
													}
												}}
											>
												🔊
											</button>
										</div>
									{/snippet}

									{#snippet answers()}
										<div class="space-y-2 mt-6">
											{#each currentQuestion.options as option}
												{@const isDisabled = disabledOptions.has(option)}
												{@const isSelected = selectedAnswer === option}
												{@const isCorrect = option === currentQuestion.correctAnswer}
												{@const showAsCorrect = isSelected && isCorrect}
												{@const showAsWrong = isSelected && !isCorrect}

												<button
													class="w-full p-4 rounded-lg border-2 text-left transition-colors text-lg font-medium"
													class:border-success={showAsCorrect}
													class:border-error={showAsWrong}
													class:border-base-300={!showAsCorrect && !showAsWrong}
													class:bg-success={showAsCorrect}
													class:bg-error={showAsWrong}
													class:bg-base-100={!showAsCorrect && !showAsWrong}
													class:hover:bg-base-200={!isDisabled && !showAsCorrect && !showAsWrong}
													class:opacity-50={isDisabled}
													class:cursor-not-allowed={isDisabled}
													disabled={isDisabled}
													onclick={() => handleAnswerSelection(option)}
												>
													{option}
												</button>
											{/each}
										</div>
									{/snippet}
								</StepwiseReveal>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</GameContainer>

	{:else if gameState === 'report'}
		<GameContainer gameType="basic" buttonMode="basic" showBackButton={false}>
			<div class="card-body p-4 md:p-8">
				<h2 class="text-3xl font-bold mb-4">Oppitunti suoritettu!</h2>
			
			<!-- Score Summary -->
			<div class="card bg-base-200 shadow-xl mb-6">
				<div class="card-body">
					<h3 class="card-title">Tulokset</h3>
					<div class="stats stats-vertical lg:stats-horizontal shadow">
						<div class="stat">
							<div class="stat-title">Pisteet</div>
							<div class="stat-value text-primary">{score}</div>
							<div class="stat-desc">Maksimi: {totalQuestions * 10}</div>
						</div>
						<div class="stat">
							<div class="stat-title">Prosentti</div>
							<div class="stat-value text-secondary">
								{Math.round((score / (totalQuestions * 10)) * 100)}%
							</div>
							<div class="stat-desc">
								{#if (score / (totalQuestions * 10)) >= 0.9}
									Erinomaista! 🎉
								{:else if (score / (totalQuestions * 10)) >= 0.8}
									Hyvää työtä! 👍
								{:else if (score / (totalQuestions * 10)) >= 0.7}
									Hyvin tehty! ✓
								{:else}
									Jatka harjoittelua! 💪
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Words that need more practice -->
			{#if wrongWords.length > 0}
				<div class="card bg-base-100 shadow-xl mb-6">
					<div class="card-body">
						<h3 class="card-title">Sanat, jotka tarvitsevat lisäharjoittelua</h3>
						<div class="space-y-3">
							{#each wrongWords as { word, userAnswer, correctAnswer }}
								<div class="flex flex-col gap-1 p-3 bg-base-200 rounded-lg">
									<div class="flex justify-between items-center">
										<span class="font-semibold">{word.spanish}</span>
										<span class="text-base-content/70">{word.finnish}</span>
									</div>
									<div class="text-sm text-error">
										Vastasit: {userAnswer}
									</div>
									<div class="text-sm text-success">
										Oikea vastaus: {correctAnswer}
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else}
				<div class="alert alert-success mb-6">
					<svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span>Kaikki sanat oikein! Loistavaa! 🌟</span>
				</div>
			{/if}
			
			<!-- Next Review Information -->
			{#if selectedLesson}
				{@const wordScores = calculateWordScores()}
				{@const nextReviewDays = calculateNextReviewInterval(wordScores)}
				{@const nextReviewDate = new Date(Date.now() + nextReviewDays * 24 * 60 * 60 * 1000)}
				
				<div class="card bg-base-100 shadow-xl mb-6">
					<div class="card-body">
						<h3 class="card-title">Seuraava kertaus</h3>
						<p class="text-base-content/70">
							Suosittelemme kertaamaan tämän oppitunnin 
							<span class="font-semibold">{nextReviewDate.toLocaleDateString('fi-FI')}</span>
							({nextReviewDays} päivän kuluttua).
						</p>
						<p class="text-sm text-base-content/60">
							Säännöllinen kertaus auttaa muistamaan sanat paremmin. 
							Palaamme asiaan automaattisesti!
						</p>
					</div>
				</div>
			{/if}
			
			<!-- Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-3">
				<button class="btn btn-primary flex-1" onclick={returnToHome}>
					Takaisin oppitunteihin
				</button>
				<button class="btn btn-outline flex-1" onclick={playAgain}>
					Pelaa uudelleen
				</button>
			</div>
			</div>
		</GameContainer>
	{/if}
