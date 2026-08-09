<script lang="ts">
	import MailboxMessageListSkeleton from '$lib/components/mailbox/mailbox-message-list-skeleton.svelte';
	import MailboxPageHeaderSkeleton from '$lib/components/mailbox/mailbox-page-header-skeleton.svelte';
	import MailboxSidebarSkeleton from '$lib/components/mailbox/mailbox-sidebar-skeleton.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
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

	<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-6">
		<div class="border-border bg-muted/30 shrink-0 border-b lg:hidden">
			<div class="space-y-2 px-4 pt-4 pb-2">
				<Skeleton class="h-4 w-20" />
				<Skeleton class="h-3 w-full max-w-48" />
			</div>
			<div class="flex gap-2 overflow-hidden p-2">
				{#each Array.from({ length: 4 }) as _, index (index)}
					<Skeleton class="h-9 w-20 shrink-0 rounded-md" />
				{/each}
			</div>
		</div>

		<div class="flex w-full min-w-0 flex-col gap-8">
			<MailboxPageHeaderSkeleton />
			<MailboxMessageListSkeleton />
		</div>
	</div>
</div>
