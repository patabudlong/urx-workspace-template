<script lang="ts" module>
	import type { Component } from 'svelte';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	export type StatusAlertVariant = 'info' | 'warning' | 'danger' | 'success' | 'plain';

	export const STATUS_ALERT_DEFAULT_TITLES: Record<StatusAlertVariant, string> = {
		info: 'Information',
		warning: 'Please wait',
		danger: 'Something went wrong',
		success: 'Success',
		plain: 'Note'
	};

	const variantConfig: Record<
		StatusAlertVariant,
		{
			className: string;
			iconClassName: string;
			role: 'alert' | 'status';
			Icon: Component;
		}
	> = {
		info: {
			className: 'bg-primary/10 text-primary border-primary/20',
			iconClassName: 'text-primary',
			role: 'status',
			Icon: InfoIcon
		},
		warning: {
			className:
				'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300',
			iconClassName: 'text-amber-600 dark:text-amber-400',
			role: 'alert',
			Icon: TriangleAlertIcon
		},
		danger: {
			className: 'bg-destructive/10 text-destructive border-destructive/20',
			iconClassName: 'text-destructive',
			role: 'alert',
			Icon: CircleAlertIcon
		},
		success: {
			className:
				'border-emerald-500/20 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
			iconClassName: 'text-emerald-600 dark:text-emerald-400',
			role: 'status',
			Icon: CircleCheckIcon
		},
		plain: {
			className: 'bg-muted/50 text-muted-foreground border-border/60',
			iconClassName: 'text-muted-foreground',
			role: 'status',
			Icon: InfoIcon
		}
	};
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';

	let {
		variant = 'plain',
		title,
		description,
		class: className,
		children
	}: {
		variant?: StatusAlertVariant;
		title?: string;
		description?: string;
		class?: string;
		children?: Snippet;
	} = $props();

	const config = $derived(variantConfig[variant]);
	const Icon = $derived(config.Icon);
	const resolvedTitle = $derived(title ?? STATUS_ALERT_DEFAULT_TITLES[variant]);
</script>

<div
	class={cn(
		'flex gap-2 rounded-lg border px-3 py-2.5 text-sm',
		config.className,
		className
	)}
	role={config.role}
>
	<Icon class={cn('mt-0.5 size-4 shrink-0', config.iconClassName)} aria-hidden="true" />
	<div class="min-w-0 flex-1 space-y-0.5">
		<p class="font-medium leading-snug">{resolvedTitle}</p>
		{#if description}
			<p class="text-sm leading-relaxed opacity-90">{description}</p>
		{:else if children}
			<div class="text-sm leading-relaxed opacity-90">
				{@render children()}
			</div>
		{/if}
	</div>
</div>
