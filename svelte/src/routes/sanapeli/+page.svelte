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
	import BackButton from '$lib/components/shared/BackButton.svelte';
	import GameContainer from '$lib/components/shared/GameContainer.svelte';
	import CategoryPicker from '$lib/components/basic/modals/CategoryPicker.svelte';
	import Sanakirja from '$lib/components/basic/modals/Sanakirja.svelte';
	import GameLengthSelector from '$lib/components/basic/input/GameLengthSelector.svelte';
	import FrequencySummary from '$lib/components/basic/report/FrequencySummary.svelte';
	import { 
		getAvailableWords,
		prepareNextGameWords,
		generateWordQueue,
		recordGameCompletion, 
		getPreviousGames 
	} from '$lib/services/wordSelection';
	import { gameSettings } from '$lib/stores/gameSettings';

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
	 * Start a new game
	 */
	async function startGame() {
		console.log('🎮 Starting new game');
		
		// Close sanakirja if open
		showSanakirja = false;
		
		// Reset game state
		totalScore = 0;
		currentQuestionNumber = 0;
		gameQuestions = [];
		
		// Ensure words are prepared for this game
		const settings = $gameSettings;
		if (upcomingWords.length !== selectedGameLength) {
			upcomingWords = await prepareNextGameWords(selectedCategory, selectedGameLength, 'spanish_to_finnish', settings.prioritizeFrequency);
		}
		
		// Generate word queue from prepared words
		wordQueue = await generateWordQueue(selectedCategory, selectedGameLength, upcomingWords, 5, 'spanish_to_finnish', settings.prioritizeFrequency);
		
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
	async function showGameReport() {
		gameState = 'report';

		// Record game completion for word selection history
		recordGameCompletion(upcomingWords, selectedCategory);

		// Prepare words for next game
		const settings = $gameSettings;
		await prepareNextGameWords(selectedCategory, selectedGameLength, 'spanish_to_finnish', settings.prioritizeFrequency);

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
	async function handleCategoryChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedCategory = target.value;
		category.set(selectedCategory);
		// Re-prepare words for new category
		const settings = $gameSettings;
		upcomingWords = await prepareNextGameWords(selectedCategory, selectedGameLength, 'spanish_to_finnish', settings.prioritizeFrequency);
	}

	/**
	 * Select a category from the picker modal
	 */
	async function selectCategory(categoryKey: string) {
		selectedCategory = categoryKey;
		category.set(selectedCategory);
		showCategoryPicker = false;
		// Re-prepare words for new category
		const settings = $gameSettings;
		upcomingWords = await prepareNextGameWords(selectedCategory, selectedGameLength, 'spanish_to_finnish', settings.prioritizeFrequency);
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
	async function handleGameLengthChange(event: Event) {
		const target = event.target as HTMLInputElement;
		selectedGameLength = parseInt(target.value);
		gameLength.set(selectedGameLength);
		// Re-prepare words for new game length
		const settings = $gameSettings;
		upcomingWords = await prepareNextGameWords(selectedCategory, selectedGameLength, 'spanish_to_finnish', settings.prioritizeFrequency);
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
			const availableWords = getAvailableWords(selectedCategory);
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
	onMount(async () => {
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
		const settings = $gameSettings;
		upcomingWords = await prepareNextGameWords(selectedCategory, selectedGameLength, 'spanish_to_finnish', settings.prioritizeFrequency);
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
	<GameContainer gameType="basic" buttonMode="basic" onBack={() => window.location.href = `${base}/`}>
		<div class="card-body p-4 md:p-8">
			<h1 class="text-3xl font-bold text-center text-primary mb-6">🇪🇸 Espanjapeli 🇫🇮</h1>

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
			<GameLengthSelector 
				value={selectedGameLength}
				options={[10, 21, 42]}
				onChange={handleGameLengthChange}
			/>

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
	</GameContainer>

	<!-- Sanakirja Modal -->
	<Sanakirja 
		isOpen={showSanakirja}
		upcomingWords={upcomingWords}
		previousGames={previousGames}
		onClose={toggleSanakirja}
		onSpeak={speakWord}
	>
		<div slot="header-actions">
			<button class="btn btn-ghost btn-sm text-primary-content" on:click={startReadAll} title="Lue kaikki">🔊</button>
		</div>
	</Sanakirja>

	<!-- Category Picker Modal -->
	<CategoryPicker 
		isOpen={showCategoryPicker}
		selectedCategory={selectedCategory}
		categories={categories}
		onSelect={selectCategory}
		onClose={toggleCategoryPicker}
	/>
{/if}

<!-- ============================================================================
     NORMAL MODE (Mobile/Desktop): Complete standalone implementation
     DO NOT consolidate with compact mode - visuals are fundamentally different
     ============================================================================ -->

<!-- PLAYING STATE - Normal Mode -->
{#if gameState === 'playing' && !isCompactModeEnabled}
	<div class="min-h-screen bg-base-200 flex flex-col md:items-center md:justify-start p-0 md:p-4">
		<div class="card bg-base-100 shadow-xl w-full md:max-w-2xl min-h-screen md:min-h-0 relative">
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

			<!-- Tips Section - 3 columns on desktop, tabs on mobile -->
			<div class="mb-4">
				<!-- Mobile: Tabs -->
				<div class="md:hidden">
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
					<div class="bg-base-200 border border-base-300 rounded-lg p-4 min-h-[6rem] flex flex-col justify-center">
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
				</div>

				<!-- Desktop: 3 Columns -->
				<div class="hidden md:grid md:grid-cols-3 md:gap-3">
					{#each [0, 1, 2] as index}
						<div class="bg-base-200 border border-base-300 rounded-lg p-3 min-h-[8rem] flex flex-col">
							<div class="font-semibold text-sm mb-2 text-center text-base-content/70">
								Vihje {index + 1}
							</div>
							<div class="text-sm text-left text-base-content flex-1 flex flex-col justify-center">
								{#if shownTips.length === 0 && index === 0}
									<p class="italic opacity-60 text-center text-xs">"Anna vihje" -painike tuottaa vihjeen</p>
								{:else if shownTips.length > index}
									{#each shownTips as tip}
										{#if tip.difficultyIndex === index}
											<div class="border-l-4 border-primary pl-2 py-1">
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
								{:else}
									<p class="italic opacity-40 text-center text-xs">Ei vielä näytetty</p>
								{/if}
							</div>
						</div>
					{/each}
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

<!-- ============================================================================
     COMPACT MODE: Complete standalone implementation for 50vh constraint
     DO NOT consolidate with normal mode - layout is fundamentally different
     ============================================================================ -->

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

<!-- ============================================================================
     NORMAL MODE (Mobile/Desktop): Answer feedback - standalone implementation
     DO NOT consolidate with compact mode - visuals are fundamentally different
     ============================================================================ -->

<!-- ANSWERED STATE - Normal Mode -->
{#if gameState === 'answered' && !isCompactModeEnabled}
	<div class="min-h-screen bg-base-200 flex flex-col md:items-center md:justify-start p-0 md:p-4">
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

<!-- ============================================================================
     COMPACT MODE: Answer feedback - standalone implementation for 50vh
     DO NOT consolidate with normal mode - layout is fundamentally different
     ============================================================================ -->

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
	<GameContainer gameType="basic" buttonMode="basic" showBackButton={false}>
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

			<!-- Frequency Summary -->
			{#if upcomingWords.length > 0}
				<FrequencySummary words={upcomingWords} />
			{/if}

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
	</GameContainer>
{/if}
