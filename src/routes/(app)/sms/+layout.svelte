<script lang="ts">
	import SmsSidebarPanel from '$lib/components/sms/sms-sidebar-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { APP_SECONDARY_SIDEBAR_CLASS } from '$lib/components/ui/sidebar/constants.js';
	import { SMS_NAV_ITEMS } from '$lib/navigation/sms-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { children } = $props();

	const canAccess = $derived(Boolean(page.data.canManageSms));
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto lg:flex-row">
	<aside class={cn(APP_SECONDARY_SIDEBAR_CLASS)}>
		<SmsSidebarPanel items={SMS_NAV_ITEMS} />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
		{#if !canAccess}
			<StatusAlert
				variant="warning"
				title="SMS access required"
				description="Only workspace owners and admins can send SMS messages."
			/>
		{:else}
			{@render children()}
		{/if}
	</div>
</div>
