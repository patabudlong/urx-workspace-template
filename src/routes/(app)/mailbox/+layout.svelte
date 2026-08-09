<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import MailboxSectionSidebar from '$lib/components/mailbox/mailbox-section-sidebar.svelte';
	import MailboxSidebarPanel from '$lib/components/mailbox/mailbox-sidebar-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { decodeMailboxFolder } from '$lib/mailbox/utils';
	import { cn } from '$lib/utils.js';
	import PenSquareIcon from '@lucide/svelte/icons/pen-square';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { page } from '$app/state';

	let { data, children } = $props();

	const activeFolder = $derived.by(() => {
		const folderParam = page.params.folder;
		return folderParam ? decodeMailboxFolder(folderParam) : 'INBOX';
	});

	const isSettingsRoute = $derived(page.url.pathname.startsWith('/mailbox/settings'));
	const showFolderSidebar = $derived(data.configured && !isSettingsRoute && !data.loadError);
</script>

{#if showFolderSidebar}
	<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto lg:flex-row">
		<aside
			class={cn(
				'bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-(--team-secondary-sidebar-width) shrink-0 lg:sticky lg:top-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:self-start lg:border-r lg:py-2'
			)}
		>
			<MailboxSidebarPanel folders={data.folders} {activeFolder} />
		</aside>

		<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
			<div class="lg:hidden">
				<MailboxSectionSidebar folders={data.folders} {activeFolder} />
			</div>

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
						<Button href="/mailbox/compose" class="h-10">
							<PenSquareIcon class="size-4" aria-hidden="true" />
							New message
						</Button>
					{/snippet}
				</PageHeader>

				{@render children()}
			</div>
		</div>
	</div>
{:else}
	<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-x-auto overflow-y-auto p-4 lg:gap-8 lg:p-6">
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

			{#if isSettingsRoute}
				{@render children()}
			{:else if !data.configured}
				<StatusAlert
					variant="info"
					title="Connect your PrivateEmail account"
					description="Link your mailbox in settings to read inbox folders and send messages from the workspace."
				/>
				<Button href="/mailbox/settings" class="h-10 w-fit">Connect mailbox</Button>
			{:else if data.loadError}
				<StatusAlert variant="danger" title="Mailbox unavailable" description={data.loadError} />
			{/if}
		</div>
	</div>
{/if}
