<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { patchMailboxMessage } from '$lib/mailbox/client';
	import { buildMailboxComposeHref, encodeMailboxFolder } from '$lib/mailbox/utils';
	import type { MailboxMessageDetail } from '$lib/shared/mailbox/schemas';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import ForwardIcon from '@lucide/svelte/icons/forward';
	import MailIcon from '@lucide/svelte/icons/mail';
	import MailOpenIcon from '@lucide/svelte/icons/mail-open';
	import ReplyAllIcon from '@lucide/svelte/icons/reply-all';
	import ReplyIcon from '@lucide/svelte/icons/reply';
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
	import StarIcon from '@lucide/svelte/icons/star';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { goto, invalidate } from '$app/navigation';
	import { cn } from '$lib/utils.js';

	let {
		folder,
		message,
		onUpdated,
		onRemoved
	}: {
		folder: string;
		message: MailboxMessageDetail;
		onUpdated: (message: MailboxMessageDetail) => void;
		onRemoved: () => void;
	} = $props();

	let acting = $state<string | null>(null);

	const readToggleLabel = $derived(message.seen ? 'Mark as unread' : 'Mark as read');
	const favoriteLabel = $derived(message.flagged ? 'Remove favorite' : 'Mark as favorite');

	async function runAction(
		action: 'toggleRead' | 'toggleFlagged' | 'archive' | 'delete' | 'spam',
		label: string
	) {
		if (acting) {
			return;
		}

		acting = label;

		try {
			const result = await patchMailboxMessage(folder, message.uid, action);

			if (result.type === 'updated') {
				onUpdated({
					...message,
					seen: result.seen,
					flagged: result.flagged
				});
				return;
			}

			onRemoved();
			await invalidate('mailbox:messages');
			void goto(`/mailbox/${encodeMailboxFolder(folder)}`, {
				keepFocus: true,
				noScroll: true,
				invalidateAll: false
			});
		} catch {
			// Keep the toolbar usable; list/detail refresh can recover state.
		} finally {
			acting = null;
		}
	}
</script>

<Tooltip.Provider delayDuration={0}>
	<div
		class="border-border bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-0.5 border-b px-2 py-1.5 backdrop-blur sm:px-3"
		role="toolbar"
		aria-label="Message actions"
	>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						href={buildMailboxComposeHref('reply', folder, message.uid)}
						variant="ghost"
						size="icon-sm"
						aria-label="Reply"
					>
						<ReplyIcon aria-hidden="true" />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>Reply</Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						href={buildMailboxComposeHref('replyAll', folder, message.uid)}
						variant="ghost"
						size="icon-sm"
						aria-label="Reply all"
					>
						<ReplyAllIcon aria-hidden="true" />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>Reply all</Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						href={buildMailboxComposeHref('forward', folder, message.uid)}
						variant="ghost"
						size="icon-sm"
						aria-label="Forward"
					>
						<ForwardIcon aria-hidden="true" />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>Forward</Tooltip.Content>
		</Tooltip.Root>

		<Separator orientation="vertical" class="mx-1 hidden h-5 sm:block" />

		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon-sm"
						aria-label={readToggleLabel}
						disabled={acting != null}
						onclick={() => runAction('toggleRead', readToggleLabel)}
					>
						{#if message.seen}
							<MailIcon aria-hidden="true" />
						{:else}
							<MailOpenIcon aria-hidden="true" />
						{/if}
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>{readToggleLabel}</Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon-sm"
						aria-label={favoriteLabel}
						disabled={acting != null}
						onclick={() => runAction('toggleFlagged', favoriteLabel)}
					>
						<StarIcon
							class={cn(message.flagged && 'fill-amber-400 text-amber-400')}
							aria-hidden="true"
						/>
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>{favoriteLabel}</Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon-sm"
						aria-label="Move to archive"
						disabled={acting != null}
						onclick={() => runAction('archive', 'Move to archive')}
					>
						<ArchiveIcon aria-hidden="true" />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>Move to archive</Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon-sm"
						aria-label="Delete"
						disabled={acting != null}
						onclick={() => runAction('delete', 'Delete')}
					>
						<Trash2Icon aria-hidden="true" />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>Delete</Tooltip.Content>
		</Tooltip.Root>

		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon-sm"
						aria-label="Mark as spam"
						disabled={acting != null}
						onclick={() => runAction('spam', 'Mark as spam')}
					>
						<ShieldAlertIcon aria-hidden="true" />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>Mark as spam</Tooltip.Content>
		</Tooltip.Root>
	</div>
</Tooltip.Provider>
