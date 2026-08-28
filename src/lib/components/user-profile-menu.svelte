<script lang="ts">
	import AppIcon from '$lib/components/app-icon.svelte';
	import LogoutDialog from '$lib/components/logout-dialog.svelte';
	import PresenceStatusIndicator from '$lib/components/presence-status-indicator.svelte';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import WorkspaceAvatar from '$lib/components/workspace-avatar.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { getProfileNavItems } from '$lib/navigation/app-nav';
	import { SOLAR } from '$lib/icons/solar-icons';
	import { updatePresenceStatus } from '$lib/presence/client-presence';
	import {
		PRESENCE_STATUS_LABELS,
		PRESENCE_STATUS_OPTIONS,
		type PresenceStatus
	} from '$lib/shared/presence';
	import type { UserDisplay } from '$lib/shared/user-display';
	import type { WorkspaceContext } from '$lib/shared/workspace-context';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import IdCardIcon from '@lucide/svelte/icons/id-card';
	import XIcon from '@lucide/svelte/icons/x';

	let {
		userDisplay,
		workspace = null,
		workspaceRole = null
	}: {
		userDisplay: UserDisplay;
		workspace?: WorkspaceContext | null;
		workspaceRole?: string | null;
	} = $props();

	const workspaceName = $derived(workspace?.workspaceName ?? 'your workspace');

	const profileNavItems = $derived(getProfileNavItems(workspaceRole));
	const menuNavItems = $derived([{ title: 'Home', href: '/', icon: SOLAR.home }, ...profileNavItems]);

	let open = $state(false);
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

	function closeMenu() {
		open = false;
	}

	function handleLogout() {
		closeMenu();
		logoutOpen = true;
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Trigger>
		{#snippet child({ props })}
			<Button
				variant="ghost"
				type="button"
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
	</Sheet.Trigger>
	<Sheet.Content
		side="right"
		showCloseButton={false}
		class="bg-popover data-[side=right]:w-80 data-[side=right]:sm:max-w-80 gap-0 p-0"
	>
		<div class="relative px-6 pt-8 pb-6">
			<Sheet.Close>
				{#snippet child({ props })}
					<Button
						variant="ghost"
						size="icon-sm"
						type="button"
						class="absolute top-4 right-4 rounded-full"
						aria-label="Close profile menu"
						{...props}
					>
						<XIcon />
					</Button>
				{/snippet}
			</Sheet.Close>

			<div class="flex flex-col items-center gap-3 text-center">
				<div class="relative">
					<Avatar.Root class="size-20">
						{#if userDisplay.avatarUrl}
							<Avatar.Image
								src={userDisplay.avatarUrl}
								alt=""
								referrerpolicy="no-referrer"
							/>
						{/if}
						<Avatar.Fallback class="bg-primary text-primary-foreground text-base font-semibold">
							{userDisplay.initials}
						</Avatar.Fallback>
					</Avatar.Root>
					<PresenceStatusIndicator
						status={presenceStatus}
						class="absolute right-0.5 bottom-0.5 size-3"
					/>
				</div>
				<Sheet.Header class="items-center gap-1 p-0">
					<Sheet.Title class="text-base font-semibold">
						{userDisplay.fullName}
					</Sheet.Title>
					<Sheet.Description
						class="flex max-w-full items-center justify-center gap-1.5 text-xs leading-relaxed"
					>
						<IdCardIcon class="size-3.5 shrink-0" aria-hidden="true" />
						<span class="truncate" title={userDisplay.email}>{userDisplay.email}</span>
					</Sheet.Description>
				</Sheet.Header>
			</div>
		</div>

		<Separator class="bg-transparent mx-6 h-0 border-t border-dashed" />

		<nav class="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-4">
			{#each menuNavItems as item (item.href)}
				<Button
					variant="ghost"
					href={item.href}
					class="h-10 w-full justify-start gap-3 px-3 font-medium"
					onclick={closeMenu}
				>
					<AppIcon icon={item.icon} class="text-muted-foreground" />
					{item.title}
				</Button>
			{/each}

			<p class="text-muted-foreground px-3 pt-4 pb-1 text-xs font-medium">Set your status</p>
			{#each PRESENCE_STATUS_OPTIONS as status (status)}
				<Button
					variant="ghost"
					type="button"
					class={cn(
						'h-10 w-full justify-start gap-3 px-3 font-medium',
						updatingPresence && 'pointer-events-none opacity-60'
					)}
					onclick={() => {
						void handlePresenceChange(status);
					}}
				>
					<PresenceStatusIndicator {status} class="size-2.5" />
					<span class="flex-1 text-left">{PRESENCE_STATUS_LABELS[status]}</span>
					{#if presenceStatus === status}
						<CheckIcon class="text-muted-foreground size-4" aria-hidden="true" />
					{/if}
				</Button>
			{/each}
		</nav>

		<Separator class="bg-transparent mx-6 h-0 border-t border-dashed" />

		<Sheet.Footer class="mt-auto items-center gap-4 px-6 pt-10 pb-8">
			<WorkspaceAvatar
				workspaceName={workspaceName}
				brandLogoUrl={workspace?.brandLogoUrl ?? null}
				class="size-16 grayscale"
			/>
			<p class="text-muted-foreground max-w-xs text-center text-xs leading-relaxed">
				Sign out to leave this workspace. You can sign back in anytime.
			</p>
			<Button variant="secondary" size="lg" type="button" class="mt-2 w-full" onclick={handleLogout}>
				Log Out
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>

<LogoutDialog bind:open={logoutOpen} showTrigger={false} />
