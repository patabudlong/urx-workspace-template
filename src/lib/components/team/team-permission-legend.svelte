<script lang="ts">
	import TeamPermissionLevel from '$lib/components/team/team-permission-level.svelte';
</script>

<div
	class="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-xs"
	aria-label="Permission level legend"
>
	<span class="font-medium text-foreground">Legend</span>
	<span class="inline-flex items-center gap-1.5">
		<TeamPermissionLevel level="yes" />
		<span>Full access</span>
	</span>
	<span class="inline-flex items-center gap-1.5">
		<TeamPermissionLevel level="limited" />
		<span>Limited (assigned or own items)</span>
	</span>
	<span class="inline-flex items-center gap-1.5">
		<TeamPermissionLevel level="no" />
		<span>Not allowed</span>
	</span>
</div>
