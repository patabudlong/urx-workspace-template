<script lang="ts">
	import ActionProgressBar from '$lib/components/action-progress-bar.svelte';
	import SiteChromeUserActions from '$lib/components/site-chrome-user-actions.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { formatWorkspaceRole } from '$lib/navigation/app-nav';
	import type { UserDisplay } from '$lib/shared/user-display';

	type WorkspaceContext = {
		workspaceName: string;
		workspaceSlug: string;
		role: string;
	};

	let {
		title = 'Dashboard',
		userDisplay,
		workspace = null
	}: {
		title?: string;
		userDisplay?: UserDisplay;
		workspace?: WorkspaceContext | null;
	} = $props();
</script>

<header class="bg-background/95 relative flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
	<ActionProgressBar />
	<Sidebar.SidebarTrigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 hidden h-4! sm:block" />
	<div class="min-w-0 flex-1">
		<h1 class="truncate text-sm font-medium">{title}</h1>
		{#if workspace}
			<p class="text-muted-foreground hidden truncate text-xs sm:block">
				{workspace.workspaceName}
				<span class="mx-1.5" aria-hidden="true">·</span>
				<span class="font-mono">{workspace.workspaceSlug}</span>
			</p>
		{/if}
	</div>
	<div class="flex shrink-0 items-center gap-2 sm:gap-3">
		{#if workspace}
			<Badge variant="outline" class="hidden font-normal sm:inline-flex">
				{formatWorkspaceRole(workspace.role)}
			</Badge>
		{/if}
		{#if userDisplay}
			<SiteChromeUserActions {userDisplay} />
		{/if}
		<ThemeToggle />
	</div>
</header>
