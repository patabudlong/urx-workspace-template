<script lang="ts">
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import AuthShell from '$lib/components/auth/auth-shell.svelte';

	let { children } = $props();
</script>

<AuthShell>
	{@render children?.()}
</AuthShell>
