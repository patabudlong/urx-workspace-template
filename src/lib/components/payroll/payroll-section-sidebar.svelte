<script lang="ts">
	import PayrollSettingsSectionMenu from '$lib/components/payroll/payroll-settings-section-menu.svelte';
	import { isAppNavActive, type AppNavItem } from '$lib/navigation/app-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let {
		items
	}: {
		items: AppNavItem[];
	} = $props();
</script>

<aside class="border-border bg-muted/30 shrink-0 border-b" aria-label="Payroll navigation">
	<div class="px-4 pt-4 pb-2">
		<h2 class="text-sm font-semibold">Payroll</h2>
		<p class="text-muted-foreground mt-1 text-xs leading-relaxed">
			Manage pay periods, runs, and compensation for this workspace.
		</p>
	</div>

	<nav class="flex flex-col gap-2 px-2 pt-0 pb-2">
		<div data-tour="payroll-nav">
			<p class="text-muted-foreground px-3 py-1.5 text-xs font-medium">Manage</p>
			<div class="flex gap-1 overflow-x-auto">
				{#each items as item (item.href)}
					{@const active = isAppNavActive(page.url.pathname, item)}
					<a
						href={item.href}
						class={cn(
							'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
							active
								? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
								: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
						)}
						aria-current={active ? 'page' : undefined}
					>
						<item.icon class="size-4 shrink-0" />
						<span>{item.title}</span>
					</a>
				{/each}
			</div>
		</div>

		<div data-tour="payroll-settings">
			<PayrollSettingsSectionMenu />
		</div>
	</nav>
</aside>
