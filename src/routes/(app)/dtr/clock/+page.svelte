<script lang="ts">
	import DtrBiometricPunchButton from '$lib/components/dtr/dtr-biometric-punch-button.svelte';
	import DtrClockCalendar from '$lib/components/dtr/dtr-clock-calendar.svelte';
	import DtrStatusLegend from '$lib/components/dtr/dtr-status-legend.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		DTR_DAY_HOLIDAY_CELL_CLASSES,
		DTR_DAY_UNDERTIME_LABEL_CLASSES
	} from '$lib/components/dtr/dtr-day-cell-styles';
	import { DTR_DAY_STATUS_LABELS } from '$lib/shared/dtr/status';
	import {
		DTR_EMPLOYEE_LINK_REQUIRED_MESSAGE,
		DTR_PUNCH_COMPLETE_MESSAGE,
		DTR_PUNCH_FAILED_MESSAGE,
		DTR_PUNCH_LOCKED_MESSAGE
	} from '$lib/shared/dtr/messages';
	import {
		DTR_PUNCH_SLOT_LABELS,
		formatDtrCalendarDate,
		formatDtrDisplayTime,
		formatDtrLiveClockDisplay,
		getTodayDtrDate,
		resolveDtrPunchState,
		summarizeDtrDayTimes,
		type DtrPunchSlot
	} from '$lib/shared/dtr/punch';
	import { formatUndertimeMinutes } from '$lib/shared/dtr/undertime';
	import { cn } from '$lib/utils.js';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
	import LockIcon from '@lucide/svelte/icons/lock';

	let { data } = $props();

	let punching = $state(false);
	let punchError = $state<string | null>(null);
	let punchSuccess = $state(false);
	let liveTime = $state(formatDtrLiveClockDisplay());

	const isAdmin = $derived(page.data.canManageDtr);
	const today = $derived(getTodayDtrDate());
	const isViewingToday = $derived(data.selectedDate === today);

	const punchState = $derived(
		isViewingToday ? data.punchState : resolveDtrPunchState(data.selectedRecord)
	);

	const selectedCalendarDay = $derived(
		data.calendar.find((day) => day.date === data.selectedDate) ?? null
	);

	const selectedTimes = $derived(summarizeDtrDayTimes(data.selectedRecord));

	const punchLabel = $derived.by(() => {
		if (!punchState.nextSlot) {
			return 'Day complete';
		}

		return DTR_PUNCH_SLOT_LABELS[punchState.nextSlot];
	});

	const monthLabel = $derived.by(() => {
		const [year, month] = data.month.split('-').map(Number);
		return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(
			new Date(year, month - 1, 1)
		);
	});

	onMount(() => {
		const interval = window.setInterval(() => {
			liveTime = formatDtrLiveClockDisplay();
		}, 1000);

		return () => window.clearInterval(interval);
	});

	function updateQuery(next: { month?: string; date?: string }) {
		const params = new URLSearchParams();
		params.set('month', next.month ?? data.month);
		params.set('date', next.date ?? data.selectedDate);
		void goto(`?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	async function handlePunch() {
		if (!data.employee || punching || data.isTodayLocked || !punchState.nextSlot) {
			return;
		}

		punching = true;
		punchError = null;
		punchSuccess = false;

		try {
			const response = await fetch('/api/v1/dtr/punch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ date: today })
			});

			const payload = (await response.json()) as {
				error?: { message?: string };
			};

			if (!response.ok) {
				punchError = payload.error?.message ?? DTR_PUNCH_FAILED_MESSAGE;
				return;
			}

			punchSuccess = true;
			await invalidateAll();
		} catch {
			punchError = DTR_PUNCH_FAILED_MESSAGE;
		} finally {
			punching = false;
		}
	}

	function punchSlotValue(slot: DtrPunchSlot): string | null {
		if (isViewingToday) {
			return data.todayRecord
				? (summarizeDtrDayTimes(data.todayRecord)[slot] ?? punchState.punches[slot] ?? null)
				: (punchState.punches[slot] ?? null);
		}

		return selectedTimes[slot];
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="DTR"
		title={isAdmin ? 'Clock in/out' : 'My time'}
		description={isAdmin
			? 'Emulate a biometric scanner to record your own login and logout times. Select a day on the calendar to review punches.'
			: 'Tap the scanner to clock in or out. Your monthly login and logout times appear on the calendar below.'}
	/>

	{#if data.needsEmployeeLink}
		<StatusAlert
			variant="warning"
			title="Employee record not linked"
			description={DTR_EMPLOYEE_LINK_REQUIRED_MESSAGE}
		/>
	{:else}
		{#if punchError}
			<StatusAlert variant="danger" title="Could not record time" description={punchError} />
		{:else if punchSuccess}
			<StatusAlert
				variant="success"
				title="Time recorded"
				description="Your punch was saved with biometric source."
			/>
		{:else if data.isTodayLocked}
			<StatusAlert
				variant="warning"
				title="Today is locked"
				description={DTR_PUNCH_LOCKED_MESSAGE}
			/>
		{:else if punchState.isComplete && isViewingToday}
			<StatusAlert
				variant="info"
				title="All punches recorded"
				description={DTR_PUNCH_COMPLETE_MESSAGE}
			/>
		{/if}

		<div class="grid gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
			<Card.Root class="overflow-hidden">
				<Card.Header class="border-b">
					<Card.Title class="flex items-center gap-2 text-base">
						<CalendarDaysIcon class="size-4" aria-hidden="true" />
						Biometric scanner
					</Card.Title>
					<Card.Description>
						{data.employee?.fullName ?? 'Employee'}
						{#if data.employee?.jobTitle}
							· {data.employee.jobTitle}
						{/if}
					</Card.Description>
				</Card.Header>
				<Card.Content class="flex flex-col gap-6 py-8">
					<DtrBiometricPunchButton
						label={punchLabel}
						employeeId={data.employee?.employeeCode}
						action={punchState.nextAction ?? 'in'}
						disabled={!isViewingToday || data.isTodayLocked}
						loading={punching}
						complete={punchState.isComplete}
						currentTime={liveTime}
						onpunch={handlePunch}
					/>

					<Separator />

					<div class="space-y-3">
						<p class="text-sm font-medium">Today&apos;s punches</p>
						<ul class="space-y-2">
							{#each Object.entries(DTR_PUNCH_SLOT_LABELS) as [slot, label] (slot)}
								{@const value = punchSlotValue(slot as DtrPunchSlot)}
								<li class="flex items-center justify-between gap-3 text-sm">
									<span class="text-muted-foreground">{label}</span>
									<span class={cn('font-medium tabular-nums', value ? 'text-foreground' : 'text-muted-foreground/60')}>
										{value ? formatDtrDisplayTime(value) : 'Pending'}
									</span>
								</li>
							{/each}
						</ul>
					</div>
				</Card.Content>
			</Card.Root>

			<div class="flex min-w-0 flex-col gap-6">
				<Card.Root>
					<Card.Header>
						<Card.Title>{monthLabel}</Card.Title>
						<Card.Description>
							Login and logout times by day. Tap a date to inspect punches.
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						<DtrClockCalendar
							month={data.month}
							selectedDate={data.selectedDate}
							days={data.calendar}
							recordsByDate={data.recordsByDate}
							onMonthChange={(month) => updateQuery({ month, date: data.selectedDate })}
							onDateSelect={(date) => updateQuery({ date })}
						/>
						<DtrStatusLegend />
					</Card.Content>
				</Card.Root>

				{#if data.selectedDate}
					<Card.Root>
						<Card.Header>
							<Card.Title>{formatDtrCalendarDate(data.selectedDate)}</Card.Title>
							<Card.Description>
								{#if selectedCalendarDay}
									{DTR_DAY_STATUS_LABELS[selectedCalendarDay.status]}
									{#if selectedCalendarDay.holidayName}
										· {selectedCalendarDay.holidayName}
									{/if}
								{:else}
									Day details
								{/if}
							</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							{#if selectedCalendarDay?.isLocked}
								<div class="text-muted-foreground flex items-center gap-2 text-sm">
									<LockIcon class="size-4 shrink-0" aria-hidden="true" />
									Locked for payroll
								</div>
							{/if}

							<div class="grid gap-3 sm:grid-cols-2">
								{#each Object.entries(DTR_PUNCH_SLOT_LABELS) as [slot, label] (slot)}
									{@const value = selectedTimes[slot as DtrPunchSlot]}
									<div class="bg-muted/30 rounded-lg border px-4 py-3">
										<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
											{label}
										</p>
										<p class="mt-1 text-lg font-semibold tabular-nums">
											{value ? formatDtrDisplayTime(value) : '—'}
										</p>
									</div>
								{/each}
							</div>

							{#if selectedCalendarDay && selectedCalendarDay.undertimeMinutes > 0}
								<p class={cn('text-sm', DTR_DAY_UNDERTIME_LABEL_CLASSES)}>
									{formatUndertimeMinutes(selectedCalendarDay.undertimeMinutes)} undertime
								</p>
							{/if}

							{#if selectedCalendarDay?.holidayName}
								<p class={cn('rounded-lg px-3 py-2 text-sm', DTR_DAY_HOLIDAY_CELL_CLASSES)}>
									{selectedCalendarDay.holidayName}
								</p>
							{/if}
						</Card.Content>
					</Card.Root>
				{/if}
			</div>
		</div>
	{/if}
</div>
