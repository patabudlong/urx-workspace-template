<script lang="ts">
	import OnboardingShell from '$lib/components/onboarding/onboarding-shell.svelte';

	let { data, children } = $props();
</script>

<OnboardingShell userDisplay={data.userDisplay}>
	{@render children?.()}
</OnboardingShell>
