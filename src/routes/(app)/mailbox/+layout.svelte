<script lang="ts">
	import MailboxLayoutSkeleton from '$lib/components/mailbox/mailbox-layout-skeleton.svelte';
	import MailboxSectionSidebar from '$lib/components/mailbox/mailbox-section-sidebar.svelte';
	import MailboxSidebarPanel from '$lib/components/mailbox/mailbox-sidebar-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { decodeMailboxFolder } from '$lib/mailbox/utils';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { data, children } = $props();

	const isSettingsRoute = $derived(page.url.pathname.startsWith('/mailbox/settings'));
	const isComposeRoute = $derived(page.url.pathname.startsWith('/mailbox/compose'));

	const activeFolder = $derived.by(() => {
		if (isComposeRoute || isSettingsRoute) {
			return '';
		}

		const folderParam = page.params.folder;
		return folderParam ? decodeMailboxFolder(folderParam) : 'INBOX';
	});

	const isMessageView = $derived(
		data.configured && !isSettingsRoute && !isComposeRoute
	);
</script>

{#snippet mailboxMain(className?: string)}
	<div class={cn('flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden', className)}>
		{@render children()}
	</div>
{/snippet}

{#await data.folders}
	<MailboxLayoutSkeleton />
{:then folders}
	<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
		<aside
			class={cn(
				'bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-(--team-secondary-sidebar-width) shrink-0 lg:sticky lg:top-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:self-stretch lg:border-r lg:py-2'
			)}
		>
			<MailboxSidebarPanel
				{folders}
				{activeFolder}
				isComposeActive={isComposeRoute}
				configured={data.configured}
			/>
		</aside>

		<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
			<div class="lg:hidden">
				<MailboxSectionSidebar
					{folders}
					{activeFolder}
					isComposeActive={isComposeRoute}
					configured={data.configured}
				/>
			</div>

			{#if !data.configured && !isSettingsRoute}
				<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 lg:p-6">
					<StatusAlert
						variant="info"
						title="Connect your PrivateEmail account"
						description="Link your mailbox in settings to read inbox folders and send messages from the workspace."
					/>
					<Button href="/mailbox/settings" class="h-10 w-fit">Connect mailbox</Button>
				</div>
			{:else if isMessageView}
				{@render mailboxMain()}
			{:else}
				{@render mailboxMain('overflow-auto p-4 lg:p-6')}
			{/if}
		</div>
	</div>
{:catch}
	<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
		<aside
			class={cn(
				'bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-(--team-secondary-sidebar-width) shrink-0 lg:sticky lg:top-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:self-stretch lg:border-r lg:py-2'
			)}
		>
			<MailboxSidebarPanel
				folders={[]}
				{activeFolder}
				isComposeActive={isComposeRoute}
				configured={data.configured}
			/>
		</aside>

		<div class="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 lg:p-6">
			<StatusAlert
				variant="danger"
				title="Mailbox unavailable"
				description="Could not load mailbox folders. Reconnect your PrivateEmail account in settings."
			/>
		</div>
	</div>
{/await}
