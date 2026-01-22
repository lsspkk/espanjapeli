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
	import { timedAnswerSettings } from '$lib/stores/timedAnswerSettings';
	import LessonCard from '$lib/components/basic/LessonCard.svelte';
	import WordList from '$lib/components/basic/WordList.svelte';
	import ExamplePhraseList from '$lib/components/basic/ExamplePhraseList.svelte';
	import { getAllWords, type Word } from '$lib/data/words';
	import { 
		loadSentenceIndex, 
		loadSentenceGroup,
		type Sentence 
	} from '$lib/services/sentenceLoader';

	// Game states
	type GameState = 'home' | 'loading' | 'teaching-words' | 'teaching-phrases' | 'quiz' | 'report';
	let gameState = $state<GameState>('home');

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
			const manifest = await loadLessonIndex();
			availableLessons = manifest.lessons;
		} catch (error) {
			console.error('Failed to load lessons:', error);
		}
	});

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

	// Load example phrases for lesson words
	async function loadExamplePhrases() {
		gameState = 'loading';
		
		try {
			// Load all sentence groups from Tatoeba
			const manifest = await loadSentenceIndex();
			const allSentences: Sentence[] = [];
			
			// Load all sentence groups
			for (const themeInfo of manifest.themes) {
				const group = await loadSentenceGroup(themeInfo.id);
				allSentences.push(...group.sentences);
			}
			
			// For each word in the lesson, find matching sentences
			const wordsWithPhrasesTemp: WordWithPhrases[] = [];
			
			for (const word of lessonWords) {
				// Find sentences that contain this word (case-insensitive)
				const wordLower = word.spanish.toLowerCase();
				const matchingSentences = allSentences.filter(sentence => {
					const sentenceLower = sentence.spanish.toLowerCase();
					// Match whole word or word with common Spanish punctuation
					const wordPattern = new RegExp(`\\b${wordLower}\\b|\\b${wordLower}[,.:;!?¿¡]`, 'i');
					return wordPattern.test(sentenceLower);
				});
				
				// Limit to 2-3 example sentences per word
				const limitedSentences = matchingSentences.slice(0, 3);
				
				wordsWithPhrasesTemp.push({
					word,
					phrases: limitedSentences
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

	// Generate quiz questions from lesson words
	function generateQuizQuestions(): QuizQuestion[] {
		const questions: QuizQuestion[] = [];
		
		// For each word, create questions in both directions
		for (const word of lessonWords) {
			// Spanish → Finnish
			questions.push({
				word,
				direction: 'spanish_to_finnish',
				prompt: word.spanish,
				correctAnswer: word.finnish,
				options: [] // Will be populated later
			});
			
			// Finnish → Spanish
			questions.push({
				word,
				direction: 'finnish_to_spanish',
				prompt: word.finnish,
				correctAnswer: word.spanish,
				options: [] // Will be populated later
			});
		}
		
		// Randomize order
		const shuffled = [...questions].sort(() => Math.random() - 0.5);
		
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
	function startQuiz() {
		// Generate questions
		quizQuestions = generateQuizQuestions();
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
		if (!currentQuestion || selectedAnswer !== null) {
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
			
			// If all 3 tries used, record as wrong and move on
			if (tries >= 3) {
				wrongWords = [...wrongWords, {
					word: currentQuestion.word,
					userAnswer: answer,
					correctAnswer: currentQuestion.correctAnswer
				}];
				
				// Record as wrong answer (no quality, 0 points)
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

<div class="min-h-screen bg-base-100 p-4">
	{#if gameState === 'home'}
		<div class="max-w-4xl mx-auto">
			<h1 class="text-3xl font-bold mb-4">Valitut sanat</h1>
			<p class="text-lg mb-6">
				Opi sanoja oppitunneilla. Jokaisessa oppitunnissa on sanoja, esimerkkejä ja testi.
			</p>

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
							<div class="grid gap-4 md:grid-cols-2">
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

	{:else if gameState === 'loading'}
		<div class="flex items-center justify-center min-h-[50vh]">
			<div class="text-center">
				<div class="loading loading-spinner loading-lg"></div>
				<p class="mt-4">Ladataan oppituntia...</p>
			</div>
		</div>

	{:else if gameState === 'teaching-words'}
		<div class="max-w-4xl mx-auto">
			<div class="mb-4">
				<button class="btn btn-sm" onclick={returnToHome}>
					← Takaisin
				</button>
			</div>
			<h2 class="text-2xl font-bold mb-4">Sanat</h2>
			<p class="text-base-content/70 mb-4">Vaihe 1/3</p>
			{#if selectedLesson}
				<div class="mb-6">
					<h3 class="text-xl font-semibold mb-2">{selectedLesson.categoryName}</h3>
					<p class="text-base-content/70">{lessonWords.length} sanaa</p>
				</div>
				
				<WordList words={lessonWords} />
				
				<div class="mt-6 flex justify-end">
					<button class="btn btn-primary" onclick={loadExamplePhrases}>
						Jatka →
					</button>
				</div>
			{/if}
		</div>

	{:else if gameState === 'teaching-phrases'}
		<div class="max-w-4xl mx-auto">
			<div class="mb-4">
				<button class="btn btn-sm" onclick={() => gameState = 'teaching-words'}>
					← Takaisin
				</button>
			</div>
			<h2 class="text-2xl font-bold mb-4">Esimerkit</h2>
			<p class="text-base-content/70 mb-4">Vaihe 2/3</p>
			
			{#if wordsWithPhrases.length === 0}
				<p class="text-base-content/70">Ladataan esimerkkejä...</p>
			{:else}
				<ExamplePhraseList {wordsWithPhrases} />
				
				<div class="mt-6 flex justify-between">
					<button class="btn" onclick={() => gameState = 'teaching-words'}>
						← Takaisin
					</button>
					<button class="btn btn-primary" onclick={startQuiz}>
						Aloita testi →
					</button>
				</div>
			{/if}
		</div>

	{:else if gameState === 'quiz'}
		<div class="max-w-4xl mx-auto">
			<!-- Header -->
			<div class="mb-4">
				<div class="flex justify-between items-center">
					<div>
						<h2 class="text-2xl font-bold">Testi</h2>
						<p class="text-base-content/70">Vaihe 3/3</p>
					</div>
					<div class="text-right">
						<div class="text-sm text-base-content/70">
							Kysymys {questionIndex + 1}/{totalQuestions}
						</div>
						<div class="text-lg font-semibold">
							Pisteet: {score}
						</div>
					</div>
				</div>
			</div>
			
			{#if currentQuestion}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<StepwiseReveal delaySeconds={currentDelay} onReveal={handleAnswersRevealed}>
							{#snippet children()}
								<!-- Question prompt -->
								<div class="text-center mb-6">
									<div class="text-3xl font-bold mb-4">
										{currentQuestion.prompt}
									</div>
									
									<!-- TTS button -->
									<button 
										class="btn btn-circle btn-ghost"
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
								
								{#if !answersRevealed}
									<div class="text-center text-base-content/70">
										Odota hetki...
									</div>
								{/if}
							{/snippet}
							
							{#snippet answers()}
								<!-- Answer options -->
								<div class="grid grid-cols-1 gap-3">
									{#each currentQuestion.options as option}
										{@const isDisabled = disabledOptions.has(option)}
										{@const isSelected = selectedAnswer === option}
										{@const isCorrect = option === currentQuestion.correctAnswer}
										{@const showAsCorrect = isSelected && isCorrect}
										{@const showAsWrong = isSelected && !isCorrect}
										
										<button
											class="btn btn-lg justify-start text-left h-auto min-h-[3rem] whitespace-normal"
											class:btn-success={showAsCorrect}
											class:btn-error={showAsWrong}
											class:btn-disabled={isDisabled}
											disabled={isDisabled || selectedAnswer !== null}
											onclick={() => handleAnswerSelection(option)}
										>
											{option}
										</button>
									{/each}
								</div>
								
								<!-- Tries indicator -->
								{#if tries > 0 && selectedAnswer === null}
									<div class="text-center mt-4 text-sm text-base-content/70">
										Yritys {tries}/3
									</div>
								{/if}
							{/snippet}
						</StepwiseReveal>
					</div>
				</div>
			{/if}
		</div>

	{:else if gameState === 'report'}
		<div class="max-w-4xl mx-auto">
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
	{/if}
</div>
