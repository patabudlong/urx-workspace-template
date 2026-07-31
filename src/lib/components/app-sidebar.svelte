<script lang="ts">
	import { page } from '$app/state';
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import BookOpenIcon from '@lucide/svelte/icons/book-open';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';

	const navItems = [
		{ title: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
		{ title: 'API Docs', href: '/docs', icon: BookOpenIcon },
		{ title: 'Health Check', href: '/api/v1/health', icon: ActivityIcon }
	];
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
							<div class="grid flex-1 text-left text-sm leading-tight">
								<span class="truncate font-medium">Urixoft</span>
								<span class="truncate text-xs text-muted-foreground">Workspace</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Platform</Sidebar.GroupLabel>
			<Sidebar.Menu>
				{#each navItems as item (item.href)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={page.url.pathname === item.href} tooltipContent={item.title}>
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

	<Sidebar.Rail />
</Sidebar.Root>
