<script lang="ts">
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';
	import { BRAND_NAME, PRODUCT_NAME } from '$lib/shared/site-meta';
	import { cn } from '$lib/utils.js';

	let {
		href,
		adaptiveLogo = false,
		logoClass = 'size-8 shrink-0 rounded-sm',
		class: className,
		...rest
	}: {
		href?: string;
		adaptiveLogo?: boolean;
		logoClass?: string;
		class?: string;
	} & Record<string, unknown> = $props();

	const rootClass = $derived(cn('flex min-w-0 items-center gap-3', className));
</script>

{#snippet mark()}
	{#if adaptiveLogo}
		<UrixoftLogo class={cn(logoClass, 'dark:hidden')} />
		<UrixoftLogo variant="white" class={cn(logoClass, 'hidden dark:block')} />
	{:else}
		<UrixoftLogo class={logoClass} />
	{/if}
	<div class="min-w-0 text-sm leading-tight">
		<p class="truncate font-semibold">{BRAND_NAME}</p>
		<p class="text-muted-foreground truncate text-xs">{PRODUCT_NAME}</p>
	</div>
{/snippet}

{#if href}
	<a {href} class={rootClass} {...rest}>
		{@render mark()}
	</a>
{:else}
	<div class={rootClass}>
		{@render mark()}
	</div>
{/if}
