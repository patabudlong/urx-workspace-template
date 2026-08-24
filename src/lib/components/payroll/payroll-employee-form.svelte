<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PayrollDeductionTypeIcon from '$lib/components/payroll/payroll-deduction-type-icon.svelte';
	import PayrollEmployeePhotoUpload from '$lib/components/payroll/payroll-employee-photo-upload.svelte';
	import PayrollMoneyInput from '$lib/components/payroll/payroll-money-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import type { PayrollCurrency } from '$lib/shared/payroll/currency';
	import { getPayrollCurrencyLabel } from '$lib/shared/payroll/currency';
	import type { PayrollDeductionType } from '$lib/shared/payroll/deductions';
	import {
		PAYROLL_PAY_TYPE_LABELS,
		PAYROLL_PAY_TYPES
	} from '$lib/shared/payroll/pay-rate';
	import {
		createPayrollEmployeeSchema,
		type CreatePayrollEmployeeInput
	} from '$lib/shared/payroll/schemas';
	import type { PhDeductionIconKey } from '$lib/shared/payroll/deduction-icon-names';
	import type { PayrollJobTitleOption } from '$lib/shared/payroll/job-titles';
	import { dollarsToCents, formatPayRateCents } from '$lib/shared/payroll/format';
	import type { Snippet } from 'svelte';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	const CUSTOM_JOB_TITLE_VALUE = '__custom__';

	type WorkScheduleOption = {
		id: string;
		name: string;
	};

	let {
		initialForm,
		deductionTypes,
		workSchedules,
		jobTitles = [],
		payrollCurrency,
		phDeductionIconUrls = {},
		currentPhotoUrl = null,
		formAction,
		resetForm = false,
		successMessage,
		onSuccess,
		actions
	}: {
		initialForm: SuperValidated<CreatePayrollEmployeeInput>;
		deductionTypes: PayrollDeductionType[];
		workSchedules: WorkScheduleOption[];
		jobTitles?: PayrollJobTitleOption[];
		payrollCurrency: PayrollCurrency;
		phDeductionIconUrls?: Partial<Record<PhDeductionIconKey, string>>;
		currentPhotoUrl?: string | null;
		formAction?: string;
		resetForm?: boolean;
		successMessage: string;
		onSuccess?: () => void | Promise<void>;
		actions: Snippet<[{ submitting: boolean }]>;
	} = $props();

	let submitting = $state(false);
	let photoFile = $state<File | null>(null);
	let photoPreview = $state<string | null>(null);
	let removePhoto = $state(false);
	let photoError = $state<string | null>(null);
	let selectedJobTitleId = $state(CUSTOM_JOB_TITLE_VALUE);

	const useJobTitleCatalog = $derived(jobTitles.length > 0);

	const displayPhotoUrl = $derived(
		removePhoto ? null : (photoPreview ?? currentPhotoUrl)
	);

	const superform = superForm(untrack(() => initialForm), {
		validators: zod4Client(createPayrollEmployeeSchema),
		dataType: 'json',
		resetForm: untrack(() => resetForm),
		validationMethod: 'onsubmit',
		onSubmit: ({ formData, validators }) => {
			validators(false);
			submitting = true;
			photoError = null;

			if (photoFile) {
				formData.set('photo', photoFile);
			}

			if (removePhoto) {
				formData.set('removePhoto', 'true');

				if (!photoFile) {
					formData.set(
						'photo',
						new File([], 'remove', { type: 'application/octet-stream' })
					);
				}
			}
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === successMessage) {
				if (photoPreview) {
					URL.revokeObjectURL(photoPreview);
				}

				photoFile = null;
				photoPreview = null;
				removePhoto = false;
				await onSuccess?.();
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage, posted } = superform;

	const selectedCatalogTitle = $derived(
		selectedJobTitleId === CUSTOM_JOB_TITLE_VALUE
			? null
			: (jobTitles.find((title) => title.id === selectedJobTitleId) ?? null)
	);

	const payDiffersFromCatalog = $derived(
		selectedCatalogTitle !== null &&
			(selectedCatalogTitle.payType !== $form.payType ||
				selectedCatalogTitle.payRate !== $form.payRate)
	);

	const showPayFields = $derived(
		!useJobTitleCatalog ||
			selectedJobTitleId === CUSTOM_JOB_TITLE_VALUE ||
			payDiffersFromCatalog
	);

	const catalogPaySummary = $derived(
		formatPayRateCents(
			dollarsToCents($form.payRate, payrollCurrency),
			$form.payType,
			payrollCurrency
		)
	);

	const currencyLabel = $derived(getPayrollCurrencyLabel(payrollCurrency));

	const showPhDeductionIcons = $derived(
		payrollCurrency === 'PHP' && Object.keys(phDeductionIconUrls).length > 0
	);

	const formError = $derived(
		$posted &&
			typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== successMessage
	);

	function setPhoto(file: File | null) {
		photoError = null;
		removePhoto = false;

		if (photoPreview) {
			URL.revokeObjectURL(photoPreview);
		}

		if (!file) {
			photoFile = null;
			photoPreview = null;
			return;
		}

		photoFile = file;
		photoPreview = URL.createObjectURL(file);
	}

	function clearPhoto() {
		photoError = null;

		if (photoPreview) {
			URL.revokeObjectURL(photoPreview);
		}

		photoFile = null;
		photoPreview = null;
		removePhoto = true;
	}

	function handlePhotoError(message: string) {
		photoError = message;
	}

	function applyJobTitleSelection(value: string) {
		selectedJobTitleId = value;

		if (value === CUSTOM_JOB_TITLE_VALUE) {
			return;
		}

		const title = jobTitles.find((item) => item.id === value);

		if (!title) {
			return;
		}

		$form.jobTitle = title.name;
		$form.payType = title.payType;
		$form.payRate = title.payRate;
	}

	$effect(() => {
		if (!useJobTitleCatalog) {
			return;
		}

		const match = jobTitles.find(
			(title) =>
				title.name.trim().toLowerCase() === ($form.jobTitle ?? '').trim().toLowerCase()
		);

		if (!match) {
			selectedJobTitleId = CUSTOM_JOB_TITLE_VALUE;
			return;
		}

		if (match.payType !== $form.payType || match.payRate !== $form.payRate) {
			selectedJobTitleId = CUSTOM_JOB_TITLE_VALUE;
			return;
		}

		selectedJobTitleId = match.id;
	});
</script>

{#if formError}
	<StatusAlert
		variant="danger"
		title="Could not save employee"
		description={String($formMessage)}
		class="mb-6"
	/>
{/if}

{#if photoError}
	<StatusAlert
		variant="danger"
		title="Invalid photo"
		description={photoError}
		class="mb-6"
	/>
{/if}

<form method="POST" action={formAction} enctype="multipart/form-data" use:enhance class="space-y-5">
	<div class="grid gap-2">
		<label class="text-sm font-medium" for="payroll-employee-photo">
			Employee photo <span class="text-muted-foreground">(optional)</span>
		</label>
		<PayrollEmployeePhotoUpload
			previewUrl={displayPhotoUrl}
			fileName={photoFile?.name ?? null}
			onchange={setPhoto}
			onclear={clearPhoto}
			onerror={handlePhotoError}
		/>
		<p class="text-muted-foreground text-xs">
			PNG, JPG, or WebP · up to 2 MB. Helps identify employees in payroll lists.
		</p>
	</div>

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

		{#if useJobTitleCatalog}
			<div class="space-y-2">
				<label class="text-sm font-medium" for="payroll-employee-job-title-select">
					Job title <span class="text-muted-foreground">(optional)</span>
				</label>
				<Select.Root
					type="single"
					value={selectedJobTitleId}
					onValueChange={(value) => {
						if (value) {
							applyJobTitleSelection(value);
						}
					}}
				>
					<Select.Trigger id="payroll-employee-job-title-select" class="h-10 w-full">
						<span class="truncate">
							{#if selectedJobTitleId === CUSTOM_JOB_TITLE_VALUE}
								Custom title
							{:else}
								{jobTitles.find((title) => title.id === selectedJobTitleId)?.name ??
									'Select job title'}
							{/if}
						</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Item value={CUSTOM_JOB_TITLE_VALUE} label="Custom title">
								Custom title
							</Select.Item>
							{#each jobTitles as title (title.id)}
								<Select.Item value={title.id} label={title.name}>
									{title.name}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
				{#if selectedJobTitleId === CUSTOM_JOB_TITLE_VALUE}
					<Form.Field form={superform} name="jobTitle">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="sr-only">Custom job title</Form.Label>
								<Input {...props} bind:value={$form.jobTitle} autocomplete="organization-title" />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>
				{:else if selectedCatalogTitle}
					<p class="text-muted-foreground text-sm">
						Pay: {catalogPaySummary}
					</p>
				{/if}
				<p class="text-muted-foreground text-xs">
					{#if selectedJobTitleId === CUSTOM_JOB_TITLE_VALUE}
						Set job title and pay rate manually below.
					{:else}
						Pay comes from this job title. Choose Custom title to set pay manually.
					{/if}
				</p>
			</div>
		{:else}
			<Form.Field form={superform} name="jobTitle">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Job title <span class="text-muted-foreground">(optional)</span></Form.Label>
						<Input {...props} bind:value={$form.jobTitle} autocomplete="organization-title" />
					{/snippet}
				</Form.Control>
				<SingleFieldErrors />
			</Form.Field>
		{/if}
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
					<Select.Trigger class="h-10 w-full" id={props.id}>
						<span class="truncate">
							{#if $form.workScheduleId}
								{workSchedules.find((schedule) => schedule.id === $form.workScheduleId)?.name ??
									'Select work schedule'}
							{:else}
								Workspace default
							{/if}
						</span>
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							<Select.Item value="" label="Workspace default">Workspace default</Select.Item>
							{#each workSchedules as schedule (schedule.id)}
								<Select.Item value={schedule.id} label={schedule.name}>
									{schedule.name}
								</Select.Item>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
				<p class="text-muted-foreground text-xs">
					Assign a named schedule from DTR → Named work schedules, or leave as workspace default.
				</p>
			{/snippet}
		</Form.Control>
		<SingleFieldErrors />
	</Form.Field>

	<div class="grid gap-5 sm:grid-cols-2">
		{#if showPayFields}
			<Form.Field form={superform} name="payType">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Pay rate type</Form.Label>
						<Select.Root type="single" bind:value={$form.payType}>
							<Select.Trigger class="h-10 w-full" id={props.id}>
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
								{$form.payType === 'hourly'
									? 'per hour'
									: $form.payType === 'daily'
										? 'per day'
										: 'per month'}
							</span>
						</Form.Label>
						<PayrollMoneyInput
							{...props}
							bind:value={$form.payRate}
							payrollCurrency={payrollCurrency}
						/>
					{/snippet}
				</Form.Control>
				<SingleFieldErrors />
			</Form.Field>
		{/if}
	</div>

	{#if deductionTypes.length > 0}
		<div class="space-y-4">
			<div>
				<p class="text-sm font-medium">Deductions</p>
				<p class="text-muted-foreground text-sm">
					Enable workspace deduction types and set amounts for this employee. Fixed amounts are monthly
					totals — semi-monthly payroll deducts half per cutoff.
				</p>
			</div>

			<div class="space-y-3">
				{#each $form.deductions ?? [] as deduction, index (deduction.typeId)}
					{@const deductionType = deductionTypes.find((type) => type.id === deduction.typeId)}
					{#if deductionType}
						<div class="border-input rounded-lg border p-4">
							<div class="flex flex-col gap-4 sm:flex-row sm:items-end">
								<label class="flex flex-1 items-center gap-3 text-sm">
									<input type="checkbox" bind:checked={$form.deductions[index].enabled} />
									{#if showPhDeductionIcons}
										<PayrollDeductionTypeIcon
											name={deductionType.name}
											iconUrls={phDeductionIconUrls}
											class="size-7 shrink-0 rounded-md object-contain bg-muted/40 p-0.5"
										/>
									{/if}
									<span class="font-medium">{deductionType.name}</span>
									<span class="text-muted-foreground">
										({deductionType.kind === 'fixed' ? 'fixed' : 'percentage'})
									</span>
								</label>

								{#if deductionType.kind === 'fixed'}
									<div class="sm:w-48">
										<PayrollMoneyInput
											bind:value={$form.deductions[index].amount}
											payrollCurrency={payrollCurrency}
											disabled={!$form.deductions[index].enabled}
											aria-label="{deductionType.name} amount"
										/>
									</div>
								{:else}
									<div class="sm:w-48">
										<Input
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
		{@render actions({ submitting })}
	</div>
</form>
