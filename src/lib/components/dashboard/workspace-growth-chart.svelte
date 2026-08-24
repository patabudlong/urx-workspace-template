<script lang="ts">
	import type { WorkspaceGrowthPoint } from '$lib/shared/dashboard/overview';

	let { points }: { points: WorkspaceGrowthPoint[] } = $props();

	const maxValue = $derived(Math.max(1, ...points.map((point) => point.value)));
	const total = $derived(points.reduce((sum, point) => sum + point.value, 0));
</script>

<div class="space-y-4">
	<div class="flex items-end justify-between gap-3">
		<div>
			<p class="text-2xl font-semibold tracking-tight">{total}</p>
			<p class="text-muted-foreground text-sm">New members in the last six months</p>
		</div>
	</div>

	<div class="flex h-44 items-end gap-2 sm:gap-3" role="img" aria-label="Team growth chart">
		{#each points as point (point.label)}
			<div class="flex min-w-0 flex-1 flex-col items-center gap-2">
				<div class="bg-muted/50 relative flex h-36 w-full items-end overflow-hidden rounded-lg">
					<div
						class="bg-primary mx-auto w-[min(100%,2.5rem)] rounded-t-md transition-all"
						style:height="{Math.max((point.value / maxValue) * 100, point.value > 0 ? 10 : 0)}%"
						title="{point.value} member{point.value === 1 ? '' : 's'}"
					></div>
				</div>
				<span class="text-muted-foreground text-xs font-medium">{point.label}</span>
			</div>
		{/each}
	</div>
</div>
