import { writable } from 'svelte/store';
import type { Vector3 } from 'three';

export const idealHeight = writable<number>(3);
export const idealZoom = writable<number>(7);
export const idealOffset = writable<Vector3>();
export const idealLookat = writable<Vector3>();
