<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="CRM"
		title="Settings"
		description="Configure CRM integration and workspace defaults."
	/>

	<StatusAlert
		variant="info"
		title="Workspace-scoped CRM"
		description="CRM records are stored per workspace. Use the /api/v1/crm endpoints for mobile clients and external integrations."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>API access</Card.Title>
			<Card.Description>Mobile and external clients can use Bearer JWT auth against the CRM API.</Card.Description>
		</Card.Header>
		<Card.Content class="text-muted-foreground space-y-2 text-sm">
			<p>Status probe: <code class="text-foreground">GET /api/v1/crm/status</code></p>
			<p>Contacts: <code class="text-foreground">GET/POST /api/v1/crm/contacts</code></p>
			<p>Companies: <code class="text-foreground">GET/POST /api/v1/crm/companies</code></p>
			<p>Deals: <code class="text-foreground">GET/POST /api/v1/crm/deals</code></p>
		</Card.Content>
	</Card.Root>
</div>
