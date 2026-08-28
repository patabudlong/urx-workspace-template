<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Project Management"
		title="Settings"
		description="Configure Project Management integration and API access for this workspace."
	/>

	<StatusAlert
		variant="info"
		title="Workspace-scoped projects"
		description="Projects are stored per workspace. Use the /api/v1/project-management endpoints for mobile clients and external integrations."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>API access</Card.Title>
			<Card.Description>Mobile and external clients can use Bearer JWT auth against the Project Management API.</Card.Description>
		</Card.Header>
		<Card.Content class="text-muted-foreground space-y-2 text-sm">
			<p>Status probe: <code class="text-foreground">GET /api/v1/project-management/status</code></p>
			<p>Projects: <code class="text-foreground">GET/POST /api/v1/project-management/projects</code></p>
			<p>Project detail: <code class="text-foreground">GET/PATCH /api/v1/project-management/projects/:id</code></p>
		</Card.Content>
	</Card.Root>
</div>
