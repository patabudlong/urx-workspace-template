<script lang="ts">
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
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
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(payrollDeductionTypesSchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === PAYROLL_DEDUCTION_TYPES_SAVED_MESSAGE) {
				showSuccess = true;
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== PAYROLL_DEDUCTION_TYPES_SAVED_MESSAGE
	);

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

		$form.types = [...$form.types, ...presets];
	}

	function removeType(index: number) {
		$form.types = $form.types.filter((_, currentIndex) => currentIndex !== index);
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Deduction types"
		description="Define deduction categories for this workspace. Assign amounts per employee when adding or editing payroll employees."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Workspace deduction catalog</Card.Title>
			<Card.Description>
				Common examples in the Philippines include SSS, PhilHealth, Pag-IBIG, withholding tax, and loans.
				Fixed amounts use your payroll currency ({data.payrollCurrency}).
			</Card.Description>
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

			<form method="POST" use:enhance class="space-y-5">
				{#if $form.types.length === 0}
					<StatusAlert
						variant="info"
						title="No deduction types yet"
						description="Add types manually or load common Philippine payroll deductions."
					/>
				{:else}
					<div class="space-y-4">
						{#each $form.types as type, index (type.id)}
							<div class="border-input space-y-4 rounded-lg border p-4">
								<input type="hidden" name="types[{index}].id" value={type.id} />

								<div class="flex items-start justify-between gap-3">
									<p class="text-sm font-medium">Deduction {index + 1}</p>
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

								<div class="grid gap-4 sm:grid-cols-2">
									<div class="space-y-2">
										<label class="text-sm font-medium" for="deduction-name-{index}">Name</label>
										<Input
											id="deduction-name-{index}"
											name="types[{index}].name"
											bind:value={$form.types[index].name}
										/>
									</div>

									<div class="space-y-2">
										<label class="text-sm font-medium" for="deduction-kind-{index}">Calculation</label>
										<Select.Root type="single" bind:value={$form.types[index].kind}>
											<Select.Trigger id="deduction-kind-{index}" class="h-10 w-full">
												<span class="truncate">
													{PAYROLL_DEDUCTION_KIND_LABELS[$form.types[index].kind]}
												</span>
											</Select.Trigger>
											<Select.Content>
												<Select.Group>
													{#each PAYROLL_DEDUCTION_KINDS as kind (kind)}
														<Select.Item
															value={kind}
															label={PAYROLL_DEDUCTION_KIND_LABELS[kind]}
														>
															{PAYROLL_DEDUCTION_KIND_LABELS[kind]}
														</Select.Item>
													{/each}
												</Select.Group>
											</Select.Content>
										</Select.Root>
										<input type="hidden" name="types[{index}].kind" value={$form.types[index].kind} />
									</div>
								</div>

								<div class="grid gap-4 sm:grid-cols-2">
									{#if $form.types[index].kind === 'fixed'}
										<div class="space-y-2">
											<label class="text-sm font-medium" for="deduction-amount-{index}">
												Default amount ({data.payrollCurrency})
											</label>
											<Input
												id="deduction-amount-{index}"
												name="types[{index}].defaultAmount"
												type="number"
												min="0"
												step="0.01"
												bind:value={$form.types[index].defaultAmount}
											/>
										</div>
									{:else}
										<div class="space-y-2">
											<label class="text-sm font-medium" for="deduction-rate-{index}">
												Default rate (%)
											</label>
											<Input
												id="deduction-rate-{index}"
												name="types[{index}].defaultRatePercent"
												type="number"
												min="0"
												max="100"
												step="0.01"
												bind:value={$form.types[index].defaultRatePercent}
											/>
										</div>
									{/if}

									<label class="flex items-center gap-3 self-end text-sm">
										<input
											type="checkbox"
											name="types[{index}].isActive"
											bind:checked={$form.types[index].isActive}
										/>
										Active for new employee assignments
									</label>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<div class="flex flex-wrap gap-3">
					<Button type="button" variant="outline" class="h-10" onclick={addType}>
						<PlusIcon class="size-4" aria-hidden="true" />
						Add deduction type
					</Button>
					<Button type="button" variant="outline" class="h-10" onclick={addPhilippinePresets}>
						Add PH defaults
					</Button>
				</div>

				<Button type="submit" class="h-10" disabled={submitting}>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Saving deduction types...
					{:else}
						Save deduction types
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
