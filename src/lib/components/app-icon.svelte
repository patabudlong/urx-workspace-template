<script lang="ts">
	import { buildIcon, getIcon } from 'iconify-icon';
	import { cn } from '$lib/utils.js';

	const sizePx = {
		sm: 16,
		md: 20,
		lg: 24,
		xl: 48
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

	const svg = $derived.by(() => {
		const iconData = getIcon(icon);
		if (!iconData) {
			return null;
		}

		return buildIcon(iconData, {
			width: dimension,
			height: dimension
		});
	});
</script>

{#if svg}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={svg.attributes.width}
		height={svg.attributes.height}
		viewBox={svg.attributes.viewBox}
		class={cn('inline-block shrink-0 align-[-0.125em]', className)}
		aria-hidden={ariaHidden}
	>
		{@html svg.body}
	</svg>
{/if}
