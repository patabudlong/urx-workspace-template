<script lang="ts">
	import {
		DTR_DAY_HOLIDAY_CELL_CLASSES,
		DTR_DAY_STATUS_CELL_CLASSES
	} from '$lib/components/dtr/dtr-day-cell-styles';
	import { DTR_DAY_STATUS_LABELS, type DtrDayStatus } from '$lib/shared/dtr/status';
	import { cn } from '$lib/utils.js';

	let {
		status,
		dayOfMonth,
		holidayName = null,
		selected = false,
		interactive = false,
		onclick
	}: {
		status: DtrDayStatus;
		dayOfMonth: number;
		holidayName?: string | null;
		selected?: boolean;
		interactive?: boolean;
		onclick?: () => void;
	} = $props();

	const title = $derived(
		holidayName
			? `${DTR_DAY_STATUS_LABELS[status]} · ${holidayName}`
			: DTR_DAY_STATUS_LABELS[status]
	);

	const cellClasses = $derived(
		holidayName ? DTR_DAY_HOLIDAY_CELL_CLASSES : DTR_DAY_STATUS_CELL_CLASSES[status]
	);
</script>

{#if interactive}
	<button
		type="button"
		class={cn(
			'flex h-10 w-full min-w-8 flex-col items-center justify-center rounded-md text-xs font-medium transition-colors',
			cellClasses,
			selected && 'ring-primary ring-2 ring-offset-2',
			'hover:opacity-90'
		)}
		title={title}
		{onclick}
	>
		{#if holidayName}
			<span class="leading-none">{dayOfMonth}</span>
			<span class="text-[10px] leading-none">Holiday</span>
		{:else}
			{dayOfMonth}
		{/if}
	</button>
{:else}
	<div
		class={cn(
			'flex h-10 w-full min-w-8 flex-col items-center justify-center rounded-md text-xs font-medium',
			cellClasses
		)}
		title={title}
	>
		{#if holidayName}
			<span class="leading-none">{dayOfMonth}</span>
			<span class="text-[10px] leading-none">Holiday</span>
		{:else}
			{dayOfMonth}
		{/if}
	</div>
{/if}
