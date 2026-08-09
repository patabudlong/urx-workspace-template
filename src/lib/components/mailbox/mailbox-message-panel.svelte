<script lang="ts">
	import MailboxMessageView from '$lib/components/mailbox/mailbox-message-view.svelte';
	import MailboxMessageViewSkeleton from '$lib/components/mailbox/mailbox-message-view-skeleton.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import {
		fetchMailboxMessage,
		getCachedMailboxMessage
	} from '$lib/mailbox/client';
	import type { MailboxMessageDetail } from '$lib/shared/mailbox/schemas';
	import MailOpenIcon from '@lucide/svelte/icons/mail-open';
	import { cn } from '$lib/utils.js';

	let {
		folder,
		targetUid,
		class: className
	}: {
		folder: string;
		targetUid: number | null;
		class?: string;
	} = $props();

	let cachedMessage = $state<MailboxMessageDetail | null>(null);
	let loadingMessage = $state(false);
	let loadError = $state(false);
	let loadedUid = $state<number | null>(null);

	$effect(() => {
		const uid = targetUid;

		if (uid == null) {
			cachedMessage = null;
			loadingMessage = false;
			loadError = false;
			loadedUid = null;
			return;
		}

		if (loadedUid === uid && cachedMessage) {
			return;
		}

		const cached = getCachedMailboxMessage(folder, uid);
		if (cached) {
			loadedUid = uid;
			cachedMessage = cached;
			loadingMessage = false;
			loadError = false;
			return;
		}

		loadedUid = uid;
		loadError = false;
		loadingMessage = true;
		cachedMessage = null;

		const controller = new AbortController();
		let cancelled = false;

		fetchMailboxMessage(folder, uid, controller.signal)
			.then((resolved) => {
				if (cancelled || targetUid !== uid) {
					return;
				}

				cachedMessage = resolved;
				loadingMessage = false;
			})
			.catch((error) => {
				if (cancelled || targetUid !== uid) {
					return;
				}

				if (error instanceof DOMException && error.name === 'AbortError') {
					return;
				}

				loadError = true;
				loadingMessage = false;
				loadedUid = null;
			});

		return () => {
			cancelled = true;
			controller.abort();
		};
	});
</script>

<section
	class={cn('bg-background flex h-full min-h-0 min-w-0 flex-col overflow-hidden', className)}
	aria-label={targetUid ? 'Message' : 'Message preview'}
>
	{#if targetUid == null}
		<div class="flex h-full min-h-0 items-center justify-center overflow-y-auto p-6 sm:p-10">
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
	{:else if loadingMessage && !cachedMessage}
		<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
			<MailboxMessageViewSkeleton layout="panel" />
		</div>
	{:else if cachedMessage}
		<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
			<MailboxMessageView message={cachedMessage} layout="panel" />
		</div>
	{/if}
</section>
