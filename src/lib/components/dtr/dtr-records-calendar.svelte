<script lang="ts">
	import { CalendarDate, parseDate, type DateValue } from '@internationalized/date';
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import {
		DTR_DAY_HOLIDAY_CELL_CLASSES,
		DTR_DAY_LOCKED_CELL_CLASSES,
		DTR_DAY_STATUS_CELL_CLASSES,
		DTR_DAY_UNDERTIME_LABEL_CLASSES
	} from '$lib/components/dtr/dtr-day-cell-styles';
	import type { DtrCalendarCell } from '$lib/shared/dtr/calendar';
	import { DTR_DAY_STATUS_LABELS } from '$lib/shared/dtr/status';
	import { formatUndertimeMinutes } from '$lib/shared/dtr/undertime';
	import { cn } from '$lib/utils.js';
	import LockIcon from '@lucide/svelte/icons/lock';

	let {
		month,
		selectedDate = '',
		days,
		onMonthChange,
		onDateSelect
	}: {
		month: string;
		selectedDate?: string;
		days: DtrCalendarCell[];
		onMonthChange: (month: string) => void;
		onDateSelect: (date: string) => void;
	} = $props();

	const dayByDate = $derived(new Map(days.map((day) => [day.date, day])));

	let placeholder = $state<DateValue>();
	let value = $state<DateValue | undefined>();

	const calendarDayClass =
		'relative flex min-h-16 w-full flex-col items-center justify-center gap-0.5 rounded-lg border p-1 text-sm leading-none font-medium whitespace-normal select-none not-data-disabled:cursor-pointer not-data-selected:hover:brightness-[1.03] focus:relative focus:border-ring focus:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-40 data-[today]:not([data-selected]):ring-primary/40 data-[today]:not([data-selected]):ring-1 data-[today]:not([data-selected]):ring-inset data-[selected]:bg-transparent data-[selected]:text-inherit data-[selected]:shadow-sm data-[selected]:ring-primary data-[selected]:ring-2 data-[selected]:ring-offset-2 data-[selected]:ring-offset-background data-[selected]:hover:text-inherit sm:min-h-20';

	function parseMonthValue(monthValue: string): CalendarDate {
		const [year, monthNumber] = monthValue.split('-').map(Number);
		return new CalendarDate(year, monthNumber, 1);
	}

	function formatMonthValue(date: DateValue): string {
		return `${date.year}-${String(date.month).padStart(2, '0')}`;
	}

	function parseSelectedDate(date: string): DateValue | undefined {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
			return undefined;
		}

		try {
			return parseDate(date);
		} catch {
			return undefined;
		}
	}

	$effect(() => {
		const next = parseMonthValue(month);
		if (placeholder?.toString() !== next.toString()) {
			placeholder = next;
		}
	});

	$effect(() => {
		const next = parseSelectedDate(selectedDate);
		if ((next?.toString() ?? '') !== (value?.toString() ?? '')) {
			value = next;
		}
	});

	function truncateHolidayLabel(name: string, maxLength = 14): string {
		const trimmed = name.trim();

		if (trimmed.length <= maxLength) {
			return trimmed;
		}

		return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
	}

	function dayTitle(cell: DtrCalendarCell | undefined): string | undefined {
		if (!cell) {
			return undefined;
		}

		const undertimeLabel =
			cell.undertimeMinutes > 0
				? `${formatUndertimeMinutes(cell.undertimeMinutes)} undertime`
				: null;

		return [
			DTR_DAY_STATUS_LABELS[cell.status],
			cell.holidayName ? cell.holidayName : null,
			undertimeLabel,
			cell.isLocked ? 'Locked for payroll' : null
		]
			.filter(Boolean)
			.join(' · ');
	}

	function statusCellClasses(cell: DtrCalendarCell | undefined): string {
		if (!cell) {
			return 'border-border/60 bg-background text-muted-foreground';
		}

		return cell.holidayName
			? DTR_DAY_HOLIDAY_CELL_CLASSES
			: DTR_DAY_STATUS_CELL_CLASSES[cell.status];
	}
</script>

<div class="w-full">
	<Calendar
		type="single"
		bind:placeholder
		bind:value
		captionLayout="dropdown"
		fixedWeeks
		disableDaysOutsideMonth
		weekdayFormat="short"
		class="w-full max-w-none bg-transparent p-0 [--cell-radius:var(--radius-lg)] [&_tbody]:block [&_tbody]:w-full [&_tbody_tr]:gap-1.5 [&_tbody_tr]:sm:gap-2 [&_td]:!size-auto [&_td]:h-auto [&_td]:min-h-16 [&_td]:!w-auto [&_td]:!flex-1 [&_td]:basis-0 [&_td]:sm:min-h-20 [&_thead]:block [&_thead]:w-full [&_thead_th]:!size-auto [&_thead_th]:min-h-0 [&_thead_th]:!w-auto [&_thead_th]:!flex-1 [&_thead_th]:basis-0 [&_thead_th]:pb-2 [&_thead_th]:text-center [&_thead_th]:text-xs [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-wide [&_thead_tr]:flex [&_thead_tr]:w-full [&_thead_tr]:gap-1.5 [&_thead_tr]:sm:gap-2 [&_tr]:flex [&_tr]:w-full"
		calendarLabel="DTR time records"
		onPlaceholderChange={(next) => {
			placeholder = next;
			const nextMonth = formatMonthValue(next);

			if (nextMonth !== month) {
				onMonthChange(nextMonth);
			}
		}}
		onValueChange={(next) => {
			value = next;
			onDateSelect(next?.toString() ?? '');
		}}
	>
	{#snippet day({ day: dateValue, outsideMonth })}
		{@const dateKey = dateValue.toString()}
		{@const cell = dayByDate.get(dateKey)}
		{@const holidayLabel = cell?.holidayName ? truncateHolidayLabel(cell.holidayName) : null}
		{@const undertimeLabel =
			cell && cell.undertimeMinutes > 0 ? formatUndertimeMinutes(cell.undertimeMinutes) : null}
		<CalendarPrimitive.Day
			class={cn(
				calendarDayClass,
				statusCellClasses(cell),
				cell?.isLocked && DTR_DAY_LOCKED_CELL_CLASSES,
				outsideMonth && 'border-transparent bg-transparent text-muted-foreground/50'
			)}
			title={dayTitle(cell)}
		>
			{#if cell?.isLocked}
				<LockIcon class="absolute top-1 right-1 size-3 opacity-70" aria-hidden="true" />
			{/if}
			<span class="text-sm leading-none font-semibold">{dateValue.day}</span>
			{#if holidayLabel}
				<span
					class="mt-0.5 w-full truncate px-0.5 text-center text-[10px] leading-tight opacity-95 sm:text-xs"
				>
					{holidayLabel}
				</span>
			{/if}
			{#if undertimeLabel}
				<span
					class={cn(
						'mt-0.5 w-full truncate px-0.5 text-center text-[10px] leading-tight sm:text-xs',
						DTR_DAY_UNDERTIME_LABEL_CLASSES
					)}
				>
					{undertimeLabel} UT
				</span>
			{/if}
		</CalendarPrimitive.Day>
	{/snippet}
	</Calendar>
</div>
