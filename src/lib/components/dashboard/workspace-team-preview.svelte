<script lang="ts">
	import DashboardCard from '$lib/components/dashboard/dashboard-card.svelte';
	import PresenceStatusIndicator from '$lib/components/presence-status-indicator.svelte';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { PRESENCE_STATUS_LABELS } from '$lib/shared/presence';
	import type { WorkspaceOverviewMember } from '$lib/shared/dashboard/overview';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	let {
		members,
		memberCount
	}: {
		members: WorkspaceOverviewMember[];
		memberCount: number;
	} = $props();

	function presenceBadgeClass(status: WorkspaceOverviewMember['presenceStatus']): string {
		if (status === 'online') {
			return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
		}

		if (status === 'away') {
			return 'bg-amber-500/10 text-amber-700 dark:text-amber-400';
		}

		if (status === 'busy') {
			return 'bg-destructive/10 text-destructive';
		}

		return 'bg-muted text-muted-foreground';
	}
</script>

<DashboardCard class="h-full">
	<Card.Header class="sm:flex-row sm:items-center sm:justify-between">
		<div class="space-y-1">
			<Card.Title>Team preview</Card.Title>
			<Card.Description>
				{memberCount === 1
					? '1 person has access to this workspace.'
					: `${memberCount} people have access to this workspace.`}
			</Card.Description>
		</div>
		<Button href="/team" variant="outline" size="sm" class="mt-2 sm:mt-0">
			View all
			<ArrowRightIcon class="size-4" />
		</Button>
	</Card.Header>
	<Card.Content class="px-0">
		{#if members.length === 0}
			<p class="text-muted-foreground px-6 text-sm leading-relaxed">
				Invite teammates to start building your workspace team.
			</p>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Member</Table.Head>
						<Table.Head class="hidden sm:table-cell">Role</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-right">Action</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each members as member (member.id)}
						<Table.Row class="hover:bg-muted/40">
							<Table.Cell>
								<div class="flex min-w-0 items-center gap-3">
									<UserAvatar
										avatarUrl={member.avatarUrl}
										initials={member.initials}
										presenceStatus={member.presenceStatus}
										class="size-9"
									/>
									<div class="min-w-0">
										<p class="truncate text-sm font-medium">{member.name}</p>
										<p class="text-muted-foreground truncate text-xs">{member.email}</p>
									</div>
								</div>
							</Table.Cell>
							<Table.Cell class="hidden sm:table-cell">
								<Badge variant="outline">{member.roleLabel}</Badge>
							</Table.Cell>
							<Table.Cell>
								<Badge class={presenceBadgeClass(member.presenceStatus)}>
									<PresenceStatusIndicator status={member.presenceStatus} class="size-2" />
									{PRESENCE_STATUS_LABELS[member.presenceStatus]}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-right">
								<Button href="/team" variant="ghost" size="sm">Open</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</Card.Content>
</DashboardCard>
