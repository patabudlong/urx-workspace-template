<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { cn } from '$lib/utils.js';

	let {
		title,
		description,
		class: className,
		children,
		actions
	}: {
		title: string;
		description: string;
		class?: string;
		children: Snippet;
		actions: Snippet;
	} = $props();
</script>

<Card.Root class={cn('overflow-hidden border shadow-sm', className)}>
	<Card.Header class="border-b">
		<Card.Title class="text-xl tracking-tight">{title}</Card.Title>
		<Card.Description class="max-w-2xl text-sm leading-relaxed">{description}</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-0 p-4 sm:p-6">
		{@render children()}
	</Card.Content>
	<Card.Footer
		class="bg-muted/30 supports-backdrop-filter:bg-muted/40 sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 border-t px-4 py-4 backdrop-blur sm:px-6"
	>
		{@render actions()}
	</Card.Footer>
</Card.Root>
