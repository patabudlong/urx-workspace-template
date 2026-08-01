<script lang="ts">
	import SiteChromeUserActions from '$lib/components/site-chrome-user-actions.svelte';
	import StandalonePageShell from '$lib/components/standalone-page-shell.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';

	let { data, children } = $props();
</script>

<StandalonePageShell href="/">
	{#snippet actions()}
		<SiteChromeUserActions userDisplay={data.userDisplay} />
		<ThemeToggle iconClass="size-5" />
	{/snippet}

	<div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
		{@render children?.()}
	</div>
</StandalonePageShell>
