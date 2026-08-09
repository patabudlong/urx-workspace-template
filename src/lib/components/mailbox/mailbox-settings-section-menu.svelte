<script lang="ts">
	import { isAppNavActive } from '$lib/navigation/app-nav';
	import { MAILBOX_SETTINGS_NAV_ITEM } from '$lib/navigation/mailbox-nav';
	import { MAILBOX_SETTINGS_NAV_ITEMS } from '$lib/navigation/mailbox-settings-nav';
	import { cn } from '$lib/utils.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { page } from '$app/state';

	let settingsOpen = $state(false);

	const isSettingsActive = $derived(page.url.pathname.startsWith('/mailbox/settings'));

	$effect(() => {
		if (isSettingsActive) {
			settingsOpen = true;
		}
	});
</script>

<div>
	<p class="text-muted-foreground px-3 py-1.5 text-xs font-medium">Account</p>
	<div class="px-1">
		<button
			type="button"
			class={cn(
				'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
				isSettingsActive
					? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
					: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
			)}
			aria-expanded={settingsOpen}
			onclick={() => {
				settingsOpen = !settingsOpen;
			}}
		>
			<MAILBOX_SETTINGS_NAV_ITEM.icon class="size-4 shrink-0" aria-hidden="true" />
			<span class="min-w-0 flex-1 truncate text-left">Settings</span>
			<ChevronDownIcon
				class={cn('size-4 shrink-0 transition-transform', settingsOpen && 'rotate-180')}
				aria-hidden="true"
			/>
		</button>

		{#if settingsOpen}
			<div class="border-sidebar-border mt-1 ms-5 flex flex-col gap-1 border-l ps-2.5">
				{#each MAILBOX_SETTINGS_NAV_ITEMS as item (item.href)}
					{@const active = isAppNavActive(page.url.pathname, item)}
					<a
						href={item.href}
						class={cn(
							'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
							active
								? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
								: 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
						)}
						aria-current={active ? 'page' : undefined}
					>
						<item.icon class="size-4 shrink-0" aria-hidden="true" />
						<span>{item.title}</span>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
