<script lang="ts">
	import PmSectionSidebar from '$lib/components/project-management/pm-section-sidebar.svelte';
	import PmSidebarPanel from '$lib/components/project-management/pm-sidebar-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { APP_SECONDARY_SIDEBAR_CLASS } from '$lib/components/ui/sidebar/constants.js';
	import { getProjectManagementNavItems } from '$lib/navigation/project-management-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { children } = $props();

	const pmNavItems = $derived(getProjectManagementNavItems(page.data.workspace?.role));
	const canAccess = $derived(pmNavItems.length > 0);
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto lg:flex-row">
	<aside class={cn(APP_SECONDARY_SIDEBAR_CLASS)}>
		<PmSidebarPanel items={pmNavItems} />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
		<div class="lg:hidden">
			<PmSectionSidebar items={pmNavItems} />
		</div>

		{#if !canAccess}
			<StatusAlert
				variant="warning"
				title="Project Management access required"
				description="Only workspace owners and admins can manage projects."
			/>
		{:else}
			{@render children()}
		{/if}
	</div>
</div>
