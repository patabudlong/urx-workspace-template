<script lang="ts">
	import OnboardingShell from '$lib/components/onboarding/onboarding-shell.svelte';

	let { data, children } = $props();
</script>

<OnboardingShell
	userEmail={data.userDisplay.email}
	userAvatarUrl={data.userDisplay.avatarUrl}
	userInitials={data.userDisplay.initials}
>
	{@render children?.()}
</OnboardingShell>
