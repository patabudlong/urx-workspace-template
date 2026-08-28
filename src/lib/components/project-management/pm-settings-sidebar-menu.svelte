<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { isAppNavActive } from '$lib/navigation/app-nav';
	import { PM_SETTINGS_NAV_ITEM } from '$lib/navigation/project-management-nav';
</script>

<Sidebar.MenuItem>
	<Sidebar.MenuButton
		isActive={isAppNavActive(page.url.pathname, PM_SETTINGS_NAV_ITEM)}
		tooltipContent={PM_SETTINGS_NAV_ITEM.title}
	>
		{#snippet child({ props })}
			<a href={PM_SETTINGS_NAV_ITEM.href} {...props}>
				<AppIcon icon={PM_SETTINGS_NAV_ITEM.icon} aria-hidden="true" />
				<span>{PM_SETTINGS_NAV_ITEM.title}</span>
			</a>
		{/snippet}
	</Sidebar.MenuButton>
</Sidebar.MenuItem>
