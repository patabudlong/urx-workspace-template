<script lang="ts">
	import AuthShell from '$lib/components/auth/auth-shell.svelte';
	import { cleanupRecaptcha, preloadRecaptcha } from '$lib/recaptcha/client';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		preloadRecaptcha();

		return () => {
			cleanupRecaptcha();
		};
	});
</script>

<AuthShell>
	{@render children?.()}
</AuthShell>
