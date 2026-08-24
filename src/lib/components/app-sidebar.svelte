<script lang="ts">
	import { page } from '$app/state';
	import SidebarModulesCta from '$lib/components/sidebar-modules-cta.svelte';
	import SiteBrandMark from '$lib/components/site-brand-mark.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { getAppNavGroups, isAppNavActive, isWorkspaceOwner, type AppNavItem } from '$lib/navigation/app-nav';
	import { cn } from '$lib/utils.js';

	const navItemClass = cn(
		'my-0.5 h-9 px-3 transition-all duration-200 ease-in-out',
		'hover:translate-x-0.5 hover:bg-primary/5 hover:text-primary',
		'data-[active=true]:bg-primary data-[active=true]:font-medium data-[active=true]:text-primary-foreground',
		'data-[active=true]:hover:bg-primary data-[active=true]:hover:text-primary-foreground'
	);

	const navGroupLabelClass =
		'text-muted-foreground mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wide';

	const navGroups = $derived(getAppNavGroups(page.data.workspace?.enabledPackages ?? []));
	const showModulesCta = $derived(isWorkspaceOwner(page.data.workspace?.role));

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
						<SiteBrandMark href="/" adaptiveLogo {...props} />
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content class="py-1 pe-1">
		{#each navGroups as group (group.label)}
			<Sidebar.Group>
				<Sidebar.GroupLabel class={navGroupLabelClass}>{group.label}</Sidebar.GroupLabel>
				<Sidebar.Menu>
					{#each group.items as item (item.href)}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton
								class={navItemClass}
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

	{#if showModulesCta}
		<Sidebar.Footer class="mt-auto shrink-0 p-0">
			<SidebarModulesCta />
		</Sidebar.Footer>
	{/if}

	<Sidebar.Rail />
</Sidebar.Root>
