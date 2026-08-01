<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import PreventStaleAuthView from '$lib/components/prevent-stale-auth-view.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { children, data } = $props();

	const headerTitle = $derived(
		typeof page.data.meta?.title === 'string' ? page.data.meta.title : 'Dashboard'
	);
</script>

<PreventStaleAuthView />

<Sidebar.Provider>
	<AppSidebar workspace={data.workspace} />
	<Sidebar.Inset>
		<SiteHeader userDisplay={data.userDisplay} title={headerTitle} workspace={data.workspace} />
		<div class="bg-muted/20 flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
