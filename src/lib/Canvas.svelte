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
		const far = 5;
		const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
		camera.position.z = 2;

		/** Create the scene */
		const scene = new THREE.Scene();

		/** Create a new box geometry */
		const boxWidth = 1;
		const boxHeight = 1;
		const boxDepth = 1;
		const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

		/** Create a new material */
		const material = new THREE.MeshPhongMaterial({ color: 0x44aa88 });

		/** Create a box --- Create a new mesh with using the box geometry + material  */
		const cube = new THREE.Mesh(geometry, material);

		/** Function to make instances of an object in the scene */
		function makeInstance(geometry: any, color: THREE.ColorRepresentation, x: number) {
			const material = new THREE.MeshPhongMaterial({ color });

			const cube = new THREE.Mesh(geometry, material);
			scene.add(cube);

			cube.position.x = x;

			return cube;
		}

		/** Make 3 cubes in the scene using the instance function */
		/** makeInstance returns the cube so we can access it in this array to manipulate */
		const cubes = [
			makeInstance(geometry, 0x44aa88, 0),
			makeInstance(geometry, 0x8844aa, -2),
			makeInstance(geometry, 0xaa8844, 2),
		];

		/** Create a directional light */
		const color = 0xffffff;
		const intensity = 1;
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(-1, 2, 4);

		/** Add the light to the scene */
		scene.add(light);

		/** Tell THREE js to render the scene */
		renderer.render(scene, camera);

		function render(time: number) {
			time *= 0.001; // convert time to seconds

			cubes.forEach((cube, ndx) => {
				const speed = 1 + ndx * 0.1;
				const rot = time * speed;
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

<canvas id="c" width="1280" height="720" />
