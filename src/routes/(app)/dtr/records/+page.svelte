<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import DtrDayCell from '$lib/components/dtr/dtr-day-cell.svelte';
	import DtrStatusLegend from '$lib/components/dtr/dtr-status-legend.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { DTR_DAY_HOLIDAY_CELL_CLASSES, DTR_DAY_UNDERTIME_LABEL_CLASSES } from '$lib/components/dtr/dtr-day-cell-styles';
	import { computeDtrDayWorkedMinutes, hasSplitDtrTimePunches } from '$lib/shared/dtr/calendar';
	import { formatDtrNgImportDayTimes, formatDtrNgImportTimeRange } from '$lib/shared/dtr/ng-timecard-import';
	import {
		computeUndertimeMinutes,
		formatUndertimeMinutes
	} from '$lib/shared/dtr/undertime';
	import { formatLunchBreakWindow } from '$lib/shared/dtr/work-schedule';
	import { DTR_DAY_STATUS_LABELS, DTR_DAY_STATUSES } from '$lib/shared/dtr/status';
	import {
		DTR_DAY_LOCKED_MESSAGE,
		DTR_DAY_SAVED_MESSAGE,
		DTR_DAY_SAVE_FAILED_MESSAGE
	} from '$lib/shared/dtr/messages';
	import { upsertDtrDaySchema } from '$lib/shared/dtr/schemas';
	import { formatHolidayPayPercent } from '$lib/shared/dtr/holidays';
	import type { PayrollEmployeeDto } from '$lib/shared/models/payroll-employee';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import LockIcon from '@lucide/svelte/icons/lock';
	import { goto, invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(upsertDtrDaySchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === DTR_DAY_SAVED_MESSAGE) {
				showSuccess = true;
				await invalidateAll();
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	const selectedEmployee = $derived(
		data.employees.find((employee: PayrollEmployeeDto) => employee.id === data.employeeId) ?? null
	);

	const selectedCalendarDay = $derived(
		data.calendar.find((day) => day.date === data.selectedDate) ?? null
	);

	const monthLabel = $derived.by(() => {
		const [year, month] = data.month.split('-').map(Number);
		return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
			new Date(year, month - 1, 1)
		);
	});

	const monthHolidays = $derived(
		data.calendar
			.filter((day) => day.holidayName)
			.sort((left, right) => left.date.localeCompare(right.date))
	);

	const monthUndertimeDays = $derived(
		data.calendar
			.filter((day) => day.undertimeMinutes > 0)
			.sort((left, right) => left.date.localeCompare(right.date))
	);

	const monthTotalUndertimeMinutes = $derived(
		monthUndertimeDays.reduce((total, day) => total + day.undertimeMinutes, 0)
	);

	const todayDate = $derived.by(() => {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	});

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== DTR_DAY_SAVED_MESSAGE
	);

	const displayStatus = $derived(
		data.selectedRecord?.status ?? selectedCalendarDay?.status ?? 'pending'
	);

	const selectedHolidayName = $derived(
		data.selectedRecord?.holidayName ?? selectedCalendarDay?.holidayName ?? null
	);

	const selectedHolidayPayPercent = $derived(
		data.selectedRecord?.holidayPayPercent ?? selectedCalendarDay?.holidayPayPercent ?? null
	);

	const selectedHolidayWorked = $derived(data.selectedRecord?.holidayWorked ?? null);

	const formPunchInput = $derived({
		timeIn: $form.timeIn,
		timeOut: $form.timeOut,
		morningTimeIn: $form.morningTimeIn,
		morningTimeOut: $form.morningTimeOut,
		afternoonTimeIn: $form.afternoonTimeIn,
		afternoonTimeOut: $form.afternoonTimeOut
	});

	const formUsesSplitPunches = $derived(hasSplitDtrTimePunches(formPunchInput));

	const selectedUndertimeMinutes = $derived.by(() => {
		if (!selectedCalendarDay) {
			return 0;
		}

		const workedMinutes = formUsesSplitPunches
			? computeDtrDayWorkedMinutes(formPunchInput)
			: computeDtrDayWorkedMinutes(formPunchInput, data.selectedLunchBreak);

		return computeUndertimeMinutes({
			workedMinutes,
			expectedWorkMinutes: selectedCalendarDay.expectedWorkMinutes,
			status: $form.status
		});
	});

	const previewGrossWorkedMinutes = $derived.by(() => {
		if (formUsesSplitPunches) {
			return computeDtrDayWorkedMinutes(formPunchInput);
		}

		if (!$form.timeIn || !$form.timeOut) {
			return 0;
		}

		return computeDtrDayWorkedMinutes({ timeIn: $form.timeIn, timeOut: $form.timeOut });
	});

	const previewWorkedMinutes = $derived.by(() => {
		if (formUsesSplitPunches) {
			return computeDtrDayWorkedMinutes(formPunchInput);
		}

		if (!$form.timeIn || !$form.timeOut) {
			return 0;
		}

		return computeDtrDayWorkedMinutes(
			{ timeIn: $form.timeIn, timeOut: $form.timeOut },
			data.selectedLunchBreak
		);
	});

	const previewLunchDeductionMinutes = $derived(
		Math.max(0, previewGrossWorkedMinutes - previewWorkedMinutes)
	);

	const lunchBreakLabel = $derived(formatLunchBreakWindow(data.selectedLunchBreak));

	function updateQuery(next: { month?: string; employeeId?: string; date?: string }) {
		const params = new URLSearchParams();
		params.set('month', next.month ?? data.month);
		params.set('employeeId', next.employeeId ?? data.employeeId);

		const date = next.date ?? data.selectedDate;
		if (date) {
			params.set('date', date);
		}

		void goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	function shiftMonth(delta: number) {
		const [year, month] = data.month.split('-').map(Number);
		const next = new Date(year, month - 1 + delta, 1);
		const monthValue = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
		updateQuery({ month: monthValue, date: '' });
	}

	function clearSelectedDate() {
		updateQuery({ date: '' });
	}

	function formatDisplayDate(date: string): string {
		const [year, month, day] = date.split('-').map(Number);
		return new Intl.DateTimeFormat(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(new Date(year, month - 1, day));
	}

	function formatShortDate(date: string): string {
		const [year, month, day] = date.split('-').map(Number);
		return new Intl.DateTimeFormat(undefined, {
			month: 'short',
			day: 'numeric'
		}).format(new Date(year, month - 1, day));
	}

	function holidayPayDescription(): string {
		if (selectedHolidayPayPercent === null) {
			return 'This date is a configured holiday.';
		}

		const workedLabel =
			selectedHolidayWorked === null
				? 'credit applies when saved'
				: selectedHolidayWorked
					? 'worked'
					: 'unworked';

		return `Holiday pay credit: ${formatHolidayPayPercent(selectedHolidayPayPercent)} (${workedLabel}).`;
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="DTR"
		title="Time records"
		description="Review daily time records by employee. Click a day to add or edit a record. These records feed payroll when a pay run is processed."
	/>

	{#if !data.settingsConfigured}
		<StatusAlert
			variant="info"
			title="Configure your work schedule"
			description="Set rest days and lunch break under Settings → Workspace default."
		/>
	{/if}

	<Card.Root>
		<Card.Header class="border-b">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div class="space-y-1">
					<Card.Title class="flex items-center gap-2">
						<CalendarDaysIcon class="text-muted-foreground size-5" aria-hidden="true" />
						Calendar
					</Card.Title>
					<Card.Description>
						Select an employee and month. Holiday names and undertime appear on configured work days.
						{#if data.workScheduleName}
							Schedule:
							<span class="text-foreground font-medium">{data.workScheduleName}</span>.
						{/if}
					</Card.Description>
				</div>
			</div>
		</Card.Header>
		<Card.Content class="space-y-6 pt-6">
			<div class="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
				<div class="space-y-2">
					<label for="dtr-employee" class="text-sm font-medium">Employee</label>
					<Select.Root
						type="single"
						value={data.employeeId}
						onValueChange={(value) => {
							if (value) {
								updateQuery({ employeeId: value, date: '' });
							}
						}}
					>
						<Select.Trigger id="dtr-employee" class="h-10 w-full bg-muted/30">
							<span class="truncate">
								{selectedEmployee?.fullName ?? 'Select employee'}
							</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each data.employees as employee (employee.id)}
									<Select.Item value={employee.id} label={employee.fullName}>
										{employee.fullName}
									</Select.Item>
								{/each}
							</Select.Group>
						</Select.Content>
					</Select.Root>
				</div>

				<div class="space-y-2">
					<label for="dtr-month" class="text-sm font-medium">Month</label>
					<div class="flex items-center gap-2">
						<Button
							type="button"
							variant="outline"
							size="icon"
							class="size-10 shrink-0"
							aria-label="Previous month"
							onclick={() => shiftMonth(-1)}
						>
							<ChevronLeftIcon class="size-4" aria-hidden="true" />
						</Button>
						<Input
							id="dtr-month"
							type="month"
							value={data.month}
							class="h-10 min-w-0 flex-1 bg-muted/30"
							onchange={(event) => {
								updateQuery({
									month: (event.currentTarget as HTMLInputElement).value,
									date: ''
								});
							}}
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							class="size-10 shrink-0"
							aria-label="Next month"
							onclick={() => shiftMonth(1)}
						>
							<ChevronRightIcon class="size-4" aria-hidden="true" />
						</Button>
					</div>
				</div>
			</div>

			{#if data.employees.length === 0}
				<StatusAlert
					variant="info"
					title="No employees yet"
					description="Add payroll employees first, then return here to manage time records."
				/>
			{:else}
				<div class="bg-muted/25 space-y-4 rounded-xl border p-4 sm:p-5">
					<div class="flex flex-wrap items-center justify-between gap-3">
						<p class="text-lg font-semibold tracking-tight">{monthLabel}</p>
						<div class="flex flex-wrap items-center gap-2">
							{#if data.month === todayDate.slice(0, 7)}
								<Badge variant="secondary" class="font-normal">Current month</Badge>
							{/if}
							{#if monthHolidays.length > 0}
								<Badge
									variant="outline"
									class={cn('font-normal', DTR_DAY_HOLIDAY_CELL_CLASSES)}
								>
									{monthHolidays.length} holiday{monthHolidays.length === 1 ? '' : 's'}
								</Badge>
							{/if}
							{#if monthTotalUndertimeMinutes > 0}
								<Badge variant="outline" class={cn('font-normal', DTR_DAY_UNDERTIME_LABEL_CLASSES)}>
									{formatUndertimeMinutes(monthTotalUndertimeMinutes)} undertime
								</Badge>
							{/if}
						</div>
					</div>

					<div class="grid grid-cols-7 gap-1.5 sm:gap-2">
						{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as weekday, weekdayIndex (weekdayIndex)}
							<div
								class="text-muted-foreground px-1 py-1 text-center text-[11px] font-semibold uppercase tracking-wide sm:text-xs"
							>
								{weekday}
							</div>
						{/each}

						{#each Array.from({ length: new Date(`${data.month}-01T12:00:00`).getDay() }) as _, index (index)}
							<div class="min-h-11" aria-hidden="true"></div>
						{/each}

						{#each data.calendar as day (day.date)}
							<DtrDayCell
								status={day.status}
								dayOfMonth={day.dayOfMonth}
								holidayName={day.holidayName}
								undertimeMinutes={day.undertimeMinutes}
								locked={day.isLocked}
								selected={data.selectedDate === day.date}
								isToday={day.date === todayDate}
								interactive={true}
								onclick={() => updateQuery({ date: day.date })}
							/>
						{/each}
					</div>

					{#if monthHolidays.length > 0}
						<div class="space-y-2 border-t pt-4">
							<p class="text-sm font-medium">Holidays this month</p>
							<ul class="flex flex-wrap gap-2">
								{#each monthHolidays as holiday (holiday.date)}
									<li>
										<button
											type="button"
											class={cn(
												'inline-flex max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors',
												DTR_DAY_HOLIDAY_CELL_CLASSES,
												data.selectedDate === holiday.date && 'ring-primary ring-2 ring-offset-2',
												'hover:brightness-[1.03]'
											)}
											onclick={() => updateQuery({ date: holiday.date })}
										>
											<span class="font-medium">{formatShortDate(holiday.date)}</span>
											<span class="truncate">{holiday.holidayName}</span>
										</button>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if monthUndertimeDays.length > 0}
						<div class="space-y-2 border-t pt-4">
							<p class="text-sm font-medium">Undertime this month</p>
							<ul class="flex flex-wrap gap-2">
								{#each monthUndertimeDays as day (day.date)}
									<li>
										<button
											type="button"
											class={cn(
												'inline-flex max-w-full items-center gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-2.5 py-1.5 text-left text-xs transition-colors',
												data.selectedDate === day.date && 'ring-primary ring-2 ring-offset-2',
												'hover:brightness-[1.03]'
											)}
											onclick={() => updateQuery({ date: day.date })}
										>
											<span class="font-medium">{formatShortDate(day.date)}</span>
											<span class={DTR_DAY_UNDERTIME_LABEL_CLASSES}>
												{formatUndertimeMinutes(day.undertimeMinutes)} UT
											</span>
										</button>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>

				<DtrStatusLegend />
			{/if}
		</Card.Content>
	</Card.Root>

	{#if data.selectedDate && data.employeeId}
		<Card.Root>
			<Card.Header class="border-b">
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div class="space-y-2">
						<Card.Title>Edit time record</Card.Title>
						<Card.Description>
							{selectedEmployee?.fullName} · {formatDisplayDate(data.selectedDate)}
						</Card.Description>
						{#if selectedHolidayName}
							<Badge class={cn('font-normal', DTR_DAY_HOLIDAY_CELL_CLASSES)}>
								{selectedHolidayName}
							</Badge>
						{/if}
						{#if selectedUndertimeMinutes > 0}
							<Badge
								variant="outline"
								class={cn('font-normal border-amber-500/25 bg-amber-500/10', DTR_DAY_UNDERTIME_LABEL_CLASSES)}
							>
								{formatUndertimeMinutes(selectedUndertimeMinutes)} undertime
							</Badge>
						{/if}
					</div>
					<Button
						type="button"
						variant="outline"
						class="h-10 shrink-0"
						onclick={clearSelectedDate}
					>
						Cancel
					</Button>
				</div>
			</Card.Header>
			<Card.Content class="pt-6">
				{#if data.selectedDateLocked}
					<StatusAlert
						variant="warning"
						title="Payroll period locked"
						description="This day falls in a completed pay run. Time records for this date cannot be changed."
						class="mb-6"
					/>

					<div class="space-y-4">
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-1">
								<p class="text-muted-foreground text-sm font-medium">Status</p>
								<p class="text-sm font-medium">
									{DTR_DAY_STATUS_LABELS[displayStatus]}
								</p>
							</div>
							<div class="space-y-1">
								<p class="text-muted-foreground text-sm font-medium">Record lock</p>
								<p class="flex items-center gap-1.5 text-sm font-medium">
									<LockIcon class="size-3.5" aria-hidden="true" />
									Locked for payroll
								</p>
							</div>
						</div>

						<Separator />

						<div class="space-y-4">
							<div>
								<p class="text-muted-foreground text-sm font-medium">Morning</p>
								<p class="text-sm">
									{formatDtrNgImportTimeRange(
										data.selectedRecord?.morningTimeIn ?? null,
										data.selectedRecord?.morningTimeOut ?? null
									)}
								</p>
							</div>
							<div>
								<p class="text-muted-foreground text-sm font-medium">Afternoon</p>
								<p class="text-sm">
									{formatDtrNgImportTimeRange(
										data.selectedRecord?.afternoonTimeIn ?? null,
										data.selectedRecord?.afternoonTimeOut ?? null
									)}
								</p>
							</div>
						</div>

						{#if data.selectedRecord && !hasSplitDtrTimePunches(data.selectedRecord)}
							<StatusAlert
								variant="plain"
								title="Day span"
								description={formatDtrNgImportDayTimes(data.selectedRecord)}
							/>
						{/if}

						{#if data.selectedLunchBreak && !hasSplitDtrTimePunches(data.selectedRecord ?? {})}
							<StatusAlert
								variant="plain"
								title="Lunch break"
								description={`${lunchBreakLabel} is deducted from worked hours when time in and time out span this window.`}
							/>
						{:else if data.selectedLunchBreak && hasSplitDtrTimePunches(data.selectedRecord ?? {})}
							<StatusAlert
								variant="plain"
								title="Lunch break"
								description={`${lunchBreakLabel} falls between morning and afternoon sessions.`}
							/>
						{/if}

						{#if data.selectedRecord && data.selectedRecord.workedMinutes > 0}
							<p class="text-muted-foreground text-sm">
								Worked time:
								{Math.round((data.selectedRecord.workedMinutes / 60) * 100) / 100} hours
								({data.selectedRecord.workedMinutes} minutes), after any lunch break deduction.
							</p>
						{/if}

						{#if data.selectedRecord?.notes}
							<div class="space-y-1">
								<p class="text-muted-foreground text-sm font-medium">Notes</p>
								<p class="text-sm">{data.selectedRecord.notes}</p>
							</div>
						{/if}

						{#if selectedHolidayName}
							<StatusAlert
								variant="info"
								title={selectedHolidayName}
								description={holidayPayDescription()}
							/>
						{/if}

						{#if selectedCalendarDay && selectedCalendarDay.undertimeMinutes > 0}
							<StatusAlert
								variant="warning"
								title="Undertime recorded"
								description={`Worked time is ${formatUndertimeMinutes(selectedCalendarDay.undertimeMinutes)} below the expected ${formatUndertimeMinutes(selectedCalendarDay.expectedWorkMinutes)} for this day.`}
							/>
						{/if}
					</div>
				{:else if showSuccess}
					<StatusAlert
						variant="success"
						title="Time record saved"
						description="The calendar has been updated for this day."
						class="mb-6"
					/>
				{:else if formError}
					<StatusAlert
						variant="danger"
						title="Could not save time record"
						description={$formMessage === DTR_DAY_SAVE_FAILED_MESSAGE
							? DTR_DAY_SAVE_FAILED_MESSAGE
							: $formMessage === DTR_DAY_LOCKED_MESSAGE
								? DTR_DAY_LOCKED_MESSAGE
								: String($formMessage)}
						class="mb-6"
					/>
				{/if}

				{#if !data.selectedDateLocked}
					<form method="POST" use:enhance class="space-y-5">
						<input type="hidden" name="employeeId" value={data.employeeId} />
						<input type="hidden" name="date" value={data.selectedDate} />

						{#if selectedHolidayName}
							<StatusAlert
								variant="info"
								title={selectedHolidayName}
								description={holidayPayDescription()}
							/>
						{/if}

						<Form.Field form={superform} name="status">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>Status</Form.Label>
									<Select.Root type="single" bind:value={$form.status}>
										<Select.Trigger class="h-10 w-full">
											<span class="truncate">
												{DTR_DAY_STATUS_LABELS[$form.status] ?? 'Select status'}
											</span>
										</Select.Trigger>
										<Select.Content>
											<Select.Group>
												{#each DTR_DAY_STATUSES as status (status)}
													<Select.Item value={status} label={DTR_DAY_STATUS_LABELS[status]}>
														{DTR_DAY_STATUS_LABELS[status]}
													</Select.Item>
												{/each}
											</Select.Group>
										</Select.Content>
									</Select.Root>
									<input type="hidden" name={props.name} value={$form.status} />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>

						<div class="space-y-5">
							<div class="space-y-3">
								<p class="text-sm font-medium">Morning</p>
								<div class="grid gap-5 sm:grid-cols-2">
									<Form.Field form={superform} name="morningTimeIn">
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label>Time in</Form.Label>
												<Input {...props} bind:value={$form.morningTimeIn} type="time" />
											{/snippet}
										</Form.Control>
										<SingleFieldErrors />
									</Form.Field>

									<Form.Field form={superform} name="morningTimeOut">
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label>Time out</Form.Label>
												<Input {...props} bind:value={$form.morningTimeOut} type="time" />
											{/snippet}
										</Form.Control>
										<SingleFieldErrors />
									</Form.Field>
								</div>
							</div>

							<div class="space-y-3">
								<p class="text-sm font-medium">Afternoon</p>
								<div class="grid gap-5 sm:grid-cols-2">
									<Form.Field form={superform} name="afternoonTimeIn">
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label>Time in</Form.Label>
												<Input {...props} bind:value={$form.afternoonTimeIn} type="time" />
											{/snippet}
										</Form.Control>
										<SingleFieldErrors />
									</Form.Field>

									<Form.Field form={superform} name="afternoonTimeOut">
										<Form.Control>
											{#snippet children({ props })}
												<Form.Label>Time out</Form.Label>
												<Input {...props} bind:value={$form.afternoonTimeOut} type="time" />
											{/snippet}
										</Form.Control>
										<SingleFieldErrors />
									</Form.Field>
								</div>
							</div>
						</div>

						{#if data.selectedRecord && !formUsesSplitPunches && data.selectedRecord.timeIn}
							<StatusAlert
								variant="plain"
								title="Legacy time range"
								description={`This record was saved as a single span (${formatDtrNgImportDayTimes(data.selectedRecord)}). Enter morning and afternoon times to match your timecard export.`}
							/>
						{/if}

						{#if data.selectedLunchBreak && !formUsesSplitPunches}
							<StatusAlert
								variant="plain"
								title="Lunch break"
								description={`${lunchBreakLabel} is deducted from worked hours when time in and time out span this window.`}
							/>
						{:else if data.selectedLunchBreak && formUsesSplitPunches}
							<StatusAlert
								variant="plain"
								title="Lunch break"
								description={`${lunchBreakLabel} falls between morning and afternoon sessions. Worked time is the sum of both sessions.`}
							/>
						{:else if selectedCalendarDay && !selectedCalendarDay.isRestDay}
							<StatusAlert
								variant="plain"
								title="Lunch break"
								description="No lunch break is configured for this employee on this day."
							/>
						{/if}

						{#if previewWorkedMinutes > 0}
							<p class="text-muted-foreground text-sm">
								Worked time:
								{Math.round((previewWorkedMinutes / 60) * 100) / 100} hours
								({previewWorkedMinutes} minutes)
								{#if previewLunchDeductionMinutes > 0}
									after a {previewLunchDeductionMinutes}-minute lunch break deduction.
								{:else if formUsesSplitPunches}
									from morning and afternoon sessions.
								{:else}
									, after any lunch break deduction.
								{/if}
							</p>
						{:else if data.selectedRecord && data.selectedRecord.workedMinutes > 0}
							<p class="text-muted-foreground text-sm">
								Worked time:
								{Math.round((data.selectedRecord.workedMinutes / 60) * 100) / 100} hours
								({data.selectedRecord.workedMinutes} minutes), after any lunch break deduction.
							</p>
						{/if}

						{#if selectedUndertimeMinutes > 0 && selectedCalendarDay}
							<StatusAlert
								variant="warning"
								title="Undertime"
								description={`Worked time is ${formatUndertimeMinutes(selectedUndertimeMinutes)} below the expected ${formatUndertimeMinutes(selectedCalendarDay.expectedWorkMinutes)} for this day.`}
							/>
						{/if}

						<Form.Field form={superform} name="notes">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Notes <span class="text-muted-foreground">(optional)</span></Form.Label>
									<Input {...props} bind:value={$form.notes} />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>

						<div class="flex flex-wrap gap-3">
							<Button type="submit" class="h-10" disabled={submitting}>
								{#if submitting}
									<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
									Saving record...
								{:else}
									Save time record
								{/if}
							</Button>
							<Button
								type="button"
								variant="outline"
								class="h-10"
								disabled={submitting}
								onclick={clearSelectedDate}
							>
								Cancel
							</Button>
						</div>
					</form>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
