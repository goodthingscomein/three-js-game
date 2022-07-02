<script lang="ts">
	import Button from './elements/Button.svelte';
</script>

<div class="absolute inset-0 py-4 px-8 z-50 flex flex-col">
	<span class="w-full flex items-center">
		<Button>Top Left</Button>
		<span class="mr-auto" />
		<Button>Top Center</Button>
		<span class="ml-auto" />
		<Button>Top Right</Button>
	</span>
	<div class="w-full mt-auto mb-auto flex items-center justify-center">
		<div class="h-52 w-36 bg-white">Wowie, a card</div>
	</div>
	<span class="w-full flex items-center">
		<Button>Bottom Left</Button>
		<span class="mr-auto" />
		<Button>Bottom Center</Button>
		<span class="ml-auto" />
		<Button>Bottom Right</Button>
	</span>
</div>
