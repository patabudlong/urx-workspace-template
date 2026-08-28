<script lang="ts">
	import type { MailboxMessageSummary } from '$lib/shared/mailbox/schemas';
	import {
		encodeMailboxFolder,
		formatMailboxDate,
		getMailboxMessageListInitials,
		getMailboxMessageListLabel
	} from '$lib/mailbox/utils';
	import { prefetchMailboxMessage } from '$lib/mailbox/client';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import PaperclipIcon from '@lucide/svelte/icons/paperclip';
	import StarIcon from '@lucide/svelte/icons/star';
	import { cn } from '$lib/utils.js';

	let {
		folder,
		messages,
		activeUid,
		emptyTitle = 'No messages',
		emptyDescription = 'This folder is empty.',
		onOpenMessage
	}: {
		folder: string;
		messages: MailboxMessageSummary[];
		activeUid?: number;
		emptyTitle?: string;
		emptyDescription?: string;
		onOpenMessage: (uid: number, href: string) => void;
	} = $props();
</script>

{#if messages.length === 0}
	<div class="flex flex-col items-center gap-3 px-6 py-16 text-center">
		<div class="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
			<InboxIcon class="size-5" aria-hidden="true" />
		</div>
		<div class="space-y-1">
			<p class="text-sm font-medium">{emptyTitle}</p>
			<p class="text-muted-foreground text-sm">{emptyDescription}</p>
		</div>
	</div>
{:else}
	<div class="flex flex-col gap-0.5 px-2 py-1.5 lg:px-3">
		{#each messages as message (message.uid)}
			{@const href = `/mailbox/${encodeMailboxFolder(folder)}/${message.uid}`}
			{@const senderLabel = getMailboxMessageListLabel(message, folder)}
			{@const senderInitials = getMailboxMessageListInitials(message, folder)}
			{@const isActive = activeUid === message.uid}
			<a
				{href}
				data-sveltekit-noscroll
				class={cn(
					'group flex gap-3 rounded-md border border-transparent px-2.5 py-3 transition-colors',
					'hover:bg-muted/50',
					!message.seen && 'bg-muted/15',
					isActive && 'border-border bg-sidebar-accent/80 shadow-sm'
				)}
				aria-current={isActive ? 'true' : undefined}
				onclick={(event) => {
					event.preventDefault();
					onOpenMessage(message.uid, href);
				}}
				onmouseenter={() => prefetchMailboxMessage(folder, message.uid)}
				onfocus={() => prefetchMailboxMessage(folder, message.uid)}
			>
				<div class="relative shrink-0 self-start">
					<span
						class={cn(
							'flex size-9 items-center justify-center rounded-full text-xs font-semibold',
							isActive
								? 'bg-primary text-primary-foreground'
								: 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/15 group-hover:text-foreground'
						)}
						aria-hidden="true"
					>
						{senderInitials}
					</span>
					{#if !message.seen}
						<span
							class="bg-primary ring-background absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2"
							aria-label="Unread"
						></span>
					{/if}
				</div>

				<div class="min-w-0 flex-1 space-y-1">
					<div class="flex items-start justify-between gap-2">
						<p
							class={cn(
								'truncate text-sm leading-none',
								!message.seen ? 'text-foreground font-semibold' : 'text-foreground/90 font-medium'
							)}
						>
							{senderLabel}
						</p>
						<time
							class="text-muted-foreground shrink-0 pt-px text-[11px] leading-none tabular-nums"
							datetime={message.date}
						>
							{formatMailboxDate(message.date)}
						</time>
					</div>

					<div class="flex items-start justify-between gap-2">
						<p
							class={cn(
								'truncate text-sm leading-snug',
								!message.seen ? 'text-foreground font-medium' : 'text-muted-foreground'
							)}
						>
							{message.subject || '(No subject)'}
						</p>
						<div class="flex shrink-0 items-center gap-1 pt-0.5">
							{#if message.flagged}
								<StarIcon
									class="size-3.5 fill-amber-400 text-amber-400"
									aria-label="Flagged"
								/>
							{/if}
							{#if message.hasAttachments}
								<PaperclipIcon
									class="text-muted-foreground size-3.5"
									aria-label="Has attachments"
								/>
							{/if}
						</div>
					</div>

					{#if message.preview}
						<p class="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
							{message.preview}
						</p>
					{/if}
				</div>
			</a>
		{/each}
	</div>
{/if}
