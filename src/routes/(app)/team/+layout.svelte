<script lang="ts">
	import SectionSidebar from '$lib/components/section-sidebar.svelte';
	import TeamSidebarPanel from '$lib/components/team-sidebar-panel.svelte';
	import { getTeamNavItems } from '$lib/navigation/team-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { children } = $props();

	const teamNavItems = $derived(getTeamNavItems(page.data.workspace?.role));
</script>

<div class="flex min-h-0 flex-1 flex-col md:flex-row">
	<aside
		class={cn(
			'bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-(--team-secondary-sidebar-width) shrink-0 md:flex md:flex-col md:border-r md:py-2'
		)}
	>
		<TeamSidebarPanel items={teamNavItems} />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
		<div class="md:hidden">
			<SectionSidebar
				title="Team"
				description="Manage members, invitations, and roles for this workspace."
				items={teamNavItems}
			/>
		</div>

		{@render children()}
	</div>
</div>
