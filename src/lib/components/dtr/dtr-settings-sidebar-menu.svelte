<script lang="ts">
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { isAppNavActive } from '$lib/navigation/app-nav';
	import { DTR_SETTINGS_NAV_ITEM } from '$lib/navigation/dtr-nav';
	import { DTR_SETTINGS_NAV_ITEMS } from '$lib/navigation/dtr-settings-nav';
	import { cn } from '$lib/utils.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { page } from '$app/state';

	let settingsOpen = $state(false);

	const isSettingsActive = $derived(page.url.pathname.startsWith('/dtr/settings'));

	$effect(() => {
		if (isSettingsActive) {
			settingsOpen = true;
		}
	});
</script>

<Sidebar.MenuItem>
	<Sidebar.MenuButton
		isActive={isSettingsActive}
		tooltipContent="Settings"
		onclick={() => {
			settingsOpen = !settingsOpen;
		}}
	>
		{#snippet child({ props })}
			<button type="button" {...props}>
				<DTR_SETTINGS_NAV_ITEM.icon class="size-4" aria-hidden="true" />
				<span>Settings</span>
				<ChevronDownIcon
					class={cn('ms-auto size-4 shrink-0 transition-transform', settingsOpen && 'rotate-180')}
					aria-hidden="true"
				/>
			</button>
		{/snippet}
	</Sidebar.MenuButton>

	{#if settingsOpen}
		<Sidebar.MenuSub>
			{#each DTR_SETTINGS_NAV_ITEMS as item (item.href)}
				<Sidebar.MenuSubItem>
					<Sidebar.MenuSubButton isActive={isAppNavActive(page.url.pathname, item)}>
						{#snippet child({ props })}
							<a href={item.href} {...props}>
								<item.icon class="size-4" aria-hidden="true" />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuSubButton>
				</Sidebar.MenuSubItem>
			{/each}
		</Sidebar.MenuSub>
	{/if}
</Sidebar.MenuItem>
