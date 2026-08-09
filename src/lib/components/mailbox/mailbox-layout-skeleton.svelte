<script lang="ts">
	import MailboxMessageListSkeleton from '$lib/components/mailbox/mailbox-message-list-skeleton.svelte';
	import MailboxSidebarSkeleton from '$lib/components/mailbox/mailbox-sidebar-skeleton.svelte';
	import { cn } from '$lib/utils.js';
</script>

<div
	class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-auto lg:flex-row"
	aria-busy="true"
	aria-label="Loading mailbox"
>
	<aside
		class={cn(
			'bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-(--team-secondary-sidebar-width) shrink-0 lg:sticky lg:top-0 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:self-stretch lg:border-r lg:py-2'
		)}
	>
		<MailboxSidebarSkeleton />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col p-0">
		<MailboxMessageListSkeleton />
	</div>
</div>
