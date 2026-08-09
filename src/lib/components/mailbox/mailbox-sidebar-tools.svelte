<script lang="ts">
	import ListSearchInput from '$lib/components/list/list-search-input.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { encodeMailboxFolder } from '$lib/mailbox/utils';
	import { cn } from '$lib/utils.js';
	import { goto, invalidate } from '$app/navigation';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';

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
	let refreshing = $state(false);

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

	async function refresh() {
		if (refreshing || !configured) {
			return;
		}

		refreshing = true;
		try {
			await Promise.all([invalidate('mailbox:messages'), invalidate('mailbox:folders')]);
		} finally {
			refreshing = false;
		}
	}
</script>

{#if configured}
	<div class={cn('flex flex-col gap-2', className)}>
		<div class="flex items-center gap-2">
			<ListSearchInput
				bind:value={draft}
				placeholder="Search mail..."
				ariaLabel="Search mail in this folder"
				class="h-9 min-w-0 flex-1 sm:w-auto lg:w-auto"
			/>
			<Button
				type="button"
				variant="outline"
				size="icon"
				class="size-9 shrink-0"
				aria-label="Refresh mailbox"
				disabled={refreshing}
				onclick={() => void refresh()}
			>
				<RefreshCwIcon class={cn('size-4', refreshing && 'animate-spin')} aria-hidden="true" />
			</Button>
		</div>
	</div>
{/if}
