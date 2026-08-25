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
		eyebrow="Settings"
		title="Security activity"
		description="Review sign-ins, password changes, and other security events for your account."
	>
		{#snippet actions()}
			<Button href="/security" variant="outline" class="h-10">Back to security</Button>
		{/snippet}
	</PageHeader>

	<Card.Root>
		<Card.Header>
			<Card.Title>Account activity</Card.Title>
			<Card.Description>
				{#if data.unusualOnly}
					Showing sign-ins flagged from unusual networks.
				{:else}
					Recent security events tied to your personal account.
				{/if}
			</Card.Description>
			<Card.Action>
				<div class="flex flex-wrap items-center gap-2">
					<Button
						href="/security/activity"
						variant={data.unusualOnly ? 'outline' : 'default'}
						size="sm"
						class="h-9"
					>
						All events
					</Button>
					<Button
						href="/security/activity?unusual=true"
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
					? 'No unusual sign-ins detected for your account.'
					: 'Security activity will appear here after sign-ins, password changes, and other account updates.'}
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
								? `/security/activity?page=${data.page - 1}&unusual=true`
								: `/security/activity?page=${data.page - 1}`}
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
								? `/security/activity?page=${data.page + 1}&unusual=true`
								: `/security/activity?page=${data.page + 1}`}
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
