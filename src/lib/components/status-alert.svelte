<script lang="ts" module>
	import type { Component } from 'svelte';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	export type StatusAlertVariant = 'info' | 'warning' | 'danger' | 'success' | 'plain';

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
			Icon: TriangleAlertIcon
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

	let {
		variant = 'plain',
		title,
		description,
		class: className
	}: {
		variant?: StatusAlertVariant;
		title: string;
		description: string;
		class?: string;
	} = $props();

	const config = $derived(variantConfig[variant]);
	const Icon = $derived(config.Icon);
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
		<p class="font-medium leading-snug">{title}</p>
		<p class="text-sm leading-relaxed opacity-90">{description}</p>
	</div>
</div>
