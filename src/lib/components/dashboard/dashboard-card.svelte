<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = 'default',
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { size?: 'default' | 'sm' } = $props();
</script>

<Card.Root bind:ref class={cn('shadow-sm', className)} {size} {...restProps}>
	{@render children?.()}
</Card.Root>
