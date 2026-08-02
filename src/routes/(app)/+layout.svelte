<script lang="ts">
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import PreventStaleAuthView from '$lib/components/prevent-stale-auth-view.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { children, data } = $props();
</script>

<PreventStaleAuthView />

<Sidebar.Provider>
	<AppSidebar userDisplay={data.userDisplay} workspaceRole={data.workspace?.role ?? null} />
	<Sidebar.Inset>
		<SiteHeader
			workspace={data.workspace}
			workspaces={data.workspaces}
			workspaceHostSuffix={data.workspaceHostSuffix}
		/>
		<div class="bg-muted/20 flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
