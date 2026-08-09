<script lang="ts">
	import OnboardingShell from '$lib/components/onboarding/onboarding-shell.svelte';
	import PreventStaleAuthView from '$lib/components/prevent-stale-auth-view.svelte';

	let { data, children } = $props();
</script>

<PreventStaleAuthView />

<OnboardingShell userDisplay={data.userDisplay}>
	{@render children?.()}
</OnboardingShell>
