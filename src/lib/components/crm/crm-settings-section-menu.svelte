<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import { isAppNavActive } from '$lib/navigation/app-nav';
	import { CRM_SETTINGS_NAV_ITEM } from '$lib/navigation/crm-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	const navActiveClass =
		'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-[inset_0_0_0_1px_var(--sidebar-border)]';

	const isSettingsActive = $derived(isAppNavActive(page.url.pathname, CRM_SETTINGS_NAV_ITEM));
</script>

<div>
	<p class="text-muted-foreground px-3 py-1.5 text-sm font-medium">Configuration</p>
	<div class="px-1">
		<a
			href={CRM_SETTINGS_NAV_ITEM.href}
			class={cn(
				'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
				isSettingsActive
					? navActiveClass
					: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
			)}
			aria-current={isSettingsActive ? 'page' : undefined}
		>
			<AppIcon icon={CRM_SETTINGS_NAV_ITEM.icon} class="shrink-0" aria-hidden="true" />
			<span>{CRM_SETTINGS_NAV_ITEM.title}</span>
		</a>
	</div>
</div>
