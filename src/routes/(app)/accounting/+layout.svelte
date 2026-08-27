<script lang="ts">
	import AccountingSectionSidebar from '$lib/components/accounting/accounting-section-sidebar.svelte';
	import AccountingSidebarPanel from '$lib/components/accounting/accounting-sidebar-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { APP_SECONDARY_SIDEBAR_CLASS } from '$lib/components/ui/sidebar/constants.js';
	import { getAccountingNavItems } from '$lib/navigation/accounting-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { children } = $props();

	const accountingNavItems = $derived(getAccountingNavItems(page.data.workspace?.role));
	const canAccess = $derived(accountingNavItems.length > 0);
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto lg:flex-row">
	<aside class={cn(APP_SECONDARY_SIDEBAR_CLASS)}>
		<AccountingSidebarPanel items={accountingNavItems} />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
		<div class="lg:hidden">
			<AccountingSectionSidebar items={accountingNavItems} />
		</div>

		{#if !canAccess}
			<StatusAlert
				variant="warning"
				title="Accounting access required"
				description="Only workspace owners and admins can manage accounting."
			/>
		{:else}
			{@render children()}
		{/if}
	</div>
</div>
