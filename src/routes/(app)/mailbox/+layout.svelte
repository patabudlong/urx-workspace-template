<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import MailboxLayoutSkeleton from '$lib/components/mailbox/mailbox-layout-skeleton.svelte';
	import MailboxSectionSidebar from '$lib/components/mailbox/mailbox-section-sidebar.svelte';
	import MailboxSidebarPanel from '$lib/components/mailbox/mailbox-sidebar-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { decodeMailboxFolder } from '$lib/mailbox/utils';
	import { cn } from '$lib/utils.js';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { page } from '$app/state';

	let { data, children } = $props();

	const isSettingsRoute = $derived(page.url.pathname.startsWith('/mailbox/settings'));
	const isComposeRoute = $derived(page.url.pathname.startsWith('/mailbox/compose'));

	const activeFolder = $derived.by(() => {
		if (isComposeRoute) {
			return '';
		}

		const folderParam = page.params.folder;
		return folderParam ? decodeMailboxFolder(folderParam) : 'INBOX';
	});
</script>

{#await data.folders}
	<MailboxLayoutSkeleton />
{:then folders}
	{@const showFolderSidebar = data.configured && !isSettingsRoute}

	{#if showFolderSidebar}
		<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto lg:flex-row">
			<aside
				class={cn(
					'bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-(--team-secondary-sidebar-width) shrink-0 lg:sticky lg:top-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:self-start lg:border-r lg:py-2'
				)}
			>
				<MailboxSidebarPanel {folders} {activeFolder} isComposeActive={isComposeRoute} />
			</aside>

			<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
				<div class="lg:hidden">
					<MailboxSectionSidebar {folders} {activeFolder} isComposeActive={isComposeRoute} />
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
				{/if}
			</div>
		</div>
	{/if}
{:catch}
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
				{/snippet}
			</PageHeader>

			<StatusAlert
				variant="danger"
				title="Mailbox unavailable"
				description="Could not load mailbox folders. Reconnect your PrivateEmail account in settings."
			/>
		</div>
	</div>
{/await}
