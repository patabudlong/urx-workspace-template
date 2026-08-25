<script lang="ts">
	import DtrSectionSidebar from '$lib/components/dtr/dtr-section-sidebar.svelte';
	import DtrSidebarPanel from '$lib/components/dtr/dtr-sidebar-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { getDtrNavItems } from '$lib/navigation/dtr-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { children } = $props();

	const dtrNavItems = $derived(
		getDtrNavItems(page.data.workspace?.role, page.data.hasLinkedPayrollEmployee)
	);
	const canAccess = $derived(dtrNavItems.length > 0);
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto lg:flex-row">
	<aside
		class={cn(
			'bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-(--team-secondary-sidebar-width) shrink-0 lg:sticky lg:top-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:self-start lg:border-r lg:py-2'
		)}
	>
		<DtrSidebarPanel items={dtrNavItems} />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
		<div class="lg:hidden">
			<DtrSectionSidebar items={dtrNavItems} />
		</div>

		{#if !canAccess}
			<StatusAlert
				variant="warning"
				title="DTR access required"
				description="Only workspace owners and admins can manage daily time records. Employees can clock in and out when their login email matches a payroll employee record."
			/>
		{:else}
			{@render children()}
		{/if}
	</div>
</div>
