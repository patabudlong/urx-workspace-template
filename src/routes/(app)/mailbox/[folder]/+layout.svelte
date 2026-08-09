<script lang="ts">
	import MailboxMessageList from '$lib/components/mailbox/mailbox-message-list.svelte';
	import MailboxMessagePanel from '$lib/components/mailbox/mailbox-message-panel.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
	import { getMailboxFolderLabel, isMailboxInboxPath } from '$lib/mailbox/utils';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { tick } from 'svelte';

	let { data, children } = $props();

	let pendingUid = $state<number | null>(null);
	let listScroller = $state<HTMLDivElement | undefined>();
	let listScrollTop = $state(0);

	const isInboxFolder = $derived(isMailboxInboxPath(data.folder));
	const mailbox = $derived(data.mailbox);

	const folderLabel = $derived.by(() => {
		const folders = page.data.folders;
		if (Array.isArray(folders)) {
			const match = folders.find((folder: MailboxFolder) => folder.path === data.folder);
			if (match) {
				return getMailboxFolderLabel(match);
			}
		}

		return data.folder;
	});

	const routeUid = $derived.by(() => {
		const uid = page.params.uid;
		if (!uid) {
			return null;
		}

		const parsed = Number(uid);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
	});

	const targetUid = $derived(pendingUid ?? routeUid);
	const activeUid = $derived(routeUid ?? pendingUid ?? undefined);

	$effect(() => {
		if (routeUid != null && routeUid === pendingUid) {
			pendingUid = null;
		}
	});

	$effect(() => {
		routeUid;
		mailbox.messages;

		const savedTop = listScrollTop;
		void tick().then(() => {
			if (listScroller) {
				listScroller.scrollTop = savedTop;
			}
		});
	});

	function captureListScroll() {
		if (listScroller) {
			listScrollTop = listScroller.scrollTop;
		}
	}

	function restoreListScroll() {
		void tick().then(() => {
			if (listScroller) {
				listScroller.scrollTop = listScrollTop;
			}
		});
	}

	function openMessage(uid: number, href: string) {
		captureListScroll();
		pendingUid = uid;
		void goto(href, {
			keepFocus: true,
			noScroll: true,
			invalidateAll: false
		}).then(restoreListScroll);
	}
</script>

<Card.Root class="flex min-h-0 min-w-0 flex-1 flex-col gap-0 rounded-none py-0">
	{@const hasPagination = mailbox.pagination.page > 1 || mailbox.pagination.hasMore}
	{#if !isInboxFolder || hasPagination}
		<Card.Header
			class="border-border shrink-0 flex-row items-center justify-between gap-4 space-y-0 rounded-none border-b px-4 pt-4 pb-4"
		>
			{#if !isInboxFolder}
				<div>
					<Card.Title>{folderLabel}</Card.Title>
					<Card.Description>
						{mailbox.pagination.total === 1
							? '1 message'
							: `${mailbox.pagination.total} messages`}
					</Card.Description>
				</div>
			{/if}
			{#if hasPagination}
				<div class={isInboxFolder ? 'ms-auto flex items-center gap-2' : 'flex items-center gap-2'}>
					{#if mailbox.pagination.page > 1}
						<Button
							variant="outline"
							size="sm"
							href={`/mailbox/${page.params.folder}?page=${mailbox.pagination.page - 1}`}
						>
							Previous
						</Button>
					{/if}
					{#if mailbox.pagination.hasMore}
						<Button
							variant="outline"
							size="sm"
							href={`/mailbox/${page.params.folder}?page=${mailbox.pagination.page + 1}`}
						>
							Next
						</Button>
					{/if}
				</div>
			{/if}
		</Card.Header>
	{/if}

	<Card.Content
		class="flex min-h-0 flex-1 flex-col overflow-hidden p-0 lg:grid lg:h-full lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]"
	>
		<div
			bind:this={listScroller}
			onscroll={captureListScroll}
			class="border-border min-h-0 flex-1 overflow-y-auto max-lg:border-b lg:h-full lg:flex-none lg:border-r"
		>
			<MailboxMessageList
				folder={data.folder}
				messages={mailbox.messages}
				{activeUid}
				onOpenMessage={openMessage}
			/>
		</div>

		<MailboxMessagePanel
			folder={data.folder}
			{targetUid}
			class="min-h-0 flex-1 overflow-hidden lg:h-full"
		/>
	</Card.Content>
</Card.Root>

{@render children()}
