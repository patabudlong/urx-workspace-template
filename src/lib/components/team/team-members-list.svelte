<script lang="ts">
	import ListPagination from '$lib/components/list/list-pagination.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import RemoveTeamMemberDialog from '$lib/components/team/remove-team-member-dialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';
	import { filterTeamMembers } from '$lib/shared/team/filter-team-members';
	import {
		formatTeamMemberRemovedMessage,
		TEAM_MEMBER_REMOVE_FAILED_MESSAGE
	} from '$lib/shared/team/member-messages';
	import { getTeamRoleTooltip } from '$lib/shared/team/role-permissions';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import CrownIcon from '@lucide/svelte/icons/crown';
	import UserMinusIcon from '@lucide/svelte/icons/user-minus';

	export type TeamMemberItem = {
		id: string;
		userId: string;
		name: string;
		email: string;
		role: string;
		roleLabel: string;
		joinedAt: string;
	};

	let {
		members,
		canManageMembers = false,
		searchQuery = ''
	}: {
		members: TeamMemberItem[];
		canManageMembers?: boolean;
		searchQuery?: string;
	} = $props();

	const PAGE_SIZE = 10;

	let currentPage = $state(1);
	let removingId = $state<string | null>(null);
	let removeMessage = $state<string | null>(null);
	let removeError = $state<string | null>(null);
	let removeDialogOpen = $state(false);
	let memberToRemove = $state<TeamMemberItem | null>(null);
	let removeEnhanceAction = $state<SubmitFunction | undefined>(undefined);

	const filteredMembers = $derived(filterTeamMembers(members, searchQuery));
	const isSearching = $derived(searchQuery.trim().length > 0);
	const totalPages = $derived(Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE)));
	const paginatedMembers = $derived(
		filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
	);

	function formatJoinedAt(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium'
		}).format(new Date(value));
	}

	function canRemoveMember(member: TeamMemberItem): boolean {
		return canManageMembers && member.role !== WORKSPACE_MEMBER_ROLES.OWNER;
	}

	function openRemoveDialog(member: TeamMemberItem) {
		memberToRemove = member;
		removeEnhanceAction = createRemoveEnhance(member.id);
		removeDialogOpen = true;
	}

	function closeRemoveDialog() {
		removeDialogOpen = false;
		memberToRemove = null;
		removeEnhanceAction = undefined;
	}

	function createRemoveEnhance(memberId: string): SubmitFunction {
		return () => {
			removingId = memberId;
			removeMessage = null;
			removeError = null;

			return async ({ result, update }) => {
				removingId = null;

				if (result.type === 'success') {
					const removedName = memberToRemove?.name ?? '';
					removeMessage = formatTeamMemberRemovedMessage(removedName);
					removeError = null;
					closeRemoveDialog();
					await invalidateAll();
				} else if (result.type === 'failure') {
					const data = result.data as { removeMessage?: string } | undefined;
					removeError = data?.removeMessage ?? TEAM_MEMBER_REMOVE_FAILED_MESSAGE;
					removeMessage = null;
					closeRemoveDialog();
				}

				await update();
			};
		};
	}

	$effect(() => {
		if (!removeDialogOpen) {
			memberToRemove = null;
			removeEnhanceAction = undefined;
		}
	});

	$effect(() => {
		searchQuery;
		currentPage = 1;
	});

	$effect(() => {
		if (currentPage > totalPages) {
			currentPage = totalPages;
		}
	});
</script>

<div class="space-y-4">
	{#if removeMessage}
		<StatusAlert variant="success" title="Member removed" description={removeMessage} />
	{:else if removeError}
		<StatusAlert variant="danger" title="Could not remove member" description={removeError} />
	{/if}

	{#if isSearching}
		<p class="text-muted-foreground text-sm">
			{filteredMembers.length === 1
				? '1 member'
				: `${filteredMembers.length} members`}
			{filteredMembers.length === members.length ? 'found' : `of ${members.length}`}
		</p>
	{/if}

	{#if filteredMembers.length === 0}
		<div
			class="border-border bg-muted/20 flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center"
		>
			<p class="text-foreground text-sm font-medium">No members match your search</p>
			<p class="text-muted-foreground max-w-sm text-sm">
				Try a different name, email address, or role.
			</p>
		</div>
	{:else}
	<div class="overflow-x-auto rounded-lg border">
		<table class="w-full min-w-[40rem] text-sm">
			<thead class="bg-muted/40 border-b">
				<tr>
					<th class="text-muted-foreground min-w-32 px-4 py-3 text-left font-medium">Name</th>
					<th class="text-muted-foreground min-w-48 px-4 py-3 text-left font-medium">Email</th>
					<th class="text-muted-foreground min-w-28 px-4 py-3 text-left font-medium">Role</th>
					<th class="text-muted-foreground min-w-28 px-4 py-3 text-left font-medium">Joined</th>
					{#if canManageMembers}
						<th class="text-muted-foreground px-4 py-3 text-right font-medium">
							<span class="sr-only">Actions</span>
						</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each paginatedMembers as member (member.id)}
					<tr class="border-b last:border-b-0">
						<td class="px-4 py-3 font-medium">{member.name}</td>
						<td class="text-muted-foreground px-4 py-3">{member.email}</td>
						<td class="px-4 py-3">
							{#if member.role === WORKSPACE_MEMBER_ROLES.OWNER}
								<span
									class="inline-flex items-center gap-1.5"
									title={getTeamRoleTooltip(member.role)}
								>
									<CrownIcon
										class="size-4 shrink-0 text-amber-600 dark:text-amber-400"
										aria-hidden="true"
									/>
									{member.roleLabel}
								</span>
							{:else}
								<span title={getTeamRoleTooltip(member.role)}>{member.roleLabel}</span>
							{/if}
						</td>
						<td class="text-muted-foreground px-4 py-3">{formatJoinedAt(member.joinedAt)}</td>
						{#if canManageMembers}
							<td class="px-4 py-3 text-right">
								{#if canRemoveMember(member)}
									<Button
										type="button"
										variant="outline"
										size="sm"
										class="text-muted-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive h-8 px-2.5"
										onclick={() => openRemoveDialog(member)}
										aria-label={`Remove ${member.name} from workspace`}
									>
										<UserMinusIcon class="size-4" aria-hidden="true" />
										Remove
									</Button>
								{/if}
							</td>
						{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<ListPagination bind:page={currentPage} pageSize={PAGE_SIZE} total={filteredMembers.length} />
	{/if}
</div>

{#if memberToRemove && removeEnhanceAction}
	<RemoveTeamMemberDialog
		bind:open={removeDialogOpen}
		member={memberToRemove}
		submitting={removingId === memberToRemove.id}
		enhanceAction={removeEnhanceAction}
	/>
{/if}
