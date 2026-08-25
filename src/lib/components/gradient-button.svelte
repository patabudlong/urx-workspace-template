<script lang="ts">
	import { Button, type ButtonProps } from '$lib/components/ui/button/index.js';
	import {
		gradientButtonClasses,
		type BrandGradientTone
	} from '$lib/shared/brand-gradients';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		tone = 'primary',
		appearance = 'filled',
		class: className,
		children,
		...restProps
	}: ButtonProps & {
		tone?: BrandGradientTone;
		appearance?: 'filled' | 'outline';
		children: Snippet;
	} = $props();
</script>

<Button
	{...restProps}
	variant="ghost"
	class={cn(
		gradientButtonClasses(tone, appearance),
		'hover:bg-transparent active:bg-transparent dark:hover:bg-transparent',
		className
	)}
>
	{@render children()}
</Button>
