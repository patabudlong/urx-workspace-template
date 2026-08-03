<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import ProfileDetailsForm from '$lib/components/account/profile-details-form.svelte';
	import ProfileEmailCard from '$lib/components/account/profile-email-card.svelte';
	import ProfilePhoneCard from '$lib/components/account/profile-phone-card.svelte';
	import ProfileSummary from '$lib/components/account/profile-summary.svelte';
	import * as Card from '$lib/components/ui/card/index.js';

	let { data } = $props();
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Settings"
		title="Account"
		description="Manage your profile, contact details, and how you appear in this workspace."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Your profile</Card.Title>
			<Card.Description>
				This is how teammates see you across the workspace.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<ProfileSummary profile={data.profile} />
		</Card.Content>
	</Card.Root>

	<ProfileDetailsForm {data} />
	<ProfilePhoneCard {data} profile={data.profile} />
	<ProfileEmailCard profile={data.profile} />
</div>
