<script lang="ts">
	import {
		DTR_DAY_HOLIDAY_CELL_CLASSES,
		DTR_DAY_STATUS_CELL_CLASSES
	} from '$lib/components/dtr/dtr-day-cell-styles';
	import { DTR_DAY_STATUS_LABELS, DTR_DAY_STATUSES } from '$lib/shared/dtr/status';
	import { cn } from '$lib/utils.js';
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
				'inline-flex h-4 min-w-10 shrink-0 items-center justify-center rounded px-1 text-[10px] font-medium',
				DTR_DAY_HOLIDAY_CELL_CLASSES
			)}
			aria-hidden="true"
		>
			Holiday
		</span>
		<span>Holiday</span>
	</span>
</div>
