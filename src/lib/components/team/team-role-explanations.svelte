<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { TEAM_ROLE_OVERVIEW } from '$lib/shared/team/role-permissions';
</script>

<div class="divide-border divide-y rounded-lg border">
	{#each TEAM_ROLE_OVERVIEW as role (role.role)}
		<div class="space-y-1 px-4 py-4">
			<Tooltip.Root>
				<Tooltip.Trigger class="text-sm font-semibold underline decoration-dotted underline-offset-4">
					{role.label}
				</Tooltip.Trigger>
				<Tooltip.Content side="top" class="max-w-xs">
					{role.tooltip}
				</Tooltip.Content>
			</Tooltip.Root>
			<p class="text-muted-foreground text-sm leading-relaxed">{role.explanation}</p>
		</div>
	{/each}
</div>
