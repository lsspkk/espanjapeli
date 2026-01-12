export interface AnimationConfig {
	characterName: 'peppa' | 'george' | 'mummy' | 'daddy';
	direction: 'left-to-right' | 'right-to-left';
	speed: number; // pixels per second
	verticalPosition: number; // percentage from top (0-100)
	scale: number; // scale factor (e.g., 1.0 = 100%, 1.5 = 150%)
	background: BackgroundType;
	frameRate: number; // frames per second (default: 15-20)
	characterWidth?: number; // Optional: override character width for positioning
	// Multi-character support
	characters?: Array<'peppa' | 'george' | 'mummy' | 'daddy'>; // Array of characters for row animation
	characterSpacing?: number; // Distance between characters in pixels (default: 100)
}

export interface BackgroundType {
	type: 'grass' | 'muddy-road' | 'none';
	height: number; // in px
	width: number; // pattern width in px
}

export interface AnimationState {
	currentFrame: number; // 0-19 (or 0-14 for daddy until more frames added)
	position: number; // horizontal position in pixels
	isRunning: boolean;
	backgroundOpacity: number; // 0-1 for fade in/out
	// Multi-character state
	characterStates?: Array<{
		characterName: string;
		currentFrame: number;
		position: number;
	}>;
}
