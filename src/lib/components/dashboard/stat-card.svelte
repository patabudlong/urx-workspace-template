<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		label,
		value,
		hint,
		icon: Icon,
		iconClass,
		class: className
	}: {
		label: string;
		value: string;
		hint?: string;
		icon?: Component;
		iconClass?: string;
		class?: string;
	} = $props();
</script>

<Card.Root class={cn('h-full', className)}>
	<Card.Header class="pb-2">
		<div class="flex items-start justify-between gap-3">
			<Card.Description class="text-xs font-medium tracking-wide uppercase">{label}</Card.Description>
			{#if Icon}
				<div
					class={cn(
						'bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg',
						iconClass
					)}
				>
					<Icon class="size-4" />
				</div>
			{/if}
		</div>
		<Card.Title class="text-2xl font-semibold tracking-tight">{value}</Card.Title>
	</Card.Header>
	{#if hint}
		<Card.Content class="pt-0">
			<p class="text-muted-foreground text-sm leading-relaxed">{hint}</p>
		</Card.Content>
	{/if}
</Card.Root>
