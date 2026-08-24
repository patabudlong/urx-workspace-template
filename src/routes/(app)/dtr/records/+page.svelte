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
	import { DTR_DAY_STATUS_LABELS, DTR_DAY_STATUSES } from '$lib/shared/dtr/status';
	import {
		DTR_DAY_LOCKED_MESSAGE,
		DTR_DAY_SAVED_MESSAGE,
		DTR_DAY_SAVE_FAILED_MESSAGE
	} from '$lib/shared/dtr/messages';
	import { upsertDtrDaySchema } from '$lib/shared/dtr/schemas';
	import { formatHolidayPayPercent } from '$lib/shared/dtr/holidays';
	import type { PayrollEmployeeDto } from '$lib/shared/models/payroll-employee';
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
						Select an employee and month to review or update time records.
						{#if data.workScheduleName}
							Using named schedule:
							<span class="text-foreground font-medium">{data.workScheduleName}</span>.
						{/if}
					</Card.Description>
				</div>
			</div>
		</Card.Header>
		<Card.Content class="space-y-6 pt-6">
			<div class="grid gap-5 sm:grid-cols-2">
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
							class="h-10 bg-muted/30"
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
						{#if data.month === todayDate.slice(0, 7)}
							<Badge variant="secondary" class="font-normal">Current month</Badge>
						{/if}
					</div>

					<div class="grid grid-cols-7 gap-1.5 sm:gap-2">
						{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as weekday (weekday)}
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
								locked={day.isLocked}
								selected={data.selectedDate === day.date}
								isToday={day.date === todayDate}
								interactive={true}
								onclick={() => updateQuery({ date: day.date })}
							/>
						{/each}
					</div>
				</div>

				<DtrStatusLegend />
			{/if}
		</Card.Content>
	</Card.Root>

	{#if data.selectedDate && data.employeeId}
		<Card.Root>
			<Card.Header class="border-b">
				<div class="flex flex-wrap items-start justify-between gap-4">
					<div class="space-y-1">
						<Card.Title>Edit time record</Card.Title>
						<Card.Description>
							{selectedEmployee?.fullName} · {formatDisplayDate(data.selectedDate)}
						</Card.Description>
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

						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-1">
								<p class="text-muted-foreground text-sm font-medium">Time in</p>
								<p class="text-sm">{data.selectedRecord?.timeIn ?? '—'}</p>
							</div>
							<div class="space-y-1">
								<p class="text-muted-foreground text-sm font-medium">Time out</p>
								<p class="text-sm">{data.selectedRecord?.timeOut ?? '—'}</p>
							</div>
						</div>

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

						{#if data.selectedRecord?.holidayName}
							<StatusAlert
								variant="info"
								title={data.selectedRecord.holidayName}
								description={data.selectedRecord.holidayPayPercent !== null
									? `Holiday pay credit: ${formatHolidayPayPercent(data.selectedRecord.holidayPayPercent)} (${data.selectedRecord.holidayWorked ? 'worked' : 'unworked'}).`
									: 'This date is a configured holiday.'}
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

						<div class="grid gap-5 sm:grid-cols-2">
							<Form.Field form={superform} name="timeIn">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Time in</Form.Label>
										<Input {...props} bind:value={$form.timeIn} type="time" />
									{/snippet}
								</Form.Control>
								<SingleFieldErrors />
							</Form.Field>

							<Form.Field form={superform} name="timeOut">
								<Form.Control>
									{#snippet children({ props })}
										<Form.Label>Time out</Form.Label>
										<Input {...props} bind:value={$form.timeOut} type="time" />
									{/snippet}
								</Form.Control>
								<SingleFieldErrors />
							</Form.Field>
						</div>

						{#if data.selectedRecord && data.selectedRecord.workedMinutes > 0}
							<p class="text-muted-foreground text-sm">
								Worked time:
								{Math.round((data.selectedRecord.workedMinutes / 60) * 100) / 100} hours
								({data.selectedRecord.workedMinutes} minutes), after any lunch break deduction.
							</p>
						{/if}

						{#if data.selectedRecord?.holidayName}
							<StatusAlert
								variant="info"
								title={data.selectedRecord.holidayName}
								description={data.selectedRecord.holidayPayPercent !== null
									? `Holiday pay credit: ${formatHolidayPayPercent(data.selectedRecord.holidayPayPercent)} (${data.selectedRecord.holidayWorked ? 'worked' : 'unworked'}).`
									: 'This date is a configured holiday.'}
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
