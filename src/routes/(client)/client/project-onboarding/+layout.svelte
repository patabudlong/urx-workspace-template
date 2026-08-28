<script lang="ts">
	import StandalonePageShell from '$lib/components/standalone-page-shell.svelte';

	let { children } = $props();
</script>

<StandalonePageShell href="/">
	<div class="mx-auto max-w-2xl px-6 py-10">
		{@render children?.()}
	</div>
</StandalonePageShell>
