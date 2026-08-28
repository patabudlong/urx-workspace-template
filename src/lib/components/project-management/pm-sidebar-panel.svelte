<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import PmSettingsSidebarMenu from '$lib/components/project-management/pm-settings-sidebar-menu.svelte';
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { SOLAR } from '$lib/icons/solar-icons';
	import { isAppNavActive, type AppNavItem } from '$lib/navigation/app-nav';

	let { items }: { items: AppNavItem[] } = $props();
</script>

<Sidebar.Header class="border-sidebar-border shrink-0 gap-1 border-b p-4">
	<div class="flex items-center gap-2">
		<AppIcon
			icon={SOLAR.projectManagement}
			size="lg"
			class="text-indigo-600 dark:text-indigo-400"
			aria-hidden="true"
		/>
		<h2 class="text-sm font-semibold">Project Management</h2>
	</div>
	<p class="text-muted-foreground mt-1 text-sm leading-relaxed">
		Plan client projects and track delivery from kickoff to completion.
	</p>
</Sidebar.Header>

<Sidebar.Content class="min-h-0 flex-1 gap-1 overflow-visible ps-1 pt-1">
	<Sidebar.Group>
		<Sidebar.GroupLabel class="text-sm">Manage</Sidebar.GroupLabel>
		<Sidebar.Menu>
			{#each items as item (item.href)}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						isActive={isAppNavActive(page.url.pathname, item)}
						tooltipContent={item.title}
					>
						{#snippet child({ props })}
							<a href={item.href} {...props}>
								<AppIcon icon={item.icon} />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/each}
		</Sidebar.Menu>
	</Sidebar.Group>
</Sidebar.Content>

<Sidebar.Footer class="border-sidebar-border mt-auto shrink-0 border-t p-2">
	<Sidebar.Menu>
		<PmSettingsSidebarMenu />
	</Sidebar.Menu>
</Sidebar.Footer>
