<script lang="ts">
	import { page } from '$app/state';
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import {
		APP_NAV_GROUPS,
		formatWorkspaceRole,
		isAppNavActive,
		type AppNavItem
	} from '$lib/navigation/app-nav';
	import Building2Icon from '@lucide/svelte/icons/building-2';

	type WorkspaceContext = {
		workspaceName: string;
		workspaceSlug: string;
		role: string;
	};

	let { workspace = null }: { workspace?: WorkspaceContext | null } = $props();

	function navTarget(item: AppNavItem): string | undefined {
		return item.external ? '_blank' : undefined;
	}

	function navRel(item: AppNavItem): string | undefined {
		return item.external ? 'noreferrer noopener' : undefined;
	}
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<UrixoftLogo class="size-8 shrink-0 rounded-sm dark:hidden" />
							<UrixoftLogo variant="white" class="hidden size-8 shrink-0 rounded-sm dark:block" />
							<div class="grid min-w-0 flex-1 text-left text-sm leading-tight">
								<span class="truncate font-semibold">Urixoft</span>
								<span class="text-muted-foreground truncate text-xs">Workspace</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		{#each APP_NAV_GROUPS as group (group.label)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
				<Sidebar.Menu>
					{#each group.items as item (item.href)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								isActive={isAppNavActive(page.url.pathname, item)}
								tooltipContent={item.title}
							>
								{#snippet child({ props })}
									<a href={item.href} target={navTarget(item)} rel={navRel(item)} {...props}>
										<item.icon />
										<span>{item.title}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>

	{#if workspace}
		<Sidebar.Footer>
			<div class="border-sidebar-border bg-sidebar-accent/40 flex items-start gap-3 rounded-lg border p-3">
				<div
					class="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg"
				>
					<Building2Icon class="size-4" />
				</div>
				<div class="min-w-0 flex-1 space-y-1">
					<p class="truncate text-sm font-medium">{workspace.workspaceName}</p>
					<p class="text-muted-foreground truncate font-mono text-[11px]">
						{workspace.workspaceSlug}.workspace.urixoft.com
					</p>
					<Badge variant="secondary" class="w-fit px-1.5 py-0 text-[10px] font-medium">
						{formatWorkspaceRole(workspace.role)}
					</Badge>
				</div>
			</div>
		</Sidebar.Footer>
	{/if}

	<Sidebar.Rail />
</Sidebar.Root>
