<script lang="ts">
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
	import { encodeMailboxFolder, getMailboxFolderLabel } from '$lib/mailbox/utils';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import SendIcon from '@lucide/svelte/icons/send';
	import FileIcon from '@lucide/svelte/icons/file';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import FolderIcon from '@lucide/svelte/icons/folder';

	let {
		folders,
		activeFolder
	}: {
		folders: MailboxFolder[];
		activeFolder: string;
	} = $props();

	function folderIcon(folder: MailboxFolder) {
		switch (folder.specialUse) {
			case '\\Inbox':
				return InboxIcon;
			case '\\Sent':
				return SendIcon;
			case '\\Drafts':
				return FileIcon;
			case '\\Trash':
				return Trash2Icon;
			case '\\Archive':
				return ArchiveIcon;
			default:
				return FolderIcon;
		}
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Folders</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each folders as folder (folder.path)}
				{@const Icon = folderIcon(folder)}
				{@const href = `/mailbox/${encodeMailboxFolder(folder.path)}`}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={activeFolder === folder.path}>
						{#snippet child({ props })}
							<a href={href} {...props}>
								<Icon class="size-4" aria-hidden="true" />
								<span class="truncate">{getMailboxFolderLabel(folder)}</span>
								{#if folder.unseen > 0}
									<span class="text-primary ms-auto text-xs font-medium">{folder.unseen}</span>
								{/if}
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
