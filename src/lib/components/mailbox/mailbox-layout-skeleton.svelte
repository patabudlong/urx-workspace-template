<script lang="ts">
	import MailboxMessageListSkeleton from '$lib/components/mailbox/mailbox-message-list-skeleton.svelte';
	import MailboxSidebarSkeleton from '$lib/components/mailbox/mailbox-sidebar-skeleton.svelte';
	import { APP_SECONDARY_SIDEBAR_CLASS } from '$lib/components/ui/sidebar/constants.js';
	import { cn } from '$lib/utils.js';
</script>

<div
	class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto lg:flex-row"
	aria-busy="true"
	aria-label="Loading mailbox"
>
	<aside class={cn(APP_SECONDARY_SIDEBAR_CLASS, 'lg:self-stretch')}>
		<MailboxSidebarSkeleton />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col p-0">
		<MailboxMessageListSkeleton />
	</div>
</div>
