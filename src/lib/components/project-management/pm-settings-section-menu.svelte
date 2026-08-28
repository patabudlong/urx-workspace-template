<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import { isAppNavActive } from '$lib/navigation/app-nav';
	import { PM_SETTINGS_NAV_ITEM } from '$lib/navigation/project-management-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	const navActiveClass =
		'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-[inset_0_0_0_1px_var(--sidebar-border)]';
</script>

<div>
	<p class="text-muted-foreground px-3 py-1.5 text-sm font-medium">Configuration</p>
	<div class="flex gap-1 overflow-x-auto">
		{#each [PM_SETTINGS_NAV_ITEM] as item (item.href)}
			{@const active = isAppNavActive(page.url.pathname, item)}
			<a
				href={item.href}
			class={cn(
				'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
				active
					? navActiveClass
					: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
			)}
			aria-current={active ? 'page' : undefined}
		>
			<AppIcon icon={item.icon} class="shrink-0" />
			<span>{item.title}</span>
		</a>
		{/each}
	</div>
</div>
