import { writable } from 'svelte/store';
import type { ColorRepresentation, Vector3, Euler } from 'three';

type Player = {
	id: number;
	color: ColorRepresentation;
	position: Vector3;
	rotation: Euler;
};

export const ourPlayer = writable<Player>();
