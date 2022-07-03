import { writable } from 'svelte/store';
import type { Mesh, ColorRepresentation, Vector3 } from 'three';

type NetworkObject = {
	color: ColorRepresentation;
	position: Vector3;
	rotationY: number;
	mesh: Mesh | undefined;
};

function createNetworkInstanceMap() {
	const { subscribe, update } = writable<Map<number, NetworkObject>>(new Map<number, NetworkObject>());

	return {
		subscribe,
		join: (id: number, newObj: NetworkObject) =>
			update((map) => {
				map.set(id, newObj);
				return map;
			}),
	};
}
export const networkInstanceMap = createNetworkInstanceMap();

function createNetworkObjectsToSpawn() {
	const { subscribe, set, update } = writable<number[]>([]);

	return {
		subscribe,
		push: (id: number) => update((arr) => [...arr, id]),
		clear: () => set([]),
	};
}
export const networkObjectsToSpawn = createNetworkObjectsToSpawn();
