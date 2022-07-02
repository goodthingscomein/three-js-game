<script lang="ts" type="module">
	import * as THREE from 'three';
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;

	/**
	 * Handle the mouse functions for the player / camera
	 */
	// Mouse change
	let mouseChange = { x: 0, y: 0 };

	// Mouse buttons down
	let mousePressed = {
		LEFT: false,
		RIGHT: false,
		MIDDLE: false,
	};

	// Keys pressed
	let keysPressed = {
		W: false,
		A: false,
		S: false,
		D: false,
	};

	let pointerLocked = false;

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
		const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
		const planeGeometry = new THREE.PlaneBufferGeometry(100, 100);

		/** Make instances of an object in the scene */
		function makeInstance(geometry: any, color: THREE.ColorRepresentation, pos: THREE.Vector3) {
			const material = new THREE.MeshPhongMaterial({ color });

			const object = new THREE.Mesh(geometry, material);
			scene.add(object);

			object.position.setX(pos.x);
			object.position.setY(pos.y);
			object.position.setZ(pos.z);

			return object;
		}

		/** Make 3 cubes in the scene using the instance function */
		/** makeInstance returns the cube so we can access it in this array to manipulate */
		const cube = makeInstance(boxGeometry, 0x44aa88, new THREE.Vector3(0, 1, 0));
		makeInstance(boxGeometry, 0xffaa88, new THREE.Vector3(2, 1, 2));

		const plane = makeInstance(planeGeometry, 0xffffff, new THREE.Vector3(0, 0, 0));
		plane.rotateX(-1.5708);

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
		 * This will also act as the game loop (FOR NOW)
		 */
		function render(time: number) {
			time *= 0.001; // convert time to seconds

			/** Updates the resolution of the renderer to match the size of the canvas */
			if (resizeRendererToDisplaySize(renderer)) {
				const canvas = renderer.domElement;
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

			/** Move the cube */
			if (keysPressed.W) cube.translateZ(0.1);
			if (keysPressed.S) cube.translateZ(-0.1);
			if (keysPressed.A) cube.translateX(0.1);
			if (keysPressed.D) cube.translateX(-0.1);

			/** Rotate the cube */
			if (pointerLocked && mousePressed.RIGHT) {
				// Rotate the player
				cube.rotateY(mouseChange.x / 500);

				// Adjust the Height of the camera
				idealHeight += mouseChange.y / 200;
				if (idealHeight < 1) idealHeight = 1;
				if (idealHeight > 5) idealHeight = 5;

				// Reset mouse changed so that only new mouse movement will move camera
				mouseChange = { x: 0, y: 0 };
			}

			/** Move the camera */
			idealOffset = CalculateIdealOffset(cube);
			camera.position.copy(idealOffset);

			/** Point the camera at the cube */
			idealLookat = CalculateIdealLookat(cube);

			camera.lookAt(idealLookat);

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
					keysPressed.W = true;
					break;
				}
				case 's': {
					keysPressed.S = true;
					break;
				}
				case 'a': {
					keysPressed.A = true;
					break;
				}
				case 'd': {
					keysPressed.D = true;
					break;
				}
			}
		});
		// Key up
		document.addEventListener('keyup', (e) => {
			switch (e.key) {
				case 'w': {
					keysPressed.W = false;
					break;
				}
				case 's': {
					keysPressed.S = false;
					break;
				}
				case 'a': {
					keysPressed.A = false;
					break;
				}
				case 'd': {
					keysPressed.D = false;
					break;
				}
			}
		});

		/** Setup Pointer Lock */
		canvas.requestPointerLock = canvas.requestPointerLock;
		document.exitPointerLock = document.exitPointerLock;

		// Mouse down (0 - left, 1 - middle, 2 - right)
		document.addEventListener('mousedown', (e) => {
			if (e.button === 0) mousePressed.LEFT = true;
			if (e.button === 1) mousePressed.MIDDLE = true;
			if (e.button === 2) {
				mousePressed.RIGHT = true;
				canvas.requestPointerLock();
			}
		});
		// Mouse up
		document.addEventListener('mouseup', (e) => {
			if (e.button === 0) mousePressed.LEFT = false;
			if (e.button === 1) mousePressed.MIDDLE = false;
			if (e.button === 2) {
				mousePressed.RIGHT = false;
				document.exitPointerLock();
			}
		});
		// Pointer Locked
		document.addEventListener('pointerlockchange', () => {
			if (document.pointerLockElement === canvas) {
				pointerLocked = true;
			} else {
				pointerLocked = false;
			}
		});
		// Mouse scrollasa
		document.addEventListener('wheel', (e) => {
			e.preventDefault();
			idealZoom += e.deltaY / 500;
			if (idealZoom > 10) idealZoom = 10;
			if (idealZoom < 3) idealZoom = 3;
		});
		// Mouse move
		document.addEventListener('mousemove', (e) => {
			mouseChange = { x: e.movementX, y: e.movementY };
		});
	}

	/** Start the THREE JS loop / initialisation once the canvas has been mounted */
	onMount(() => {
		main();
	});
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
