<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import SecurityPasswordCard from '$lib/components/security/security-password-card.svelte';

	let { data } = $props();
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Settings"
		title="Security"
		description="Review your sign-in methods, password, and personal security settings."
	/>

	<SecurityPasswordCard {data} security={data.security} />
</div>
