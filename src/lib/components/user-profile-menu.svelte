<script lang="ts">
	import { goto } from '$app/navigation';
	import LogoutDialog from '$lib/components/logout-dialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import { getProfileNavItems } from '$lib/navigation/app-nav';
	import type { UserDisplay } from '$lib/shared/user-display';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

	let {
		userDisplay,
		workspaceRole = null
	}: {
		userDisplay: UserDisplay;
		workspaceRole?: string | null;
	} = $props();

	const profileNavItems = $derived(getProfileNavItems(workspaceRole));

	let logoutOpen = $state(false);
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				variant="ghost"
				size="icon"
				class="rounded-full"
				aria-label={userDisplay.fullName}
				{...props}
			>
				<UserAvatar
					avatarUrl={userDisplay.avatarUrl}
					initials={userDisplay.initials}
					class="size-8"
				/>
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
		<DropdownMenu.Label class="p-0 font-normal">
			<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
				<UserAvatar
					avatarUrl={userDisplay.avatarUrl}
					initials={userDisplay.initials}
					class="size-8"
				/>
				<div class="grid flex-1 text-left text-sm leading-tight">
					<span class="truncate font-medium">{userDisplay.fullName}</span>
					<span class="text-muted-foreground truncate text-xs">{userDisplay.email}</span>
				</div>
			</div>
		</DropdownMenu.Label>
		{#if profileNavItems.length > 0}
			<DropdownMenu.Separator />
			{#each profileNavItems as item (item.href)}
				<DropdownMenu.Item
					onSelect={() => {
						goto(item.href);
					}}
				>
					<item.icon />
					{item.title}
				</DropdownMenu.Item>
			{/each}
		{/if}
		<DropdownMenu.Separator />
		<DropdownMenu.Item
			variant="destructive"
			onSelect={() => {
				logoutOpen = true;
			}}
		>
			<LogOutIcon />
			Sign out
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<LogoutDialog bind:open={logoutOpen} showTrigger={false} />
