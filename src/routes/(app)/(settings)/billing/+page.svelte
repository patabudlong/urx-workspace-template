<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex w-full flex-col gap-8">
	<PageHeader
		eyebrow="Settings"
		title="Billing"
		description="Manage your workspace subscription, invoices, and payment methods."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace billing</Card.Title>
			<Card.Description>Billing and subscription settings will be available here.</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-sm">
				View your plan, update payment details, and download invoices for this workspace.
			</p>
		</Card.Content>
	</Card.Root>
</div>
