<script lang="ts">
	import LogoutDialog from '$lib/components/logout-dialog.svelte';
	import UserAvatar from '$lib/components/user-avatar.svelte';
	import type { UserDisplay } from '$lib/shared/user-display';

	let { userDisplay }: { userDisplay: UserDisplay } = $props();
</script>

<div class="flex items-center gap-2 sm:gap-3">
	<UserAvatar avatarUrl={userDisplay.avatarUrl} initials={userDisplay.initials} />
	<span class="text-muted-foreground hidden max-w-[12rem] truncate text-sm sm:inline">
		{userDisplay.email}
	</span>
	<LogoutDialog />
</div>
