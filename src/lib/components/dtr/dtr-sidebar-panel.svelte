<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { isAppNavActive, type AppNavItem } from '$lib/navigation/app-nav';

	let { items }: { items: AppNavItem[] } = $props();
</script>

<Sidebar.Header class="border-sidebar-border shrink-0 gap-1 border-b p-4">
	<h2 class="text-sm font-semibold">DTR</h2>
	<p class="text-muted-foreground mt-1 text-xs leading-relaxed">
		Daily time records, work schedules, and attendance for this workspace.
	</p>
</Sidebar.Header>

<Sidebar.Content class="min-h-0 flex-1 gap-1 overflow-visible ps-1 pt-1">
	<Sidebar.Group>
		<Sidebar.GroupLabel>Manage</Sidebar.GroupLabel>
		<Sidebar.Menu>
			{#each items as item (item.href)}
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
