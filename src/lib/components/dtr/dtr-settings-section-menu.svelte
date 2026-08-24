<script lang="ts">
	import { isAppNavActive } from '$lib/navigation/app-nav';
	import { DTR_SETTINGS_NAV_ITEMS } from '$lib/navigation/dtr-settings-nav';
	import { cn } from '$lib/utils.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { page } from '$app/state';

	const navActiveClass =
		'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-[inset_0_0_0_1px_var(--sidebar-border)]';

	let settingsOpen = $state(false);

	const isSettingsActive = $derived(page.url.pathname.startsWith('/dtr/settings'));

	$effect(() => {
		if (isSettingsActive) {
			settingsOpen = true;
		}
	});
</script>

<div>
	<p class="text-muted-foreground px-3 py-1.5 text-sm font-medium">Configuration</p>
	<div class="px-1">
		<button
			type="button"
			class={cn(
				'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
				isSettingsActive
					? navActiveClass
					: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
			)}
			aria-expanded={settingsOpen}
			onclick={() => {
				settingsOpen = !settingsOpen;
			}}
		>
			<span class="min-w-0 flex-1 truncate text-left">Settings</span>
			<ChevronDownIcon
				class={cn('size-4 shrink-0 transition-transform', settingsOpen && 'rotate-180')}
				aria-hidden="true"
			/>
		</button>

		{#if settingsOpen}
			<div class="mt-1 ms-3 flex flex-col gap-1 ps-2">
				{#each DTR_SETTINGS_NAV_ITEMS as item (item.href)}
					{@const active = isAppNavActive(page.url.pathname, item)}
					<a
						href={item.href}
						class={cn(
							'rounded-md px-3 py-2 text-sm transition-colors',
							active
								? navActiveClass
								: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
						)}
						aria-current={active ? 'page' : undefined}
					>
						{item.title}
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
