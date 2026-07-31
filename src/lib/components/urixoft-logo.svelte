<script lang="ts">
	import logo from '$lib/assets/urixoft-logo.png';
	import logoWhite from '$lib/assets/urixoft-logo-white.png';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		alt = 'Urixoft',
		variant = 'default'
	}: {
		class?: string;
		alt?: string;
		variant?: 'default' | 'white';
	} = $props();

	const src = $derived(variant === 'white' ? logoWhite : logo);
</script>

<img src={src} alt={alt} class={cn('object-contain', className)} />
