<script lang="ts">
	import MailboxComposeButton from '$lib/components/mailbox/mailbox-compose-button.svelte';
	import MailboxFolderList from '$lib/components/mailbox/mailbox-folder-list.svelte';
	import MailboxInboxMenu from '$lib/components/mailbox/mailbox-inbox-menu.svelte';
	import MailboxSettingsSidebarMenu from '$lib/components/mailbox/mailbox-settings-sidebar-menu.svelte';
	import MailboxSidebarRefresh from '$lib/components/mailbox/mailbox-sidebar-refresh.svelte';
	import MailboxSidebarTools from '$lib/components/mailbox/mailbox-sidebar-tools.svelte';
	import { findMailboxInboxFolder } from '$lib/mailbox/utils';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';

	let {
		folders,
		activeFolder,
		isComposeActive = false,
		configured = true,
		searchQuery = ''
	}: {
		folders: MailboxFolder[];
		activeFolder: string;
		isComposeActive?: boolean;
		configured?: boolean;
		searchQuery?: string;
	} = $props();

	const inboxFolder = $derived(configured ? findMailboxInboxFolder(folders) : null);
</script>

<Sidebar.Header class="border-sidebar-border shrink-0 gap-3 border-b p-4">
	<div class="flex items-start justify-between gap-2">
		<div class="min-w-0">
			<h2 class="text-sm font-semibold">Mailbox</h2>
			<p class="text-muted-foreground mt-1 text-xs leading-relaxed">
				Browse folders and read messages from your connected PrivateEmail account.
			</p>
		</div>
		<MailboxSidebarRefresh {configured} class="-me-1 -mt-0.5" />
	</div>
	<MailboxSidebarTools {configured} {activeFolder} {searchQuery} />
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
