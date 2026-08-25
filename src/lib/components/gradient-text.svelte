<script lang="ts">
	import {
		brandGradientImage,
		type BrandGradientDirection,
		type BrandGradientTone
	} from '$lib/shared/brand-gradients';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';
	import type { SvelteHTMLElements } from 'svelte/elements';

	type ElementTag = keyof Pick<SvelteHTMLElements, 'span' | 'p' | 'h1' | 'h2' | 'h3'>;

	let {
		tone = 'primary',
		direction = 'horizontal',
		as = 'span',
		class: className,
		children
	}: {
		tone?: BrandGradientTone;
		direction?: BrandGradientDirection;
		as?: ElementTag;
		class?: string;
		children: Snippet;
	} = $props();

	const gradientImage = $derived(brandGradientImage(tone, direction));
</script>

<svelte:element
	this={as}
	class={cn('gradient-text bg-clip-text text-transparent', className)}
	style:background-image={gradientImage}
>
	{@render children()}
</svelte:element>
