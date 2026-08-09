<script lang="ts">
	import ActionProgressBar from '$lib/components/action-progress-bar.svelte';
	import NotificationBellButton from '$lib/components/notification-bell-button.svelte';
	import SiteHeaderGlobalSearch from '$lib/components/site-header-global-search.svelte';
	import SiteHeaderWorkspaceSwitcher from '$lib/components/site-header-workspace-switcher.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import UserProfileMenu from '$lib/components/user-profile-menu.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { UserDisplay } from '$lib/shared/user-display';
	import type { WorkspaceContext } from '$lib/shared/workspace-context';

	let {
		userDisplay,
		workspace = null,
		workspaces = [],
		workspaceHostSuffix = '',
		workspaceRole = null
	}: {
		userDisplay: UserDisplay;
		workspace?: WorkspaceContext | null;
		workspaces?: WorkspaceContext[];
		workspaceHostSuffix?: string;
		workspaceRole?: string | null;
	} = $props();
</script>

<header class="bg-background/95 relative flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
	<ActionProgressBar />
	<Sidebar.SidebarTrigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-1 hidden h-4! sm:block" />

	<div class="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
		<SiteHeaderWorkspaceSwitcher {workspace} {workspaces} {workspaceHostSuffix} />
	</div>

	<div class="flex shrink-0 items-center gap-1 sm:gap-2">
		<SiteHeaderGlobalSearch workspaceRole={workspaceRole} />
		<NotificationBellButton />
		<ThemeToggle />
		<UserProfileMenu {userDisplay} {workspaceRole} />
	</div>
</header>
