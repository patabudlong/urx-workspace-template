<script lang="ts">
	import AuthPromoPanel from '$lib/components/auth/auth-promo-panel.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!-- Centered card — ShadcnSpace auth1 proportions (max-w-5xl, 50/50 columns). -->
<div class="bg-muted flex min-h-svh items-center justify-center p-4 md:py-[15px]">
	<div
		class="bg-card text-card-foreground grid w-full max-w-5xl overflow-hidden rounded-xl shadow-md max-lg:min-h-[calc(100svh-2rem)] lg:grid-cols-2 lg:min-h-[calc(100svh-30px)]"
	>
		<aside class="hidden min-h-0 lg:block">
			<AuthPromoPanel />
		</aside>

		<div class="flex min-h-0 flex-col overflow-y-auto max-lg:min-h-[calc(100svh-2rem)] lg:min-h-0">
			{@render children?.()}
		</div>
	</div>
</div>
