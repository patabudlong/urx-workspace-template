<script lang="ts">
	import { page } from '$app/state';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { children, data } = $props();

	const headerTitle = $derived(
		typeof page.data.meta?.title === 'string' ? page.data.meta.title : 'Dashboard'
	);
</script>

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<SiteHeader userEmail={data.user.email} title={headerTitle} />
		<div class="flex flex-1 flex-col gap-4 p-4 md:p-6">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
