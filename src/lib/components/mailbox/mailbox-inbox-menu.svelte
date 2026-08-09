<script lang="ts">
	import MailboxFolderCount from '$lib/components/mailbox/mailbox-folder-count.svelte';
	import { encodeMailboxFolder, getMailboxFolderLabel } from '$lib/mailbox/utils';
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let {
		inbox,
		activeFolder
	}: {
		inbox: MailboxFolder;
		activeFolder: string;
	} = $props();

	const href = $derived(`/mailbox/${encodeMailboxFolder(inbox.path)}`);
	const active = $derived(activeFolder === inbox.path);
	const label = $derived(getMailboxFolderLabel(inbox));
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Inbox</Sidebar.GroupLabel>
	<Sidebar.GroupContent>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton isActive={active} tooltipContent={label}>
					{#snippet child({ props })}
						<a {href} {...props}>
							<InboxIcon class="size-4" aria-hidden="true" />
							<span class="min-w-0 flex-1 truncate">{label}</span>
							<MailboxFolderCount unseen={inbox.unseen} total={inbox.total} />
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.GroupContent>
</Sidebar.Group>
