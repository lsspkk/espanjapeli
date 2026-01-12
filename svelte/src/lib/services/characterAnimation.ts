import type { AnimationConfig, AnimationState } from '$lib/types/animation';
import { base } from '$app/paths';

export class CharacterAnimationService {
	private config!: AnimationConfig;
	private state: AnimationState = {
		currentFrame: 0,
		position: 0,
		isRunning: false,
		backgroundOpacity: 0
	};
	private startTime: number = 0;
	private lastFrameTime: number = 0;
	private screenWidth: number = 0;
	private characterWidth: number = 0;
	private totalFrames: number = 20;
	private fadeInDuration: number = 500; // ms
	private fadeOutDuration: number = 500; // ms
	private isFadingOut: boolean = false;
	private fadeOutStartTime: number = 0;
	// Multi-character support
	private isMultiCharacter: boolean = false;
	private characterFrameTimes: number[] = [];
	private characterTotalFrames: number[] = [];

	/**
	 * Initialize animation with config
	 */
	initialize(config: AnimationConfig): AnimationState {
		this.config = config;
		this.screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;

		// Check if this is a multi-character animation
		this.isMultiCharacter = !!(config.characters && config.characters.length > 0);

		if (this.isMultiCharacter) {
			// Initialize multi-character state
			const spacing = config.characterSpacing || 100;
			this.state.characterStates = config.characters!.map((charName, index) => {
				const charWidth = this.getCharacterWidth(charName);
				const offset = index * spacing;

				let initialPosition: number;
				if (config.direction === 'left-to-right') {
					initialPosition = -charWidth - offset;
				} else {
					initialPosition = this.screenWidth + charWidth + offset;
				}

				return {
					characterName: charName,
					currentFrame: 0,
					position: initialPosition
				};
			});

			// Initialize frame times for each character
			this.characterFrameTimes = config.characters!.map(() => performance.now());
			this.characterTotalFrames = config.characters!.map((charName) =>
				charName === 'daddy' ? 15 : 20
			);

			// Set character width to the widest for fade-out detection
			this.characterWidth = Math.max(...config.characters!.map((c) => this.getCharacterWidth(c)));
		} else {
			// Single character mode
			// Set character width based on character type
			if (config.characterWidth) {
				this.characterWidth = config.characterWidth;
			} else {
				this.characterWidth = this.getCharacterWidth(config.characterName);
			}

			// Set total frames based on character (daddy has fewer frames for now)
			this.totalFrames = config.characterName === 'daddy' ? 15 : 20;

			// Set initial position based on direction
			if (config.direction === 'left-to-right') {
				this.state.position = -this.characterWidth;
			} else {
				this.state.position = this.screenWidth + this.characterWidth;
			}

			this.state.currentFrame = 0;
		}

		this.state.isRunning = false;
		this.state.backgroundOpacity = 0;

		return { ...this.state };
	}

	/**
	 * Get character width based on character type
	 */
	private getCharacterWidth(characterName: string): number {
		// Peppa is wider due to bicycle, Daddy is wider due to larger viewBox
		if (characterName === 'peppa') {
			return 160;
		} else if (characterName === 'daddy') {
			return 100;
		} else {
			return 60;
		}
	}

	/**
	 * Start animation (handles background fade-in)
	 */
	async start(): Promise<void> {
		this.state.isRunning = true;
		this.startTime = performance.now();
		this.lastFrameTime = this.startTime;

		// Start fade-in
		return new Promise((resolve) => {
			const fadeIn = () => {
				const elapsed = performance.now() - this.startTime;
				this.state.backgroundOpacity = Math.min(1, elapsed / this.fadeInDuration);

				if (this.state.backgroundOpacity < 1) {
					requestAnimationFrame(fadeIn);
				} else {
					resolve();
				}
			};
			fadeIn();
		});
	}

	/**
	 * Update animation frame and position
	 */
	update(deltaTime: number): AnimationState {
		if (!this.state.isRunning) {
			return { ...this.state };
		}

		const currentTime = performance.now();

		// Handle fade-out
		if (this.isFadingOut) {
			const fadeElapsed = currentTime - this.fadeOutStartTime;
			this.state.backgroundOpacity = Math.max(0, 1 - fadeElapsed / this.fadeOutDuration);
			return { ...this.state };
		}

		if (this.isMultiCharacter) {
			// Update each character independently
			const frameDuration = 1000 / this.config.frameRate;

			this.state.characterStates = this.state.characterStates!.map((charState, index) => {
				const timeSinceLastFrame = currentTime - this.characterFrameTimes[index];

				// Update frame
				let newFrame = charState.currentFrame;
				if (timeSinceLastFrame >= frameDuration) {
					newFrame = (charState.currentFrame + 1) % this.characterTotalFrames[index];
					this.characterFrameTimes[index] = currentTime;
				}

				// Update position
				const pixelsToMove = (this.config.speed * deltaTime) / 1000;
				let newPosition: number;
				if (this.config.direction === 'left-to-right') {
					newPosition = charState.position + pixelsToMove;
				} else {
					newPosition = charState.position - pixelsToMove;
				}

				return {
					...charState,
					currentFrame: newFrame,
					position: newPosition
				};
			});
		} else {
			// Single character mode
			// Update frame based on frame rate
			const frameDuration = 1000 / this.config.frameRate;
			const timeSinceLastFrame = currentTime - this.lastFrameTime;

			if (timeSinceLastFrame >= frameDuration) {
				this.state.currentFrame = (this.state.currentFrame + 1) % this.totalFrames;
				this.lastFrameTime = currentTime;
			}

			// Update position
			this.state.position = this.calculatePosition(deltaTime);
		}

		// Check if animation should start fading out
		if (this.shouldStartFadeOut()) {
			this.startFadeOut();
		}

		return { ...this.state };
	}

	/**
	 * Calculate horizontal position based on speed and time
	 */
	private calculatePosition(deltaTime: number): number {
		const pixelsToMove = (this.config.speed * deltaTime) / 1000;

		if (this.config.direction === 'left-to-right') {
			return this.state.position + pixelsToMove;
		} else {
			return this.state.position - pixelsToMove;
		}
	}

	/**
	 * Check if character has exited screen and should start fade-out
	 */
	private shouldStartFadeOut(): boolean {
		if (this.isFadingOut) return false;

		if (this.isMultiCharacter) {
			// Check if the last character has exited
			const lastCharState = this.state.characterStates![this.state.characterStates!.length - 1];
			const lastCharWidth = this.getCharacterWidth(lastCharState.characterName);

			if (this.config.direction === 'left-to-right') {
				return lastCharState.position > this.screenWidth + lastCharWidth;
			} else {
				return lastCharState.position < -lastCharWidth;
			}
		} else {
			if (this.config.direction === 'left-to-right') {
				return this.state.position > this.screenWidth + this.characterWidth;
			} else {
				return this.state.position < -this.characterWidth;
			}
		}
	}

	/**
	 * Start fade-out process
	 */
	private startFadeOut(): void {
		this.isFadingOut = true;
		this.fadeOutStartTime = performance.now();
	}

	/**
	 * Check if animation is complete
	 */
	isComplete(): boolean {
		return this.isFadingOut && this.state.backgroundOpacity <= 0;
	}

	/**
	 * Stop and cleanup (handles background fade-out)
	 */
	async stop(): Promise<void> {
		this.state.isRunning = false;

		if (!this.isFadingOut) {
			this.startFadeOut();

			return new Promise((resolve) => {
				const fadeOut = () => {
					const elapsed = performance.now() - this.fadeOutStartTime;
					this.state.backgroundOpacity = Math.max(0, 1 - elapsed / this.fadeOutDuration);

					if (this.state.backgroundOpacity > 0) {
						requestAnimationFrame(fadeOut);
					} else {
						resolve();
					}
				};
				fadeOut();
			});
		}
	}

	/**
	 * Get current frame SVG path
	 */
	getCurrentFramePath(): string {
		const frameNumber = this.state.currentFrame + 1; // Frames are 1-indexed in filenames
		return `${base}/svg/animations/one/${this.config.characterName}-${frameNumber}.svg`;
	}

	/**
	 * Get current frame SVG path for a specific character in multi-character mode
	 */
	getCharacterFramePath(index: number): string {
		if (!this.isMultiCharacter || !this.state.characterStates) {
			return this.getCurrentFramePath();
		}

		const charState = this.state.characterStates[index];
		const frameNumber = charState.currentFrame + 1;
		return `${base}/svg/animations/one/${charState.characterName}-${frameNumber}.svg`;
	}

	/**
	 * Get current animation state
	 */
	getState(): AnimationState {
		return { ...this.state };
	}
}
