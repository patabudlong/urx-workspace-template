<script lang="ts">
	import NotificationList from '$lib/components/notifications/notification-list.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import {
		fetchNotifications,
		fetchUnreadNotificationCount,
		markAllNotificationsReadClient,
		markNotificationReadClient,
		startNotificationPolling
	} from '$lib/notifications/client-notifications';
	import type { NotificationSummary } from '$lib/shared/models/notification';
	import { cn } from '$lib/utils.js';
	import BellIcon from '@lucide/svelte/icons/bell';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let {
		workspaceId = null
	}: {
		workspaceId?: string | null;
	} = $props();

	let unreadCount = $state(0);
	let notifications = $state<NotificationSummary[]>([]);
	let loading = $state(false);
	let open = $state(false);

	const previewLimit = 8;
	const hasUnread = $derived(unreadCount > 0);
	const badgeLabel = $derived(unreadCount > 99 ? '99+' : String(unreadCount));

	async function loadPreview(): Promise<void> {
		loading = true;

		try {
			notifications = await fetchNotifications({
				limit: previewLimit,
				workspaceId: workspaceId ?? undefined
			});
		} finally {
			loading = false;
		}
	}

	async function handleOpenChange(nextOpen: boolean): Promise<void> {
		open = nextOpen;

		if (nextOpen) {
			await loadPreview();
		}
	}

	async function handleSelect(notification: NotificationSummary): Promise<void> {
		if (!notification.isRead) {
			await markNotificationReadClient(notification.id);
			unreadCount = Math.max(0, unreadCount - 1);
			notifications = notifications.map((item) =>
				item.id === notification.id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
			);
		}

		open = false;

		if (notification.href) {
			await goto(notification.href);
		}
	}

	async function handleMarkAllRead(): Promise<void> {
		const ok = await markAllNotificationsReadClient(workspaceId ?? undefined);

		if (!ok) {
			return;
		}

		unreadCount = 0;
		notifications = notifications.map((item) => ({
			...item,
			isRead: true,
			readAt: item.readAt ?? new Date().toISOString()
		}));
	}

	onMount(() => {
		const stopPolling = startNotificationPolling((count) => {
			unreadCount = count;
		}, workspaceId ?? undefined);

		return stopPolling;
	});
</script>

<Popover.Root bind:open onOpenChange={handleOpenChange}>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				class="relative size-9"
				aria-label="Notifications"
			>
				<BellIcon class="size-5" strokeWidth={2} />
				{#if hasUnread}
					<Badge
						variant="destructive"
						class={cn(
							'pointer-events-none absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center px-1 text-[11px] leading-none shadow-sm'
						)}
					>
						{badgeLabel}
					</Badge>
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content
		class="bg-card text-card-foreground border-border w-80 border p-0 shadow-xl ring-1 ring-border/60 sm:w-96"
		align="end"
	>
		<div class="bg-muted/40 flex items-center justify-between border-b px-4 py-3">
			<div>
				<p class="text-sm font-medium">Notifications</p>
				<p class="text-muted-foreground text-xs">
					{#if hasUnread}
						{unreadCount} unread
					{:else}
						You're all caught up
					{/if}
				</p>
			</div>
			{#if hasUnread}
				<Button variant="ghost" size="sm" class="h-8" onclick={handleMarkAllRead}>
					Mark all read
				</Button>
			{/if}
		</div>

		<div class="max-h-96 overflow-y-auto">
			{#if loading}
				<div class="space-y-3 p-4">
					{#each Array.from({ length: 4 }) as _, index (index)}
						<div class="space-y-2">
							<Skeleton class="h-4 w-3/5" />
							<Skeleton class="h-3 w-full" />
						</div>
					{/each}
				</div>
			{:else}
				<NotificationList
					{notifications}
					compact
					emptyMessage="Notifications about team updates and account security will appear here."
					onSelect={handleSelect}
				/>
			{/if}
		</div>

		<div class="bg-muted/30 border-t px-4 py-2">
			<Button href="/notifications" variant="ghost" size="sm" class="h-8 w-full">
				View all notifications
			</Button>
		</div>
	</Popover.Content>
</Popover.Root>
