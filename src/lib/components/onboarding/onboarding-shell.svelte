<script lang="ts">
	import SiteChromeUserActions from '$lib/components/site-chrome-user-actions.svelte';
	import StandalonePageShell from '$lib/components/standalone-page-shell.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import type { UserDisplay } from '$lib/shared/user-display';
	import type { Snippet } from 'svelte';

	let {
		children,
		userDisplay
	}: {
		children: Snippet;
		userDisplay: UserDisplay;
	} = $props();
</script>

<StandalonePageShell mainClass="overflow-y-auto">
	{#snippet actions()}
		<SiteChromeUserActions {userDisplay} />
		<ThemeToggle iconClass="size-5" />
	{/snippet}

	{@render children?.()}
</StandalonePageShell>
