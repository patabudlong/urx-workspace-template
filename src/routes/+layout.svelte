<script lang="ts">
	import { page } from '$app/state';
	import { brandTheme } from '$lib/brand';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { formatPageTitle } from '$lib/shared/site-meta';
	import { ModeWatcher } from 'mode-watcher';
	import '../routes/layout.css';

	let { children } = $props();

	const documentTitle = $derived(
		formatPageTitle(
			typeof page.data.meta?.title === 'string' ? page.data.meta.title : undefined
		)
	);
</script>

<svelte:head>
	<title>{documentTitle}</title>
	<style>
		:global(:root) {
			--brand-primary: {brandTheme.primary};
			--brand-primary-foreground: {brandTheme.primaryForeground};
			--brand-secondary: {brandTheme.secondary};
			--brand-secondary-foreground: {brandTheme.secondaryForeground};
			--brand-tertiary: {brandTheme.tertiary};
			--brand-tertiary-foreground: {brandTheme.tertiaryForeground};
			--primary: var(--brand-primary);
			--primary-foreground: var(--brand-primary-foreground);
			--secondary: var(--brand-secondary);
			--secondary-foreground: var(--brand-secondary-foreground);
			--tertiary: var(--brand-tertiary);
			--tertiary-foreground: var(--brand-tertiary-foreground);
			--sidebar-primary: var(--brand-primary);
			--sidebar-primary-foreground: var(--brand-primary-foreground);
		}
	</style>
</svelte:head>

<ModeWatcher />
<Toaster richColors closeButton />

{@render children()}
