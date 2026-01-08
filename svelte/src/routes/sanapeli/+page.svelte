<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { tts } from '$lib/services/tts';
	import { checkAnswer } from '$lib/services/answerChecker';
	import { 
		generateTip, 
		getPointsForTips, 
		getTipDifficultyName,
		type Tip 
	} from '$lib/services/tipService';
	import { 
		autoSpeak, 
		compactMode, 
		category, 
		gameLength, 
		gameHistory,
		type QuestionResult 
	} from '$lib/stores/progress';
	import { theme, availableThemes, type Theme } from '$lib/stores/theme';
	import { 
		getAllWords, 
		getWordsFromCategory, 
		getCategoryKeys, 
		getCategoryName,
		type Word 
	} from '$lib/data/words';
	import { getRandomCongratulation, getRandomSympathy } from '$lib/data/messages';
	import { 
		getCategoriesByLearningOrder, 
		getCategoryMetadata,
		getTierEmoji,
		type CategoryWithKey 
	} from '$lib/data/categoryConfig';
	import { 
		selectGameWords, 
		recordGameCompletion, 
		getPreviousGames 
	} from '$lib/services/wordSelection';

	// Game states
	type GameState = 'home' | 'playing' | 'answered' | 'report';
	let gameState: GameState = 'home';

	// Game variables
	let currentWord: Word | null = null;
	let currentQuestionNumber = 0;
	let tipsShown = 0;
	let totalScore = 0;
	let wordQueue: Word[] = [];
	let gameQuestions: QuestionResult[] = [];
	let currentQuestionData: QuestionResult | null = null;

	// Sanakirja state
	let showSanakirja = false;
	let upcomingWords: Word[] = [];
	let previousGames: Word[][] = [];

	// Category picker modal state
	let showCategoryPicker = false;

	// Reading-all state
	let readingAll = false;
	let readingProgress = 0;
	let readingTotal = 0;
	let cancelReading = false;

	// UI state
	let userAnswer = '';
	let possiblePoints = 10;
	let resultMessage = '';
	let resultIsCorrect = false;
	let pointsEarned = 0;

	// Tip state
	let shownTips: Tip[] = [];
	let activeTipTab = 0;

	// Settings (bound to stores)
	let selectedCategory: string;
	let selectedGameLength: number;
	let isAutoSpeakEnabled: boolean;
	let isCompactModeEnabled: boolean;
	let selectedTheme: Theme;

	// Subscribe to stores
	category.subscribe(value => selectedCategory = value);
	gameLength.subscribe(value => selectedGameLength = value);
	autoSpeak.subscribe(value => isAutoSpeakEnabled = value);
	compactMode.subscribe(value => isCompactModeEnabled = value);
	theme.subscribe(value => selectedTheme = value);

	/**
	 * Shuffle array using Fisher-Yates algorithm
	 */
	function shuffleArray<T>(array: T[]): T[] {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	/**
	 * Spread out duplicate words to be at least minDistance apart
	 */
	function spreadOutDuplicates(words: Word[], minDistance = 5): Word[] {
		const result = [...words];
		const wordPositions = new Map<string, number[]>();
		
		// Build initial position map
		result.forEach((word, index) => {
			if (!wordPositions.has(word.spanish)) {
				wordPositions.set(word.spanish, []);
			}
			wordPositions.get(word.spanish)!.push(index);
		});
		
		// For each word that appears multiple times
		for (const [spanish, positions] of wordPositions.entries()) {
			if (positions.length <= 1) continue;
			
			// Try to spread out duplicates
			for (let i = 1; i < positions.length; i++) {
				const currentPos = positions[i];
				const prevPos = positions[i - 1];
				
				if (currentPos - prevPos < minDistance) {
					// Look for a swap position that's far enough from all instances
					for (let newPos = prevPos + minDistance; newPos < result.length; newPos++) {
						const farEnough = positions.every((pos, idx) => {
							if (idx >= i) return true;
							return Math.abs(newPos - pos) >= minDistance;
						});
						
						const wordAtNewPos = result[newPos];
						const newPosInstances = wordPositions.get(wordAtNewPos.spanish) || [];
						const wouldCreateProblem = newPosInstances.some(pos => 
							pos !== newPos && Math.abs(currentPos - pos) < minDistance
						);
						
						if (farEnough && !wouldCreateProblem) {
							[result[currentPos], result[newPos]] = [result[newPos], result[currentPos]];
							positions[i] = newPos;
							const otherPositions = wordPositions.get(wordAtNewPos.spanish);
							if (otherPositions) {
								const otherIdx = otherPositions.indexOf(newPos);
								if (otherIdx !== -1) {
									otherPositions[otherIdx] = currentPos;
								}
							}
							break;
						}
					}
				}
			}
		}
		
		return result;
	}

	/**
	 * Get available words based on selected category
	 */
	function getAvailableWords(): Word[] {
		if (selectedCategory === 'all') {
			return getAllWords();
		}
		return getWordsFromCategory(selectedCategory);
	}

	/**
	 * Prepare words for the next game using intelligent selection
	 */
	function prepareNextGameWords() {
		const availableWords = getAvailableWords();
		upcomingWords = selectGameWords(availableWords, selectedGameLength, selectedCategory);
		console.log(`📚 Prepared ${upcomingWords.length} words for next game`);
	}

	/**
	 * Generate a randomized queue of words for the entire game
	 * Uses the prepared upcomingWords if available, otherwise falls back to random selection
	 */
	function generateWordQueue(questionsNeeded: number): Word[] {
		console.log(`🔀 Generating word queue for ${questionsNeeded} questions...`);
		
		// If upcomingWords are prepared and match the needed count, use them
		if (upcomingWords.length === questionsNeeded) {
			const queue = spreadOutDuplicates([...upcomingWords], 5);
			console.log(`   ✅ Using prepared words (${queue.length} words)`);
			return queue;
		}
		
		// Otherwise, generate fresh using the word selection service
		const availableWords = getAvailableWords();
		console.log(`   Available words in category: ${availableWords.length}`);
		
		const selectedWords = selectGameWords(availableWords, questionsNeeded, selectedCategory);
		
		// Spread out duplicates to be at least 5 questions apart
		const finalQueue = spreadOutDuplicates(selectedWords, 5);
		
		console.log(`   ✅ Generated queue with ${finalQueue.length} words`);
		return finalQueue;
	}

	/**
	 * Start a new game
	 */
	function startGame() {
		console.log('🎮 Starting new game');
		
		// Close sanakirja if open
		showSanakirja = false;
		
		// Reset game state
		totalScore = 0;
		currentQuestionNumber = 0;
		gameQuestions = [];
		
		// Ensure words are prepared for this game
		if (upcomingWords.length !== selectedGameLength) {
			prepareNextGameWords();
		}
		
		// Generate word queue from prepared words
		wordQueue = generateWordQueue(selectedGameLength);
		
		// Start first question
		nextQuestion();
	}

	/**
	 * Start next question
	 */
	function nextQuestion() {
		if (currentQuestionNumber >= selectedGameLength) {
			showGameReport();
			return;
		}

		// Get next word from queue
		currentWord = wordQueue.shift() || null;
		
		if (!currentWord) {
			console.error('❌ No more words in queue!');
			return;
		}

		currentQuestionNumber++;
		console.log(`📖 Question ${currentQuestionNumber}/${selectedGameLength}: ${currentWord.spanish}`);

		// Reset question state
		tipsShown = 0;
		shownTips = [];
		activeTipTab = 0;
		userAnswer = '';
		possiblePoints = 10;
		
		// Initialize question data
		currentQuestionData = {
			questionNumber: currentQuestionNumber,
			spanish: currentWord.spanish,
			finnish: currentWord.finnish,
			english: currentWord.english || '',
			userAnswer: '',
			isCorrect: false,
			pointsEarned: 0,
			maxPoints: 10,
			tipsRequested: 0,
			tipsShown: []
		};

		// Change to playing state
		gameState = 'playing';

		// Speak the word if auto-speak is enabled
		if (isAutoSpeakEnabled && currentWord) {
			setTimeout(() => {
				tts.speakSpanish(currentWord!.spanish);
			}, 300);
		}
	}

	/**
	 * Speak current word again
	 */
	function speakCurrentWord() {
		if (currentWord) {
			tts.speakSpanish(currentWord.spanish);
		}
	}

	/**
	 * Show next tip
	 */
	async function showNextTip() {
		if (!currentWord || tipsShown >= 3) {
			return;
		}

		// Generate tips for current difficulty level (with Spanish word for cache lookup)
		const difficulty = getTipDifficultyName(tipsShown);
		const tips = await generateTip(currentWord.finnish, difficulty, currentWord.spanish);
		
		// Add all tips to shown tips
		shownTips = [...shownTips, ...tips];
		
		// Update active tab and tips shown
		activeTipTab = tipsShown;
		tipsShown++;

		// Update question data
		if (currentQuestionData) {
			currentQuestionData.tipsRequested = tipsShown;
			currentQuestionData.tipsShown.push(difficulty);
		}

		// Update points
		possiblePoints = getPointsForTips(tipsShown);
		
		const cacheStatus = tips[0]?.fromCache ? '(cached)' : '(generated)';
		console.log(`💡 Tip ${tipsShown} shown ${cacheStatus}: ${tips.length} tip(s) (${possiblePoints} points remaining)`);
	}

	/**
	 * Submit answer
	 */
	function submitAnswer() {
		if (!currentWord || !currentQuestionData) return;

		const correctAnswer = currentWord.finnish;
		
		// Get all Finnish words for validation
		const allWords = getAllWords();
		const allFinnishWords = allWords.map(w => w.finnish);
		
		const result = checkAnswer(userAnswer, correctAnswer, allFinnishWords);
		
		// Calculate points
		const pointsMap = [10, 5, 1, 1];
		const earned = result.isCorrect ? pointsMap[tipsShown] : 0;

		// Update question data
		currentQuestionData.userAnswer = userAnswer;
		currentQuestionData.isCorrect = result.isCorrect;
		currentQuestionData.pointsEarned = earned;
		
		// Add to game questions
		gameQuestions.push({ ...currentQuestionData });

		// Update score
		if (result.isCorrect) {
			totalScore += earned;
		}

		// Show result
		resultIsCorrect = result.isCorrect;
		pointsEarned = earned;
		resultMessage = result.isCorrect ? getRandomCongratulation() : getRandomSympathy();
		
		// Log if rejected because it's a different word
		if (result.matchType === 'different-word') {
			console.log(`❌ Answer "${userAnswer}" rejected: it's a different valid word`);
		}
		
		gameState = 'answered';
	}

	/**
	 * Show game report
	 */
	function showGameReport() {
		gameState = 'report';

		// Record game completion for word selection history
		recordGameCompletion(upcomingWords, selectedCategory);

		// Prepare words for next game
		prepareNextGameWords();

		// Calculate statistics
		const correctCount = gameQuestions.filter(q => q.isCorrect).length;
		const incorrectCount = gameQuestions.filter(q => !q.isCorrect).length;
		const accuracy = Math.round((correctCount / selectedGameLength) * 100);
		const maxPossibleScore = selectedGameLength * 10;

		// Save to game history
		const categoryName = selectedCategory === 'all' ? 'Kaikki sanat' : getCategoryName(selectedCategory);
		gameHistory.add({
			gameType: 'spanish-to-finnish',
			category: selectedCategory,
			categoryName: categoryName,
			gameLength: selectedGameLength,
			totalScore: totalScore,
			maxPossibleScore: maxPossibleScore,
			summary: {
				correctCount,
				incorrectCount,
				accuracy
			},
			questions: gameQuestions
		});

		console.log('💾 Game result saved to history');
	}

	/**
	 * Go back to home screen
	 */
	function goHome() {
		gameState = 'home';
	}

	/**
	 * Handle category change
	 */
	function handleCategoryChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedCategory = target.value;
		category.set(selectedCategory);
		// Re-prepare words for new category
		prepareNextGameWords();
	}

	/**
	 * Select a category from the picker modal
	 */
	function selectCategory(categoryKey: string) {
		selectedCategory = categoryKey;
		category.set(selectedCategory);
		showCategoryPicker = false;
		// Re-prepare words for new category
		prepareNextGameWords();
	}

	/**
	 * Toggle category picker modal
	 */
	function toggleCategoryPicker() {
		showCategoryPicker = !showCategoryPicker;
	}

	/**
	 * Get the display name for current category
	 */
	function getCurrentCategoryDisplay(): { emoji: string; name: string } {
		if (selectedCategory === 'all') {
			return { emoji: '📚', name: 'Kaikki sanat' };
		}
		const cat = categories.find(c => c.key === selectedCategory);
		return cat ? { emoji: cat.emoji, name: cat.name } : { emoji: '📚', name: 'Valitse kategoria' };
	}

	$: currentCategoryDisplay = getCurrentCategoryDisplay();

	/**
	 * Handle game length change
	 */
	function handleGameLengthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedGameLength = parseInt(target.value);
		gameLength.set(selectedGameLength);
		// Re-prepare words for new game length
		prepareNextGameWords();
	}

	/**
	 * Handle auto-speak toggle
	 */
	function handleAutoSpeakChange(event: Event) {
		const target = event.target as HTMLInputElement;
		isAutoSpeakEnabled = target.checked;
		autoSpeak.set(isAutoSpeakEnabled);
	}

	/**
	 * Handle compact mode toggle
	 */
	function handleCompactModeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		isCompactModeEnabled = target.checked;
		compactMode.set(isCompactModeEnabled);
	}

	/**
	 * Handle theme change
	 */
	function handleThemeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedTheme = target.value as Theme;
		theme.set(selectedTheme);
	}

	/**
	 * Toggle Sanakirja modal
	 */
	function toggleSanakirja() {
		showSanakirja = !showSanakirja;
		
		if (showSanakirja) {
			// Load previous games when opening
			const availableWords = getAvailableWords();
			previousGames = getPreviousGames(selectedCategory, availableWords, 3);
		}
	}

	/**
	 * Speak a word in Spanish and Finnish using TTS
	 */
	function getVoiceFor(langPrefix: string): SpeechSynthesisVoice | null {
		const voices = window.speechSynthesis.getVoices();
		if (!voices || voices.length === 0) return null;
		return voices.find(v => v.lang && v.lang.startsWith(langPrefix)) || voices.find(v => v.lang && v.lang.includes(langPrefix)) || null;
	}

	function speakWord(spanish: string, finnish: string) {
		const esVoice = getVoiceFor('es');
		const fiVoice = getVoiceFor('fi');

		const spanishUtterance = new SpeechSynthesisUtterance(spanish);
		spanishUtterance.lang = 'es-ES';
		if (esVoice) spanishUtterance.voice = esVoice;
		spanishUtterance.rate = 1.0;

		spanishUtterance.onend = () => {
			const finnishUtterance = new SpeechSynthesisUtterance(finnish);
			finnishUtterance.lang = 'fi-FI';
			if (fiVoice) finnishUtterance.voice = fiVoice;
			finnishUtterance.rate = 1.0;
			window.speechSynthesis.speak(finnishUtterance);
		};

		window.speechSynthesis.speak(spanishUtterance);
	}

	/**
	 * Speak a spanish+finnish pair and return a promise that resolves when done
	 */
	function speakPair(spanish: string, finnish: string) {
		return new Promise<void>((resolve) => {
			if (cancelReading) return resolve();
			const esVoice = getVoiceFor('es');
			const fiVoice = getVoiceFor('fi');

			const spanishUtterance = new SpeechSynthesisUtterance(spanish);
			spanishUtterance.lang = 'es-ES';
			if (esVoice) spanishUtterance.voice = esVoice;
			spanishUtterance.rate = 1.0;

			spanishUtterance.onend = () => {
				if (cancelReading) return resolve();
				const finnishUtterance = new SpeechSynthesisUtterance(finnish);
				finnishUtterance.lang = 'fi-FI';
				if (fiVoice) finnishUtterance.voice = fiVoice;
				finnishUtterance.rate = 1.0;
				finnishUtterance.onend = () => resolve();
				window.speechSynthesis.speak(finnishUtterance);
			};

			window.speechSynthesis.speak(spanishUtterance);
		});
	}

	function getSanakirjaWords(): Word[] {
		// Combine upcoming words and all previousGames words into a single list
		const prev = previousGames.flat ? previousGames.flat() : ([] as Word[]).concat(...previousGames);
		return [...upcomingWords, ...prev];
	}

	async function startReadAll() {
		const list = getSanakirjaWords();
		if (!list || list.length === 0) return;
		readingTotal = list.length;
		readingProgress = 0;
		cancelReading = false;
		readingAll = true;

		for (let i = 0; i < list.length; i++) {
			if (cancelReading) break;
			readingProgress = i + 1;
			try {
				await speakPair(list[i].spanish, list[i].finnish);
			} catch (e) {
				// ignore and continue
			}
			// pause between words
			if (cancelReading) break;
			await new Promise(r => setTimeout(r, 500));
		}

		readingAll = false;
		cancelReading = false;
	}

	function cancelReadAll() {
		cancelReading = true;
		window.speechSynthesis.cancel();
		readingAll = false;
		readdingResetTimeout();
	}

	// small helper to reset progress after cancel to avoid leaving stale numbers
	function readdingResetTimeout() {
		setTimeout(() => {
			readingProgress = 0;
			readingTotal = 0;
		}, 200);
	}

	/**
	 * Handle form submission (Enter key)
	 */
	function handleSubmit(event: Event) {
		event.preventDefault();
		if (gameState === 'playing' && userAnswer.trim()) {
			submitAnswer();
		}
	}

	// Get categories for dropdown (sorted by learning order)
	let categories: { key: string; name: string; emoji: string; tooltip: string; tier: number }[] = [];
	onMount(() => {
		const orderedCategories = getCategoriesByLearningOrder();
		categories = [
			{ key: 'all', name: 'Kaikki sanat', emoji: '📚', tooltip: 'Kaikki sanat kaikista kategorioista', tier: 0 },
			...orderedCategories.map(cat => ({
				key: cat.key,
				name: getCategoryName(cat.key),
				emoji: getTierEmoji(cat.tier),
				tooltip: `${cat.description} (${cat.cefrLevel})`,
				tier: cat.tier
			}))
		];

		// Prepare words for the next game
		prepareNextGameWords();
	});

	// Format message with line break
	function formatMessage(msg: string): { spanish: string; finnish: string } {
		const [spanish, finnish] = msg.split(' | ');
		return { spanish, finnish };
	}

	$: formattedResultMessage = formatMessage(resultMessage || '');
	$: wrongAnswers = gameQuestions.filter(q => !q.isCorrect);
	$: correctCount = gameQuestions.filter(q => q.isCorrect).length;
	$: accuracy = selectedGameLength > 0 ? Math.round((correctCount / selectedGameLength) * 100) : 0;
	$: maxPossibleScore = selectedGameLength * 10;
	$: scorePercentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
</script>

<!-- HOME STATE -->
{#if gameState === 'home'}
	<div class="min-h-screen bg-base-200 flex items-center justify-center p-0 md:p-4">
		<div class="card bg-base-100 shadow-xl w-full md:max-w-2xl min-h-screen md:min-h-0">
			<div class="card-body p-4 md:p-8">
				<h1 class="text-3xl font-bold text-center text-primary mb-3">🇪🇸 Espanjapeli 🇫🇮</h1>
				<a href="{base}/" class="btn btn-ghost btn-md self-center mb-4">← Takaisin</a>

				<!-- Category Selection -->
				<div class="form-control mb-4">
					<label class="label">
						<span class="label-text font-semibold text-lg">Valitse kategoria:</span>
					</label>
					<button 
						class="btn btn-outline btn-lg w-full justify-between text-left font-normal"
						on:click={toggleCategoryPicker}
					>
						<span class="flex items-center gap-2">
							<span>{currentCategoryDisplay.emoji}</span>
							<span>{currentCategoryDisplay.name}</span>
						</span>
						<span class="text-base-content/50">▼</span>
					</button>
				</div>

				<!-- Game Length -->
				<div class="form-control mb-4">
					<label class="label">
						<span class="label-text font-semibold text-lg">Kysymyksiä:</span>
					</label>
					<div class="flex gap-4">
						<label class="label cursor-pointer gap-2">
							<input 
								type="radio" 
								name="game-length" 
								value="10" 
								class="radio radio-primary"
								checked={selectedGameLength === 10}
								on:change={handleGameLengthChange}
							/>
							<span class="label-text text-base">10</span>
						</label>
						<label class="label cursor-pointer gap-2">
							<input 
								type="radio" 
								name="game-length" 
								value="21" 
								class="radio radio-primary"
								checked={selectedGameLength === 21}
								on:change={handleGameLengthChange}
							/>
							<span class="label-text text-base">21</span>
						</label>
						<label class="label cursor-pointer gap-2">
							<input 
								type="radio" 
								name="game-length" 
								value="42" 
								class="radio radio-primary"
								checked={selectedGameLength === 42}
								on:change={handleGameLengthChange}
							/>
							<span class="label-text text-base">42</span>
						</label>
					</div>
				</div>

				<!-- Auto-speak -->
				<div class="form-control mb-2">
					<label class="label cursor-pointer justify-start gap-3">
						<input 
							type="checkbox" 
							class="checkbox checkbox-primary"
							checked={isAutoSpeakEnabled}
							on:change={handleAutoSpeakChange}
						/>
						<span class="label-text">Lue sanat ääneen automaattisesti</span>
					</label>
				</div>

				<!-- Compact mode -->
				<div class="form-control mb-6">
					<label class="label cursor-pointer justify-start gap-3">
						<input 
							type="checkbox" 
							class="checkbox checkbox-primary"
							checked={isCompactModeEnabled}
					on:change={handleCompactModeChange}
				/>
				<span class="label-text">Pieni näyttö (50vh)</span>
			</label>
		</div>

		<!-- Theme Selection -->
		<div class="form-control mb-4">
			<label class="label" for="theme-select">
				<span class="label-text font-semibold text-lg">Väriteema:</span>
			</label>
			<select 
				id="theme-select"
				class="select select-bordered w-full"
				bind:value={selectedTheme}
				on:change={handleThemeChange}
			>
				{#each availableThemes as themeOption}
					<option value={themeOption.value}>
						{themeOption.emoji} {themeOption.name}
					</option>
				{/each}
			</select>
		</div>

		<!-- Action Buttons -->
		<div class="flex gap-3">
			<button 
				class="btn btn-outline flex-shrink-0 btn-lg"
				on:click={toggleSanakirja}
			>
				📖 Sanakirja
			</button>
			<button class="btn btn-primary btn-lg flex-1" on:click={startGame}>
				Aloita
			</button>
		</div>
			</div>

			{#if readingAll}
				<div class="fixed inset-0 z-60 flex items-center justify-center pointer-events-none">
					<div class="bg-base-200 p-4 rounded shadow-sm pointer-events-auto w-full max-w-sm text-center">
						<p class="font-medium">Luetaan {readingTotal} sanaa</p>
						<p class="text-sm mt-2">{readingProgress}/{readingTotal}</p>
						<div class="mt-4">
							<button class="btn btn-ghost" on:click={cancelReadAll}>Keskeytä</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Sanakirja Modal -->
	{#if showSanakirja}
		<div 
			class="fixed inset-0 bg-neutral/50 z-50" 
			on:click={toggleSanakirja}
			on:keydown={(e) => e.key === 'Escape' && toggleSanakirja()}
			role="button"
			tabindex="0"
		>
			<div 
				class="bg-base-100 w-full h-full sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:shadow-xl overflow-hidden"
				on:click|stopPropagation
				on:keydown|stopPropagation
				role="dialog"
				aria-modal="true"
			>
				<!-- Header -->
				<div class="bg-primary text-primary-content p-4 flex items-center justify-between">
					<h2 class="text-xl font-bold">📖 Sanakirja</h2>
					<div class="flex items-center gap-2">
						<button class="btn btn-ghost btn-sm text-primary-content" on:click={startReadAll} title="Lue kaikki">🔊</button>
						<button class="btn btn-ghost btn-sm btn-circle text-primary-content" on:click={toggleSanakirja}>✕</button>
					</div>
				</div>

				<!-- Content -->
				<div class="overflow-y-auto h-[calc(100vh-64px)] sm:h-auto sm:max-h-[calc(90vh-64px)] p-4">
					<!-- Upcoming Words Section Header -->
					<div class="bg-secondary/20 border border-secondary/30 rounded p-2 mb-3">
						<p class="text-sm font-medium text-center text-secondary">
							Seuraavan pelin sanat ({upcomingWords.length})
						</p>
					</div>

					<!-- Upcoming Words -->
					{#if upcomingWords.length > 0}
						<div class="space-y-1 mb-4">
							{#each upcomingWords as word}
								<div class="flex items-center gap-2 p-2 bg-base-200 hover:bg-base-300 rounded transition-colors">
									<span class="font-bold text-primary w-1/2 truncate">{word.spanish}</span>
									<span class="text-base-content/70 w-1/2 truncate">{word.finnish}</span>
									<button
										class="btn btn-ghost btn-xs btn-circle flex-shrink-0"
										on:click={() => speakWord(word.spanish, word.finnish)}
										title="Kuuntele"
									>
										🔊
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Previous Games -->
					{#each previousGames as gameWords, gameIndex}
						<div class="bg-base-300 rounded p-2 mb-3 mt-4">
							<p class="text-sm font-medium text-center text-base-content/70">
								{gameIndex === 0 ? 'Edellisen pelin sanat' : `${gameIndex + 1}. viimeisen pelin sanat`}
							</p>
						</div>

						<div class="space-y-1 mb-4">
							{#each gameWords as word}
								<div class="flex items-center gap-2 p-2 bg-base-200 hover:bg-base-300 rounded transition-colors">
									<span class="font-bold text-primary w-1/2 truncate">{word.spanish}</span>
									<span class="text-base-content/70 w-1/2 truncate">{word.finnish}</span>
									<button
										class="btn btn-ghost btn-xs btn-circle flex-shrink-0"
										on:click={() => speakWord(word.spanish, word.finnish)}
										title="Kuuntele"
									>
										🔊
									</button>
								</div>
							{/each}
						</div>
					{/each}

					<!-- Close button -->
					<div class="fixed bottom-4 right-4">
						<button class="btn btn-primary btn-lg" on:click={toggleSanakirja}>
							Sulje
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Category Picker Modal -->
	{#if showCategoryPicker}
		<div 
			class="fixed inset-0 bg-neutral/50 z-50" 
			on:click={toggleCategoryPicker}
			on:keydown={(e) => e.key === 'Escape' && toggleCategoryPicker()}
			role="button"
			tabindex="0"
		>
			<div 
				class="bg-base-100 w-full h-full sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:h-auto sm:max-h-[90vh] sm:rounded-lg sm:shadow-xl overflow-hidden"
				on:click|stopPropagation
				on:keydown|stopPropagation
				role="dialog"
				aria-modal="true"
			>
				<!-- Header -->
				<div class="bg-primary text-primary-content px-3 py-2 flex items-center justify-between">
					<h2 class="text-base font-bold">Valitse kategoria</h2>
					<button class="btn btn-ghost btn-xs btn-circle text-primary-content" on:click={toggleCategoryPicker}>✕</button>
				</div>

				<!-- Content -->
				<div class="overflow-y-auto h-[calc(100vh-44px)] sm:h-auto sm:max-h-[calc(90vh-44px)] p-2">
					<!-- All Words Option -->
					<button
						class="w-full text-left px-2 py-1.5 rounded mb-2 flex items-center gap-2 transition-colors text-sm"
						class:bg-primary={selectedCategory === 'all'}
						class:text-primary-content={selectedCategory === 'all'}
						class:bg-base-200={selectedCategory !== 'all'}
						class:hover:bg-base-300={selectedCategory !== 'all'}
						on:click={() => selectCategory('all')}
					>
						<span>📚</span>
						<span class="font-medium">Kaikki sanat</span>
					</button>

					<!-- Tier 1: Foundation -->
					<div class="border-l-[3px] border-red-500 pl-2 mb-2">
						<div class="text-[10px] text-base-content/50 mb-0.5">Perusta</div>
						<div class="grid grid-cols-2 gap-1">
							{#each categories.filter(c => c.tier === 1) as cat}
								<button
									class="text-left px-2 py-1 rounded text-sm transition-colors"
									class:bg-primary={selectedCategory === cat.key}
									class:text-primary-content={selectedCategory === cat.key}
									class:bg-base-200={selectedCategory !== cat.key}
									class:hover:bg-base-300={selectedCategory !== cat.key}
									on:click={() => selectCategory(cat.key)}
								>
									{cat.name}
								</button>
							{/each}
						</div>
					</div>

					<!-- Tier 2: Concrete Basics -->
					<div class="border-l-[3px] border-yellow-500 pl-2 mb-2">
						<div class="text-[10px] text-base-content/50 mb-0.5">Perusasiat</div>
						<div class="grid grid-cols-2 gap-1">
							{#each categories.filter(c => c.tier === 2) as cat}
								<button
									class="text-left px-2 py-1 rounded text-sm transition-colors"
									class:bg-primary={selectedCategory === cat.key}
									class:text-primary-content={selectedCategory === cat.key}
									class:bg-base-200={selectedCategory !== cat.key}
									class:hover:bg-base-300={selectedCategory !== cat.key}
									on:click={() => selectCategory(cat.key)}
								>
									{cat.name}
								</button>
							{/each}
						</div>
					</div>

					<!-- Tier 3: Everyday Topics -->
					<div class="border-l-[3px] border-green-500 pl-2 mb-2">
						<div class="text-[10px] text-base-content/50 mb-0.5">Arkiaiheet</div>
						<div class="grid grid-cols-2 gap-1">
							{#each categories.filter(c => c.tier === 3) as cat}
								<button
									class="text-left px-2 py-1 rounded text-sm transition-colors"
									class:bg-primary={selectedCategory === cat.key}
									class:text-primary-content={selectedCategory === cat.key}
									class:bg-base-200={selectedCategory !== cat.key}
									class:hover:bg-base-300={selectedCategory !== cat.key}
									on:click={() => selectCategory(cat.key)}
								>
									{cat.name}
								</button>
							{/each}
						</div>
					</div>

					<!-- Tier 4: Practical Skills -->
					<div class="border-l-[3px] border-blue-500 pl-2 mb-2">
						<div class="text-[10px] text-base-content/50 mb-0.5">Käytäntö</div>
						<div class="grid grid-cols-2 gap-1">
							{#each categories.filter(c => c.tier === 4) as cat}
								<button
									class="text-left px-2 py-1 rounded text-sm transition-colors"
									class:bg-primary={selectedCategory === cat.key}
									class:text-primary-content={selectedCategory === cat.key}
									class:bg-base-200={selectedCategory !== cat.key}
									class:hover:bg-base-300={selectedCategory !== cat.key}
									on:click={() => selectCategory(cat.key)}
								>
									{cat.name}
								</button>
							{/each}
						</div>
					</div>

					<!-- Tier 5: Specialized -->
					<div class="border-l-[3px] border-purple-500 pl-2 mb-2">
						<div class="text-[10px] text-base-content/50 mb-0.5">Erikois</div>
						<div class="grid grid-cols-2 gap-1">
							{#each categories.filter(c => c.tier === 5) as cat}
								<button
									class="text-left px-2 py-1 rounded text-sm transition-colors"
									class:bg-primary={selectedCategory === cat.key}
									class:text-primary-content={selectedCategory === cat.key}
									class:bg-base-200={selectedCategory !== cat.key}
									class:hover:bg-base-300={selectedCategory !== cat.key}
									on:click={() => selectCategory(cat.key)}
								>
									{cat.name}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}

<!-- PLAYING STATE - Normal Mode -->
<!-- PLAYING STATE - Normal Mode -->
{#if gameState === 'playing' && !isCompactModeEnabled}
	<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
		<div class="card bg-base-100 shadow-xl w-full max-w-2xl relative">
			<button on:click={goHome} class="btn btn-ghost btn-circle btn-sm absolute top-2 right-2 text-2xl" title="Lopeta peli">✕</button>
			
			<div class="card-body">
				<!-- Score Bar -->
				<div class="text-center text-xl font-bold mb-6">
					<span class="text-base-content/70">Kysymys: {currentQuestionNumber}/{selectedGameLength}</span>
					<span class="mx-2 text-base-content/30">|</span>
					<span class="text-base-content">Pisteet: <span class="text-primary">{totalScore}</span></span>
				</div>

				<!-- Word Display -->
				<div class="bg-primary text-primary-content rounded-xl p-8 mb-6 text-center relative shadow-lg">
					<div class="text-5xl md:text-6xl font-bold mb-2">{currentWord?.spanish || ''}</div>
					<button 
						class="btn btn-circle btn-sm absolute bottom-2 right-2 btn-neutral" 
						on:click={speakCurrentWord} 
						title="Kuuntele sana uudelleen"
					>
						🔊
					</button>
				</div>

				<!-- Points Info -->
				<div class="text-center text-lg mb-4 text-base-content/70">
					Mahdolliset pisteet: <span class="font-bold text-primary">{possiblePoints}</span>
				</div>

				<!-- Tip Tabs - Always visible -->
				<div class="tabs tabs-boxed justify-center mb-3" role="tablist">
					{#each [0, 1, 2] as index}
						<button 
							class="tab"
							class:tab-active={activeTipTab === index && shownTips.length > index}
							on:click={() => activeTipTab = index}
							role="tab"
							disabled={shownTips.length <= index}
							aria-selected={activeTipTab === index}
						>
							Vihje {index + 1}
						</button>
					{/each}
				</div>

				<!-- Tips Section - Always visible with placeholder or content -->
				<div class="bg-base-200 border border-base-300 rounded-lg p-4 mb-4 min-h-[6rem] flex flex-col justify-center">
					<div class="text-sm text-left text-base-content">
						{#if shownTips.length === 0}
							<p class="italic opacity-60 text-center">"Anna vihje" -painike tuottaa vihjeen mutta vähentää pisteitä.</p>
						{:else}
							<div class="space-y-3">
								{#each shownTips as tip}
									{#if tip.difficultyIndex === activeTipTab}
										<div class="border-l-4 border-primary pl-3 py-1">
											<p class="mb-1">{tip.text}</p>
											{#if tip.fromCache && (tip.tipModel || tip.translationModel)}
												<p class="text-xs opacity-50 font-mono">
													{#if tip.tipModel}
														<span>{tip.tipModel}</span>
													{/if}
													{#if tip.translationModel}
														<span> | {tip.translationModel}</span>
													{/if}
												</p>
											{/if}
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Show Tip Button - Full width on mobile -->
				<div class="mb-4">
					<button 
						class="btn btn-warning w-full md:w-auto md:min-w-[200px]"
						on:click={showNextTip}
						disabled={tipsShown >= 3}
					>
						{#if tipsShown >= 3}
							Kaikki vihjeet näytetty
						{:else}
							Anna vihje
						{/if}
					</button>
				</div>

				<!-- Answer Form -->
				<form on:submit={handleSubmit} class="space-y-4">
					<input 
						type="text" 
						class="input input-bordered input-lg w-full text-center text-2xl"
						bind:value={userAnswer}
						placeholder="Kirjoita vastaus suomeksi..."
						autofocus
					/>
					<button 
						type="submit"
						class="btn btn-success btn-lg w-full"
						disabled={!userAnswer.trim()}
					>
						Tarkista vastaus
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- PLAYING STATE - Compact Mode (50vh) -->
{#if gameState === 'playing' && isCompactModeEnabled}
	<div class="h-screen bg-base-200">
		<div class="h-[50vh] bg-base-100 p-3 flex flex-col relative">
			<button on:click={goHome} class="btn btn-ghost btn-circle btn-xs absolute top-1 right-1 z-10" title="Lopeta peli">✕</button>
			
			<!-- Compact Score Bar -->
			<div class="text-center text-sm font-bold mb-2 flex-shrink-0">
				<span class="text-xs text-base-content/70">Kysymys: {currentQuestionNumber}/{selectedGameLength}</span>
				<span class="mx-1 text-base-content/30">|</span>
				<span class="text-xs text-base-content">Pisteet: <span class="text-primary">{totalScore}</span></span>
			</div>

			<!-- Compact Word Display -->
			<div class="bg-primary text-primary-content rounded p-2 mb-2 text-center relative flex-shrink-0">
				<div class="text-2xl font-bold">{currentWord?.spanish || ''}</div>
				<button 
					class="btn btn-circle btn-xs absolute bottom-0.5 right-0.5 btn-neutral border-0 min-h-0 h-6 w-6" 
					on:click={speakCurrentWord}
				>
					<span class="text-xs">🔊</span>
				</button>
			</div>

			<!-- Compact Tip Tabs -->
			<div class="tabs tabs-xs tabs-boxed justify-center mb-1 flex-shrink-0" role="tablist">
				{#each [0, 1, 2] as index}
					<button 
						class="tab tab-xs text-[10px]"
						class:tab-active={activeTipTab === index && shownTips.length > index}
						on:click={() => activeTipTab = index}
						role="tab"
						disabled={shownTips.length <= index}
						aria-selected={activeTipTab === index}
					>
						Vihje {index + 1}
					</button>
				{/each}
			</div>

			<!-- Compact Tips Section - Flexible height -->
			<div class="bg-base-200 border border-base-300 rounded py-2 px-2 mb-1 flex-1 min-h-0 overflow-y-auto">
				<div class="text-xs text-left text-base-content">
					{#if shownTips.length === 0}
						<p class="italic opacity-60 text-center">"Anna vihje" tuottaa vihjeen</p>
					{:else}
						<div class="space-y-2">
							{#each shownTips as tip}
								{#if tip.difficultyIndex === activeTipTab}
									<div class="border-l-2 border-primary pl-2 py-0.5">
										<p class="mb-0.5">{tip.text}</p>
										{#if tip.fromCache && (tip.tipModel || tip.translationModel)}
											<p class="text-[9px] opacity-50 font-mono">
												{#if tip.tipModel}
													<span>{tip.tipModel}</span>
												{/if}
												{#if tip.translationModel}
													<span> | {tip.translationModel}</span>
												{/if}
											</p>
										{/if}
									</div>
								{/if}
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Compact Controls Row: Tip Button, Input, Submit -->
			<div class="flex gap-2 mb-1 flex-shrink-0 items-center">
				<button 
					class="btn btn-warning btn-xs h-8 min-h-8 px-2 text-[10px] whitespace-nowrap"
					on:click={showNextTip}
					disabled={tipsShown >= 3}
				>
					{#if tipsShown >= 3}
						Kaikki vihjeet
					{:else}
						Anna vihje
					{/if}
				</button>
				<input 
					type="text" 
					class="input input-bordered h-8 min-h-8 flex-1 text-center text-sm px-2 py-0 border-base-300"
					style="line-height: 1.5rem;"
					bind:value={userAnswer}
					placeholder="Vastaus..."
					on:keypress={(e) => e.key === 'Enter' && userAnswer.trim() && submitAnswer()}
					autofocus
				/>
				<button 
					type="button"
					class="btn btn-success btn-xs h-8 min-h-8 px-2 text-xs"
					on:click={submitAnswer}
					disabled={!userAnswer.trim()}
				>
					Tarkista
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ANSWERED STATE - Normal Mode -->
{#if gameState === 'answered' && !isCompactModeEnabled}
	<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
		<div class="card bg-base-100 shadow-xl w-full max-w-2xl relative">
			<button on:click={goHome} class="btn btn-ghost btn-circle btn-sm absolute top-2 right-2 text-2xl" title="Lopeta peli">✕</button>
			
			<div class="card-body text-center">
				<!-- Score Bar -->
				<div class="text-xl font-bold text-primary mb-6">
					<span class="text-base-content/70">Kysymys: {currentQuestionNumber}/{selectedGameLength}</span>
					<span class="mx-2 text-base-content/30">|</span>
					<span>Pisteet: <span class="text-secondary">{totalScore}</span></span>
				</div>

				<!-- Result Area: Correct Answer, Points, Reaction Message -->
				<div class="space-y-4">
					<!-- Correct Answer Display -->
					<div class="bg-base-200 rounded-lg p-6">
						<div class="text-3xl font-bold">
							<span class="text-primary">{currentWord?.spanish}</span> = <span class="text-secondary">{currentWord?.finnish}</span>
						</div>
					</div>

					<!-- Points Earned Display -->
					<div class="rounded-lg p-4" class:bg-success={pointsEarned > 0} class:text-success-content={pointsEarned > 0} class:bg-error={pointsEarned === 0} class:text-error-content={pointsEarned === 0}>
						<div class="text-2xl font-bold">
							{#if pointsEarned > 0}
								+{pointsEarned} pistettä
							{:else}
								0 pistettä
							{/if}
						</div>
					</div>

					<!-- Reaction Messages -->
					<div class="bg-base-200 rounded-lg p-6">
						<div class="text-2xl font-bold text-primary italic mb-2">{formattedResultMessage.spanish}</div>
						<div class="text-lg text-base-content/70">{formattedResultMessage.finnish}</div>
					</div>
				</div>

				<!-- Next Button -->
				<button class="btn btn-primary btn-lg w-full mt-6" on:click={nextQuestion} autofocus>
					Seuraava
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ANSWERED STATE - Compact Mode (50vh) -->
{#if gameState === 'answered' && isCompactModeEnabled}
	<div class="h-screen bg-base-200">
		<div class="h-[50vh] bg-base-100 p-3 flex flex-col relative">
			<button on:click={goHome} class="btn btn-ghost btn-circle btn-xs absolute top-1 right-1 z-10" title="Lopeta peli">✕</button>
			
			<!-- Compact Score Bar -->
			<div class="text-center text-sm font-bold text-primary mb-2">
				<span class="text-xs text-base-content/70">Kysymys: {currentQuestionNumber}/{selectedGameLength}</span>
				<span class="mx-1 text-base-content/30">|</span>
				<span class="text-xs">Pisteet: <span class="text-secondary">{totalScore}</span></span>
			</div>

			<!-- Compact Result Area -->
			<div class="flex-1 flex flex-col gap-2 overflow-y-auto">
				<!-- Compact Correct Answer -->
				<div class="bg-base-200 rounded p-3 flex-shrink-0">
					<div class="text-xl font-bold">
						<span class="text-primary">{currentWord?.spanish}</span> = <span class="text-secondary">{currentWord?.finnish}</span>
					</div>
				</div>

				<!-- Compact Points Earned -->
				<div class="rounded p-2 flex-shrink-0" class:bg-success={pointsEarned > 0} class:text-success-content={pointsEarned > 0} class:bg-error={pointsEarned === 0} class:text-error-content={pointsEarned === 0}>
					<div class="text-lg font-bold">
						{#if pointsEarned > 0}
							+{pointsEarned} pistettä
						{:else}
							0 pistettä
						{/if}
					</div>
				</div>

				<!-- Compact Reaction Messages -->
				<div class="bg-base-200 rounded p-3 flex-shrink-0">
					<div class="text-lg font-bold text-primary italic">{formattedResultMessage.spanish}</div>
					<div class="text-sm text-base-content/70">{formattedResultMessage.finnish}</div>
				</div>
			</div>

			<!-- Next Button -->
			<button class="btn btn-primary btn-sm flex-shrink-0 mt-2" on:click={nextQuestion} autofocus>
				Seuraava
			</button>
		</div>
	</div>
{/if}

<!-- REPORT STATE -->
{#if gameState === 'report'}
	<div class="min-h-screen bg-base-200 flex items-center justify-center p-4">
		<div class="card bg-base-100 shadow-xl w-full max-w-2xl">
			<div class="card-body">
				<h2 class="card-title text-3xl justify-center mb-6 text-primary">🎉 Peli päättyi!</h2>

				<!-- Stats Grid -->
				<div class="stats stats-vertical lg:stats-horizontal shadow mb-6 w-full">
					<div class="stat">
						<div class="stat-title">Kysymyksiä</div>
						<div class="stat-value text-primary text-3xl">{selectedGameLength}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Oikein</div>
						<div class="stat-value text-success text-3xl">{correctCount}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Väärin</div>
						<div class="stat-value text-error text-3xl">{selectedGameLength - correctCount}</div>
					</div>
					<div class="stat">
						<div class="stat-title">Tarkkuus</div>
						<div class="stat-value text-3xl">{accuracy}%</div>
					</div>
				</div>

				<!-- Score Summary -->
				<div class="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
					<div class="text-center w-full">
						<div class="text-2xl font-bold text-primary">
							Pisteet: {totalScore} / {maxPossibleScore}
						</div>
						<div class="text-lg text-base-content/70">
							({scorePercentage}%)
						</div>
					</div>
				</div>

				<!-- Wrong Answers -->
				{#if wrongAnswers.length > 0}
					<div class="mb-6">
						<h3 class="text-xl font-bold mb-3 text-error">Väärät vastaukset:</h3>
						<div class="space-y-2">
							{#each wrongAnswers as wrong}
								<div class="bg-base-200 border-l-4 border-error rounded-r-lg p-3">
									<div class="flex-1">
										<div class="font-bold text-lg">
											<span class="text-primary">{wrong.spanish}</span> = <span class="text-secondary">{wrong.finnish}</span>
										</div>
										{#if wrong.userAnswer}
											<div class="text-sm text-base-content/70">
												Sinun vastauksesi: <span class="text-error">{wrong.userAnswer}</span>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Action Buttons -->
				<div class="flex flex-col sm:flex-row gap-3">
					<button class="btn btn-primary flex-1" on:click={startGame}>
						Pelaa uudestaan
					</button>
					<button class="btn btn-ghost flex-1" on:click={goHome}>
						Palaa kotiin
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
