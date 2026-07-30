<script lang="ts">
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { title = 'Dashboard' }: { title?: string } = $props();
</script>

<header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
	<Sidebar.SidebarTrigger class="-ml-1" />
	<Separator orientation="vertical" class="mr-2 h-4!" />
	<h1 class="text-sm font-medium">{title}</h1>
	<div class="ml-auto flex items-center gap-2">
		<ThemeToggle />
	</div>
</header>
