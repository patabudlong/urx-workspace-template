<script lang="ts">
	import TeamPermissionLevel from '$lib/components/team/team-permission-level.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { TEAM_ROLE_OVERVIEW } from '$lib/shared/team/role-permissions';
</script>

<div class="overflow-x-auto rounded-lg border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="min-w-28">Role</Table.Head>
				<Table.Head class="min-w-48">Description</Table.Head>
				<Table.Head class="w-28 text-center">Manage members</Table.Head>
				<Table.Head class="w-32 text-center">Edit team settings</Table.Head>
				<Table.Head class="w-36 text-center">Create / edit all content</Table.Head>
				<Table.Head class="w-36 text-center">View all team content</Table.Head>
				<Table.Head class="w-32 text-center">Assigned items only</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each TEAM_ROLE_OVERVIEW as role (role.role)}
				<Table.Row>
					<Table.Cell class="font-medium whitespace-nowrap">
						<Tooltip.Root>
							<Tooltip.Trigger class="cursor-default underline decoration-dotted underline-offset-4">
								{role.label}
							</Tooltip.Trigger>
							<Tooltip.Content side="top" class="max-w-xs">
								{role.tooltip}
							</Tooltip.Content>
						</Tooltip.Root>
					</Table.Cell>
					<Table.Cell class="text-muted-foreground text-sm leading-relaxed">
						{role.shortDescription}
					</Table.Cell>
					<Table.Cell class="text-center">
						<TeamPermissionLevel level={role.manageMembers} />
					</Table.Cell>
					<Table.Cell class="text-center">
						<TeamPermissionLevel level={role.editTeamSettings} />
					</Table.Cell>
					<Table.Cell class="text-center">
						<TeamPermissionLevel level={role.createEditAllContent} />
					</Table.Cell>
					<Table.Cell class="text-center">
						<TeamPermissionLevel level={role.viewAllTeamContent} />
					</Table.Cell>
					<Table.Cell class="text-center">
						<TeamPermissionLevel level={role.accessOnlyAssigned} />
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
