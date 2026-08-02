<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import TeamPermissionMatrix from '$lib/components/team/team-permission-matrix.svelte';
	import TeamRoleCards from '$lib/components/team/team-role-cards.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
</script>

<div class="flex w-full flex-col gap-8">
	<PageHeader
		eyebrow="Team"
		title="Roles & permissions"
		description="Built-in workspace roles and what each role can do. Roles are assigned when you invite members — they cannot be customized per workspace."
	>
		{#snippet actions()}
			<Button href="/team/invitations" variant="outline" class="h-10">
				<UserPlusIcon class="size-4" aria-hidden="true" />
				Invite teammate
			</Button>
		{/snippet}
	</PageHeader>

	<StatusAlert
		variant="info"
		title="Fixed role definitions"
		description="These permissions apply to every workspace. To change what someone can do, assign a different role on the Members or Invitations page."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Roles at a glance</Card.Title>
			<Card.Description>
				Six built-in roles from Owner (full control) to Guest (shared items only). Pick the
				lowest role that still lets someone do their job.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<TeamRoleCards />
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Full permission matrix</Card.Title>
			<Card.Description>
				Detailed breakdown of team management, content, and access permissions by role.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<TeamPermissionMatrix />
		</Card.Content>
	</Card.Root>
</div>
