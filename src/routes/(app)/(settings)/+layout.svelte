<script lang="ts">
	import SectionSidebar from '$lib/components/section-sidebar.svelte';
	import SettingsSidebarPanel from '$lib/components/settings-sidebar-panel.svelte';
	import { getProfileNavItems } from '$lib/navigation/app-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { children } = $props();

	const settingsNavItems = $derived(getProfileNavItems(page.data.workspace?.role));
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto lg:flex-row">
	<aside
		class={cn(
			'bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-(--team-secondary-sidebar-width) shrink-0 lg:sticky lg:top-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:self-start lg:border-r lg:py-2'
		)}
	>
		<SettingsSidebarPanel items={settingsNavItems} />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
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
