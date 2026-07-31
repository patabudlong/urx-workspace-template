<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children
	}: {
		class?: string;
		children: Snippet;
	} = $props();
</script>

<StatusAlert variant="danger" class={className}>
	{@render children()}
</StatusAlert>
