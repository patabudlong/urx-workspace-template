<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
</script>

<Sidebar.Header class="border-sidebar-border shrink-0 gap-2 border-b p-4">
	<Skeleton class="h-4 w-20" />
	<Skeleton class="h-3 w-full max-w-48" />
	<Skeleton class="h-3 w-4/5 max-w-40" />
</Sidebar.Header>

<Sidebar.Content class="min-h-0 flex-1 gap-1 overflow-visible ps-1 pt-3">
	<Skeleton class="mx-2 mb-2 h-3 w-14" />
	<div class="space-y-1 px-1">
		{#each Array.from({ length: 6 }) as _, index (index)}
			<div class="flex h-8 items-center gap-2 rounded-md px-2">
				<Skeleton class="size-4 shrink-0 rounded-md" />
				<Skeleton class="h-4 flex-1" style="max-width: {55 + (index % 3) * 12}%;" />
			</div>
		{/each}
	</div>
</Sidebar.Content>
