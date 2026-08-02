<script lang="ts">
	import TeamPermissionLevel from '$lib/components/team/team-permission-level.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { TEAM_ROLE_OVERVIEW } from '$lib/shared/team/role-permissions';

	const permissionRows = [
		{ key: 'manageMembers' as const, label: 'Manage members' },
		{ key: 'editTeamSettings' as const, label: 'Team settings' },
		{ key: 'createEditAllContent' as const, label: 'Create / edit content' },
		{ key: 'viewAllTeamContent' as const, label: 'View all content' },
		{ key: 'accessOnlyAssigned' as const, label: 'Assigned items only' }
	];
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
	{#each TEAM_ROLE_OVERVIEW as role (role.role)}
		<Card.Root class="flex flex-col">
			<Card.Header class="gap-2 pb-3">
				<div class="flex items-start justify-between gap-2">
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Card.Title class="text-base">{role.label}</Card.Title>
						</Tooltip.Trigger>
						<Tooltip.Content side="top" class="max-w-xs">
							{role.tooltip}
						</Tooltip.Content>
					</Tooltip.Root>
					{#if role.role === 'owner'}
						<Badge variant="secondary" class="shrink-0">Workspace</Badge>
					{/if}
				</div>
				<Card.Description class="text-sm leading-relaxed">
					{role.shortDescription}
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-1 flex-col gap-4 pt-0">
				<dl class="grid gap-2">
					{#each permissionRows as row (row.key)}
						<div class="flex items-center justify-between gap-3 text-sm">
							<dt class="text-muted-foreground">{row.label}</dt>
							<dd>
								<TeamPermissionLevel level={role[row.key]} />
							</dd>
						</div>
					{/each}
				</dl>
				<p class="text-muted-foreground mt-auto border-t pt-3 text-xs leading-relaxed">
					{role.explanation}
				</p>
			</Card.Content>
		</Card.Root>
	{/each}
</div>
