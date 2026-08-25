<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { formatUserAgentLabel } from '$lib/shared/format-user-agent';
	import type { SecurityEventSummary } from '$lib/shared/models/security-event';
	import {
		getSecurityEventCategoryLabel,
		getSecurityEventPresentation,
		getSecurityEventSeverityLabel
	} from '$lib/shared/security/event-presentations';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import MonitorIcon from '@lucide/svelte/icons/monitor';

	let {
		events,
		emptyMessage = 'No security activity recorded yet.'
	}: {
		events: SecurityEventSummary[];
		emptyMessage?: string;
	} = $props();

	function formatTimestamp(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}

	function severityVariant(
		severity: SecurityEventSummary['severity']
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		if (severity === 'critical') {
			return 'destructive';
		}

		if (severity === 'warning') {
			return 'secondary';
		}

		return 'outline';
	}
</script>

{#if events.length === 0}
	<p class="text-muted-foreground text-sm leading-relaxed">{emptyMessage}</p>
{:else}
	<ul class="divide-border divide-y">
		{#each events as event (event.id)}
			{@const presentation = getSecurityEventPresentation(event.action, event.metadata)}
			<li class="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
				<div class="min-w-0 flex-1 space-y-1">
					<div class="flex flex-wrap items-center gap-2">
						<p class="text-sm font-medium">{presentation.title}</p>
						<Badge variant={severityVariant(event.severity)}>
							{getSecurityEventSeverityLabel(event.severity)}
						</Badge>
						{#if event.isUnusualLocation}
							<Badge variant="secondary">Unusual location</Badge>
						{/if}
					</div>
					{#if presentation.description}
						<p class="text-muted-foreground text-sm leading-relaxed">
							{presentation.description}
						</p>
					{/if}
					<div class="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
						<span>{getSecurityEventCategoryLabel(event.category)}</span>
						{#if event.ipAddress}
							<span class="inline-flex items-center gap-1">
								<MapPinIcon class="size-3.5 shrink-0" aria-hidden="true" />
								{event.ipAddress}
							</span>
						{/if}
						{#if event.userAgent}
							<span class="inline-flex min-w-0 items-center gap-1">
								<MonitorIcon class="size-3.5 shrink-0" aria-hidden="true" />
								<span class="truncate">{formatUserAgentLabel(event.userAgent)}</span>
							</span>
						{/if}
					</div>
				</div>
				<time class="text-muted-foreground shrink-0 text-xs tabular-nums" datetime={event.createdAt}>
					{formatTimestamp(event.createdAt)}
				</time>
			</li>
		{/each}
	</ul>
{/if}
