<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import ListSearchInput from '$lib/components/list/list-search-input.svelte';
	import TeamMembersList from '$lib/components/team/team-members-list.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import type { TeamMemberItem } from '$lib/components/team/team-members-list.svelte';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';

	import { page } from '$app/state';

	let { data } = $props();

	let searchQuery = $state('');
	let members = $state<TeamMemberItem[] | null>(null);

	$effect(() => {
		const next = data.members as Promise<TeamMemberItem[]> | TeamMemberItem[];

		if (Array.isArray(next)) {
			members = next;
			return;
		}

		if (!next || typeof next.then !== 'function') {
			members = [];
			return;
		}

		members = null;

		void next.then((resolved) => {
			members = resolved;
		});
	});
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
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
		{#if members === null}
			<Card.Header>
				<Skeleton class="h-6 w-40" />
				<Skeleton class="mt-2 h-4 w-64" />
			</Card.Header>
			<Card.Content class="space-y-3">
				{#each Array.from({ length: 5 }) as _, index (index)}
					<Skeleton class="h-14 w-full" />
				{/each}
			</Card.Content>
		{:else}
			<Card.Header>
				<Card.Title>Workspace members</Card.Title>
				<Card.Description>
					{members.length === 1
						? '1 person has access to this workspace.'
						: `${members.length} people have access to this workspace.`}
				</Card.Description>
				{#if members.length > 0}
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
				{#if members.length > 0}
					<TeamMembersList
						{members}
						canManageMembers={data.canManageMembers}
						actorRole={page.data.workspace?.role ?? ''}
						currentUserId={page.data.user?.id ?? ''}
						{searchQuery}
					/>
				{:else}
					<p class="text-muted-foreground text-sm">
						No members yet. Send an invitation and they will appear here after accepting.
					</p>
				{/if}
			</Card.Content>
		{/if}
	</Card.Root>
</div>
