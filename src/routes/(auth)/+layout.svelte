<script lang="ts">
	import AuthShell from '$lib/components/auth/auth-shell.svelte';
	import { preloadRecaptcha } from '$lib/recaptcha/client';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		preloadRecaptcha();
	});
</script>

<AuthShell>
	{@render children?.()}
</AuthShell>
