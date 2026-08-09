<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import MailboxFolderList from '$lib/components/mailbox/mailbox-folder-list.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import PenSquareIcon from '@lucide/svelte/icons/pen-square';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { page } from '$app/state';
	import { decodeMailboxFolder } from '$lib/mailbox/utils';

	let { data, children } = $props();

	const activeFolder = $derived.by(() => {
		const folderParam = page.params.folder;
		return folderParam ? decodeMailboxFolder(folderParam) : 'INBOX';
	});

	const isSettingsRoute = $derived(page.url.pathname.startsWith('/mailbox/settings'));
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Mailbox"
		title="Email"
		description="Your PrivateEmail account is connected per user. Messages are read live from your mail server and are not stored in MongoDB."
	>
		{#snippet actions()}
			<Button href="/mailbox/settings" variant="outline" class="h-10">
				<SettingsIcon class="size-4" aria-hidden="true" />
				Settings
			</Button>
			{#if data.configured}
				<Button href="/mailbox/compose" class="h-10">
					<PenSquareIcon class="size-4" aria-hidden="true" />
					New message
				</Button>
			{/if}
		{/snippet}
	</PageHeader>

	{#if !data.configured}
		<StatusAlert
			variant="info"
			title="Connect your PrivateEmail account"
			description="Link your mailbox in settings to read inbox folders and send messages from the workspace."
		/>
		<Button href="/mailbox/settings" class="h-10 w-fit">Connect mailbox</Button>
	{:else if data.loadError && !isSettingsRoute}
		<StatusAlert variant="danger" title="Mailbox unavailable" description={data.loadError} />
	{:else if isSettingsRoute}
		{@render children()}
	{:else}
		<div class="grid min-h-0 gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
			<Card.Root class="min-h-0">
				<Card.Content class="p-2">
					<MailboxFolderList folders={data.folders} {activeFolder} />
				</Card.Content>
			</Card.Root>

			<div class="flex min-h-0 min-w-0 flex-col gap-4">
				{@render children()}
			</div>
		</div>
	{/if}
</div>
