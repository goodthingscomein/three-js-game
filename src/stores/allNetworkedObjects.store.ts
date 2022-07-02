import { writable } from 'svelte/store';
import type { Mesh } from 'three';

export const allNetworkObjects = writable<Map<number, Mesh>>(new Map<number, Mesh>());
