<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { DTR_DAY_STATUS_LABELS, type DtrDayStatus } from '$lib/shared/dtr/status';
	import { formatUndertimeMinutes } from '$lib/shared/dtr/undertime';
	import {
		DTR_DAY_HOLIDAY_CELL_CLASSES,
		DTR_DAY_LOCKED_CELL_CLASSES,
		DTR_DAY_STATUS_CELL_CLASSES,
		DTR_DAY_UNDERTIME_LABEL_CLASSES
	} from '$lib/components/dtr/dtr-day-cell-styles';
	import DtrCalendarLockIcon from '$lib/components/dtr/dtr-calendar-lock-icon.svelte';

	let {
		status,
		dayOfMonth,
		holidayName = null,
		undertimeMinutes = 0,
		locked = false,
		selected = false,
		isToday = false,
		interactive = false,
		onclick
	}: {
		status: DtrDayStatus;
		dayOfMonth: number;
		holidayName?: string | null;
		undertimeMinutes?: number;
		locked?: boolean;
		selected?: boolean;
		isToday?: boolean;
		interactive?: boolean;
		onclick?: () => void;
	} = $props();

	const undertimeLabel = $derived(
		undertimeMinutes > 0 ? formatUndertimeMinutes(undertimeMinutes) : null
	);

	const title = $derived(
		[
			DTR_DAY_STATUS_LABELS[status],
			holidayName ? holidayName : null,
			undertimeLabel ? `${undertimeLabel} undertime` : null,
			locked ? 'Locked for payroll' : null
		]
			.filter(Boolean)
			.join(' · ')
	);

	const cellClasses = $derived(
		holidayName ? DTR_DAY_HOLIDAY_CELL_CLASSES : DTR_DAY_STATUS_CELL_CLASSES[status]
	);

	const holidayLabel = $derived(holidayName ? truncateHolidayLabel(holidayName) : null);
	const hasSubLabel = $derived(Boolean(holidayLabel || undertimeLabel));

	const sharedClasses = $derived(
		cn(
			'relative flex w-full min-w-8 flex-col items-center justify-center rounded-lg text-xs font-medium transition-[color,box-shadow,transform]',
			hasSubLabel ? 'min-h-14 px-0.5 py-1.5' : 'h-11',
			cellClasses,
			locked && DTR_DAY_LOCKED_CELL_CLASSES,
			isToday && !selected && 'ring-primary/40 ring-1 ring-inset',
			selected && 'ring-primary shadow-sm ring-2 ring-offset-2 ring-offset-background',
			interactive && 'hover:brightness-[1.03] active:scale-[0.97]'
		)
	);

	function truncateHolidayLabel(name: string, maxLength = 16): string {
		const trimmed = name.trim();

		if (trimmed.length <= maxLength) {
			return trimmed;
		}

		return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
	}
</script>

{#if interactive}
	<button type="button" class={cn(sharedClasses, 'cursor-pointer')} title={title} {onclick}>
		{#if locked}
			<DtrCalendarLockIcon />
		{/if}
		<span class="text-xs leading-none font-semibold">{dayOfMonth}</span>
		{#if holidayLabel}
			<span class="mt-0.5 w-full truncate px-0.5 text-center text-[9px] leading-tight opacity-95 sm:text-[10px]">
				{holidayLabel}
			</span>
		{/if}
		{#if undertimeLabel}
			<span
				class={cn(
					'mt-0.5 w-full truncate px-0.5 text-center text-[9px] leading-tight sm:text-[10px]',
					DTR_DAY_UNDERTIME_LABEL_CLASSES
				)}
			>
				{undertimeLabel} UT
			</span>
		{/if}
	</button>
{:else}
	<div class={sharedClasses} title={title}>
		{#if locked}
			<DtrCalendarLockIcon />
		{/if}
		<span class="text-xs leading-none font-semibold">{dayOfMonth}</span>
		{#if holidayLabel}
			<span class="mt-0.5 w-full truncate px-0.5 text-center text-[9px] leading-tight opacity-95 sm:text-[10px]">
				{holidayLabel}
			</span>
		{/if}
		{#if undertimeLabel}
			<span
				class={cn(
					'mt-0.5 w-full truncate px-0.5 text-center text-[9px] leading-tight sm:text-[10px]',
					DTR_DAY_UNDERTIME_LABEL_CLASSES
				)}
			>
				{undertimeLabel} UT
			</span>
		{/if}
	</div>
{/if}
