<script lang="ts">
	import MailboxSectionSidebar from '$lib/components/mailbox/mailbox-section-sidebar.svelte';
	import MailboxSidebarPanel from '$lib/components/mailbox/mailbox-sidebar-panel.svelte';
	import MailboxSidebarSkeleton from '$lib/components/mailbox/mailbox-sidebar-skeleton.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { MailboxFolder } from '$lib/shared/mailbox/schemas';
	import { decodeMailboxFolder } from '$lib/mailbox/utils';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { data, children } = $props();

	let sidebarFolders = $state<MailboxFolder[] | null>(null);
	let foldersLoadFailed = $state(false);

	const isSettingsRoute = $derived(page.url.pathname.startsWith('/mailbox/settings'));
	const isComposeRoute = $derived(page.url.pathname.startsWith('/mailbox/compose'));

	$effect(() => {
		const next = (page.data.folders ?? data.folders) as
			| Promise<MailboxFolder[]>
			| MailboxFolder[]
			| undefined;

		if (Array.isArray(next)) {
			// Ignore empty placeholders from parent while a folder layout still owns folders.
			if (next.length > 0 || sidebarFolders === null) {
				sidebarFolders = next;
			}
			foldersLoadFailed = false;
			return;
		}

		if (!next) {
			return;
		}

		void next
			.then((folders) => {
				if (folders.length > 0 || sidebarFolders === null) {
					sidebarFolders = folders;
				}
				foldersLoadFailed = false;
			})
			.catch(() => {
				foldersLoadFailed = true;
				if (sidebarFolders === null) {
					sidebarFolders = [];
				}
			});
	});

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

{#snippet mailboxSidebar(folders: MailboxFolder[])}
	<MailboxSidebarPanel
		{folders}
		{activeFolder}
		isComposeActive={isComposeRoute}
		configured={data.configured}
	/>
{/snippet}

<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row">
	<aside
		class={cn(
			'bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-(--team-secondary-sidebar-width) shrink-0 lg:sticky lg:top-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:self-stretch lg:border-r lg:py-2'
		)}
	>
		{#if sidebarFolders === null}
			<MailboxSidebarSkeleton />
		{:else}
			{@render mailboxSidebar(sidebarFolders)}
		{/if}
	</aside>

	<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
		<div class="lg:hidden">
			{#if sidebarFolders === null}
				<div class="border-border border-b p-3" aria-busy="true" aria-label="Loading folders">
					<Skeleton class="h-9 w-full" />
				</div>
			{:else}
				<MailboxSectionSidebar
					folders={sidebarFolders}
					{activeFolder}
					isComposeActive={isComposeRoute}
					configured={data.configured}
				/>
			{/if}
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

		{#if foldersLoadFailed && data.configured && !isSettingsRoute}
			<div class="border-border shrink-0 border-t p-4">
				<StatusAlert
					variant="danger"
					title="Folders unavailable"
					description="Could not load mailbox folders. Reconnect your PrivateEmail account in settings."
				/>
			</div>
		{/if}
	</div>
</div>
