import { writable } from 'svelte/store';
import type { ColorRepresentation, Vector3 } from 'three';

type Player = {
	id: number;
	color: ColorRepresentation;
	position: Vector3;
	rotationY: number;
};

export const ourPlayer = writable<Player>();
