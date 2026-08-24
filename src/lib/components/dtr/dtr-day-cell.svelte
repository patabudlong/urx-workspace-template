<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { DTR_DAY_STATUS_LABELS, type DtrDayStatus } from '$lib/shared/dtr/status';
	import {
		DTR_DAY_HOLIDAY_CELL_CLASSES,
		DTR_DAY_STATUS_CELL_CLASSES
	} from '$lib/components/dtr/dtr-day-cell-styles';
	import LockIcon from '@lucide/svelte/icons/lock';

	let {
		status,
		dayOfMonth,
		holidayName = null,
		locked = false,
		selected = false,
		interactive = false,
		onclick
	}: {
		status: DtrDayStatus;
		dayOfMonth: number;
		holidayName?: string | null;
		locked?: boolean;
		selected?: boolean;
		interactive?: boolean;
		onclick?: () => void;
	} = $props();

	const title = $derived(
		locked
			? `${DTR_DAY_STATUS_LABELS[status]} · Locked for payroll`
			: holidayName
				? `${DTR_DAY_STATUS_LABELS[status]} · ${holidayName}`
				: DTR_DAY_STATUS_LABELS[status]
	);

	const cellClasses = $derived(
		locked
			? 'bg-muted text-muted-foreground border border-border'
			: holidayName
				? DTR_DAY_HOLIDAY_CELL_CLASSES
				: DTR_DAY_STATUS_CELL_CLASSES[status]
	);
</script>

{#if interactive && !locked}
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
			cellClasses,
			selected && !locked && 'ring-primary ring-2 ring-offset-2'
		)}
		title={title}
	>
		{#if locked}
			<LockIcon class="size-3.5" aria-hidden="true" />
			<span class="text-[10px] leading-none">{dayOfMonth}</span>
		{:else if holidayName}
			<span class="leading-none">{dayOfMonth}</span>
			<span class="text-[10px] leading-none">Holiday</span>
		{:else}
			{dayOfMonth}
		{/if}
	</div>
{/if}
