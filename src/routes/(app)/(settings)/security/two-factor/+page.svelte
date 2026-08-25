<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import SecurityTwoFactorCard from '$lib/components/security/security-two-factor-card.svelte';

	let { data } = $props();
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Settings"
		title="Two-factor authentication"
		description="Add an extra layer of protection when signing in to your account."
	/>

	<SecurityTwoFactorCard {data} security={data.security} />
</div>
