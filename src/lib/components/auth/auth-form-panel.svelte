<script lang="ts">
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		footer,
		children
	}: {
		title: string;
		description?: string;
		footer?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="relative flex min-h-full flex-col">
	<header
		class="relative flex shrink-0 items-center justify-between gap-4 border-b px-4 py-4 sm:px-6 lg:border-b-0 lg:px-10 lg:pt-8"
	>
		<div class="flex items-center gap-3 lg:hidden">
			<div class="rounded-lg bg-primary/10 p-1.5 ring-1 ring-primary/15">
				<UrixoftLogo class="size-8 shrink-0 rounded-sm" />
			</div>
			<div class="min-w-0">
				<p class="truncate text-sm font-medium">Urixoft Workspace</p>
				<p class="text-muted-foreground truncate text-xs">Secure sign-in</p>
			</div>
		</div>
		<ThemeToggle class="ml-auto" iconClass="size-5" />
	</header>

	<main class="flex min-h-0 flex-1 flex-col">
		<div class="flex flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:px-10 lg:py-10 xl:px-16">
			<div class="mx-auto w-full max-w-md space-y-8">
				<div class="space-y-2">
					<h2 class="text-2xl font-semibold tracking-tight">{title}</h2>
					{#if description}
						<p class="text-muted-foreground text-sm leading-relaxed">{description}</p>
					{/if}
				</div>

				<div class="space-y-6">
					{@render children()}
				</div>
			</div>
		</div>

		{#if footer}
			<footer class="text-muted-foreground shrink-0 border-t px-4 py-6 sm:px-6 lg:px-10 xl:px-16">
				<div class="mx-auto w-full max-w-md">
					{@render footer()}
				</div>
			</footer>
		{/if}
	</main>
</div>
