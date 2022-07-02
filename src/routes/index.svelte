<script lang="ts">
	// Components
	import Canvas from '$lib/Canvas.svelte';
	import Ui from '$lib/UI/UI.svelte';

	// State
	let showingUI = false;
</script>

<div class="relative w-full h-screen">
	{#if showingUI}
		<Ui />
	{/if}
	<Canvas />
</div>
