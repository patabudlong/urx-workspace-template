<script lang="ts">
	import PayrollSectionSidebar from '$lib/components/payroll/payroll-section-sidebar.svelte';
	import PayrollSidebarPanel from '$lib/components/payroll/payroll-sidebar-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { APP_SECONDARY_SIDEBAR_CLASS } from '$lib/components/ui/sidebar/constants.js';
	import { getPayrollNavItems } from '$lib/navigation/payroll-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { children } = $props();

	const payrollNavItems = $derived(
		getPayrollNavItems(page.data.workspace?.role, page.data.hasLinkedPayrollEmployee)
	);
	const canAccess = $derived(payrollNavItems.length > 0);
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto lg:flex-row">
	<aside class={cn(APP_SECONDARY_SIDEBAR_CLASS)}>
		<PayrollSidebarPanel items={payrollNavItems} />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
		<div class="lg:hidden">
			<PayrollSectionSidebar items={payrollNavItems} />
		</div>

		{#if !canAccess}
			<StatusAlert
				variant="warning"
				title="Payroll access required"
				description="Only workspace owners and admins can manage payroll. Employees can view payslips when their login email matches the email on their payroll employee record."
			/>
		{:else}
			{@render children()}
		{/if}
	</div>
</div>
