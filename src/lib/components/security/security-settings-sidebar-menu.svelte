<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { isAppNavActive } from '$lib/navigation/app-nav';
	import { SECURITY_NAV_ITEM, SECURITY_NAV_ITEMS } from '$lib/navigation/security-nav';
	import { cn } from '$lib/utils.js';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { page } from '$app/state';

	let securityOpen = $state(false);

	const isSecurityActive = $derived(page.url.pathname.startsWith('/security'));

	$effect(() => {
		if (isSecurityActive) {
			securityOpen = true;
		}
	});
</script>

<Sidebar.MenuItem>
	<Sidebar.MenuButton
		isActive={isSecurityActive}
		tooltipContent={SECURITY_NAV_ITEM.title}
		onclick={() => {
			securityOpen = !securityOpen;
		}}
	>
		{#snippet child({ props })}
			<button type="button" {...props}>
				<AppIcon icon={SECURITY_NAV_ITEM.icon} aria-hidden="true" />
				<span>{SECURITY_NAV_ITEM.title}</span>
				<ChevronDownIcon
					class={cn('ms-auto size-4 shrink-0 transition-transform', securityOpen && 'rotate-180')}
					aria-hidden="true"
				/>
			</button>
		{/snippet}
	</Sidebar.MenuButton>

	{#if securityOpen}
		<Sidebar.MenuSub>
			{#each SECURITY_NAV_ITEMS as item (item.href)}
				<Sidebar.MenuSubItem>
					<Sidebar.MenuSubButton isActive={isAppNavActive(page.url.pathname, item)}>
						{#snippet child({ props })}
							<a href={item.href} {...props}>
								<AppIcon icon={item.icon} aria-hidden="true" />
								<span>{item.title}</span>
							</a>
						{/snippet}
					</Sidebar.MenuSubButton>
				</Sidebar.MenuSubItem>
			{/each}
		</Sidebar.MenuSub>
	{/if}
</Sidebar.MenuItem>
