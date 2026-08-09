<script lang="ts">
	import MailboxComposeButton from '$lib/components/mailbox/mailbox-compose-button.svelte';
	import MailboxFolderList from '$lib/components/mailbox/mailbox-folder-list.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';

	let {
		folders,
		activeFolder,
		isComposeActive = false
	}: {
		folders: MailboxFolder[];
		activeFolder: string;
		isComposeActive?: boolean;
	} = $props();
</script>

<Sidebar.Header class="border-sidebar-border shrink-0 gap-3 border-b p-4">
	<h2 class="text-sm font-semibold">Mailbox</h2>
	<p class="text-muted-foreground mt-1 text-xs leading-relaxed">
		Browse folders and read messages from your connected PrivateEmail account.
	</p>
	<MailboxComposeButton active={isComposeActive} />
</Sidebar.Header>

<Sidebar.Content class="min-h-0 flex-1 gap-1 overflow-visible ps-1 pt-1">
	<MailboxFolderList {folders} {activeFolder} />
</Sidebar.Content>
