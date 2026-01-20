import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	pushGameState,
	replaceGameState,
	setupHistoryListener,
	type GameHistoryState
} from './gameNavHistory';

describe('gameNavHistory', () => {
	let originalPushState: typeof window.history.pushState;
	let originalReplaceState: typeof window.history.replaceState;

	beforeEach(() => {
		// Save original methods
		originalPushState = window.history.pushState;
		originalReplaceState = window.history.replaceState;

		// Mock history methods
		window.history.pushState = vi.fn();
		window.history.replaceState = vi.fn();
	});

	afterEach(() => {
		// Restore original methods
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	});

	describe('pushGameState', () => {
		it('should push state to browser history', () => {
			pushGameState('tarinat', 'reading');

			expect(window.history.pushState).toHaveBeenCalledWith(
				{ gameId: 'tarinat', state: 'reading', data: undefined },
				'',
				window.location.href
			);
		});

		it('should push state with data', () => {
			pushGameState('tarinat', 'reading', { storyId: 'story-1' });

			expect(window.history.pushState).toHaveBeenCalledWith(
				{ gameId: 'tarinat', state: 'reading', data: { storyId: 'story-1' } },
				'',
				window.location.href
			);
		});
	});

	describe('replaceGameState', () => {
		it('should replace current history state', () => {
			replaceGameState('tarinat', 'questions');

			expect(window.history.replaceState).toHaveBeenCalledWith(
				{ gameId: 'tarinat', state: 'questions', data: undefined },
				'',
				window.location.href
			);
		});

		it('should replace state with data', () => {
			replaceGameState('tarinat', 'questions', { questionIndex: 3 });

			expect(window.history.replaceState).toHaveBeenCalledWith(
				{ gameId: 'tarinat', state: 'questions', data: { questionIndex: 3 } },
				'',
				window.location.href
			);
		});
	});

	describe('setupHistoryListener', () => {
		it('should add popstate event listener', () => {
			const callback = vi.fn();
			const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

			setupHistoryListener(callback);

			expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
		});

		it('should call callback when popstate event fires', () => {
			const callback = vi.fn();
			setupHistoryListener(callback);

			const state: GameHistoryState = { gameId: 'tarinat', state: 'reading' };
			const event = new PopStateEvent('popstate', { state });

			window.dispatchEvent(event);

			expect(callback).toHaveBeenCalledWith(state);
		});

		it('should return cleanup function that removes listener', () => {
			const callback = vi.fn();
			const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

			const cleanup = setupHistoryListener(callback);
			cleanup();

			expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
		});

		it('should handle null state', () => {
			const callback = vi.fn();
			setupHistoryListener(callback);

			const event = new PopStateEvent('popstate', { state: null });
			window.dispatchEvent(event);

			expect(callback).toHaveBeenCalledWith(null);
		});
	});
});
