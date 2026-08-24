<script lang="ts">
	import { page } from '$app/state';
	import * as Command from '$lib/components/ui/command/index.js';
	import { getAppNavGroups, getProfileNavItems } from '$lib/navigation/app-nav';
	import { cn } from '$lib/utils.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { onMount } from 'svelte';

	let {
		workspaceRole = null
	}: {
		workspaceRole?: string | null;
	} = $props();

	let open = $state(false);

	const navGroups = $derived(getAppNavGroups(page.data.workspace?.enabledPackages ?? []));
	const profileNavItems = $derived(getProfileNavItems(workspaceRole));

	const isMac = $derived(
		typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
	);

	const shortcutLabel = $derived(isMac ? '⌘K' : 'Ctrl+K');

	const searchFieldClass =
		'border-input/60 bg-muted/30 text-muted-foreground hover:bg-muted/50 rounded-lg border transition-colors';

	function handleKeydown(event: KeyboardEvent) {
		if (event.key.toLowerCase() !== 'k') {
			return;
		}

		const modifier = isMac ? event.metaKey : event.ctrlKey;

		if (!modifier || event.shiftKey || event.altKey) {
			return;
		}

		event.preventDefault();
		open = true;
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);

		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

<button
	type="button"
	class={cn(searchFieldClass, 'inline-flex h-10 w-10 shrink-0 items-center justify-center md:hidden')}
	onclick={() => {
		open = true;
	}}
	aria-label="Open search"
>
	<SearchIcon class="size-4 opacity-60" />
</button>

<button
	type="button"
	class={cn(
		searchFieldClass,
		'relative hidden h-10 w-44 items-center pr-2 pl-9 text-left text-sm sm:w-52 md:flex lg:w-72'
	)}
	onclick={() => {
		open = true;
	}}
	aria-label="Open search"
>
	<SearchIcon class="absolute top-1/2 left-3 size-4 shrink-0 -translate-y-1/2 opacity-60" />
	<span class="flex-1 truncate">Search...</span>
	<kbd
		class="bg-background text-muted-foreground pointer-events-none hidden h-5 shrink-0 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium lg:inline-flex"
	>
		{shortcutLabel}
	</kbd>
</button>

<Command.Dialog bind:open title="Search" description="Search pages and resources">
	<Command.Input placeholder="Search pages and resources..." />
	<Command.List>
		<Command.Empty>No results found.</Command.Empty>
		{#each navGroups as group (group.label)}
			<Command.Group heading={group.label}>
				{#each group.items as item (item.href)}
					<Command.LinkItem
						href={item.href}
						target={item.external ? '_blank' : undefined}
						rel={item.external ? 'noreferrer noopener' : undefined}
						onSelect={() => {
							open = false;
						}}
					>
						<item.icon />
						<span>{item.title}</span>
					</Command.LinkItem>
				{/each}
			</Command.Group>
		{/each}
		{#if profileNavItems.length > 0}
			<Command.Group heading="Settings">
				{#each profileNavItems as item (item.href)}
					<Command.LinkItem
						href={item.href}
						onSelect={() => {
							open = false;
						}}
					>
						<item.icon />
						<span>{item.title}</span>
					</Command.LinkItem>
				{/each}
			</Command.Group>
		{/if}
	</Command.List>
</Command.Dialog>
