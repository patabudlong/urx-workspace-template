<script lang="ts">
	import MailboxComposeButton from '$lib/components/mailbox/mailbox-compose-button.svelte';
	import MailboxFolderList from '$lib/components/mailbox/mailbox-folder-list.svelte';
	import MailboxInboxMenu from '$lib/components/mailbox/mailbox-inbox-menu.svelte';
	import { findMailboxInboxFolder } from '$lib/mailbox/utils';
	import { MAILBOX_SETTINGS_NAV_ITEM } from '$lib/navigation/mailbox-nav';
	import { isAppNavActive } from '$lib/navigation/app-nav';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
	import { page } from '$app/state';

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
	const isSettingsActive = $derived(isAppNavActive(page.url.pathname, MAILBOX_SETTINGS_NAV_ITEM));
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
		<Sidebar.MenuItem>
			<Sidebar.MenuButton isActive={isSettingsActive} tooltipContent="Settings">
				{#snippet child({ props })}
					<a href={MAILBOX_SETTINGS_NAV_ITEM.href} {...props}>
						<MAILBOX_SETTINGS_NAV_ITEM.icon class="size-4" aria-hidden="true" />
						<span>Settings</span>
					</a>
				{/snippet}
			</Sidebar.MenuButton>
		</Sidebar.MenuItem>
	</Sidebar.Menu>
</Sidebar.Footer>
