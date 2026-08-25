<script lang="ts">
	import {
		DTR_DAY_HOLIDAY_CELL_CLASSES,
		DTR_DAY_STATUS_CELL_CLASSES
	} from '$lib/components/dtr/dtr-day-cell-styles';
	import { DTR_DAY_STATUS_LABELS, DTR_DAY_STATUSES } from '$lib/shared/dtr/status';
	import { cn } from '$lib/utils.js';
	import DtrLockIcon from '$lib/components/dtr/dtr-lock-icon.svelte';
	import { DTR_DAY_UNDERTIME_LABEL_CLASSES } from '$lib/components/dtr/dtr-day-cell-styles';
</script>

<div
	class="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-xs"
	aria-label="Time record status legend"
>
	{#each DTR_DAY_STATUSES as status (status)}
		<span class="inline-flex items-center gap-1.5">
			<span
				class={cn(
					'inline-flex h-4 w-4 shrink-0 rounded',
					DTR_DAY_STATUS_CELL_CLASSES[status]
				)}
				aria-hidden="true"
			></span>
			<span>{DTR_DAY_STATUS_LABELS[status]}</span>
		</span>
	{/each}

	<span class="inline-flex items-center gap-1.5">
		<span
			class={cn(
				'inline-flex h-4 max-w-24 shrink-0 items-center justify-center truncate rounded px-1 text-[10px] font-medium',
				DTR_DAY_HOLIDAY_CELL_CLASSES
			)}
			aria-hidden="true"
		>
			New Year
		</span>
		<span>Holiday (name on calendar)</span>
	</span>

	<span class="inline-flex items-center gap-1.5">
		<span
			class={cn(
				'inline-flex h-4 min-w-10 shrink-0 items-center justify-center rounded px-1 text-[10px] font-semibold',
				DTR_DAY_UNDERTIME_LABEL_CLASSES
			)}
			aria-hidden="true"
		>
			1h UT
		</span>
		<span>Undertime</span>
	</span>

	<span class="inline-flex items-center gap-1.5">
		<span
			class="border-border/60 bg-emerald-500/15 relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-emerald-500/25"
			aria-hidden="true"
		>
			<DtrLockIcon class="size-2.5" />
		</span>
		<span>Locked (payroll processed)</span>
	</span>
</div>
