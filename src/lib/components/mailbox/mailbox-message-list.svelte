<script lang="ts">
	import type { MailboxMessageSummary } from '$lib/shared/mailbox/schemas';
	import {
		encodeMailboxFolder,
		formatMailboxDate
	} from '$lib/mailbox/utils';
	import { prefetchMailboxMessage } from '$lib/mailbox/client';
	import * as Table from '$lib/components/ui/table/index.js';
	import PaperclipIcon from '@lucide/svelte/icons/paperclip';
	import { cn } from '$lib/utils.js';

	let {
		folder,
		messages,
		activeUid,
		onOpenMessage
	}: {
		folder: string;
		messages: MailboxMessageSummary[];
		activeUid?: number;
		onOpenMessage: (uid: number, href: string) => void;
	} = $props();
</script>

{#if messages.length === 0}
	<p class="text-muted-foreground px-4 py-8 text-sm">No messages in this folder.</p>
{:else}
	<Table.Root>
		<Table.Body>
			{#each messages as message (message.uid)}
				{@const href = `/mailbox/${encodeMailboxFolder(folder)}/${message.uid}`}
				<Table.Row
					class={cn(
						'hover:bg-muted/40 cursor-pointer',
						!message.seen && 'bg-muted/20 font-medium',
						activeUid === message.uid && 'bg-muted/50'
					)}
				>
					<Table.Cell class="max-w-0">
						<a
							{href}
							data-sveltekit-noscroll
							class="flex min-w-0 flex-col gap-1 py-1"
							onclick={(event) => {
								event.preventDefault();
								onOpenMessage(message.uid, href);
							}}
							onmouseenter={() => prefetchMailboxMessage(folder, message.uid)}
							onfocus={() => prefetchMailboxMessage(folder, message.uid)}
						>
							<div class="flex items-center gap-2">
								<span class="truncate">{message.from || 'Unknown sender'}</span>
								<span class="text-muted-foreground ms-auto shrink-0 text-xs">
									{formatMailboxDate(message.date)}
								</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="truncate">{message.subject}</span>
								{#if message.hasAttachments}
									<PaperclipIcon class="text-muted-foreground size-3.5 shrink-0" aria-hidden="true" />
								{/if}
							</div>
							{#if message.preview}
								<p class="text-muted-foreground truncate text-xs">{message.preview}</p>
							{/if}
						</a>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{/if}
