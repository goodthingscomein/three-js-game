<script lang="ts" type="module">
	import * as THREE from 'three';

	// Stores
	import { keysPressed, mousePressed, mouseChange, pointerLocked } from '../stores/controls.stores';
	import { ourPlayer } from '../stores/player.store';
	import { networkInstanceMap, networkObjectsToSpawn } from '../stores/networkInstanceMap.store';
	import { connect, sendTransform } from '../stores/socket.store'; // Needed to connect to the server
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;

	/** Handle jump + gravity */
	let onGround = true;
	const gravity = 6;
	const jumpStength = 0.4;
	let fallSpeed = 0;

	function main() {
		if (!canvas) {
			console.log('Could not find the canvas');
			return;
		}
		const renderer = new THREE.WebGLRenderer({ canvas });

		/** Create the camera */
		const fov = 75;
		const aspect = 2; // the canvas default
		const near = 1;
		const far = 5000;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

		let idealHeight = 3;
		let idealZoom = 7;
		let idealOffset: THREE.Vector3;
		let idealLookat: THREE.Vector3;

		function CalculateIdealOffset(objectToFollow: THREE.Mesh<any, any>) {
			const idealOffset = new THREE.Vector3(0, idealHeight, -idealZoom);
			idealOffset.applyQuaternion(objectToFollow.quaternion);
			idealOffset.add(objectToFollow.position);
			return idealOffset;
		}

		function CalculateIdealLookat(objectToFollow: THREE.Mesh<any, any>) {
			const idealLookat = new THREE.Vector3(0, 0, idealHeight / 10);
			idealLookat.applyQuaternion(objectToFollow.quaternion);
			idealLookat.add(objectToFollow.position);
			return idealLookat;
		}

		/** Create the scene */
		const scene = new THREE.Scene();

		/** Create an array of all of the paths of the Skybox PNGs */
		function createPathStrings(filename: string) {
			const basePath = '../assets/skybox/textures/';
			const baseFilename = basePath + filename;
			const fileType = '.png';
			const sides = ['ft', 'bk', 'up', 'dn', 'rt', 'lf'];
			const pathStings = sides.map((side) => {
				return baseFilename + '_' + side + fileType;
			});

			return pathStings;
		}

		/** Create array of all Skybox textures from PNGs */
		function createMaterialArray(filename: string) {
			const skyboxImagepaths = createPathStrings(filename);
			const materialArray = skyboxImagepaths.map((image) => {
				let texture = new THREE.TextureLoader().load(image);
				return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
			});

			return materialArray;
		}

		/** Create the skybox */
		const skyboxMaterialArray = createMaterialArray('skybox');
		const skyboxGeometry = new THREE.BoxGeometry(2000, 2000, 2000);
		const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterialArray);
		scene.add(skybox);

		/** Create a new box geometry */
		const boxGeometry = new THREE.BoxGeometry(1, 2, 1);
		const planeGeometry = new THREE.PlaneBufferGeometry(100, 100);

		/** Create our player */
		$networkInstanceMap.set($ourPlayer.id, {
			...$ourPlayer,
			mesh: makeInstance(scene, boxGeometry, $ourPlayer.color, $ourPlayer.position, $ourPlayer.rotation),
		});

		const plane = makeInstance(
			scene,
			planeGeometry,
			0xffffff,
			new THREE.Vector3(0, 0, 0),
			new THREE.Euler(-1.5708, 0, 0)
		);

		/** Create a directional light */
		const directionalLightColor: THREE.ColorRepresentation = 0xffffff;
		const directionalLightIntensity = 0.4;
		const directionalLight = new THREE.DirectionalLight(directionalLightColor, directionalLightIntensity);
		directionalLight.position.set(-1, 2, 4);

		/** Create an ambient light */
		const ambientLightColor: THREE.ColorRepresentation = 0xffffff;
		const ambientLightIntensity = 0.6;
		const ambientLight = new THREE.AmbientLight(ambientLightColor, ambientLightIntensity);

		/** Add the lights to the scene */
		scene.add(directionalLight);
		scene.add(ambientLight);

		/** Checks if the renderer output resolution */
		function resizeRendererToDisplaySize(renderer: THREE.WebGLRenderer) {
			const canvas = renderer.domElement;
			const pixelRatio = window.devicePixelRatio;
			const width = (canvas.clientWidth * pixelRatio) | 0;
			const height = (canvas.clientHeight * pixelRatio) | 0;
			const needResize = canvas.width !== width || canvas.height !== height;
			if (needResize) {
				renderer.setSize(width, height, false);
			}
			return needResize;
		}

		/** Tell THREE js to render the scene */
		renderer.render(scene, camera);

		/**
		 * THREE JS render loop
		 * This will also act as the game loop
		 */
		function render(time: number) {
			time *= 0.001; // convert time to seconds

			/** Updates the resolution of the renderer to match the size of the canvas */
			if (resizeRendererToDisplaySize(renderer)) {
				const canvas = renderer.domElement;
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

			/** Handle the movement of our player */
			const ourPlayerNetworkInstance = $networkInstanceMap.get($ourPlayer.id);
			if (ourPlayerNetworkInstance && ourPlayerNetworkInstance.mesh) {
				/** First update if the player is on the ground - clamp to the ground if needed */
				ourPlayerNetworkInstance.mesh.translateY(fallSpeed);

				if (ourPlayerNetworkInstance.mesh.position.y <= 1) {
					ourPlayerNetworkInstance.mesh.position.setY(1);
					onGround = true;
					fallSpeed = 0;
				} else {
					fallSpeed -= gravity / 400;
					onGround = false;
				}

				/** Calculate if the player has moved - set the flag to send message to server*/
				let playerMoved = false;
				if (($keysPressed.W && !$keysPressed.S) || (!$keysPressed.W && $keysPressed.S)) playerMoved = true; // Check move front back
				if (($keysPressed.A && !$keysPressed.D) || (!$keysPressed.A && $keysPressed.D)) playerMoved = true; // Check move left right
				if ($pointerLocked && ($mousePressed.RIGHT || $mousePressed.MIDDLE) && $mouseChange.x) playerMoved = true; // Check rotating
				if (!onGround) playerMoved = true; // Check falling

				/** Move */
				if ($keysPressed.W) ourPlayerNetworkInstance.mesh.translateZ(0.1);
				if ($keysPressed.S) ourPlayerNetworkInstance.mesh.translateZ(-0.1);
				if ($keysPressed.A) ourPlayerNetworkInstance.mesh.translateX(0.1);
				if ($keysPressed.D) ourPlayerNetworkInstance.mesh.translateX(-0.1);

				/** Jump */
				if ($keysPressed.SPACE && onGround) {
					console.log('jump');
					fallSpeed += jumpStength;
					ourPlayerNetworkInstance.mesh.translateY(fallSpeed);
				}

				/** Rotate */
				if ($pointerLocked && ($mousePressed.RIGHT || $mousePressed.MIDDLE)) {
					// Rotate the player object
					ourPlayerNetworkInstance.mesh.rotateY($mouseChange.x / 600);

					// Adjust the Height of the camera
					idealHeight += $mouseChange.y / 150;
					if (idealHeight < 1) idealHeight = 1;
					if (idealHeight > 5) idealHeight = 5;

					// Reset mouse changed so that only new mouse movement will move camera
					mouseChange.set({ x: 0, y: 0 });
				}

				/** Tell the server our players new transform */
				if (playerMoved) sendTransform(ourPlayerNetworkInstance.mesh.position, ourPlayerNetworkInstance.mesh.rotation);

				/** Move the camera */
				idealOffset = CalculateIdealOffset(ourPlayerNetworkInstance.mesh);
				camera.position.copy(idealOffset);

				/** Point the camera at the cube */
				idealLookat = CalculateIdealLookat(ourPlayerNetworkInstance.mesh);
				camera.lookAt(idealLookat);
			}

			/** Check to see if we need to spawn in other players */
			if ($networkObjectsToSpawn.length) {
				for (let i = 0; i < $networkObjectsToSpawn.length; i++) {
					if ($networkObjectsToSpawn[i] === $ourPlayer.id) continue;
					// Spawn in the new player
					const newOtherPlayer = $networkInstanceMap.get($networkObjectsToSpawn[i]);
					if (newOtherPlayer) {
						console.log('Creating other players mesh');
						newOtherPlayer.mesh = makeInstance(
							scene,
							boxGeometry,
							newOtherPlayer.color,
							newOtherPlayer.position,
							newOtherPlayer.rotation
						);
					}
				}
				networkObjectsToSpawn.clear();
			}

			renderer.render(scene, camera);
			requestAnimationFrame(render);
		}
		requestAnimationFrame(render);

		/**
		 * //////////////////////////////
		 * Setup all event listeners
		 * //////////////////////////////
		 */
		// Key down
		document.addEventListener('keydown', (e) => {
			switch (e.key) {
				case 'w': {
					$keysPressed.W = true;
					break;
				}
				case 's': {
					$keysPressed.S = true;
					break;
				}
				case 'a': {
					$keysPressed.A = true;
					break;
				}
				case 'd': {
					$keysPressed.D = true;
					break;
				}
				case ' ': {
					$keysPressed.SPACE = true;
					break;
				}
			}
		});
		// Key up
		document.addEventListener('keyup', (e) => {
			switch (e.key) {
				case 'w': {
					if ((!$mousePressed.RIGHT || !$mousePressed.LEFT) && !$mousePressed.MIDDLE) $keysPressed.W = false;
					break;
				}
				case 's': {
					$keysPressed.S = false;
					break;
				}
				case 'a': {
					$keysPressed.A = false;
					break;
				}
				case 'd': {
					$keysPressed.D = false;
					break;
				}
				case ' ': {
					$keysPressed.SPACE = false;
					break;
				}
			}
		});

		/** Setup Pointer Lock */
		canvas.requestPointerLock = canvas.requestPointerLock;
		document.exitPointerLock = document.exitPointerLock;

		// Mouse down (0 - left, 1 - middle, 2 - right)
		document.addEventListener('mousedown', (e) => {
			if (e.button === 0) {
				$mousePressed.LEFT = true;
				lockPointer();
				if ($mousePressed.RIGHT) $keysPressed.W = true;
			}
			if (e.button === 1) {
				$mousePressed.MIDDLE = true;
				lockPointer();
				$keysPressed.W = true;
			}
			if (e.button === 2) {
				$mousePressed.RIGHT = true;
				lockPointer();
				if ($mousePressed.LEFT) $keysPressed.W = true;
			}
		});
		// Mouse up
		document.addEventListener('mouseup', (e) => {
			// Update the mouse pressed obj
			if (e.button === 0) $mousePressed.LEFT = false;
			if (e.button === 1) $mousePressed.MIDDLE = false;
			if (e.button === 2) $mousePressed.RIGHT = false;

			// Cancel mouse run
			const lrMouseRun = $mousePressed.LEFT && $mousePressed.RIGHT;
			if (!lrMouseRun && !$mousePressed.MIDDLE) $keysPressed.W = false;

			// Exit pointer lock
			if (!($mousePressed.LEFT || $mousePressed.MIDDLE || $mousePressed.RIGHT)) unlockPointer();
		});
		// Pointer Locked
		document.addEventListener('pointerlockchange', () => {
			document.pointerLockElement === canvas ? pointerLocked.set(true) : pointerLocked.set(false);
		});
		// Pointer Lock timer
		let pointerLockTimer: NodeJS.Timeout;
		function lockPointer() {
			// Clear any old timers, and start a new timer
			clearTimeout(pointerLockTimer);
			pointerLockTimer = setTimeout(() => {
				if ($pointerLocked) return;
				if (!($mousePressed.LEFT || $mousePressed.MIDDLE || $mousePressed.RIGHT)) return;
				if (canvas) canvas.requestPointerLock();
			}, 30);
		}
		function unlockPointer() {
			clearTimeout(pointerLockTimer);
			document.exitPointerLock();
		}
		// Mouse scrollasa
		document.addEventListener('wheel', (e) => {
			e.preventDefault();
			idealZoom += e.deltaY / 500;
			if (idealZoom > 10) idealZoom = 10;
			if (idealZoom < 3) idealZoom = 3;
		});
		// Mouse move
		document.addEventListener('mousemove', (e) => mouseChange.set({ x: e.movementX, y: e.movementY }));
	}

	/** Make instances of an object in the scene */
	function makeInstance(
		scene: THREE.Scene,
		geometry: any,
		color: THREE.ColorRepresentation,
		pos: THREE.Vector3,
		rot: THREE.Euler
	) {
		const material = new THREE.MeshPhongMaterial({ color });

		const object = new THREE.Mesh(geometry, material);
		scene.add(object);

		object.position.copy(pos);
		object.rotation.copy(rot);

		return object;
	}

	/** Connect to socket io */
	onMount(() => {
		connect();
	});

	/** Socket will get the player details and will create the player */
	$: if ($ourPlayer) main();
</script>

<svelte:head>
	<title>Three JS Game - MMORPG</title>
</svelte:head>
<svelte:window on:contextmenu={(e) => e.preventDefault()} />

<canvas id="c" bind:this={canvas} />

<style>
	#c {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
