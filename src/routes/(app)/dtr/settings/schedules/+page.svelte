<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { DTR_WEEK_DAY_LABELS } from '$lib/shared/dtr/weekdays';
	import {
		DTR_WORK_SCHEDULES_SAVED_MESSAGE,
		DTR_WORK_SCHEDULES_SAVE_FAILED_MESSAGE
	} from '$lib/shared/dtr/messages';
	import { dtrWorkSchedulesSchema } from '$lib/shared/dtr/schemas';
	import {
		createBlankWorkScheduleInput,
		formatLunchBreakWindow,
		listWorkScheduleWorkDaySummaries,
		toWorkScheduleDto
	} from '$lib/shared/dtr/work-schedule';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);
	let activeScheduleIndex = $state<number | null>(null);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(dtrWorkSchedulesSchema),
		dataType: 'json',
		resetForm: false,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === DTR_WORK_SCHEDULES_SAVED_MESSAGE) {
				showSuccess = true;
				activeScheduleIndex = null;
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, errors, message: formMessage } = superform;

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== DTR_WORK_SCHEDULES_SAVED_MESSAGE
	);

	const hasValidationErrors = $derived(
		typeof $formMessage === 'string' && $formMessage.includes('Check each schedule name')
	);

	function scheduleDto(scheduleIndex: number) {
		const schedule = $form.schedules[scheduleIndex];
		return toWorkScheduleDto({
			id: schedule.id,
			workspaceId: '',
			name: schedule.name,
			days: schedule.days,
			lunchBreakStart: schedule.lunchBreakStart,
			lunchBreakEnd: schedule.lunchBreakEnd,
			createdAt: '',
			updatedAt: ''
		});
	}

	function addSchedule() {
		const nextIndex = $form.schedules.length + 1;
		$form.schedules = [
			...$form.schedules,
			{
				...createBlankWorkScheduleInput(),
				name: `Schedule ${nextIndex}`
			}
		];
		activeScheduleIndex = $form.schedules.length - 1;
	}

	function removeSchedule(index: number) {
		$form.schedules = $form.schedules.filter((_, currentIndex) => currentIndex !== index);

		if (activeScheduleIndex === index) {
			activeScheduleIndex = null;
		} else if (activeScheduleIndex !== null && activeScheduleIndex > index) {
			activeScheduleIndex -= 1;
		}
	}

	function editSchedule(index: number) {
		activeScheduleIndex = index;
	}

	function toggleRestDay(scheduleIndex: number, dayIndex: number) {
		const day = $form.schedules[scheduleIndex].days[dayIndex];
		const nextKind = day.kind === 'rest' ? 'work' : 'rest';

		$form.schedules[scheduleIndex].days[dayIndex] = {
			...day,
			kind: nextKind,
			startTime: nextKind === 'work' ? day.startTime || '09:00' : '',
			endTime: nextKind === 'work' ? day.endTime || '17:00' : ''
		};
	}

	function clearLunchBreak(scheduleIndex: number) {
		$form.schedules[scheduleIndex].lunchBreakStart = '';
		$form.schedules[scheduleIndex].lunchBreakEnd = '';
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="DTR"
		title="Named work schedules"
		description="Create reusable schedules with per-day start and end times. Assign them to employees for time records and payroll."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Schedule templates</Card.Title>
			<Card.Description>
				Example: Saturday 8:00am–12:00pm with lunch 12:00pm–1:00pm on longer shifts. Assign named schedules
				to employees under Payroll → Employees, or use the
				<a href="/dtr/settings" class="text-primary font-medium hover:underline">workspace default</a>.
			</Card.Description>
			<Card.Action>
				<Button type="button" variant="outline" class="h-10" onclick={addSchedule}>
					<PlusIcon class="size-4" aria-hidden="true" />
					Add schedule
				</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Named work schedules saved"
					description="These schedules are now available when adding payroll employees."
					class="mb-6"
				/>
			{:else if formError}
				<StatusAlert
					variant="danger"
					title="Could not save named work schedules"
					description={$formMessage === DTR_WORK_SCHEDULES_SAVE_FAILED_MESSAGE
						? DTR_WORK_SCHEDULES_SAVE_FAILED_MESSAGE
						: String($formMessage)}
					class="mb-6"
				/>
			{:else if hasValidationErrors}
				<StatusAlert
					variant="danger"
					title="Could not save named work schedules"
					description="Check each schedule name, work day times, and lunch break fields, then try again."
					class="mb-6"
				/>
			{/if}

			<form method="POST" use:enhance class="space-y-6">
				{#if $form.schedules.length === 0}
					<StatusAlert
						variant="info"
						title="No named schedules yet"
						description="Add a schedule template to define custom work days, hours, and lunch breaks per employee."
					/>
				{:else}
					<div class="overflow-x-auto rounded-lg border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head class="min-w-40">Name</Table.Head>
									<Table.Head class="min-w-56">Work days</Table.Head>
									<Table.Head class="min-w-32">Lunch break</Table.Head>
									<Table.Head class="w-28 text-right">Actions</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each $form.schedules as schedule, scheduleIndex (schedule.id)}
									<Table.Row
										data-state={activeScheduleIndex === scheduleIndex ? 'selected' : undefined}
									>
										<Table.Cell class="align-top font-medium">
											{schedule.name.trim() || `Schedule ${scheduleIndex + 1}`}
										</Table.Cell>
										<Table.Cell
											class="text-muted-foreground max-w-md align-top whitespace-normal text-sm"
										>
											{@const workDayLines = listWorkScheduleWorkDaySummaries(
												scheduleDto(scheduleIndex)
											)}
											{#if workDayLines.length === 0}
												No work days
											{:else}
												<ul class="list-disc space-y-1 ps-4">
													{#each workDayLines as line (line)}
														<li>{line}</li>
													{/each}
												</ul>
											{/if}
										</Table.Cell>
										<Table.Cell class="text-muted-foreground align-top text-sm">
											{formatLunchBreakWindow(scheduleDto(scheduleIndex).lunchBreak)}
										</Table.Cell>
										<Table.Cell class="align-top text-right">
											<div class="flex justify-end gap-1">
												<Button
													type="button"
													variant="ghost"
													size="icon"
													class="size-8"
													onclick={() => editSchedule(scheduleIndex)}
													aria-label="Edit schedule"
												>
													<PencilIcon class="size-4" />
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													class="size-8"
													onclick={() => removeSchedule(scheduleIndex)}
													aria-label="Remove schedule"
												>
													<Trash2Icon class="size-4" />
												</Button>
											</div>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/if}

				{#if activeScheduleIndex !== null && $form.schedules[activeScheduleIndex]}
					{@const scheduleIndex = activeScheduleIndex}
					<div class="border-input space-y-6 rounded-lg border p-4">
						<div class="flex items-center justify-between gap-3">
							<p class="text-sm font-medium">Edit schedule</p>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="h-8"
								onclick={() => (activeScheduleIndex = null)}
							>
								Close
							</Button>
						</div>

						<div class="space-y-2">
							<label class="text-sm font-medium" for="schedule-name-{scheduleIndex}">
								Schedule name
							</label>
							<Input
								id="schedule-name-{scheduleIndex}"
								required
								bind:value={$form.schedules[scheduleIndex].name}
							/>
							{#if $errors.schedules?.[scheduleIndex]?.name}
								<p class="text-destructive text-sm">
									{$errors.schedules[scheduleIndex].name}
								</p>
							{/if}
						</div>

						<div class="overflow-x-auto rounded-lg border">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head class="min-w-32">Day</Table.Head>
										<Table.Head class="w-24 text-center">Rest day</Table.Head>
										<Table.Head class="min-w-36">Start</Table.Head>
										<Table.Head class="min-w-36">End</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each $form.schedules[scheduleIndex].days as day, dayIndex (day.day)}
										<Table.Row>
											<Table.Cell class="font-medium">
												{DTR_WEEK_DAY_LABELS[day.day]}
											</Table.Cell>
											<Table.Cell class="text-center">
												<input
													type="checkbox"
													checked={day.kind === 'rest'}
													onchange={() => toggleRestDay(scheduleIndex, dayIndex)}
													aria-label="{DTR_WEEK_DAY_LABELS[day.day]} rest day"
												/>
											</Table.Cell>
											<Table.Cell>
												{#if day.kind === 'work'}
													<Input
														type="time"
														class="h-10"
														bind:value={
															$form.schedules[scheduleIndex].days[dayIndex].startTime
														}
													/>
												{:else}
													<span class="text-muted-foreground text-sm">—</span>
												{/if}
											</Table.Cell>
											<Table.Cell>
												{#if day.kind === 'work'}
													<Input
														type="time"
														class="h-10"
														bind:value={
															$form.schedules[scheduleIndex].days[dayIndex].endTime
														}
													/>
												{:else}
													<span class="text-muted-foreground text-sm">—</span>
												{/if}
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>

						<div class="space-y-4">
							<div>
								<p class="text-sm font-medium">Lunch break</p>
								<p class="text-muted-foreground text-sm">
									Deducted from worked hours when time in and time out overlap this window (e.g.
									12:00pm–1:00pm).
								</p>
							</div>
							<div class="grid gap-4 sm:grid-cols-2">
								<div class="space-y-2">
									<label
										class="text-sm font-medium"
										for="schedule-lunch-start-{scheduleIndex}"
									>
										Start time
									</label>
									<Input
										id="schedule-lunch-start-{scheduleIndex}"
										type="time"
										class="h-10"
										bind:value={$form.schedules[scheduleIndex].lunchBreakStart}
									/>
								</div>
								<div class="space-y-2">
									<label class="text-sm font-medium" for="schedule-lunch-end-{scheduleIndex}">
										End time
									</label>
									<Input
										id="schedule-lunch-end-{scheduleIndex}"
										type="time"
										class="h-10"
										bind:value={$form.schedules[scheduleIndex].lunchBreakEnd}
									/>
								</div>
							</div>
							<Button
								type="button"
								variant="outline"
								class="h-10"
								onclick={() => clearLunchBreak(scheduleIndex)}
							>
								Remove lunch break
							</Button>
						</div>
					</div>
				{/if}

				{#if $form.schedules.length > 0}
					<Button type="submit" class="h-10" disabled={submitting}>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Saving schedules...
						{:else}
							Save named schedules
						{/if}
					</Button>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>
</div>
