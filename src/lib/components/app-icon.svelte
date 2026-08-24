<script lang="ts">
	import { cn } from '$lib/utils.js';

	const sizePx = {
		sm: 16,
		md: 20,
		lg: 24
	} as const;

	type AppIconSize = keyof typeof sizePx;

	let {
		icon,
		size = 'md',
		class: className,
		'aria-hidden': ariaHidden
	}: {
		icon: string;
		size?: AppIconSize;
		class?: string;
		'aria-hidden'?: boolean | 'true' | 'false';
	} = $props();

	const dimension = $derived(sizePx[size]);
</script>

<iconify-icon
	{icon}
	width={dimension}
	height={dimension}
	class={cn('inline-block shrink-0 align-[-0.125em]', className)}
	aria-hidden={ariaHidden}
></iconify-icon>
