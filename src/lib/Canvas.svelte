<script lang="ts" type="module">
	import * as THREE from 'three';
	import { onMount } from 'svelte';

	function main() {
		const canvas = document.querySelector('#c');
		if (!canvas) {
			console.log('Could not find the canvas');
			return;
		}
		const renderer = new THREE.WebGLRenderer({ canvas });

		/** Create the camera */
		const fov = 75;
		const aspect = 2; // the canvas default
		const near = 0.1;
		const far = 10000;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.z = 5;
		camera.position.y = 2;
		camera.rotateX(-0.25);

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
		const cubes = [
			makeInstance(boxGeometry, 0x44aa88, new THREE.Vector3(0, 1, 0)),
			makeInstance(boxGeometry, 0x8844aa, new THREE.Vector3(-2, 1, 0)),
			makeInstance(boxGeometry, 0xaa8844, new THREE.Vector3(2, 1, 0)),
		];

		const plane = makeInstance(planeGeometry, 0xffffff, new THREE.Vector3(0, 0, 0));
		plane.rotateX(-1.5708);

		/** Create a directional light */
		const color: THREE.ColorRepresentation = 0xffffff;
		const intensity: number = 0.6;
		const directionalLight = new THREE.DirectionalLight(color, intensity);
		directionalLight.position.set(-1, 2, 4);

		/** Create an ambient light */
		const ambientLight = new THREE.AmbientLight(color, 0.3);

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

		/** Setup THREE JS render loop */
		function render(time: number) {
			time *= 0.001; // convert time to seconds

			/** Updates the resolution of the renderer to match the size of the canvas */
			if (resizeRendererToDisplaySize(renderer)) {
				const canvas = renderer.domElement;
				camera.aspect = canvas.clientWidth / canvas.clientHeight;
				camera.updateProjectionMatrix();
			}

			cubes.forEach((cube, ndx) => {
				const speed = 1 + ndx * 0.1;
				const rot = (time * speed) / 10;
				cube.rotation.x = rot;
				cube.rotation.y = rot;
			});

			renderer.render(scene, camera);
			requestAnimationFrame(render);
		}
		requestAnimationFrame(render);
	}

	/** Start the THREE JS loop / initialisation once the canvas has been mounted */
	onMount(() => {
		main();
	});
</script>

<canvas id="c" />

<style>
	#c {
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
