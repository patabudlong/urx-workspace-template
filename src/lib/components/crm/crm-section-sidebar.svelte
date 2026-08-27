<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import { isAppNavActive, type AppNavItem } from '$lib/navigation/app-nav';
	import { SOLAR } from '$lib/icons/solar-icons';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	const navActiveClass =
		'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-[inset_0_0_0_1px_var(--sidebar-border)]';

	let { items }: { items: AppNavItem[] } = $props();
</script>

<aside class="border-border bg-muted/30 shrink-0 border-b" aria-label="CRM navigation">
	<div class="px-4 pt-4 pb-2">
		<div class="flex items-center gap-2">
			<AppIcon
				icon={SOLAR.crm}
				size="lg"
				class="text-sky-600 dark:text-sky-400"
				aria-hidden="true"
			/>
			<h2 class="text-sm font-semibold">CRM</h2>
		</div>
		<p class="text-muted-foreground mt-1 text-sm leading-relaxed">
			Manage contacts, companies, and deals for this workspace.
		</p>
	</div>

	<nav class="flex flex-col gap-2 px-2 pt-0 pb-2">
		<div>
			<p class="text-muted-foreground px-3 py-1.5 text-sm font-medium">Manage</p>
			<div class="flex gap-1 overflow-x-auto">
				{#each items as item (item.href)}
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
	</nav>
</aside>
