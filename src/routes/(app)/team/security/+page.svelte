<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import SecurityActivityList from '$lib/components/security/security-activity-list.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let { data } = $props();

	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.limit)));
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
			<Card.Description>
				Visible to workspace owners and admins. Includes RBAC updates, invitations, and member changes.
			</Card.Description>
			<Card.Action>
				<div class="flex flex-wrap items-center gap-2">
					<Button
						href="/team/security"
						variant={data.unusualOnly ? 'outline' : 'default'}
						size="sm"
						class="h-9"
					>
						All events
					</Button>
					<Button
						href="/team/security?unusual=true"
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
			<SecurityActivityList
				events={data.events}
				emptyMessage={data.unusualOnly
					? 'No unusual sign-ins recorded for this workspace.'
					: 'Workspace security events will appear here as teammates sign in and administrators make changes.'}
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
							href={data.unusualOnly
								? `/team/security?page=${data.page - 1}&unusual=true`
								: `/team/security?page=${data.page - 1}`}
							variant="outline"
							size="sm"
							class="h-8"
						>
							Previous
						</Button>
					{/if}
					{#if data.page < totalPages}
						<Button
							href={data.unusualOnly
								? `/team/security?page=${data.page + 1}&unusual=true`
								: `/team/security?page=${data.page + 1}`}
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
