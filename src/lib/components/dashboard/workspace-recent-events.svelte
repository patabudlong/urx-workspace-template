<script lang="ts">
	import DashboardCard from '$lib/components/dashboard/dashboard-card.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { WorkspaceOverviewActivity } from '$lib/shared/dashboard/overview';

	let { events }: { events: WorkspaceOverviewActivity[] } = $props();

	function formatEventTime(timestamp: string): string {
		return new Intl.DateTimeFormat(undefined, {
			hour: '2-digit',
			minute: '2-digit'
		}).format(new Date(timestamp));
	}
</script>

<DashboardCard class="h-full">
	<Card.Header>
		<Card.Title>Recent events</Card.Title>
		<Card.Description>Latest team and workspace activity.</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if events.length === 0}
			<p class="text-muted-foreground text-sm leading-relaxed">
				Activity will appear here as teammates join and invitations are sent.
			</p>
		{:else}
			<ul class="space-y-4">
				{#each events as event (event.id)}
					<li class="flex gap-3">
						<span class="text-muted-foreground w-12 shrink-0 pt-0.5 text-xs font-medium tabular-nums">
							{formatEventTime(event.timestamp)}
						</span>
						<div class="min-w-0 flex-1 border-s ps-3">
							<p class="text-sm leading-relaxed">{event.title}</p>
							{#if event.detail}
								<p class="text-muted-foreground mt-0.5 text-xs">{event.detail}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</Card.Content>
</DashboardCard>
