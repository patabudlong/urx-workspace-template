<script lang="ts">
	import ListSearchInput from '$lib/components/list/list-search-input.svelte';
	import { encodeMailboxFolder } from '$lib/mailbox/utils';
	import { cn } from '$lib/utils.js';
	import { goto } from '$app/navigation';

	let {
		configured = true,
		activeFolder = '',
		searchQuery = '',
		class: className
	}: {
		configured?: boolean;
		activeFolder?: string;
		searchQuery?: string;
		class?: string;
	} = $props();

	let draft = $state('');

	$effect(() => {
		draft = searchQuery;
	});

	$effect(() => {
		if (!configured) {
			return;
		}

		const next = draft.trim();
		const current = searchQuery.trim();
		if (next === current) {
			return;
		}

		const timeout = setTimeout(() => {
			void applySearch(next);
		}, 350);

		return () => clearTimeout(timeout);
	});

	function targetFolderPath(): string {
		return activeFolder || 'INBOX';
	}

	async function applySearch(query: string) {
		const folder = targetFolderPath();
		const base = `/mailbox/${encodeMailboxFolder(folder)}`;
		const href = query ? `${base}?q=${encodeURIComponent(query)}` : base;
		await goto(href, {
			keepFocus: true,
			noScroll: true,
			invalidateAll: false
		});
	}
</script>

{#if configured}
	<div class={cn('w-full', className)}>
		<ListSearchInput
			bind:value={draft}
			placeholder="Search mail..."
			ariaLabel="Search mail in this folder"
			class="border-border bg-background h-9 w-full min-w-0 border sm:w-full lg:w-full dark:border-border dark:bg-background"
		/>	</div>
{/if}
