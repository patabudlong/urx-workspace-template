<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { isAppNavActive } from '$lib/navigation/app-nav';
	import { TEAM_NAV_ITEMS } from '$lib/navigation/team-nav';
</script>

<Sidebar.Header class="border-sidebar-border shrink-0 gap-1 border-b p-4">
	<h2 class="text-sm font-semibold">Team</h2>
	<p class="text-muted-foreground mt-1 text-xs leading-relaxed">
		Manage members and invitations for this workspace.
	</p>
</Sidebar.Header>

<Sidebar.Content class="min-h-0 flex-1 gap-1 ps-1 pt-1">
	<Sidebar.Group>
		<Sidebar.GroupLabel>Manage</Sidebar.GroupLabel>
		<Sidebar.Menu>
			{#each TEAM_NAV_ITEMS as item (item.href)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton isActive={isAppNavActive(page.url.pathname, item)} tooltipContent={item.title}>
						{#snippet child({ props })}
							<a href={item.href} {...props}>
								<item.icon />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.Group>
</Sidebar.Content>
