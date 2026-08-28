<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { isAppNavActive } from '$lib/navigation/app-nav';
	import { CRM_SETTINGS_NAV_ITEM } from '$lib/navigation/crm-nav';
</script>

<Sidebar.MenuItem>
	<Sidebar.MenuButton
		isActive={isAppNavActive(page.url.pathname, CRM_SETTINGS_NAV_ITEM)}
		tooltipContent={CRM_SETTINGS_NAV_ITEM.title}
	>
		{#snippet child({ props })}
			<a href={CRM_SETTINGS_NAV_ITEM.href} {...props}>
				<AppIcon icon={CRM_SETTINGS_NAV_ITEM.icon} aria-hidden="true" />
				<span>{CRM_SETTINGS_NAV_ITEM.title}</span>
			</a>
		{/snippet}
	</Sidebar.MenuButton>
</Sidebar.MenuItem>
