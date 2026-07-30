<script lang="ts">
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let {
		title = 'Dashboard',
		userEmail
	}: { title?: string; userEmail?: string } = $props();
</script>

<header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
	<Sidebar.SidebarTrigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 h-4!" />
	<h1 class="text-sm font-medium">{title}</h1>
	<div class="ml-auto flex items-center gap-3">
		{#if userEmail}
			<span class="text-muted-foreground hidden text-sm sm:inline">{userEmail}</span>
			<form method="POST" action="/logout">
				<Button type="submit" variant="outline" size="sm">Sign out</Button>
			</form>
		{/if}
		<ThemeToggle />
	</div>
</header>
