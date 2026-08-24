<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import PayrollDeductionTypeIcon from '$lib/components/payroll/payroll-deduction-type-icon.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { PayrollCurrency } from '$lib/shared/payroll/currency';
	import {
		createDeductionTypeId,
		PAYROLL_DEDUCTION_KIND_LABELS,
		PAYROLL_DEDUCTION_KINDS,
		PH_PAYROLL_DEDUCTION_PRESETS
	} from '$lib/shared/payroll/deductions';
	import {
		PAYROLL_DEDUCTION_TYPES_SAVED_MESSAGE,
		PAYROLL_DEDUCTION_TYPES_SAVE_FAILED_MESSAGE
	} from '$lib/shared/payroll/messages';
	import { payrollDeductionTypesSchema } from '$lib/shared/payroll/schemas';
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
	let activeTypeIndex = $state<number | null>(null);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(payrollDeductionTypesSchema),
		dataType: 'json',
		resetForm: false,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === PAYROLL_DEDUCTION_TYPES_SAVED_MESSAGE) {
				showSuccess = true;
				activeTypeIndex = null;
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
			$formMessage !== PAYROLL_DEDUCTION_TYPES_SAVED_MESSAGE
	);

	const isSemiMonthly = $derived(data.payFrequency === 'semi-monthly');

	const showPhDeductionIcons = $derived(
		data.payrollCurrency === 'PHP' && Object.keys(data.phDeductionIconUrls).length > 0
	);

	function formatMoney(amount: number, currency: PayrollCurrency): string {
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency,
			maximumFractionDigits: currency === 'JPY' ? 0 : 2
		}).format(amount);
	}

	function perCutoffHint(monthlyAmount: number): string | null {
		if (!isSemiMonthly || monthlyAmount <= 0) {
			return null;
		}

		return `${formatMoney(monthlyAmount / 2, data.payrollCurrency)} per cutoff`;
	}

	function formatDefaultValue(
		type: (typeof $form.types)[number],
		currency: PayrollCurrency
	): string {
		if (type.kind === 'fixed') {
			return new Intl.NumberFormat(undefined, {
				style: 'currency',
				currency,
				maximumFractionDigits: currency === 'JPY' ? 0 : 2
			}).format(type.defaultAmount);
		}

		return `${type.defaultRatePercent}%`;
	}

	function addType() {
		$form.types = [
			...$form.types,
			{
				id: createDeductionTypeId(),
				name: '',
				kind: 'fixed',
				defaultAmount: 0,
				defaultRatePercent: 0,
				isActive: true
			}
		];
		activeTypeIndex = $form.types.length - 1;
	}

	function addPhilippinePresets() {
		const existingNames = new Set($form.types.map((type) => type.name.toLowerCase()));
		const presets = PH_PAYROLL_DEDUCTION_PRESETS.filter(
			(preset) => !existingNames.has(preset.name.toLowerCase())
		).map((preset) => ({
			id: createDeductionTypeId(),
			name: preset.name,
			kind: preset.kind,
			defaultAmount: 0,
			defaultRatePercent: 0,
			isActive: true
		}));

		if (presets.length === 0) {
			return;
		}

		const startIndex = $form.types.length;
		$form.types = [...$form.types, ...presets];
		activeTypeIndex = startIndex;
	}

	function editType(index: number) {
		activeTypeIndex = index;
	}

	function removeType(index: number) {
		$form.types = $form.types.filter((_, currentIndex) => currentIndex !== index);

		if (activeTypeIndex === index) {
			activeTypeIndex = null;
		} else if (activeTypeIndex !== null && activeTypeIndex > index) {
			activeTypeIndex -= 1;
		}
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Deduction types"
		description="Define deduction categories for this workspace. Fixed amounts are monthly totals — each pay run deducts the portion for that period."
	/>

	{#if isSemiMonthly}
		<StatusAlert
			variant="info"
			title="Semi-monthly deductions"
			description="With {data.payFrequencyLabel} payroll, fixed deductions like SSS are split across cutoffs. Enter the full monthly amount (e.g. ₱700 SSS → ₱350 deducted per cutoff). Percentage deductions apply to gross pay for that cutoff."
		/>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace deduction catalog</Card.Title>
			<Card.Description>
				Common examples in the Philippines include SSS, PhilHealth, Pag-IBIG, withholding tax, and loans.
				Fixed amounts are monthly totals in {data.payrollCurrency}.
			</Card.Description>
			<Card.Action>
				<div class="flex flex-wrap justify-end gap-2">
					<Button type="button" variant="outline" class="h-10" onclick={addPhilippinePresets}>
						Add PH defaults
					</Button>
					<Button type="button" variant="outline" class="h-10" onclick={addType}>
						<PlusIcon class="size-4" aria-hidden="true" />
						Add deduction type
					</Button>
				</div>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Deduction types saved"
					description="These types are now available when setting up employee deductions."
					class="mb-6"
				/>
			{:else if formError}
				<StatusAlert
					variant="danger"
					title="Could not save deduction types"
					description={$formMessage === PAYROLL_DEDUCTION_TYPES_SAVE_FAILED_MESSAGE
						? PAYROLL_DEDUCTION_TYPES_SAVE_FAILED_MESSAGE
						: String($formMessage)}
					class="mb-6"
				/>
			{/if}

			<form method="POST" use:enhance class="space-y-6">
				{#if $form.types.length === 0}
					<StatusAlert
						variant="info"
						title="No deduction types yet"
						description="Add types manually or load common Philippine payroll deductions."
					/>
				{:else}
					<div class="overflow-x-auto rounded-lg border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head class="min-w-40">Name</Table.Head>
									<Table.Head class="min-w-36">Calculation</Table.Head>
									<Table.Head class="min-w-32">Default</Table.Head>
									<Table.Head class="min-w-24">Status</Table.Head>
									<Table.Head class="w-28 text-right">Actions</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each $form.types as type, index (type.id)}
									<Table.Row data-state={activeTypeIndex === index ? 'selected' : undefined}>
										<Table.Cell class="align-top font-medium">
											<div class="flex items-center gap-3">
												{#if showPhDeductionIcons}
													<PayrollDeductionTypeIcon
														name={type.name}
														iconUrls={data.phDeductionIconUrls}
													/>
												{/if}
												<span>{type.name.trim() || `Deduction ${index + 1}`}</span>
											</div>
										</Table.Cell>
										<Table.Cell class="text-muted-foreground align-top text-sm">
											{PAYROLL_DEDUCTION_KIND_LABELS[type.kind]}
										</Table.Cell>
										<Table.Cell class="text-muted-foreground align-top text-sm whitespace-nowrap">
											{formatDefaultValue(type, data.payrollCurrency)}
										</Table.Cell>
										<Table.Cell class="align-top">
											{#if type.isActive}
												<Badge variant="secondary">Active</Badge>
											{:else}
												<Badge variant="outline">Inactive</Badge>
											{/if}
										</Table.Cell>
										<Table.Cell class="align-top text-right">
											<div class="flex justify-end gap-1">
												<Button
													type="button"
													variant="ghost"
													size="icon"
													class="size-8"
													onclick={() => editType(index)}
													aria-label="Edit deduction type"
												>
													<PencilIcon class="size-4" />
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													class="size-8"
													onclick={() => removeType(index)}
													aria-label="Remove deduction type"
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

				{#if activeTypeIndex !== null && $form.types[activeTypeIndex]}
					{@const typeIndex = activeTypeIndex}
					<div class="border-input space-y-5 rounded-lg border p-4">
						<div class="flex items-center justify-between gap-3">
							<div class="flex items-center gap-3">
								{#if showPhDeductionIcons}
									<PayrollDeductionTypeIcon
										name={$form.types[typeIndex].name}
										iconUrls={data.phDeductionIconUrls}
										class="size-10 shrink-0 rounded-md object-contain bg-muted/40 p-1"
									/>
								{/if}
								<p class="text-sm font-medium">
									{$form.types[typeIndex].name.trim()
										? `Edit ${$form.types[typeIndex].name}`
										: 'New deduction type'}
								</p>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="h-8"
								onclick={() => (activeTypeIndex = null)}
							>
								Close
							</Button>
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<label class="text-sm font-medium" for="deduction-name-{typeIndex}">Name</label>
								<Input
									id="deduction-name-{typeIndex}"
									bind:value={$form.types[typeIndex].name}
								/>
								{#if $errors.types?.[typeIndex]?.name}
									<p class="text-destructive text-sm">{$errors.types[typeIndex].name}</p>
								{/if}
							</div>

							<div class="space-y-2">
								<label class="text-sm font-medium" for="deduction-kind-{typeIndex}">
									Calculation
								</label>
								<Select.Root type="single" bind:value={$form.types[typeIndex].kind}>
									<Select.Trigger id="deduction-kind-{typeIndex}" class="h-10 w-full">
										<span class="truncate">
											{PAYROLL_DEDUCTION_KIND_LABELS[$form.types[typeIndex].kind]}
										</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											{#each PAYROLL_DEDUCTION_KINDS as kind (kind)}
												<Select.Item value={kind} label={PAYROLL_DEDUCTION_KIND_LABELS[kind]}>
													{PAYROLL_DEDUCTION_KIND_LABELS[kind]}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
							</div>
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							{#if $form.types[typeIndex].kind === 'fixed'}
								<div class="space-y-2">
									<label class="text-sm font-medium" for="deduction-amount-{typeIndex}">
										Default amount ({data.payrollCurrency})
										<span class="text-muted-foreground font-normal">per month</span>
									</label>
									<Input
										id="deduction-amount-{typeIndex}"
										type="number"
										min="0"
										step="0.01"
										bind:value={$form.types[typeIndex].defaultAmount}
									/>
									{#if perCutoffHint($form.types[typeIndex].defaultAmount)}
										<p class="text-muted-foreground text-sm">
											Deducted per cutoff: {perCutoffHint($form.types[typeIndex].defaultAmount)}
										</p>
									{/if}
									{#if $errors.types?.[typeIndex]?.defaultAmount}
										<p class="text-destructive text-sm">
											{$errors.types[typeIndex].defaultAmount}
										</p>
									{/if}
								</div>
							{:else}
								<div class="space-y-2">
									<label class="text-sm font-medium" for="deduction-rate-{typeIndex}">
										Default rate (%)
									</label>
									<Input
										id="deduction-rate-{typeIndex}"
										type="number"
										min="0"
										max="100"
										step="0.01"
										bind:value={$form.types[typeIndex].defaultRatePercent}
									/>
									{#if $errors.types?.[typeIndex]?.defaultRatePercent}
										<p class="text-destructive text-sm">
											{$errors.types[typeIndex].defaultRatePercent}
										</p>
									{/if}
								</div>
							{/if}

							<label class="flex items-center gap-3 self-end text-sm">
								<input
									type="checkbox"
									bind:checked={$form.types[typeIndex].isActive}
								/>
								Active for new employee assignments
							</label>
						</div>
					</div>
				{/if}

				{#if $form.types.length > 0}
					<Button type="submit" class="h-10" disabled={submitting}>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Saving deduction types...
						{:else}
							Save deduction types
						{/if}
					</Button>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>
</div>
