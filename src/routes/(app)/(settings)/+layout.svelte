<script lang="ts">
	import SectionSidebar from '$lib/components/section-sidebar.svelte';
	import SettingsSidebarPanel from '$lib/components/settings-sidebar-panel.svelte';
	import { getProfileNavItems } from '$lib/navigation/app-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { children } = $props();

	const settingsNavItems = $derived(getProfileNavItems(page.data.workspace?.role));
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
	<aside
		class={cn(
			'bg-sidebar text-sidebar-foreground border-sidebar-border hidden h-full w-(--team-secondary-sidebar-width) shrink-0 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden lg:border-r lg:py-2'
		)}
	>
		<SettingsSidebarPanel items={settingsNavItems} />
	</aside>

	<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-x-auto overflow-y-auto p-4 lg:gap-8 lg:p-6">
		<div class="lg:hidden">
			<SectionSidebar
				title="Account"
				description="Manage your personal account, security, and billing preferences."
				items={settingsNavItems}
			/>
		</div>

		{@render children()}
	</div>
</div>
