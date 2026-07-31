<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import type { Snippet } from 'svelte';

	let {
		title = 'Something went wrong',
		class: className,
		children
	}: {
		title?: string;
		class?: string;
		children: Snippet;
	} = $props();
</script>

<StatusAlert variant="danger" {title} class={className}>
	{@render children()}
</StatusAlert>
