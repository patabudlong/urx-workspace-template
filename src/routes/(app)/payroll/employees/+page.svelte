<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { formatPayRateCents } from '$lib/shared/payroll/format';
	import {
		PAYROLL_EMPLOYEE_CREATED_MESSAGE,
		PAYROLL_EMPLOYEE_CREATE_FAILED_MESSAGE
	} from '$lib/shared/payroll/messages';
	import {
		createPayrollEmployeeSchema,
		PAYROLL_PAY_TYPES
	} from '$lib/shared/payroll/schemas';
	import type { PayrollEmployeeDto } from '$lib/shared/models/payroll-employee';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);
	let employees = $state<PayrollEmployeeDto[] | null>(null);

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

	$effect(() => {
		const next = data.employees as Promise<PayrollEmployeeDto[]> | PayrollEmployeeDto[];

		if (Array.isArray(next)) {
			employees = next;
			return;
		}

		if (!next || typeof next.then !== 'function') {
			employees = [];
			return;
		}

		employees = null;

		void next.then((resolved) => {
			employees = resolved;
		});
	});

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== PAYROLL_EMPLOYEE_CREATED_MESSAGE
	);
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Employees"
		description="People paid through this workspace. Add employees before creating pay runs."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Add employee</Card.Title>
			<Card.Description>Store compensation details for payroll processing.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Employee added"
					description="The employee is now available for pay runs."
					class="mb-6"
				/>
			{:else if formError}
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

				<div class="grid gap-5 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="payType">Pay type</Label>
						<select
							id="payType"
							name="payType"
							bind:value={$form.payType}
							class="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
						>
							{#each PAYROLL_PAY_TYPES as payType (payType)}
								<option value={payType}>{payType === 'hourly' ? 'Hourly' : 'Salary'}</option>
							{/each}
						</select>
						<SingleFieldErrors />
					</div>

					<Form.Field form={superform} name="payRate">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>
									Pay rate (USD)
									<span class="text-muted-foreground font-normal">
										{$form.payType === 'hourly' ? 'per hour' : 'per year'}
									</span>
								</Form.Label>
								<Input {...props} bind:value={$form.payRate} type="number" min="0" step="0.01" inputmode="decimal" />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>
				</div>

				<Button type="submit" class="h-10" disabled={submitting}>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Adding employee...
					{:else}
						<UserPlusIcon class="size-4" aria-hidden="true" />
						Add employee
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Active employees</Card.Title>
			<Card.Description>Compensation records for this workspace.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if employees === null}
				<div class="space-y-3" aria-busy="true" aria-label="Loading employees">
					{#each Array.from({ length: 4 }) as _, index (index)}
						<Skeleton class="h-14 w-full" />
					{/each}
				</div>
			{:else if employees.length === 0}
				<StatusAlert
					variant="info"
					title="No employees yet"
					description="Add your first employee above to start building payroll runs."
				/>
			{:else}
				<ul class="divide-border divide-y">
					{#each employees as employee (employee.id)}
						<li class="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
							<div class="min-w-0 space-y-1">
								<p class="truncate font-medium">{employee.fullName}</p>
								<p class="text-muted-foreground text-sm">
									{#if employee.jobTitle}
										{employee.jobTitle}
										{#if employee.email}
											<span aria-hidden="true"> · </span>
										{/if}
									{/if}
									{#if employee.email}
										{employee.email}
									{/if}
								</p>
							</div>
							<p class="text-sm font-medium">
								{formatPayRateCents(employee.payRateCents, employee.payType)}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
