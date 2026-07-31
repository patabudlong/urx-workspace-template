<script lang="ts">
	import logo from '$lib/assets/urixoft-logo.png';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		alt = 'Urixoft'
	}: {
		class?: string;
		alt?: string;
	} = $props();
</script>

<img src={logo} alt={alt} class={cn('object-contain', className)} />
