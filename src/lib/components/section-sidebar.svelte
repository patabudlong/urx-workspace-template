<script lang="ts">
	import { page } from '$app/state';
	import { isAppNavActive, type AppNavItem } from '$lib/navigation/app-nav';
	import { cn } from '$lib/utils.js';

	let {
		title,
		description,
		items
	}: {
		title: string;
		description?: string;
		items: AppNavItem[];
	} = $props();
</script>

<aside
	class="border-border bg-muted/30 shrink-0 border-b"
	aria-label="{title} navigation"
>
	<div class="px-4 pt-4 pb-2">
		<h2 class="text-sm font-semibold">{title}</h2>
		{#if description}
			<p class="text-muted-foreground mt-1 text-xs leading-relaxed">{description}</p>
		{/if}
	</div>

	<nav class="flex gap-1 overflow-x-auto p-2">
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
	</nav>
</aside>
