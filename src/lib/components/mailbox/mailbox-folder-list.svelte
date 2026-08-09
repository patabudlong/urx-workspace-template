<script lang="ts">
	import MailboxFolderCount from '$lib/components/mailbox/mailbox-folder-count.svelte';
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
	import {
		encodeMailboxFolder,
		getMailboxFolderIcon,
		getMailboxFolderLabel,
		partitionMailboxFolders
	} from '$lib/mailbox/utils';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let {
		folders,
		activeFolder
	}: {
		folders: MailboxFolder[];
		activeFolder: string;
	} = $props();

	const mailboxFolders = $derived(partitionMailboxFolders(folders).folders);
</script>

{#if mailboxFolders.length > 0}
<Sidebar.Group>
	<Sidebar.GroupLabel>Folders</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each mailboxFolders as folder (folder.path)}
				{@const Icon = getMailboxFolderIcon(folder)}
				{@const href = `/mailbox/${encodeMailboxFolder(folder.path)}`}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={activeFolder === folder.path}>
						{#snippet child({ props })}
							<a href={href} {...props}>
								<Icon class="size-4" aria-hidden="true" />
								<span class="min-w-0 flex-1 truncate">{getMailboxFolderLabel(folder)}</span>
								<MailboxFolderCount unseen={folder.unseen} total={folder.total} />
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
{/if}
