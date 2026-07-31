<script lang="ts">
	import OnboardingShell from '$lib/components/onboarding/onboarding-shell.svelte';

	let { children } = $props();
</script>

<OnboardingShell>
	{@render children?.()}
</OnboardingShell>
