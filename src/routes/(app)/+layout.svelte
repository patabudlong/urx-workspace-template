<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import AppSidebarViewport from '$lib/components/app-sidebar-viewport.svelte';
	import PreventStaleAuthView from '$lib/components/prevent-stale-auth-view.svelte';
	import PresenceHeartbeat from '$lib/components/presence-heartbeat.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_TEAM_SECONDARY } from '$lib/components/ui/sidebar/constants.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { normalizePathname } from '$lib/shared/url-path';
	import { cn } from '$lib/utils.js';

	let { children, data } = $props();

	let sidebarOpen = $state(true);

	const pathname = $derived(normalizePathname(page.url.pathname));
	const isTeamSection = $derived(pathname === '/team' || pathname.startsWith('/team/'));
	const isSettingsSection = $derived(
		pathname === '/account' || pathname === '/security' || pathname === '/billing'
	);
	// urixoft-workspace-mailbox:layout:start
	const isMailboxSection = $derived(pathname === '/mailbox' || pathname.startsWith('/mailbox/'));
	// urixoft-workspace-mailbox:layout:end
	const isNestedAppSection = $derived(isTeamSection || isSettingsSection || isMailboxSection);
</script>

<PreventStaleAuthView />
<PresenceHeartbeat />

<Sidebar.Provider
	bind:open={sidebarOpen}
	class="h-svh overflow-hidden"
	style="--sidebar-width: {SIDEBAR_WIDTH}; --team-secondary-sidebar-width: {SIDEBAR_WIDTH_TEAM_SECONDARY};"
>
	<AppSidebarViewport />
	<AppSidebar />
	<Sidebar.Inset
		class="h-full min-h-0 min-w-0 overflow-hidden md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none"
	>
		<SiteHeader
			userDisplay={data.userDisplay}
			workspace={data.workspace}
			workspaces={data.workspaces}
			workspaceHostSuffix={data.workspaceHostSuffix}
			workspaceRole={data.workspace?.role ?? null}
		/>
		<div
			class={cn(
				'flex min-h-0 w-full min-w-0 flex-1 flex-col',
				!isNestedAppSection && 'gap-6 overflow-x-auto overflow-y-auto p-4 md:gap-8 md:p-6'
			)}
		>
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
