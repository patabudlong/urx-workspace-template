<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<div class="space-y-6">
	<div class="space-y-2">
		<h1 class="text-2xl font-semibold tracking-tight">Workspace requests</h1>
		<p class="text-muted-foreground text-sm">
			Review and approve new workspace owner requests before users can access the dashboard.
		</p>
	</div>

	{#if form?.message}
		<StatusAlert variant="danger" title="Unable to update request" description={form.message} />
	{/if}

	{#if form?.success}
		<StatusAlert
			variant="success"
			title="Request updated"
			description="The workspace request was updated successfully."
		/>
	{/if}

	{#if data.requests.length === 0}
		<Card.Root>
			<Card.Content class="text-muted-foreground py-10 text-center text-sm">
				No pending workspace requests.
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-4">
			{#each data.requests as request}
				<Card.Root>
					<Card.Header class="space-y-1">
						<Card.Title>{request.name}</Card.Title>
						<Card.Description>
							<span class="font-mono">{request.slug}</span>
							{#if request.requester}
								· {request.requester.name} ({request.requester.email})
							{/if}
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<dl class="grid gap-3 text-sm sm:grid-cols-2">
							<div>
								<dt class="text-muted-foreground">Team size</dt>
								<dd>{request.teamSize}</dd>
							</div>
							<div>
								<dt class="text-muted-foreground">Contact</dt>
								<dd>{request.contactPhone}</dd>
							</div>
							<div>
								<dt class="text-muted-foreground">Location</dt>
								<dd>{request.city}, {request.country}</dd>
							</div>
							{#if request.website}
								<div>
									<dt class="text-muted-foreground">Website</dt>
									<dd>{request.website}</dd>
								</div>
							{/if}
							<div>
								<dt class="text-muted-foreground">Requested</dt>
								<dd>{new Date(request.createdAt).toLocaleString()}</dd>
							</div>
						</dl>

						<div class="flex flex-col gap-3 sm:flex-row">
							<form method="POST" action="?/approve" use:enhance>
								<input type="hidden" name="workspaceId" value={request.id} />
								<Button type="submit">Approve</Button>
							</form>

							<form method="POST" action="?/reject" use:enhance class="flex flex-1 flex-col gap-2 sm:flex-row">
								<input type="hidden" name="workspaceId" value={request.id} />
								<input
									type="text"
									name="rejectionReason"
									placeholder="Optional rejection reason"
									class="border-input bg-background h-10 flex-1 rounded-lg border px-2.5 text-sm"
								/>
								<Button type="submit" variant="outline">Reject</Button>
							</form>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
