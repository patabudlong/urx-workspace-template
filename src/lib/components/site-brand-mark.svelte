<script lang="ts">
	import GradientText from '$lib/components/gradient-text.svelte';
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';
	import { APP_NAME, BRAND_NAME, PRODUCT_NAME } from '$lib/shared/site-meta';
	import { cn } from '$lib/utils.js';

	let {
		href,
		adaptiveLogo = false,
		iconOnly = false,
		/** `stacked` shows brand + product on two lines; `combined` shows full app name. */
		nameFormat = 'stacked',
		gradientProduct = false,
		logoClass = 'size-8 shrink-0 rounded-sm',
		class: className,
		...rest
	}: {
		href?: string;
		adaptiveLogo?: boolean;
		iconOnly?: boolean;
		nameFormat?: 'stacked' | 'combined';
		gradientProduct?: boolean;
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
	{#if !iconOnly}
		<div class="min-w-0 text-sm leading-tight">
			{#if nameFormat === 'combined'}
				<p class="truncate font-semibold">{APP_NAME}</p>
			{:else}
				<p class="truncate font-semibold">{BRAND_NAME}</p>
				{#if gradientProduct}
					<GradientText tone="primary" as="p" class="truncate text-xs font-medium">
						{PRODUCT_NAME}
					</GradientText>
				{:else}
					<p class="text-muted-foreground truncate text-xs">{PRODUCT_NAME}</p>
				{/if}
			{/if}
		</div>
	{/if}
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
