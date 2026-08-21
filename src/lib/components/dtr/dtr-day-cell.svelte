<script lang="ts">
	import { DTR_DAY_STATUS_LABELS, type DtrDayStatus } from '$lib/shared/dtr/status';
	import { cn } from '$lib/utils.js';

	let {
		status,
		dayOfMonth,
		selected = false,
		interactive = false,
		onclick
	}: {
		status: DtrDayStatus;
		dayOfMonth: number;
		selected?: boolean;
		interactive?: boolean;
		onclick?: () => void;
	} = $props();

	const statusClasses: Record<DtrDayStatus, string> = {
		present: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
		absent: 'bg-destructive/15 text-destructive',
		rest: 'bg-muted text-muted-foreground',
		partial: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
		pending: 'bg-background text-muted-foreground border border-dashed border-border'
	};
</script>

{#if interactive}
	<button
		type="button"
		class={cn(
			'flex h-10 w-full min-w-8 flex-col items-center justify-center rounded-md text-xs font-medium transition-colors',
			statusClasses[status],
			selected && 'ring-primary ring-2 ring-offset-2',
			'hover:opacity-90'
		)}
		title={DTR_DAY_STATUS_LABELS[status]}
		{onclick}
	>
		{dayOfMonth}
	</button>
{:else}
	<div
		class={cn(
			'flex h-10 w-full min-w-8 flex-col items-center justify-center rounded-md text-xs font-medium',
			statusClasses[status]
		)}
		title={DTR_DAY_STATUS_LABELS[status]}
	>
		{dayOfMonth}
	</div>
{/if}
