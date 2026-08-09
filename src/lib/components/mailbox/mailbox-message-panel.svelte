<script lang="ts">
	import MailboxMessageReplyPanel from '$lib/components/mailbox/mailbox-message-reply-panel.svelte';
	import MailboxMessageToolbar from '$lib/components/mailbox/mailbox-message-toolbar.svelte';
	import MailboxMessageView from '$lib/components/mailbox/mailbox-message-view.svelte';
	import MailboxMessageViewSkeleton from '$lib/components/mailbox/mailbox-message-view-skeleton.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import {
		fetchMailboxMessage,
		getCachedMailboxMessage
	} from '$lib/mailbox/client';
	import { mailboxSummaryToPreviewDetail, type MailboxComposeMode } from '$lib/mailbox/utils';
	import type { MailboxMessageDetail, MailboxMessageSummary } from '$lib/shared/mailbox/schemas';
	import MailOpenIcon from '@lucide/svelte/icons/mail-open';
	import { page } from '$app/state';
	import { cn } from '$lib/utils.js';
	import { toast } from 'svelte-sonner';

	let {
		folder,
		targetUid,
		preview,
		onListUpdate,
		class: className
	}: {
		folder: string;
		targetUid: number | null;
		preview?: MailboxMessageSummary | null;
		onListUpdate?: (
			uid: number,
			patch: Partial<Pick<MailboxMessageDetail, 'seen' | 'flagged'>>
		) => void;
		class?: string;
	} = $props();

	let detailMessage = $state<MailboxMessageDetail | null>(null);
	let loadingBody = $state(false);
	let loadError = $state(false);
	let composeMode = $state<MailboxComposeMode | null>(null);

	const previewDetail = $derived(preview ? mailboxSummaryToPreviewDetail(preview) : null);
	const userEmail = $derived(
		page.data.connection && 'email' in page.data.connection
			? (page.data.connection.email ?? '')
			: ''
	);
	const signature = $derived(page.data.signature ?? null);

	$effect(() => {
		targetUid;
		composeMode = null;
	});

	function syncListUpdate(message: MailboxMessageDetail) {
		onListUpdate?.(message.uid, { seen: message.seen, flagged: message.flagged });
	}

	$effect(() => {
		const uid = targetUid;
		const currentFolder = folder;

		if (uid == null) {
			detailMessage = null;
			loadingBody = false;
			loadError = false;
			return;
		}

		loadError = false;

		const cached = getCachedMailboxMessage(currentFolder, uid);
		if (cached) {
			detailMessage = cached;
			loadingBody = false;

			if (!cached.seen) {
				void fetchMailboxMessage(currentFolder, uid, { markSeen: true }).then((resolved) => {
					if (targetUid !== uid || folder !== currentFolder) {
						return;
					}

					detailMessage = resolved;
					syncListUpdate(resolved);
				});
			}

			return;
		}

		loadingBody = true;
		if (detailMessage?.uid !== uid) {
			detailMessage = null;
		}

		const controller = new AbortController();
		let cancelled = false;

		void fetchMailboxMessage(currentFolder, uid, {
			signal: controller.signal,
			markSeen: true
		})
			.then((resolved) => {
				if (cancelled || targetUid !== uid || folder !== currentFolder) {
					return;
				}

				detailMessage = resolved;
				loadingBody = false;
				syncListUpdate(resolved);
			})
			.catch((error: unknown) => {
				if (cancelled || targetUid !== uid || folder !== currentFolder) {
					return;
				}

				if (error instanceof DOMException && error.name === 'AbortError') {
					return;
				}

				loadError = true;
				loadingBody = false;
				detailMessage = null;
			});

		return () => {
			cancelled = true;
			controller.abort();
		};
	});

	function handleMessageUpdated(message: MailboxMessageDetail) {
		detailMessage = message;
		syncListUpdate(message);
	}

	function handleMessageRemoved() {
		detailMessage = null;
		composeMode = null;
	}

	function handleCompose(mode: MailboxComposeMode) {
		composeMode = composeMode === mode ? null : mode;
	}

	function closeCompose() {
		composeMode = null;
	}

	function handleReplySent() {
		toast.success('Email sent', {
			description: 'Your message was delivered successfully.'
		});
		closeCompose();
	}
</script>

<section
	class={cn('bg-background flex h-full min-h-0 min-w-0 flex-col overflow-y-auto', className)}
	aria-label={targetUid ? 'Message' : 'Message preview'}
>
	{#if targetUid == null}
		<div class="flex min-h-full flex-1 items-center justify-center p-6 sm:p-10">
			<div
				class="border-border/70 bg-background flex max-w-sm flex-col items-center gap-4 rounded-xl border border-dashed px-8 py-10 text-center shadow-sm"
			>
				<div class="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
					<MailOpenIcon class="size-6" aria-hidden="true" />
				</div>
				<div class="space-y-1.5">
					<p class="text-foreground text-base font-medium">Select email to view</p>
					<p class="text-muted-foreground text-sm leading-relaxed">
						Pick a message from the list on the left to read it here.
					</p>
				</div>
			</div>
		</div>
	{:else if loadError}
		<div class="p-6">
			<StatusAlert
				variant="danger"
				title="Message unavailable"
				description="This message could not be loaded. It may have been moved or deleted."
			/>
		</div>
	{:else if detailMessage}
		<MailboxMessageToolbar
			{folder}
			message={detailMessage}
			{composeMode}
			onCompose={handleCompose}
			onUpdated={handleMessageUpdated}
			onRemoved={handleMessageRemoved}
		/>
		{#if composeMode}
			<MailboxMessageReplyPanel
				mode={composeMode}
				message={detailMessage}
				{userEmail}
				{signature}
				onClose={closeCompose}
				onSent={handleReplySent}
			/>
		{/if}
		<MailboxMessageView message={detailMessage} layout="panel" />
	{:else if previewDetail}
		<MailboxMessageView message={previewDetail} layout="panel" loadingBody />
	{:else if loadingBody}
		<MailboxMessageViewSkeleton layout="panel" />
	{/if}
</section>
