<script lang="ts">
	import SectionSidebar from '$lib/components/section-sidebar.svelte';
	import { SECURITY_NAV_ITEMS } from '$lib/navigation/security-nav';

	let { children } = $props();
</script>

<div class="flex w-full min-w-0 flex-col gap-6 lg:gap-8">
	<div class="lg:hidden">
		<SectionSidebar
			title="Security"
			description="Review your sign-in methods, password, and personal security settings."
			items={SECURITY_NAV_ITEMS}
		/>
	</div>

	{@render children()}
</div>
