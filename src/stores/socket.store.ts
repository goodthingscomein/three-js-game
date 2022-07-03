import type { Vector3, Mesh, ColorRepresentation, Euler } from 'three';
import { io, Socket } from 'socket.io-client';

// Stores
import { ourPlayer } from './player.store';
import { networkInstanceMap, networkObjectsToSpawn } from './networkInstanceMap.store';

let socket: Socket;

export function connect() {
	socket = io('http://localhost:4000');
	setupSocketListeners();
}

function setupSocketListeners() {
	let ourPlayerValue: Player;
	ourPlayer.subscribe((val) => (ourPlayerValue = val));

	let networkInstanceMapValue: Map<number, NetworkObject>;
	networkInstanceMap.subscribe((val) => (networkInstanceMapValue = val));

	socket.on('me:setup', (data) => {
		ourPlayer.set(data);
	});

	// Get existing players (before we joined)
	socket.on('players:existing', (data) => {
		if (!data.length) return;
		for (let i = 0; i < data.length; i++) {
			networkInstanceMap.join(data[i][0], data[i][1]);
			networkObjectsToSpawn.push(data[i][0]);
		}
	});

	// Get new players (after we joined)
	socket.on('player:joined', (data) => {
		networkInstanceMap.join(data.id, data);
		networkObjectsToSpawn.push(data.id);
	});

	// Get other player movement
	socket.on('player:transform', (data) => {
		if (!networkInstanceMapValue || !ourPlayerValue) return; // If we do not have access to our stores
		if (data.id === ourPlayerValue.id) return; // If this is a movement of our own player, do nothing
		const playerToMove = networkInstanceMapValue.get(data.id); // Get the player that has moved
		if (playerToMove && playerToMove.mesh) {
			playerToMove.mesh.position.copy(data.position);
			playerToMove.mesh.rotation.copy(data.rotation);
		}
	});
}

export function sendTransform(position: Vector3, rotation: Euler) {
	if (!socket) return;
	socket.emit('player:transform', { position, rotation });
}

/** External types */
type Player = {
	id: number;
	color: ColorRepresentation;
	position: Vector3;
	rotation: Euler;
};
type NetworkObject = {
	color: ColorRepresentation;
	position: Vector3;
	rotation: Euler;
	mesh: Mesh | undefined;
};
