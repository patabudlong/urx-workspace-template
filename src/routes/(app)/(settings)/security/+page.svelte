<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<div class="flex w-full flex-col gap-8">
	<PageHeader
		eyebrow="Settings"
		title="Security"
		description="Review your sign-in methods, password, and personal security settings."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Your security</Card.Title>
			<Card.Description>Personal security settings will be available here.</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-sm">
				Manage your password, connected accounts, and sign-in preferences.
			</p>
		</Card.Content>
	</Card.Root>
</div>
