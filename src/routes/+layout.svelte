<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ModeWatcher />

<Sidebar.Provider>
	<AppSidebar />
	<Sidebar.Inset>
		<SiteHeader />
		<div class="flex flex-1 flex-col gap-4 p-4 md:p-6">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
