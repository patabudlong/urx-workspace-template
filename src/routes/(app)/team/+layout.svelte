<script lang="ts">
	import SectionSidebar from '$lib/components/section-sidebar.svelte';
	import TeamSidebarPanel from '$lib/components/team-sidebar-panel.svelte';
	import { getTeamNavItems } from '$lib/navigation/team-nav';
	import { cn } from '$lib/utils.js';
	import { page } from '$app/state';

	let { children } = $props();

	const teamNavItems = $derived(getTeamNavItems(page.data.workspace?.role));
</script>

<div class="flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row">
	<aside
		class={cn(
			'bg-sidebar text-sidebar-foreground border-sidebar-border hidden h-full w-(--team-secondary-sidebar-width) shrink-0 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden lg:border-r lg:py-2'
		)}
	>
		<TeamSidebarPanel items={teamNavItems} />
	</aside>

	<div class="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-x-auto overflow-y-auto p-4 lg:gap-8 lg:p-6">
		<div class="lg:hidden">
			<SectionSidebar
				title="Team"
				description="Manage members, invitations, and roles for this workspace."
				items={teamNavItems}
			/>
		</div>

		{@render children()}
	</div>
</div>
