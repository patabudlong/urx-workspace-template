<script lang="ts">
	import StandalonePageShell from '$lib/components/standalone-page-shell.svelte';
	import { LEGAL_ROUTES } from '$lib/shared/legal';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<StandalonePageShell href="/">
	{#snippet actions()}
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
	{/snippet}

	<div class="mx-auto max-w-3xl px-6 py-10">
		{@render children?.()}
	</div>
</StandalonePageShell>
