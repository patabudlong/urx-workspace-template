<script lang="ts">
	import SiteChromeFooter from '$lib/components/site-chrome-footer.svelte';
	import SiteChromeHeader from '$lib/components/site-chrome-header.svelte';
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		children,
		actions,
		href,
		headerClass,
		mainClass
	}: {
		children: Snippet;
		actions?: Snippet;
		href?: string;
		headerClass?: string;
		mainClass?: string;
	} = $props();
</script>

<div class="bg-background flex min-h-svh flex-col">
	<SiteChromeHeader {href} {actions} class={headerClass} />
	<main class={cn('min-h-0 flex-1', mainClass)}>
		{@render children()}
	</main>
	<SiteChromeFooter />
</div>
