<script lang="ts">
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
	import { encodeMailboxFolder, getMailboxFolderIcon, getMailboxFolderLabel } from '$lib/mailbox/utils';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let {
		folders,
		activeFolder
	}: {
		folders: MailboxFolder[];
		activeFolder: string;
	} = $props();
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Folders</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			{#each folders as folder (folder.path)}
				{@const Icon = getMailboxFolderIcon(folder)}
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
