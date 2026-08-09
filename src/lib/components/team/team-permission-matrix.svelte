<script lang="ts">
	import TeamPermissionLevel from '$lib/components/team/team-permission-level.svelte';
	import TeamPermissionLegend from '$lib/components/team/team-permission-legend.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import {
		TEAM_MATRIX_ROLE_COLUMNS,
		TEAM_PERMISSION_MATRIX,
		findTeamRoleOverview
	} from '$lib/shared/team/role-permissions';
</script>

<div class="space-y-4">
	<TeamPermissionLegend />

	<div class="overflow-x-auto rounded-lg border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="bg-background sticky start-0 z-10 min-w-56 shadow-[1px_0_0_0_var(--border)]">
					Permission
				</Table.Head>
				{#each TEAM_MATRIX_ROLE_COLUMNS as role (role)}
					{@const overview = findTeamRoleOverview(role)}
					<Table.Head class="w-20 text-center whitespace-nowrap">
						{#if overview}
							<Tooltip.Root>
								<Tooltip.Trigger class="cursor-default underline decoration-dotted underline-offset-4">
									{overview.label}
								</Tooltip.Trigger>
								<Tooltip.Content side="top" class="max-w-xs">
									{overview.tooltip}
								</Tooltip.Content>
							</Tooltip.Root>
						{/if}
					</Table.Head>
				{/each}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each TEAM_PERMISSION_MATRIX as row, index (row.label)}
				{#if row.group && (index === 0 || TEAM_PERMISSION_MATRIX[index - 1]?.group !== row.group)}
					<Table.Row class="bg-muted/30 hover:bg-muted/30">
						<Table.Cell
							colspan={TEAM_MATRIX_ROLE_COLUMNS.length + 1}
							class="text-muted-foreground py-2 text-xs font-semibold tracking-wide uppercase"
						>
							{row.group}
						</Table.Cell>
					</Table.Row>
				{/if}
				<Table.Row>
					<Table.Cell
						class="bg-background sticky start-0 z-10 text-sm shadow-[1px_0_0_0_var(--border)]"
					>
						{row.label}
					</Table.Cell>
					{#each TEAM_MATRIX_ROLE_COLUMNS as role (role)}
						<Table.Cell class="text-center">
							<TeamPermissionLevel level={row.permissions[role]} />
						</Table.Cell>
					{/each}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
	</div>
</div>
