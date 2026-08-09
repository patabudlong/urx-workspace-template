<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';

	let {
		title = 'Something went wrong',
		description,
		class: className
	}: {
		title?: string;
		description: string;
		class?: string;
	} = $props();
</script>

<StatusAlert variant="danger" {title} {description} class={className} />
