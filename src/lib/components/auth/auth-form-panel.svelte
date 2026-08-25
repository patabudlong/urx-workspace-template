<script lang="ts">
	import GradientText from '$lib/components/gradient-text.svelte';
	import SiteBrandMark from '$lib/components/site-brand-mark.svelte';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
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
		class="relative flex shrink-0 items-center justify-end gap-4 border-b px-6 py-4 lg:border-b-0 lg:px-10 lg:pt-10 lg:pb-0"
	>
		<ThemeToggle iconClass="size-5" />
	</header>

	<main class="flex min-h-0 flex-1 flex-col">
		<div class="flex flex-1 flex-col justify-center px-6 py-8 lg:px-10 lg:py-10">
			<div class="w-full space-y-6">
				<div class="mb-2">
					<SiteBrandMark href="/" nameFormat="stacked" gradientProduct />
				</div>

				<div class="space-y-1">
					<GradientText tone="primary" as="h2" class="text-xl font-bold tracking-tight">
						{title}
					</GradientText>
					{#if description}
						<p class="text-muted-foreground text-sm font-medium">{description}</p>
					{/if}
				</div>

				<div class="space-y-6">
					{@render children()}
				</div>
			</div>
		</div>

		{#if footer}
			<footer class="text-muted-foreground shrink-0 border-t px-6 py-6 lg:px-10">
				<div class="w-full">
					{@render footer()}
				</div>
			</footer>
		{/if}
	</main>
</div>
