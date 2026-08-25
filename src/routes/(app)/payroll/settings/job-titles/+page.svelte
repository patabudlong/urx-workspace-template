<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import PayrollMoneyInput from '$lib/components/payroll/payroll-money-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import type { PayrollCurrency } from '$lib/shared/payroll/currency';
	import { createJobTitleId } from '$lib/shared/payroll/job-titles';
	import {
		PAYROLL_JOB_TITLES_SAVED_MESSAGE,
		PAYROLL_JOB_TITLES_SAVE_FAILED_MESSAGE
	} from '$lib/shared/payroll/messages';
	import {
		PAYROLL_PAY_TYPE_LABELS,
		PAYROLL_PAY_TYPES
	} from '$lib/shared/payroll/pay-rate';
	import {
		PH_PAY_RATE_PRESET_CUSTOM,
		PH_PAY_RATE_PRESET_IDS,
		PH_PAY_RATE_PRESET_LABELS,
		applyPhPayRatePreset,
		deriveMonthlyPayRates,
		deriveRatesFromDailyPay,
		resolvePhPayRatePreset,
		type PhPayRatePresetId
	} from '$lib/shared/payroll/ph-rates';
	import { payrollJobTitlesSchema } from '$lib/shared/payroll/schemas';
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
	let activeTitleIndex = $state<number | null>(null);
	let titlePresetSelections = $state<Record<string, PhPayRatePresetId>>({});

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(payrollJobTitlesSchema),
		dataType: 'json',
		resetForm: false,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === PAYROLL_JOB_TITLES_SAVED_MESSAGE) {
				showSuccess = true;
				activeTitleIndex = null;
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
			$formMessage !== PAYROLL_JOB_TITLES_SAVED_MESSAGE
	);

	const isSemiMonthly = $derived(data.payFrequency === 'semi-monthly');

	function formatMoney(amount: number, currency: PayrollCurrency): string {
		return new Intl.NumberFormat(undefined, {
			style: 'currency',
			currency,
			maximumFractionDigits: currency === 'JPY' ? 0 : 2
		}).format(amount);
	}

	function formatPayRate(title: (typeof $form.titles)[number], currency: PayrollCurrency): string {
		return formatMoney(title.payRate, currency);
	}

	function payRateSuffix(payType: (typeof $form.titles)[number]['payType']): string {
		if (payType === 'hourly') {
			return '/hr';
		}

		if (payType === 'daily') {
			return '/day';
		}

		return '/mo';
	}

	function payRateDerivation(title: (typeof $form.titles)[number]) {
		if (title.payRate <= 0) {
			return null;
		}

		if (title.payType === 'monthly') {
			return deriveMonthlyPayRates(title.payRate);
		}

		if (title.payType === 'daily') {
			return deriveRatesFromDailyPay(title.payRate);
		}

		return null;
	}

	function presetForTitle(title: (typeof $form.titles)[number]): PhPayRatePresetId {
		if (data.payrollCurrency !== 'PHP') {
			return PH_PAY_RATE_PRESET_CUSTOM;
		}

		return (
			titlePresetSelections[title.id] ??
			resolvePhPayRatePreset(title.payType, title.payRate)
		);
	}

	function syncPresetSelection(title: (typeof $form.titles)[number]) {
		if (data.payrollCurrency !== 'PHP') {
			return;
		}

		titlePresetSelections[title.id] = resolvePhPayRatePreset(title.payType, title.payRate);
	}

	function setPayRatePreset(index: number, presetId: PhPayRatePresetId) {
		const title = $form.titles[index];
		titlePresetSelections[title.id] = presetId;

		if (presetId === PH_PAY_RATE_PRESET_CUSTOM) {
			return;
		}

		const preset = applyPhPayRatePreset(presetId);

		if (!preset) {
			return;
		}

		$form.titles[index].payType = preset.payType;
		$form.titles[index].payRate = preset.payRate;
	}

	function addTitle() {
		$form.titles = [
			...$form.titles,
			{
				id: createJobTitleId(),
				name: '',
				payType: 'monthly',
				payRate: 0,
				isActive: true
			}
		];
		activeTitleIndex = $form.titles.length - 1;
		syncPresetSelection($form.titles[activeTitleIndex]);
	}

	function editTitle(index: number) {
		activeTitleIndex = index;
		syncPresetSelection($form.titles[index]);
	}

	function removeTitle(index: number) {
		const removedId = $form.titles[index]?.id;
		$form.titles = $form.titles.filter((_, currentIndex) => currentIndex !== index);

		if (removedId) {
			const { [removedId]: _, ...rest } = titlePresetSelections;
			titlePresetSelections = rest;
		}

		if (activeTitleIndex === index) {
			activeTitleIndex = null;
		} else if (activeTitleIndex !== null && activeTitleIndex > index) {
			activeTitleIndex -= 1;
		}
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Job titles"
		description="Define standard roles and default compensation. Use per day for minimum-wage roles (DTR drives pay). Use per month for fixed semi-monthly salaries."
	/>

	{#if isSemiMonthly}
		<StatusAlert
			variant="plain"
			title="Semi-monthly pay periods"
			description="Pay runs use 1st–15th and 16th–end cutoffs. Monthly employees get half their monthly rate each cutoff. Daily employees are paid per worked day from time records in that cutoff."
		/>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace job title catalog</Card.Title>
			<Card.Description>
				Default pay rates use your payroll currency ({data.payrollCurrency}). Employees can still
				override compensation individually.
			</Card.Description>
			<Card.Action>
				<Button type="button" variant="outline" class="h-10" onclick={addTitle}>
					<PlusIcon class="size-4" aria-hidden="true" />
					Add job title
				</Button>
			</Card.Action>
		</Card.Header>
		<Card.Content>
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Job titles saved"
					description="These titles are now available when adding or editing employees."
					class="mb-6"
				/>
			{:else if formError}
				<StatusAlert
					variant="danger"
					title="Could not save job titles"
					description={$formMessage === PAYROLL_JOB_TITLES_SAVE_FAILED_MESSAGE
						? PAYROLL_JOB_TITLES_SAVE_FAILED_MESSAGE
						: String($formMessage)}
					class="mb-6"
				/>
			{/if}

			<form method="POST" use:enhance class="space-y-6">
				{#if $form.titles.length === 0}
					<StatusAlert
						variant="info"
						title="No job titles yet"
						description="Add roles with default pay rates to speed up employee setup."
					/>
				{:else}
					<div class="overflow-x-auto rounded-lg border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									<Table.Head class="min-w-44">Job title</Table.Head>
									<Table.Head class="min-w-32">Pay type</Table.Head>
									<Table.Head class="min-w-36">Default pay rate</Table.Head>
									<Table.Head class="min-w-24">Status</Table.Head>
									<Table.Head class="w-28 text-right">Actions</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each $form.titles as title, index (title.id)}
									<Table.Row data-state={activeTitleIndex === index ? 'selected' : undefined}>
										<Table.Cell class="align-top font-medium">
											{title.name.trim() || `Job title ${index + 1}`}
										</Table.Cell>
										<Table.Cell class="text-muted-foreground align-top text-sm">
											{PAYROLL_PAY_TYPE_LABELS[title.payType]}
										</Table.Cell>
										<Table.Cell class="text-muted-foreground align-top text-sm whitespace-nowrap">
											{formatPayRate(title, data.payrollCurrency)}
											<span class="text-muted-foreground/80">
												{payRateSuffix(title.payType)}
											</span>
										</Table.Cell>
										<Table.Cell class="align-top">
											{#if title.isActive}
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
													onclick={() => editTitle(index)}
													aria-label="Edit job title"
												>
													<PencilIcon class="size-4" />
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													class="size-8"
													onclick={() => removeTitle(index)}
													aria-label="Remove job title"
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

				{#if activeTitleIndex !== null && $form.titles[activeTitleIndex]}
					{@const titleIndex = activeTitleIndex}
					<div class="border-input space-y-5 rounded-lg border p-4">
						<div class="flex items-center justify-between gap-3">
							<p class="text-sm font-medium">
								{$form.titles[titleIndex].name.trim()
									? `Edit ${$form.titles[titleIndex].name}`
									: 'New job title'}
							</p>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								class="h-8"
								onclick={() => (activeTitleIndex = null)}
							>
								Close
							</Button>
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<label class="text-sm font-medium" for="job-title-name-{titleIndex}">
									Job title
								</label>
								<Input
									id="job-title-name-{titleIndex}"
									bind:value={$form.titles[titleIndex].name}
									autocomplete="organization-title"
								/>
								{#if $errors.titles?.[titleIndex]?.name}
									<p class="text-destructive text-sm">{$errors.titles[titleIndex].name}</p>
								{/if}
							</div>

							{#if data.payrollCurrency === 'PHP'}
								<div class="space-y-2">
									<label
										class="text-sm font-medium"
										for="job-title-pay-rate-preset-{titleIndex}"
									>
										Default pay rate
									</label>
									<Select.Root
										type="single"
										value={presetForTitle($form.titles[titleIndex])}
										onValueChange={(value) => {
											if (value) {
												setPayRatePreset(titleIndex, value as PhPayRatePresetId);
											}
										}}
									>
										<Select.Trigger id="job-title-pay-rate-preset-{titleIndex}" class="h-10 w-full">
											<span class="truncate">
												{PH_PAY_RATE_PRESET_LABELS[presetForTitle($form.titles[titleIndex])]}
											</span>
										</Select.Trigger>
										<Select.Content>
											<Select.Group>
												{#each PH_PAY_RATE_PRESET_IDS as presetId (presetId)}
													<Select.Item
														value={presetId}
														label={PH_PAY_RATE_PRESET_LABELS[presetId]}
													>
														{PH_PAY_RATE_PRESET_LABELS[presetId]}
													</Select.Item>
												{/each}
											</Select.Group>
										</Select.Content>
									</Select.Root>
								</div>
							{:else}
								<div class="space-y-2">
									<label class="text-sm font-medium" for="job-title-pay-type-{titleIndex}">
										Pay rate type
									</label>
									<Select.Root type="single" bind:value={$form.titles[titleIndex].payType}>
										<Select.Trigger id="job-title-pay-type-{titleIndex}" class="h-10 w-full">
											<span class="truncate">
												{PAYROLL_PAY_TYPE_LABELS[$form.titles[titleIndex].payType]}
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
								</div>
							{/if}
						</div>

						<div class="grid gap-4 sm:grid-cols-2">
							{#if data.payrollCurrency !== 'PHP' || presetForTitle($form.titles[titleIndex]) === PH_PAY_RATE_PRESET_CUSTOM}
								{#if data.payrollCurrency === 'PHP'}
									<div class="space-y-2">
										<label class="text-sm font-medium" for="job-title-pay-type-{titleIndex}">
											Pay rate type
										</label>
										<Select.Root type="single" bind:value={$form.titles[titleIndex].payType}>
											<Select.Trigger id="job-title-pay-type-{titleIndex}" class="h-10 w-full">
												<span class="truncate">
													{PAYROLL_PAY_TYPE_LABELS[$form.titles[titleIndex].payType]}
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
									</div>
								{/if}

								<div class="space-y-2">
									<label class="text-sm font-medium" for="job-title-pay-rate-{titleIndex}">
										Default pay rate ({data.payrollCurrency})
										<span class="text-muted-foreground font-normal">
											{$form.titles[titleIndex].payType === 'hourly'
												? 'per hour'
												: $form.titles[titleIndex].payType === 'daily'
													? 'per day'
													: 'per month'}
										</span>
									</label>
									<PayrollMoneyInput
										id="job-title-pay-rate-{titleIndex}"
										bind:value={$form.titles[titleIndex].payRate}
										payrollCurrency={data.payrollCurrency}
									/>
									{#if $errors.titles?.[titleIndex]?.payRate}
										<p class="text-destructive text-sm">{$errors.titles[titleIndex].payRate}</p>
									{/if}
								</div>
							{/if}

							{#if payRateDerivation($form.titles[titleIndex])}
								{@const derived = payRateDerivation($form.titles[titleIndex])!}
								<div
									class="space-y-2 {data.payrollCurrency === 'PHP' &&
									presetForTitle($form.titles[titleIndex]) !== PH_PAY_RATE_PRESET_CUSTOM
										? 'sm:col-span-2'
										: ''}"
								>
									<p class="text-muted-foreground text-sm">
										{#if $form.titles[titleIndex].payType === 'daily'}
											Monthly equivalent (×{derived.workingDaysPerMonth}):
											{formatMoney(
												derived.dailyRate * derived.workingDaysPerMonth,
												data.payrollCurrency
											)}/mo
										{:else}
											Daily equivalent (÷{derived.workingDaysPerMonth}):
											{formatMoney(derived.dailyRate, data.payrollCurrency)}/day
										{/if}
										{#if isSemiMonthly}
											· Per cutoff (÷2):
											{formatMoney(derived.semiMonthlyRate, data.payrollCurrency)}
										{/if}
									</p>
								</div>
							{/if}

							<label class="flex items-center gap-3 self-end text-sm">
								<input type="checkbox" bind:checked={$form.titles[titleIndex].isActive} />
								Active for employee assignment
							</label>
						</div>
					</div>
				{/if}

				{#if $form.titles.length > 0}
					<Button type="submit" class="h-10" disabled={submitting}>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Saving job titles...
						{:else}
							Save job titles
						{/if}
					</Button>
				{/if}
			</form>
		</Card.Content>
	</Card.Root>
</div>
