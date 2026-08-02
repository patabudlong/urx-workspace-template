<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import type { UserDisplay } from '$lib/shared/user-display';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

	let { userDisplay }: { userDisplay: UserDisplay } = $props();

	const sidebar = useSidebar();

	let logoutForm = $state<HTMLFormElement | null>(null);
</script>

<form bind:this={logoutForm} method="POST" action="/logout" class="hidden" aria-hidden="true"></form>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="lg"
						tooltipContent={userDisplay.fullName}
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						<UserAvatar
							avatarUrl={userDisplay.avatarUrl}
							initials={userDisplay.initials}
							class="size-8 rounded-lg"
						/>
						<div
							class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
						>
							<span class="truncate font-medium">{userDisplay.fullName}</span>
							<span class="text-muted-foreground truncate text-xs">{userDisplay.email}</span>
						</div>
						<EllipsisVerticalIcon class="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<UserAvatar
							avatarUrl={userDisplay.avatarUrl}
							initials={userDisplay.initials}
							class="size-8 rounded-lg"
						/>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{userDisplay.fullName}</span>
							<span class="text-muted-foreground truncate text-xs">{userDisplay.email}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Item
					variant="destructive"
					onSelect={() => {
						logoutForm?.requestSubmit();
					}}
				>
					<LogOutIcon />
					Sign out
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
