<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import DtrDayCell from '$lib/components/dtr/dtr-day-cell.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { DTR_DAY_STATUS_LABELS, DTR_DAY_STATUSES } from '$lib/shared/dtr/status';
	import {
		DTR_DAY_SAVED_MESSAGE,
		DTR_DAY_SAVE_FAILED_MESSAGE
	} from '$lib/shared/dtr/messages';
	import { upsertDtrDaySchema } from '$lib/shared/dtr/schemas';
	import type { PayrollEmployeeDto } from '$lib/shared/models/payroll-employee';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
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

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== DTR_DAY_SAVED_MESSAGE
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
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="DTR"
		title="Time records"
		description="Review daily time records by employee. Click a day to add or edit a record."
	/>

	{#if !data.settingsConfigured}
		<StatusAlert
			variant="info"
			title="Configure your work schedule"
			description="Set rest days under Work schedule so the calendar can mark rest days correctly."
		/>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Calendar</Card.Title>
			<Card.Description>Select an employee and month to review or update time records.</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-6">
			<div class="grid gap-5 sm:grid-cols-2">
				<div class="space-y-2">
					<label for="dtr-month" class="text-sm font-medium">Month</label>
					<Input
						id="dtr-month"
						type="month"
						value={data.month}
						class="h-10"
						onchange={(event) => {
							updateQuery({ month: (event.currentTarget as HTMLInputElement).value });
						}}
					/>
				</div>

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
						<Select.Trigger id="dtr-employee" class="h-10 w-full">
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
			</div>

			{#if data.employees.length === 0}
				<StatusAlert
					variant="info"
					title="No employees yet"
					description="Add payroll employees first, then return here to manage time records."
				/>
			{:else}
				<div class="grid grid-cols-7 gap-2">
					{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as weekday (weekday)}
						<div class="text-muted-foreground px-1 text-center text-xs font-medium">{weekday}</div>
					{/each}

					{#each Array.from({ length: new Date(`${data.month}-01T12:00:00`).getDay() }) as _, index (index)}
						<div></div>
					{/each}

					{#each data.calendar as day (day.date)}
						<DtrDayCell
							status={day.status}
							dayOfMonth={day.dayOfMonth}
							selected={data.selectedDate === day.date}
							interactive={true}
							onclick={() => updateQuery({ date: day.date })}
						/>
					{/each}
				</div>

				<div class="text-muted-foreground flex flex-wrap gap-4 text-xs">
					{#each DTR_DAY_STATUSES as status (status)}
						<span>{DTR_DAY_STATUS_LABELS[status]}</span>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if data.selectedDate && data.employeeId}
		<Card.Root>
			<Card.Header>
				<Card.Title>Edit time record</Card.Title>
				<Card.Description>
					{selectedEmployee?.fullName} · {data.selectedDate}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				{#if showSuccess}
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
							: String($formMessage)}
						class="mb-6"
					/>
				{/if}

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

					<Form.Field form={superform} name="notes">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Notes <span class="text-muted-foreground">(optional)</span></Form.Label>
								<Input {...props} bind:value={$form.notes} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Button type="submit" class="h-10" disabled={submitting}>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Saving record...
						{:else}
							Save time record
						{/if}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
