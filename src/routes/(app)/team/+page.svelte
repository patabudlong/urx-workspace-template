<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex w-full flex-col gap-8">
	<PageHeader
		eyebrow="Team"
		title="Members"
		description="View workspace members, update roles, and manage who has access."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Team members</Card.Title>
			<Card.Description>Member management and invitations will be available here.</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-sm">
				View your team, send invites, and update member roles from this page.
			</p>
		</Card.Content>
	</Card.Root>
</div>
