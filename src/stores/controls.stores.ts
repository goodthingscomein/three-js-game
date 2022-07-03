import { writable } from 'svelte/store';

// Mouse change
type MouseChange = {
	x: number;
	y: number;
};
export const mouseChange = writable<MouseChange>({ x: 0, y: 0 });

// Mouse buttons down
type MousePressed = {
	LEFT: boolean;
	RIGHT: boolean;
	MIDDLE: boolean;
};
export const mousePressed = writable<MousePressed>({
	LEFT: false,
	RIGHT: false,
	MIDDLE: false,
});

// Keys pressed
type KeysPressed = {
	W: boolean;
	A: boolean;
	S: boolean;
	D: boolean;
	SPACE: boolean;
};
export const keysPressed = writable<KeysPressed>({
	W: false,
	A: false,
	S: false,
	D: false,
	SPACE: false,
});

export const pointerLocked = writable<boolean>(false);
