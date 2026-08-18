<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { getPayrollCurrencyLabel } from '$lib/shared/payroll/currency';
	import {
		PAYROLL_EMPLOYEE_CREATED_MESSAGE,
		PAYROLL_EMPLOYEE_CREATE_FAILED_MESSAGE
	} from '$lib/shared/payroll/messages';
	import {
		PAYROLL_PAY_TYPE_LABELS,
		PAYROLL_PAY_TYPES
	} from '$lib/shared/payroll/pay-rate';
	import { createPayrollEmployeeSchema } from '$lib/shared/payroll/schemas';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(createPayrollEmployeeSchema),
		resetForm: true,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === PAYROLL_EMPLOYEE_CREATED_MESSAGE) {
				showSuccess = true;
				await invalidateAll();
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	const currencyLabel = $derived(getPayrollCurrencyLabel(data.payrollCurrency));
	const payRateStep = $derived(data.payrollCurrency === 'JPY' ? '1' : '0.01');

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== PAYROLL_EMPLOYEE_CREATED_MESSAGE
	);

	function addAnother() {
		showSuccess = false;
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Add employee"
		description="Store compensation details for payroll processing."
	>
		{#snippet actions()}
			<Button href="/payroll/employees" variant="outline" class="h-10">
				<ArrowLeftIcon class="size-4" aria-hidden="true" />
				Back to employees
			</Button>
		{/snippet}
	</PageHeader>

	<Card.Root class="max-w-3xl">
		<Card.Header>
			<Card.Title>Employee details</Card.Title>
			<Card.Description>
				Assign pay rates, deductions, and an optional work schedule from DTR.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Employee added"
					description="The employee is now available for pay runs."
					class="mb-6"
				/>
				<div class="flex flex-wrap gap-2">
					<Button type="button" variant="outline" class="h-10" onclick={addAnother}>
						<UserPlusIcon class="size-4" aria-hidden="true" />
						Add another
					</Button>
					<Button href="/payroll/employees" class="h-10">View employees</Button>
				</div>
			{:else}
				{#if formError}
					<StatusAlert
						variant="danger"
						title="Could not add employee"
						description={$formMessage === PAYROLL_EMPLOYEE_CREATE_FAILED_MESSAGE
							? PAYROLL_EMPLOYEE_CREATE_FAILED_MESSAGE
							: String($formMessage)}
						class="mb-6"
					/>
				{/if}

				<form method="POST" use:enhance class="space-y-5">
					<div class="grid gap-5 sm:grid-cols-2">
						<Form.Field form={superform} name="firstName">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>First name</Form.Label>
									<Input {...props} bind:value={$form.firstName} autocomplete="given-name" />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>

						<Form.Field form={superform} name="lastName">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>Last name</Form.Label>
									<Input {...props} bind:value={$form.lastName} autocomplete="family-name" />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>
					</div>

					<div class="grid gap-5 sm:grid-cols-2">
						<Form.Field form={superform} name="email">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Email <span class="text-muted-foreground">(optional)</span></Form.Label>
									<Input {...props} bind:value={$form.email} type="email" autocomplete="email" />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>

						<Form.Field form={superform} name="jobTitle">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Job title <span class="text-muted-foreground">(optional)</span></Form.Label>
									<Input {...props} bind:value={$form.jobTitle} autocomplete="organization-title" />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>
					</div>

					<Form.Field form={superform} name="employeeCode">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>
									Employee code
									<span class="text-muted-foreground">(optional, for biometrics)</span>
								</Form.Label>
								<Input {...props} bind:value={$form.employeeCode} autocomplete="off" />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Form.Field form={superform} name="workScheduleId">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>
									Work schedule
									<span class="text-muted-foreground">(optional)</span>
								</Form.Label>
								<Select.Root type="single" bind:value={$form.workScheduleId}>
									<Select.Trigger class="h-10 w-full">
										<span class="truncate">
											{#if $form.workScheduleId}
												{data.workSchedules.find((schedule) => schedule.id === $form.workScheduleId)
													?.name ?? 'Select work schedule'}
											{:else}
												Workspace default
											{/if}
										</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											<Select.Item value="" label="Workspace default">
												Workspace default
											</Select.Item>
											{#each data.workSchedules as schedule (schedule.id)}
												<Select.Item value={schedule.id} label={schedule.name}>
													{schedule.name}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
								<p class="text-muted-foreground text-xs">
									Assign a named schedule from DTR → Named work schedules, or leave as workspace
									default.
								</p>
								<input type="hidden" name={props.name} value={$form.workScheduleId} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<div class="grid gap-5 sm:grid-cols-2">
						<Form.Field form={superform} name="payType">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Pay rate type</Form.Label>
									<Select.Root type="single" bind:value={$form.payType}>
										<Select.Trigger class="h-10 w-full">
											<span class="truncate">
												{PAYROLL_PAY_TYPE_LABELS[$form.payType] ?? 'Select pay rate type'}
											</span>
										</Select.Trigger>
										<Select.Content>
											<Select.Group>
												{#each PAYROLL_PAY_TYPES as payType (payType)}
													<Select.Item value={payType} label={PAYROLL_PAY_TYPE_LABELS[payType]}>
														{PAYROLL_PAY_TYPE_LABELS[payType]}
													</Select.Item>
												{/each}
											</Select.Group>
										</Select.Content>
									</Select.Root>
									<input type="hidden" name={props.name} value={$form.payType} />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>

						<Form.Field form={superform} name="payRate">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>
										Pay rate ({currencyLabel})
										<span class="text-muted-foreground font-normal">
											{$form.payType === 'hourly' ? 'per hour' : 'per month'}
										</span>
									</Form.Label>
									<Input
										{...props}
										bind:value={$form.payRate}
										type="number"
										min="0"
										step={payRateStep}
										inputmode="decimal"
									/>
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>
					</div>

					{#if data.deductionTypes.length > 0}
						<div class="space-y-4">
							<div>
								<p class="text-sm font-medium">Deductions</p>
								<p class="text-muted-foreground text-sm">
									Enable workspace deduction types and set amounts for this employee.
								</p>
							</div>

							<div class="space-y-3">
								{#each $form.deductions as deduction, index (deduction.typeId)}
									{@const deductionType = data.deductionTypes.find(
										(type) => type.id === deduction.typeId
									)}
									{#if deductionType}
										<div class="border-input rounded-lg border p-4">
											<input
												type="hidden"
												name="deductions[{index}].typeId"
												value={deduction.typeId}
											/>
											<div class="flex flex-col gap-4 sm:flex-row sm:items-end">
												<label class="flex flex-1 items-center gap-3 text-sm">
													<input
														type="checkbox"
														name="deductions[{index}].enabled"
														bind:checked={$form.deductions[index].enabled}
													/>
													<span class="font-medium">{deductionType.name}</span>
													<span class="text-muted-foreground">
														({deductionType.kind === 'fixed' ? 'fixed' : 'percentage'})
													</span>
												</label>

												{#if deductionType.kind === 'fixed'}
													<div class="sm:w-48">
														<Input
															name="deductions[{index}].amount"
															type="number"
															min="0"
															step={payRateStep}
															bind:value={$form.deductions[index].amount}
															disabled={!$form.deductions[index].enabled}
															aria-label="{deductionType.name} amount"
														/>
													</div>
												{:else}
													<div class="sm:w-48">
														<Input
															name="deductions[{index}].ratePercent"
															type="number"
															min="0"
															max="100"
															step="0.01"
															bind:value={$form.deductions[index].ratePercent}
															disabled={!$form.deductions[index].enabled}
															aria-label="{deductionType.name} rate percent"
														/>
													</div>
												{/if}
											</div>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{:else}
						<StatusAlert
							variant="info"
							title="No deduction types configured"
							description="Add deduction types under Payroll → Deductions before assigning them to employees."
						/>
					{/if}

					<div class="flex flex-wrap gap-2 pt-1">
						<Button type="submit" class="h-10" disabled={submitting}>
							{#if submitting}
								<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
								Adding employee...
							{:else}
								<UserPlusIcon class="size-4" aria-hidden="true" />
								Add employee
							{/if}
						</Button>
						<Button href="/payroll/employees" variant="outline" class="h-10">Cancel</Button>
					</div>
				</form>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
