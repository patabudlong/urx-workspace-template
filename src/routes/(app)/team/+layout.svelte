<script lang="ts">
	import SectionSidebar from '$lib/components/section-sidebar.svelte';
	import TeamSidebarPanel from '$lib/components/team-sidebar-panel.svelte';
	import { TEAM_NAV_ITEMS } from '$lib/navigation/team-nav';
	import { cn } from '$lib/utils.js';

	let { children } = $props();
</script>

<div class="flex min-h-0 flex-1 flex-col md:flex-row">
	<aside
		class={cn(
			'bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-(--team-secondary-sidebar-width) shrink-0 md:flex md:flex-col md:border-r'
		)}
	>
		<TeamSidebarPanel />
	</aside>

	<div class="flex min-w-0 flex-1 flex-col gap-6 p-4 md:gap-8 md:p-6">
		<div class="md:hidden">
			<SectionSidebar
				title="Team"
				description="Manage members and invitations for this workspace."
				items={TEAM_NAV_ITEMS}
			/>
		</div>

		{@render children()}
	</div>
</div>
