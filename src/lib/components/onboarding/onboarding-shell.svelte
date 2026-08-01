<script lang="ts">
	import LogoutDialog from '$lib/components/logout-dialog.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';
	import type { Snippet } from 'svelte';

	let {
		children,
		userEmail,
		userAvatarUrl = null,
		userInitials = '?'
	}: {
		children: Snippet;
		userEmail?: string;
		userAvatarUrl?: string | null;
		userInitials?: string;
	} = $props();
</script>

<div class="bg-background flex min-h-svh flex-col">
	<header
		class="border-border/60 bg-background/95 sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b px-4 py-3 backdrop-blur sm:px-6"
	>
		<div class="flex min-w-0 items-center gap-3">
			<UrixoftLogo class="size-8 shrink-0 rounded-sm" />
			<div class="min-w-0">
				<p class="truncate text-sm font-medium">Urixoft Workspace</p>
				<p class="text-muted-foreground truncate text-xs">Workspace onboarding</p>
			</div>
		</div>
		<div class="flex shrink-0 items-center gap-2 sm:gap-3">
			{#if userEmail}
				<div class="flex items-center gap-2 sm:gap-3">
					<UserAvatar avatarUrl={userAvatarUrl} initials={userInitials} />
					<span class="text-muted-foreground hidden max-w-[12rem] truncate text-sm sm:inline">
						{userEmail}
					</span>
					<LogoutDialog />
				</div>
			{/if}
			<ThemeToggle iconClass="size-5" />
		</div>
	</header>

	<main class="min-h-0 flex-1 overflow-y-auto">
		{@render children?.()}
	</main>

	<footer class="border-border/60 shrink-0 border-t px-4 py-3 sm:px-6">
		<p class="text-muted-foreground text-center text-xs sm:text-sm">
			© 2026 Urixoft Platform. All rights reserved.
		</p>
	</footer>
</div>
