<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		eyebrow,
		title,
		description,
		actions,
		children
	}: {
		eyebrow?: string;
		title: string;
		description?: string;
		actions?: Snippet;
		children?: Snippet;
	} = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div class="min-w-0 space-y-1">
		{#if eyebrow}
			<p class="text-primary text-sm font-semibold">{eyebrow}</p>
		{/if}
		<h2 class="text-2xl font-semibold tracking-tight">{title}</h2>
		{#if description}
			<p class="text-muted-foreground max-w-2xl text-sm leading-relaxed">{description}</p>
		{/if}
		{#if children}
			<div class="pt-1">
				{@render children()}
			</div>
		{/if}
	</div>

	{#if actions}
		<div class="flex shrink-0 flex-wrap items-center gap-2">
			{@render actions()}
		</div>
	{/if}
</div>
