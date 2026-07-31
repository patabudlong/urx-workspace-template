<script lang="ts">
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';

	let { children } = $props();
</script>

<div class="bg-background min-h-svh">
	<header class="border-b px-4 py-4 sm:px-6">
		<div class="mx-auto flex max-w-6xl items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<UrixoftLogo class="size-8 rounded-sm" />
				<div>
					<p class="text-sm font-medium">Platform admin</p>
					<p class="text-muted-foreground text-xs">Workspace review</p>
				</div>
			</div>
			<ThemeToggle iconClass="size-5" />
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
		{@render children?.()}
	</main>
</div>
