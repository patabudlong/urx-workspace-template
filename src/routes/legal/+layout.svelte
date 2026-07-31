<script lang="ts">
	import UrixoftLogo from '$lib/components/urixoft-logo.svelte';
	import { LEGAL_ROUTES } from '$lib/shared/legal';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<div class="bg-background min-h-svh">
	<header class="border-border border-b">
		<div class="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
			<a href="/" class="flex items-center gap-3">
				<UrixoftLogo class="size-8" />
				<span class="text-sm font-medium">Urixoft Workspace</span>
			</a>
			<nav class="text-muted-foreground flex items-center gap-4 text-sm">
				<a
					href={LEGAL_ROUTES.termsOfService}
					class:text-foreground={page.url.pathname === LEGAL_ROUTES.termsOfService}
					class="hover:text-foreground transition-colors"
				>
					Terms
				</a>
				<a
					href={LEGAL_ROUTES.privacyNotice}
					class:text-foreground={page.url.pathname === LEGAL_ROUTES.privacyNotice}
					class="hover:text-foreground transition-colors"
				>
					Privacy
				</a>
			</nav>
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-6 py-10">
		{@render children?.()}
	</main>
</div>
