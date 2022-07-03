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
	socket.on('me:setup', (data) => {
		ourPlayer.set(data);
	});

	socket.on('players:existing', (data) => {
		if (!data.length) return;
		for (let i = 0; i < data.length; i++) {
			networkInstanceMap.join(data[i][0], data[i][1]);
			networkObjectsToSpawn.push(data[i][0]);
		}
	});

	socket.on('player:joined', (data) => {
		networkInstanceMap.join(data.id, data);
		networkObjectsToSpawn.push(data.id);
	});
}
