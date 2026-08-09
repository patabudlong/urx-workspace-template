<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';

	let {
		unseen,
		total
	}: {
		unseen: number;
		total: number;
	} = $props();
</script>

<!-- Wrapper avoids Sidebar.MenuButton [&>span:last-child]:truncate clipping the count -->
<div class="ms-auto flex shrink-0 items-center gap-1.5">
	{#if unseen > 0}
		<Badge variant="default" class="min-w-5 justify-center px-1.5 tabular-nums">
			{unseen}
		</Badge>
	{:else if total > 0}
		<span class="text-muted-foreground text-xs tabular-nums">{total}</span>
	{/if}
</div>
