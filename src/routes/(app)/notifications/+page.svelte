<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import NotificationList from '$lib/components/notifications/notification-list.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { markAllNotificationsReadClient } from '$lib/notifications/client-notifications';

	let { data } = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.limit)));
	const hasUnreadOnPage = $derived(data.notifications.some((notification) => !notification.isRead));

	async function handleMarkAllRead(): Promise<void> {
		await markAllNotificationsReadClient();
		window.location.reload();
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Account"
		title="Notifications"
		description="Stay up to date on team activity, invitations, and account security alerts."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Your notifications</Card.Title>
			<Card.Description>
				{#if data.unreadOnly}
					Showing unread notifications only.
				{:else}
					Recent updates across your workspaces and account.
				{/if}
			</Card.Description>
			<Card.Action>
				<div class="flex flex-wrap items-center gap-2">
					<Button
						href="/notifications"
						variant={data.unreadOnly ? 'outline' : 'default'}
						size="sm"
						class="h-9"
					>
						All
					</Button>
					<Button
						href="/notifications?unread=true"
						variant={data.unreadOnly ? 'default' : 'outline'}
						size="sm"
						class="h-9"
					>
						Unread
					</Button>
					{#if hasUnreadOnPage}
						<Button variant="outline" size="sm" class="h-9" onclick={handleMarkAllRead}>
							Mark all read
						</Button>
					{/if}
				</div>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<NotificationList
				notifications={data.notifications}
				emptyMessage={data.unreadOnly
					? 'No unread notifications.'
					: 'Notifications about team updates and account security will appear here.'}
			/>
		</Card.Content>
		{#if data.total > data.limit}
			<Card.Footer class="justify-between border-t">
				<p class="text-muted-foreground text-sm">
					Page {data.page} of {totalPages}
				</p>
				<div class="flex items-center gap-2">
					{#if data.page > 1}
						<Button
							href={data.unreadOnly
								? `/notifications?page=${data.page - 1}&unread=true`
								: `/notifications?page=${data.page - 1}`}
							variant="outline"
							size="sm"
							class="h-8"
						>
							Previous
						</Button>
					{/if}
					{#if data.page < totalPages}
						<Button
							href={data.unreadOnly
								? `/notifications?page=${data.page + 1}&unread=true`
								: `/notifications?page=${data.page + 1}`}
							variant="outline"
							size="sm"
							class="h-8"
						>
							Next
						</Button>
					{/if}
				</div>
			</Card.Footer>
		{/if}
	</Card.Root>
</div>
