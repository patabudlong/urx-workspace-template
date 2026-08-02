<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex w-full flex-col gap-8">
	<PageHeader
		eyebrow="Settings"
		title="Account"
		description="Manage your workspace profile, contact details, and branding."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace account</Card.Title>
			<Card.Description>Account settings for this workspace will be available here.</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-sm">
				Update workspace name, logo, contact information, and public-facing details.
			</p>
		</Card.Content>
	</Card.Root>
</div>
