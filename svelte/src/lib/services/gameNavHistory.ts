/**
 * Game Navigation History Manager
 *
 * Manages browser history for game navigation, enabling proper back button behavior.
 * Each game pushes states when transitioning (home -> playing -> report), and the
 * browser back button triggers popstate events that games handle via the listener.
 *
 * Usage in a game component:
 *   onMount: replaceGameState('gameId', 'home') + setupHistoryListener(callback)
 *   onDestroy: cleanup listener
 *   startGame: pushGameState('gameId', 'playing')
 *   goHome: window.history.back() (triggers the listener callback)
 */

export type GameHistoryState = {
	gameId: string;
	state: string;
	data?: Record<string, unknown>;
};

/**
 * Push a new state to browser history
 */
export function pushGameState(gameId: string, state: string, data?: Record<string, unknown>): void {
	const historyState: GameHistoryState = { gameId, state, data };

	// Push to browser history
	window.history.pushState(historyState, '', window.location.href);
}

/**
 * Replace current history state
 */
export function replaceGameState(
	gameId: string,
	state: string,
	data?: Record<string, unknown>
): void {
	const historyState: GameHistoryState = { gameId, state, data };

	// Replace current state
	window.history.replaceState(historyState, '', window.location.href);
}

/**
 * Setup popstate listener for handling back button
 * Returns cleanup function
 */
export function setupHistoryListener(
	callback: (state: GameHistoryState | null) => void
): () => void {
	const handler = (event: PopStateEvent) => {
		const state = event.state as GameHistoryState | null;
		callback(state);
	};

	window.addEventListener('popstate', handler);

	// Return cleanup function
	return () => {
		window.removeEventListener('popstate', handler);
	};
}
