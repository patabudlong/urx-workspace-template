<script lang="ts">
	import * as Command from '$lib/components/ui/command/index.js';
	import { APP_NAV_GROUPS } from '$lib/navigation/app-nav';
	import { cn } from '$lib/utils.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { onMount } from 'svelte';

	let open = $state(false);

	const isMac = $derived(
		typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
	);

	const shortcutLabel = $derived(isMac ? '⌘K' : 'Ctrl+K');

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
	class={cn(
		'bg-muted/40 text-muted-foreground hover:bg-muted/60 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent transition-colors md:hidden'
	)}
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
		'bg-muted/40 text-muted-foreground hover:bg-muted/60 hidden h-8 w-44 items-center gap-2 rounded-lg border border-transparent px-2 text-left text-sm transition-colors sm:w-52 md:flex lg:w-60'
	)}
	onclick={() => {
		open = true;
	}}
	aria-label="Open search"
>
	<SearchIcon class="size-4 shrink-0 opacity-60" />
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
		{#each APP_NAV_GROUPS as group (group.label)}
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
	</Command.List>
</Command.Dialog>
