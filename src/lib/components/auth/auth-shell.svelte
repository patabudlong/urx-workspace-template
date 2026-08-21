<script lang="ts">
	import AuthPromoPanel from '$lib/components/auth/auth-promo-panel.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="grid h-svh overflow-hidden lg:grid-cols-2">
	<aside class="bg-muted hidden h-svh p-3 lg:flex xl:p-4">
		<AuthPromoPanel />
	</aside>

	<div class="bg-background flex h-svh min-h-0 flex-col overflow-y-auto">
		{@render children?.()}
	</div>
</div>
