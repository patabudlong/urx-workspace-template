<script lang="ts">
	import { goto } from '$app/navigation';
	import LogoutDialog from '$lib/components/logout-dialog.svelte';
	import PresenceStatusIndicator from '$lib/components/presence-status-indicator.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import { getProfileNavItems } from '$lib/navigation/app-nav';
	import { updatePresenceStatus } from '$lib/presence/client-presence';
	import {
		PRESENCE_STATUS_LABELS,
		PRESENCE_STATUS_OPTIONS,
		type PresenceStatus
	} from '$lib/shared/presence';
	import type { UserDisplay } from '$lib/shared/user-display';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
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
	let presenceStatus = $state<PresenceStatus>('offline');
	let updatingPresence = $state(false);

	$effect(() => {
		presenceStatus = userDisplay.presenceStatus;
	});

	async function handlePresenceChange(status: PresenceStatus) {
		if (status === presenceStatus || updatingPresence) {
			return;
		}

		const previous = presenceStatus;
		presenceStatus = status;
		updatingPresence = true;

		const profile = await updatePresenceStatus(status);
		updatingPresence = false;

		if (!profile) {
			presenceStatus = previous;
		} else {
			presenceStatus = profile.presenceStatus;
		}
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				variant="ghost"
				class="h-9 max-w-[12rem] gap-2 rounded-full px-2 sm:pl-1 sm:pr-3"
				aria-label={`${userDisplay.fullName}, ${PRESENCE_STATUS_LABELS[presenceStatus]}`}
				{...props}
			>
				<UserAvatar
					avatarUrl={userDisplay.avatarUrl}
					initials={userDisplay.initials}
					presenceStatus={presenceStatus}
					class="size-8"
				/>
				<span class="hidden min-w-0 flex-1 truncate text-left text-sm font-medium sm:inline">
					{userDisplay.fullName}
				</span>
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content class="min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
		<DropdownMenu.Label class="p-0 font-normal">
			<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
				<UserAvatar
					avatarUrl={userDisplay.avatarUrl}
					initials={userDisplay.initials}
					presenceStatus={presenceStatus}
					class="size-8"
				/>
				<div class="grid min-w-0 flex-1 text-left text-sm leading-tight">
					<span class="truncate font-medium">{userDisplay.fullName}</span>
					<span class="text-muted-foreground flex items-center gap-1.5 truncate text-xs">
						<PresenceStatusIndicator status={presenceStatus} class="size-2" />
						{PRESENCE_STATUS_LABELS[presenceStatus]}
					</span>
				</div>
			</div>
		</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.Label class="text-muted-foreground text-xs font-medium">
			Set your status
		</DropdownMenu.Label>
		{#each PRESENCE_STATUS_OPTIONS as status (status)}
			<DropdownMenu.Item
				class={cn(updatingPresence && 'pointer-events-none opacity-60')}
				onSelect={() => {
					void handlePresenceChange(status);
				}}
			>
				<PresenceStatusIndicator status={status} class="size-2.5" />
				<span class="flex-1">{PRESENCE_STATUS_LABELS[status]}</span>
				{#if presenceStatus === status}
					<CheckIcon class="text-muted-foreground size-4" aria-hidden="true" />
				{/if}
			</DropdownMenu.Item>
		{/each}
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
