<script lang="ts">
	import { page } from '$app/state';
	import SiteBrandMark from '$lib/components/site-brand-mark.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { APP_NAV_GROUPS, isAppNavActive, type AppNavItem } from '$lib/navigation/app-nav';

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

	<Sidebar.Rail />
</Sidebar.Root>
