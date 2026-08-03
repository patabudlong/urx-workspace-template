<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex w-full flex-col gap-8">
	<PageHeader
		eyebrow="Settings"
		title="Account"
		description="Manage your profile, contact details, and preferences."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Your account</Card.Title>
			<Card.Description>Personal account settings will be available here.</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-sm">
				Update your name, email, avatar, and other personal details.
			</p>
		</Card.Content>
	</Card.Root>
</div>
