<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import DashboardCard from '$lib/components/dashboard/dashboard-card.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { cn } from '$lib/utils.js';

	type TrendDirection = 'up' | 'down' | 'neutral';

	let {
		label,
		value,
		hint,
		period,
		trend,
		icon,
		iconClass,
		class: className
	}: {
		label: string;
		value: string;
		hint?: string;
		period?: string;
		trend?: { label: string; direction?: TrendDirection };
		icon?: string;
		iconClass?: string;
		class?: string;
	} = $props();

	const trendClass = $derived(
		trend?.direction === 'up'
			? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
			: trend?.direction === 'down'
				? 'bg-destructive/10 text-destructive'
				: 'bg-muted text-muted-foreground'
	);

	const showFooter = $derived(Boolean(period || trend || hint));
</script>

<DashboardCard class={cn('h-full', className)}>
	<Card.Header class="pb-2">
		<div class="flex items-start justify-between gap-3">
			<Card.Description class="text-xs font-medium tracking-wide uppercase">{label}</Card.Description>
			{#if icon}
				<div
					class={cn(
						'bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg',
						iconClass
					)}
				>
					<AppIcon {icon} size="md" />
				</div>
			{/if}
		</div>
		<Card.Title class="text-2xl font-semibold tracking-tight">{value}</Card.Title>
	</Card.Header>
	{#if showFooter}
		<Card.Content class="space-y-2 pt-0">
			{#if period || trend}
				<div class="flex items-center justify-between gap-3">
					{#if period}
						<p class="text-muted-foreground text-sm">{period}</p>
					{:else}
						<span aria-hidden="true"></span>
					{/if}
					{#if trend}
						<span class={cn('rounded-md px-2 py-0.5 text-xs font-medium', trendClass)}>
							{trend.label}
						</span>
					{/if}
				</div>
			{/if}
			{#if hint}
				<p class="text-muted-foreground text-sm leading-relaxed">{hint}</p>
			{/if}
		</Card.Content>
	{/if}
</DashboardCard>
