<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex w-full flex-col gap-8">
	<PageHeader
		eyebrow="Settings"
		title="Security"
		description="Review access controls, authentication policies, and workspace security settings."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace security</Card.Title>
			<Card.Description>Security controls for this workspace will be available here.</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-sm">
				Manage sign-in requirements, session policies, and team access safeguards.
			</p>
		</Card.Content>
	</Card.Root>
</div>
