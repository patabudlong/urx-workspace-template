<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import ListSearchInput from '$lib/components/list/list-search-input.svelte';
	import TeamMembersList from '$lib/components/team/team-members-list.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	let { data } = $props();

	let searchQuery = $state('');
</script>

<div class="flex w-full flex-col gap-8">
	<PageHeader
		eyebrow="Team"
		title="Members"
		description="People who have joined this workspace. Invited teammates appear here only after they create an account and accept their invitation."
	>
		{#snippet actions()}
			<Button href="/team/invitations" variant="outline" class="h-10">
				<UserPlusIcon class="size-4" aria-hidden="true" />
				Invite teammate
			</Button>
		{/snippet}
	</PageHeader>

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace members</Card.Title>
			<Card.Description>
				{data.members.length === 1
					? '1 person has access to this workspace.'
					: `${data.members.length} people have access to this workspace.`}
			</Card.Description>
			{#if data.members.length > 0}
				<Card.Action>
					<ListSearchInput
						bind:value={searchQuery}
						placeholder="Search members..."
						ariaLabel="Search members"
					/>
				</Card.Action>
			{/if}
		</Card.Header>
		<Card.Content>
			{#if data.members.length > 0}
				<TeamMembersList
					members={data.members}
					canManageMembers={data.canManageMembers}
					{searchQuery}
				/>
			{:else}
				<p class="text-muted-foreground text-sm">
					No members yet. Send an invitation and they will appear here after accepting.
				</p>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
