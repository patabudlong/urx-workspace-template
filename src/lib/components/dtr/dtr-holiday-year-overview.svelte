<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { DtrHolidayCategory, DtrHolidayEntry } from '$lib/shared/dtr/holidays';
	import { getMonthDateRange } from '$lib/shared/dtr/calendar';
	import { DTR_HOLIDAY_CATEGORY_BADGE_CLASSES } from '$lib/components/dtr/dtr-holiday-category-styles';

	let {
		year,
		holidays = []
	}: {
		year: number;
		holidays?: DtrHolidayEntry[];
	} = $props();

	const holidayByDate = $derived(
		new Map(
			holidays
				.filter((holiday) => holiday.date.trim().length > 0 && holiday.name.trim().length > 0)
				.map((holiday) => [holiday.date, holiday])
		)
	);

	const months = $derived(Array.from({ length: 12 }, (_, index) => index + 1));

	function monthValue(month: number): string {
		return `${year}-${String(month).padStart(2, '0')}`;
	}

	function monthLabel(month: number): string {
		return new Intl.DateTimeFormat(undefined, { month: 'short' }).format(
			new Date(year, month - 1, 1)
		);
	}

	function cellClasses(category: DtrHolidayCategory | null, isToday: boolean): string {
		if (!category) {
			return isToday ? 'ring-primary/40 bg-muted/50 ring-1 ring-inset' : 'text-muted-foreground/70';
		}

		return cn(
			DTR_HOLIDAY_CATEGORY_BADGE_CLASSES[category],
			'font-medium',
			isToday && 'ring-primary/50 ring-1 ring-inset'
		);
	}

	const todayDate = $derived.by(() => {
		const today = new Date();
		const y = today.getFullYear();
		const m = String(today.getMonth() + 1).padStart(2, '0');
		const d = String(today.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	});
</script>

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
	{#each months as month (month)}
		{@const monthKey = monthValue(month)}
		{@const { days } = getMonthDateRange(monthKey)}
		{@const monthHolidayCount = days.filter((date) => holidayByDate.has(date)).length}
		<div class="bg-background space-y-2 rounded-lg border p-3">
			<div class="flex items-center justify-between gap-2">
				<p class="text-sm font-semibold tracking-tight">{monthLabel(month)}</p>
				{#if monthHolidayCount > 0}
					<span class="text-muted-foreground text-[11px] font-medium">
						{monthHolidayCount} holiday{monthHolidayCount === 1 ? '' : 's'}
					</span>
				{/if}
			</div>

			<div class="grid grid-cols-7 gap-0.5">
				{#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as weekday, weekdayIndex (weekdayIndex)}
					<div
						class="text-muted-foreground text-center text-[9px] font-semibold uppercase tracking-wide"
					>
						{weekday}
					</div>
				{/each}

				{#each Array.from({ length: new Date(`${monthKey}-01T12:00:00`).getDay() }) as _, index (index)}
					<div class="h-5" aria-hidden="true"></div>
				{/each}

				{#each days as date (date)}
					{@const holiday = holidayByDate.get(date)}
					{@const dayOfMonth = Number(date.slice(8, 10))}
					<div
						class={cn(
							'flex h-5 items-center justify-center rounded text-[10px]',
							cellClasses(holiday?.category ?? null, date === todayDate)
						)}
						title={holiday ? `${holiday.name}` : undefined}
					>
						{dayOfMonth}
					</div>
				{/each}
			</div>
		</div>
	{/each}
</div>
