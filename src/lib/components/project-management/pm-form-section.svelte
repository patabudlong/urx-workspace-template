<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';

	let {
		title,
		description,
		class: className,
		children
	}: {
		title: string;
		description?: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<section class={cn('space-y-4', className)}>
	<div class="space-y-1">
		<h3 class="text-base font-semibold tracking-tight">{title}</h3>
		{#if description}
			<p class="text-muted-foreground text-sm leading-relaxed">{description}</p>
		{/if}
	</div>
	<div class="bg-muted/25 border-border/70 space-y-4 rounded-xl border p-4 sm:p-5">
		{@render children()}
	</div>
</section>
