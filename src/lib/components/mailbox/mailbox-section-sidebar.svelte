<script lang="ts">
	import MailboxComposeButton from '$lib/components/mailbox/mailbox-compose-button.svelte';
	import MailboxFolderCount from '$lib/components/mailbox/mailbox-folder-count.svelte';
	import {
		encodeMailboxFolder,
		findMailboxInboxFolder,
		getMailboxFolderIcon,
		getMailboxFolderLabel,
		partitionMailboxFolders
	} from '$lib/mailbox/utils';
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import { cn } from '$lib/utils.js';

	let {
		folders,
		activeFolder,
		isComposeActive = false
	}: {
		folders: MailboxFolder[];
		activeFolder: string;
		isComposeActive?: boolean;
	} = $props();

	const inboxFolder = $derived(findMailboxInboxFolder(folders));
	const mailboxFolders = $derived(partitionMailboxFolders(folders).folders);
</script>

<aside class="border-border bg-muted/30 shrink-0 border-b" aria-label="Mailbox navigation">
	<div class="flex flex-col gap-3 px-4 pt-4 pb-2">
		<div>
			<h2 class="text-sm font-semibold">Mailbox</h2>
			<p class="text-muted-foreground mt-1 text-xs leading-relaxed">
				Browse folders and read messages from your connected PrivateEmail account.
			</p>
		</div>
		<MailboxComposeButton active={isComposeActive} layout="inline" />
	</div>

	<nav class="flex flex-col gap-2 p-2 pt-0">
		{#if inboxFolder}
			{@const href = `/mailbox/${encodeMailboxFolder(inboxFolder.path)}`}
			{@const active = activeFolder === inboxFolder.path}
			<div>
				<p class="text-muted-foreground px-3 py-1.5 text-xs font-medium">Inbox</p>
				<div class="flex gap-1 overflow-x-auto">
					<a
						{href}
						class={cn(
							'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
							active
								? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
								: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
						)}
						aria-current={active ? 'page' : undefined}
					>
						<InboxIcon class="size-4 shrink-0" />
						<span class="min-w-0 flex-1 truncate">{getMailboxFolderLabel(inboxFolder)}</span>
						<MailboxFolderCount unseen={inboxFolder.unseen} total={inboxFolder.total} />
					</a>
				</div>
			</div>
		{/if}

		{#if mailboxFolders.length > 0}
			<div>
				<p class="text-muted-foreground px-3 py-1.5 text-xs font-medium">Folders</p>
				<div class="flex gap-1 overflow-x-auto">
					{#each mailboxFolders as folder (folder.path)}
						{@const Icon = getMailboxFolderIcon(folder)}
						{@const href = `/mailbox/${encodeMailboxFolder(folder.path)}`}
						{@const active = activeFolder === folder.path}
						<a
							{href}
							class={cn(
								'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
								active
									? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
									: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
							)}
							aria-current={active ? 'page' : undefined}
						>
							<Icon class="size-4 shrink-0" />
							<span class="min-w-0 flex-1 truncate">{getMailboxFolderLabel(folder)}</span>
							<MailboxFolderCount unseen={folder.unseen} total={folder.total} />
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</nav>
</aside>
