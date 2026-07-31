<script lang="ts">
	import { cn } from '$lib/utils.js';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children
	}: {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<div
	class={cn(
		'bg-destructive/10 text-destructive flex gap-2 rounded-lg border border-destructive/20 px-3 py-2 text-sm',
		className
	)}
	role="alert"
>
	<CircleAlertIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
	<div class="min-w-0 flex-1">{@render children()}</div>
</div>
