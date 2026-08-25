<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import SecurityActivityList from '$lib/components/security/security-activity-list.svelte';
	import SecurityPasswordCard from '$lib/components/security/security-password-card.svelte';
	import SecurityTwoFactorCard from '$lib/components/security/security-two-factor-card.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	let { data } = $props();
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Settings"
		title="Security"
		description="Review your sign-in methods, password, and personal security settings."
	/>

	<SecurityPasswordCard {data} security={data.security} />
	<SecurityTwoFactorCard {data} security={data.security} />

	<Card.Root>
		<Card.Header>
			<Card.Title>Recent activity</Card.Title>
			<Card.Description>
				Latest sign-ins, password changes, and other account security events.
			</Card.Description>
			<Card.Action>
				<Button href="/security/activity" variant="outline" class="h-9">View all activity</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			<SecurityActivityList events={data.recentActivity} />
		</Card.Content>
	</Card.Root>
</div>
