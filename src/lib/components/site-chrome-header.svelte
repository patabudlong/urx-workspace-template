<script lang="ts">
	import SiteBrandMark from '$lib/components/site-brand-mark.svelte';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		href,
		actions,
		class: className
	}: {
		href?: string;
		actions?: Snippet;
		class?: string;
	} = $props();
</script>

<header
	class={cn(
		'border-border/60 bg-background/95 sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 backdrop-blur sm:px-6',
		className
	)}
>
	<SiteBrandMark {href} />
	{#if actions}
		<div class="flex shrink-0 items-center gap-2 sm:gap-3">
			{@render actions()}
		</div>
	{/if}
</header>
