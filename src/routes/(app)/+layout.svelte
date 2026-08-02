<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import PreventStaleAuthView from '$lib/components/prevent-stale-auth-view.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import { SIDEBAR_WIDTH, SIDEBAR_WIDTH_TEAM_SECONDARY } from '$lib/components/ui/sidebar/constants.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { cn } from '$lib/utils.js';

	let { children, data } = $props();

	const isTeamSection = $derived(
		page.url.pathname === '/team' || page.url.pathname.startsWith('/team/')
	);
</script>

<PreventStaleAuthView />

<Sidebar.Provider
	class="h-svh overflow-hidden"
	style="--sidebar-width: {SIDEBAR_WIDTH}; --team-secondary-sidebar-width: {SIDEBAR_WIDTH_TEAM_SECONDARY};"
>
	<AppSidebar userDisplay={data.userDisplay} workspaceRole={data.workspace?.role ?? null} />
	<Sidebar.Inset
		class="h-full min-h-0 min-w-0 overflow-hidden md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none"
	>
		<SiteHeader
			workspace={data.workspace}
			workspaces={data.workspaces}
			workspaceHostSuffix={data.workspaceHostSuffix}
		/>
		<div
			class={cn(
				'flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden',
				!isTeamSection && 'gap-6 overflow-y-auto p-4 md:gap-8 md:p-6'
			)}
		>
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
