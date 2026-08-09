<script lang="ts">
	import MailboxMessageList from '$lib/components/mailbox/mailbox-message-list.svelte';
	import MailboxMessageListSkeleton from '$lib/components/mailbox/mailbox-message-list-skeleton.svelte';
	import MailboxMessagePanel from '$lib/components/mailbox/mailbox-message-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { MailboxFolder, MailboxMessageSummary } from '$lib/shared/mailbox/schemas';
	import { setMailboxMessagePrefetchEnabled } from '$lib/mailbox/client';
	import { getMailboxFolderLabel, isMailboxInboxPath } from '$lib/mailbox/utils';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { tick } from 'svelte';

	type MailboxListData = {
		messages: MailboxMessageSummary[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			hasMore: boolean;
		};
	};

	let { data, children } = $props();

	let mailbox = $state<MailboxListData | null>(null);
	let mailboxFolder = $state<string | null>(null);
	let mailboxPage = $state<number | null>(null);
	let mailboxLoadFailed = $state<Error | null>(null);
	let pendingUid = $state<number | null>(null);
	let listScroller = $state<HTMLDivElement | undefined>();
	let listScrollTop = $state(0);

	$effect(() => {
		const folder = data.folder;
		const pageNum = data.page;
		const next = data.mailbox as Promise<MailboxListData> | MailboxListData;
		mailboxLoadFailed = null;

		if (!next || typeof (next as Promise<MailboxListData>).then !== 'function') {
			mailbox = next as MailboxListData;
			mailboxFolder = folder;
			mailboxPage = pageNum;
			setMailboxMessagePrefetchEnabled(true);
			return;
		}

		// Clear only when folder/page changes — keep the list during message opens.
		if (mailboxFolder !== folder || mailboxPage !== pageNum) {
			mailbox = null;
			setMailboxMessagePrefetchEnabled(false);
		}

		void (next as Promise<MailboxListData>)
			.then((resolved) => {
				if (folder === data.folder && pageNum === data.page) {
					mailbox = resolved;
					mailboxFolder = folder;
					mailboxPage = pageNum;
					setMailboxMessagePrefetchEnabled(true);
				}
			})
			.catch((error: unknown) => {
				if (folder === data.folder && pageNum === data.page) {
					mailboxLoadFailed =
						error instanceof Error ? error : new Error('Failed to load messages.');
					mailbox = null;
					mailboxFolder = null;
					mailboxPage = null;
					setMailboxMessagePrefetchEnabled(false);
				}
			});
	});

	const isInboxFolder = $derived(isMailboxInboxPath(data.folder));

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
	const previewMessage = $derived.by(() => {
		if (targetUid == null || !mailbox) {
			return null;
		}

		return mailbox.messages.find((message) => message.uid === targetUid) ?? null;
	});

	$effect(() => {
		if (routeUid != null && routeUid === pendingUid) {
			pendingUid = null;
		}
	});

	$effect(() => {
		routeUid;

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

	function updateMessageInList(
		uid: number,
		patch: Partial<Pick<MailboxMessageSummary, 'seen' | 'flagged'>>
	) {
		if (!mailbox) {
			return;
		}

		const index = mailbox.messages.findIndex((message) => message.uid === uid);
		if (index === -1) {
			return;
		}

		const current = mailbox.messages[index];
		if (current.seen === patch.seen && current.flagged === patch.flagged) {
			return;
		}

		const messages = mailbox.messages.slice();
		messages[index] = { ...current, ...patch };
		mailbox = { ...mailbox, messages };
	}
</script>

{#snippet messageListPane(mailbox: MailboxListData)}
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
			preview={previewMessage}
			onListUpdate={updateMessageInList}
			class="min-h-0 flex-1 lg:h-full"
		/>
	</Card.Content>
{/snippet}

<Card.Root class="flex min-h-0 min-w-0 flex-1 flex-col gap-0 rounded-none py-0">
	{#if mailboxLoadFailed}
		<div class="p-4 sm:p-6">
			<StatusAlert
				variant="danger"
				title="Messages unavailable"
				description={mailboxLoadFailed.message}
			/>
		</div>
	{:else if mailbox}
		{@render messageListPane(mailbox)}
	{:else}
		<Card.Content
			class="flex min-h-0 flex-1 flex-col overflow-hidden p-0 lg:grid lg:h-full lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]"
		>
			<div class="border-border min-h-0 flex-1 overflow-y-auto max-lg:border-b lg:h-full lg:flex-none lg:border-r">
				<MailboxMessageListSkeleton layout="panel" />
			</div>
			<MailboxMessagePanel
				folder={data.folder}
				targetUid={null}
				class="min-h-0 flex-1 lg:h-full"
			/>
		</Card.Content>
	{/if}
</Card.Root>

{@render children()}
