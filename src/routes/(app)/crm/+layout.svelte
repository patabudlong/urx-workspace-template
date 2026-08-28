<script lang="ts">
	import CrmSectionSidebar from '$lib/components/crm/crm-section-sidebar.svelte';
	import CrmSidebarPanel from '$lib/components/crm/crm-sidebar-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { APP_SECONDARY_SIDEBAR_CLASS } from '$lib/components/ui/sidebar/constants.js';
	import { getCrmNavItems } from '$lib/navigation/crm-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { children } = $props();

	const crmNavItems = $derived(getCrmNavItems(page.data.workspace?.role));
	const canAccess = $derived(crmNavItems.length > 0);
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto lg:flex-row">
	<aside class={cn(APP_SECONDARY_SIDEBAR_CLASS)}>
		<CrmSidebarPanel items={crmNavItems} />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
		<div class="lg:hidden">
			<CrmSectionSidebar items={crmNavItems} />
		</div>

		{#if !canAccess}
			<StatusAlert
				variant="warning"
				title="CRM access required"
				description="Only workspace owners and admins can manage CRM records."
			/>
		{:else}
			{@render children()}
		{/if}
	</div>
</div>
