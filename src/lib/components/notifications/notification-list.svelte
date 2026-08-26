<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { getNotificationCategoryLabel } from '$lib/shared/notifications/presentations';
	import type { NotificationSummary } from '$lib/shared/models/notification';
	import { cn } from '$lib/utils.js';

	let {
		notifications,
		emptyMessage = 'No notifications yet.',
		compact = false,
		onSelect
	}: {
		notifications: NotificationSummary[];
		emptyMessage?: string;
		compact?: boolean;
		onSelect?: (notification: NotificationSummary) => void;
	} = $props();

	function formatTimestamp(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: compact ? undefined : 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}

	function severityVariant(
		severity: NotificationSummary['severity']
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (severity === 'critical') {
			return 'destructive';
		}

		if (severity === 'warning') {
			return 'secondary';
		}

		return 'outline';
	}

	function rowClass(notification: NotificationSummary): string {
		return cn(
			'flex flex-col gap-2',
			compact
				? 'px-4 py-3'
				: 'py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
			compact && !notification.isRead && 'bg-primary/8'
		);
	}
</script>

{#if notifications.length === 0}
	<p class={cn('text-muted-foreground text-sm leading-relaxed', compact && 'px-4 py-4')}>
		{emptyMessage}
	</p>
{:else}
	<ul class="divide-border divide-y">
		{#each notifications as notification (notification.id)}
			<li>
				{#if onSelect}
					<button
						type="button"
						class={cn(
							'hover:bg-muted w-full text-left transition-colors',
							rowClass(notification)
						)}
						onclick={() => onSelect(notification)}
					>
						<div class="min-w-0 flex-1 space-y-1">
							<div class="flex flex-wrap items-center gap-2">
								<span
									class={cn(
										'size-2 shrink-0 rounded-full',
										!notification.isRead && 'bg-primary'
									)}
									aria-hidden="true"
								></span>
								<p class={cn('text-sm font-medium', notification.isRead && 'text-muted-foreground')}>
									{notification.title}
								</p>
								{#if !compact}
									<Badge variant={severityVariant(notification.severity)}>
										{getNotificationCategoryLabel(notification.category)}
									</Badge>
								{/if}
							</div>
							{#if notification.body}
								<p class="text-muted-foreground text-sm leading-relaxed">{notification.body}</p>
							{/if}
						</div>
						<time
							class="text-muted-foreground shrink-0 text-xs tabular-nums"
							datetime={notification.createdAt}
						>
							{formatTimestamp(notification.createdAt)}
						</time>
					</button>
				{:else if notification.href}
					<a
						href={notification.href}
						class={cn('hover:bg-muted block transition-colors', rowClass(notification))}
					>
						<div class="min-w-0 flex-1 space-y-1">
							<div class="flex flex-wrap items-center gap-2">
								<span
									class={cn(
										'size-2 shrink-0 rounded-full',
										!notification.isRead && 'bg-primary'
									)}
									aria-hidden="true"
								></span>
								<p class={cn('text-sm font-medium', notification.isRead && 'text-muted-foreground')}>
									{notification.title}
								</p>
								{#if !compact}
									<Badge variant={severityVariant(notification.severity)}>
										{getNotificationCategoryLabel(notification.category)}
									</Badge>
								{/if}
							</div>
							{#if notification.body}
								<p class="text-muted-foreground text-sm leading-relaxed">{notification.body}</p>
							{/if}
						</div>
						<time
							class="text-muted-foreground shrink-0 text-xs tabular-nums"
							datetime={notification.createdAt}
						>
							{formatTimestamp(notification.createdAt)}
						</time>
					</a>
				{:else}
					<div class={rowClass(notification)}>
						<div class="min-w-0 flex-1 space-y-1">
							<div class="flex flex-wrap items-center gap-2">
								<span
									class={cn(
										'size-2 shrink-0 rounded-full',
										!notification.isRead && 'bg-primary'
									)}
									aria-hidden="true"
								></span>
								<p class={cn('text-sm font-medium', notification.isRead && 'text-muted-foreground')}>
									{notification.title}
								</p>
								{#if !compact}
									<Badge variant={severityVariant(notification.severity)}>
										{getNotificationCategoryLabel(notification.category)}
									</Badge>
								{/if}
							</div>
							{#if notification.body}
								<p class="text-muted-foreground text-sm leading-relaxed">{notification.body}</p>
							{/if}
						</div>
						<time
							class="text-muted-foreground shrink-0 text-xs tabular-nums"
							datetime={notification.createdAt}
						>
							{formatTimestamp(notification.createdAt)}
						</time>
					</div>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
