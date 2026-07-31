<script lang="ts">
	import { brandTheme } from '$lib/brand';
	import { ModeWatcher } from 'mode-watcher';
	import '../routes/layout.css';

	let { children } = $props();
</script>

<svelte:head>
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

{@render children()}
