<script lang="ts">
	import { CalendarDate, parseDate, type DateValue } from '@internationalized/date';
	import { Calendar as CalendarPrimitive } from 'bits-ui';
	import { Calendar } from '$lib/components/ui/calendar/index.js';
	import {
		DTR_DAY_HOLIDAY_CELL_CLASSES,
		DTR_DAY_LOCKED_CELL_CLASSES,
		DTR_DAY_STATUS_CELL_CLASSES
	} from '$lib/components/dtr/dtr-day-cell-styles';
	import type { DtrDayDto } from '$lib/shared/models/dtr-day';
	import type { DtrCalendarCell } from '$lib/shared/dtr/calendar';
	import { formatDtrDisplayTime, summarizeDtrDayTimes } from '$lib/shared/dtr/punch';
	import { cn } from '$lib/utils.js';
	import LockIcon from '@lucide/svelte/icons/lock';

	let {
		month,
		selectedDate = '',
		days,
		recordsByDate = {},
		onMonthChange,
		onDateSelect
	}: {
		month: string;
		selectedDate?: string;
		days: DtrCalendarCell[];
		recordsByDate?: Record<string, DtrDayDto | null>;
		onMonthChange: (month: string) => void;
		onDateSelect: (date: string) => void;
	} = $props();

	const dayByDate = $derived(new Map(days.map((day) => [day.date, day])));

	let placeholder = $state<DateValue>();
	let value = $state<DateValue | undefined>();

	const calendarDayClass =
		'relative flex min-h-[4.75rem] w-full flex-col items-stretch justify-start gap-0.5 rounded-lg border p-1.5 text-left text-sm leading-none font-medium whitespace-normal select-none not-data-disabled:cursor-pointer not-data-selected:hover:brightness-[1.03] focus:relative focus:border-ring focus:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-40 data-[today]:not([data-selected]):ring-primary/40 data-[today]:not([data-selected]):ring-1 data-[today]:not([data-selected]):ring-inset data-[selected]:bg-transparent data-[selected]:text-inherit data-[selected]:shadow-sm data-[selected]:ring-primary data-[selected]:ring-2 data-[selected]:ring-offset-2 data-[selected]:ring-offset-background data-[selected]:hover:text-inherit sm:min-h-24';

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

	function formatDaySummary(record: DtrDayDto | null | undefined): string | null {
		if (!record) {
			return null;
		}

		const times = summarizeDtrDayTimes(record);
		const segments: string[] = [];

		if (times.morningTimeIn) {
			segments.push(`${formatDtrDisplayTime(times.morningTimeIn)}`);
		}

		if (times.afternoonTimeOut) {
			segments.push(`${formatDtrDisplayTime(times.afternoonTimeOut)}`);
		} else if (times.morningTimeOut) {
			segments.push(`${formatDtrDisplayTime(times.morningTimeOut)}`);
		}

		if (segments.length === 0) {
			return null;
		}

		return segments.join(' – ');
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
		class="w-full max-w-none bg-transparent p-0 [--cell-radius:var(--radius-lg)] [&_tbody]:block [&_tbody]:w-full [&_tbody_tr]:gap-1.5 [&_tbody_tr]:sm:gap-2 [&_td]:!size-auto [&_td]:h-auto [&_td]:min-h-[4.75rem] [&_td]:!w-auto [&_td]:!flex-1 [&_td]:basis-0 [&_td]:sm:min-h-24 [&_thead]:block [&_thead]:w-full [&_thead_th]:!size-auto [&_thead_th]:min-h-0 [&_thead_th]:!w-auto [&_thead_th]:!flex-1 [&_thead_th]:basis-0 [&_thead_th]:pb-2 [&_thead_th]:text-center [&_thead_th]:text-xs [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-wide [&_thead_tr]:flex [&_thead_tr]:w-full [&_thead_tr]:gap-1.5 [&_thead_tr]:sm:gap-2 [&_tr]:flex [&_tr]:w-full"
		calendarLabel="My time records"
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
		{@const record = recordsByDate[dateKey] ?? null}
		{@const summary = formatDaySummary(record)}
		<CalendarPrimitive.Day
			class={cn(
				calendarDayClass,
				statusCellClasses(cell),
				cell?.isLocked && DTR_DAY_LOCKED_CELL_CLASSES,
				outsideMonth && 'border-transparent bg-transparent text-muted-foreground/50'
			)}
		>
			{#if cell?.isLocked}
				<LockIcon class="absolute top-1 right-1 size-3 opacity-70" aria-hidden="true" />
			{/if}
			<span class="text-sm leading-none font-semibold">{dateValue.day}</span>
			{#if summary}
				<span class="text-muted-foreground mt-1 w-full truncate text-[10px] leading-tight sm:text-xs">
					{summary}
				</span>
			{:else if cell?.status === 'rest'}
				<span class="text-muted-foreground mt-1 text-[10px] leading-tight sm:text-xs">Rest</span>
			{/if}
		</CalendarPrimitive.Day>
	{/snippet}
	</Calendar>
</div>
