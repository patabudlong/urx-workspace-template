<script lang="ts">
	import MailboxComposeButton from '$lib/components/mailbox/mailbox-compose-button.svelte';
	import MailboxFolderList from '$lib/components/mailbox/mailbox-folder-list.svelte';
	import MailboxInboxMenu from '$lib/components/mailbox/mailbox-inbox-menu.svelte';
	import MailboxSettingsSidebarMenu from '$lib/components/mailbox/mailbox-settings-sidebar-menu.svelte';
	import { findMailboxInboxFolder } from '$lib/mailbox/utils';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';

	let {
		folders,
		activeFolder,
		isComposeActive = false,
		configured = true
	}: {
		folders: MailboxFolder[];
		activeFolder: string;
		isComposeActive?: boolean;
		configured?: boolean;
	} = $props();

	const inboxFolder = $derived(configured ? findMailboxInboxFolder(folders) : null);
</script>

<Sidebar.Header class="border-sidebar-border shrink-0 gap-1 border-b p-4">
	<h2 class="text-sm font-semibold">Mailbox</h2>
	<p class="text-muted-foreground mt-1 text-xs leading-relaxed">
		Browse folders and read messages from your connected PrivateEmail account.
	</p>
</Sidebar.Header>

<Sidebar.Content class="min-h-0 flex-1 gap-1 overflow-visible ps-1 pt-1">
	{#if configured}
		<Sidebar.Group class="pb-1">
			<MailboxComposeButton active={isComposeActive} />
		</Sidebar.Group>
	{/if}
	{#if inboxFolder}
		<MailboxInboxMenu inbox={inboxFolder} {activeFolder} />
	{/if}
	{#if configured}
		<MailboxFolderList {folders} {activeFolder} />
	{/if}
</Sidebar.Content>

<Sidebar.Footer class="border-sidebar-border mt-auto shrink-0 border-t p-2">
	<Sidebar.Menu>
		<MailboxSettingsSidebarMenu />
	</Sidebar.Menu>
</Sidebar.Footer>
