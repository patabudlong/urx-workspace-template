<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import SecurityActivityList from '$lib/components/security/security-activity-list.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import type { SecurityEventCategory } from '$lib/shared/models/security-event';
	import { getSecurityEventCategoryLabel } from '$lib/shared/security/event-presentations';
	import { buildSecurityLogHref } from '$lib/shared/security/security-activity-filters';

	let { data } = $props();

	const basePath = '/team/security';
	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.limit)));

	function filterHref(category: SecurityEventCategory | null): string {
		return buildSecurityLogHref(basePath, {
			category,
			unusualOnly: data.unusualOnly
		});
	}

	function unusualHref(): string {
		return buildSecurityLogHref(basePath, {
			category: data.category,
			unusualOnly: !data.unusualOnly
		});
	}

	function pageHref(page: number): string {
		return buildSecurityLogHref(basePath, {
			page,
			category: data.category,
			unusualOnly: data.unusualOnly
		});
	}

	const emptyMessage = $derived.by(() => {
		if (data.unusualOnly && data.category) {
			return `No unusual ${getSecurityEventCategoryLabel(data.category).toLowerCase()} events recorded for this workspace.`;
		}

		if (data.unusualOnly) {
			return 'No unusual sign-ins recorded for this workspace.';
		}

		if (data.category) {
			return `No ${getSecurityEventCategoryLabel(data.category).toLowerCase()} events recorded for this workspace yet.`;
		}

		return 'Workspace security events will appear here as teammates sign in and administrators make changes.';
	});

	const description = $derived.by(() => {
		if (data.unusualOnly && data.category) {
			return `Showing unusual ${getSecurityEventCategoryLabel(data.category).toLowerCase()} events for this workspace.`;
		}

		if (data.unusualOnly) {
			return 'Showing sign-ins flagged from unusual networks.';
		}

		if (data.category) {
			return `Showing ${getSecurityEventCategoryLabel(data.category).toLowerCase()} events for this workspace.`;
		}

		return 'Visible to workspace owners and admins. Includes RBAC updates, invitations, and member changes.';
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Team"
		title="Security log"
		description="Audit sign-ins, role changes, invitations, and other security-sensitive workspace actions."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace security events</Card.Title>
			<Card.Description>{description}</Card.Description>
			<Card.Action>
				<div class="flex flex-wrap items-center justify-end gap-2">
					<Button
						href={filterHref(null)}
						variant={!data.category ? 'default' : 'outline'}
						size="sm"
						class="h-9"
					>
						All events
					</Button>
					{#each data.filterCategories as category (category)}
						<Button
							href={filterHref(category)}
							variant={data.category === category ? 'default' : 'outline'}
							size="sm"
							class="h-9"
						>
							{getSecurityEventCategoryLabel(category)}
						</Button>
					{/each}
					<Button
						href={unusualHref()}
						variant={data.unusualOnly ? 'default' : 'outline'}
						size="sm"
						class="h-9"
					>
						Unusual sign-ins
					</Button>
				</div>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<SecurityActivityList events={data.events} {emptyMessage} />
		</Card.Content>
		{#if data.total > data.limit}
			<Card.Footer class="justify-between border-t">
				<p class="text-muted-foreground text-sm">
					Page {data.page} of {totalPages}
				</p>
				<div class="flex items-center gap-2">
					{#if data.page > 1}
						<Button href={pageHref(data.page - 1)} variant="outline" size="sm" class="h-8">
							Previous
						</Button>
					{/if}
					{#if data.page < totalPages}
						<Button href={pageHref(data.page + 1)} variant="outline" size="sm" class="h-8">
							Next
						</Button>
					{/if}
				</div>
			</Card.Footer>
		{/if}
	</Card.Root>
</div>
