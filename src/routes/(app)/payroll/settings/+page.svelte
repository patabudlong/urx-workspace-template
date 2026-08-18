<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { PAYROLL_CURRENCIES } from '$lib/shared/payroll/currency';
	import {
		PAY_FREQUENCIES,
		PAY_FREQUENCY_LABELS,
		WEEK_START_DAYS,
		WEEK_START_DAY_LABELS,
		requiresPeriodAnchor
	} from '$lib/shared/payroll/frequency';
	import {
		PAYROLL_SETTINGS_SAVED_MESSAGE,
		PAYROLL_SETTINGS_SAVE_FAILED_MESSAGE
	} from '$lib/shared/payroll/messages';
	import { payrollSettingsSchema } from '$lib/shared/payroll/schemas';
	import { PAYROLL_TIMEZONES } from '$lib/shared/payroll/timezone';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(payrollSettingsSchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === PAYROLL_SETTINGS_SAVED_MESSAGE) {
				showSuccess = true;
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	const showAnchorFields = $derived(requiresPeriodAnchor($form.payFrequency));

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== PAYROLL_SETTINGS_SAVED_MESSAGE
	);
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Payroll"
		title="Settings"
		description="Set how often your workspace runs payroll. Pay runs use these rules to suggest the next period."
	/>

	{#if !data.settingsConfigured}
		<StatusAlert
			variant="info"
			title="Using default schedule"
			description="Save your pay frequency below. Semi-monthly and monthly schedules work immediately; weekly and bi-weekly need a period anchor date."
		/>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Pay schedule</Card.Title>
			<Card.Description>
				Controls suggested dates when creating pay runs. You can still override dates on each run.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Settings saved"
					description="New pay runs will use this schedule for suggested periods."
					class="mb-6"
				/>
			{:else if formError}
				<StatusAlert
					variant="danger"
					title="Could not save settings"
					description={$formMessage === PAYROLL_SETTINGS_SAVE_FAILED_MESSAGE
						? PAYROLL_SETTINGS_SAVE_FAILED_MESSAGE
						: String($formMessage)}
					class="mb-6"
				/>
			{/if}

			<form method="POST" use:enhance class="space-y-5">
				<div class="grid gap-5 sm:grid-cols-2">
					<Form.Field form={superform} name="payFrequency">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Pay frequency</Form.Label>
								<Select.Root type="single" bind:value={$form.payFrequency}>
									<Select.Trigger class="h-10 w-full">
										<span class="truncate">
											{PAY_FREQUENCY_LABELS[$form.payFrequency] ?? 'Select frequency'}
										</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											{#each PAY_FREQUENCIES as frequency (frequency)}
												<Select.Item value={frequency} label={PAY_FREQUENCY_LABELS[frequency]}>
													{PAY_FREQUENCY_LABELS[frequency]}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
								<input type="hidden" name={props.name} value={$form.payFrequency} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Form.Field form={superform} name="currency">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Currency</Form.Label>
								<Select.Root type="single" bind:value={$form.currency}>
									<Select.Trigger class="h-10 w-full">
										<span class="truncate">
											{PAYROLL_CURRENCIES.find((currency) => currency.value === $form.currency)
												?.label ?? 'Select currency'}
										</span>
									</Select.Trigger>
									<Select.Content>
										<Select.Group>
											{#each PAYROLL_CURRENCIES as currency (currency.value)}
												<Select.Item value={currency.value} label={currency.label}>
													{currency.label}
												</Select.Item>
											{/each}
										</Select.Group>
									</Select.Content>
								</Select.Root>
								<input type="hidden" name={props.name} value={$form.currency} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
						<p class="text-muted-foreground text-xs">
							Used for employee pay rates and payroll amounts in this workspace.
						</p>
					</Form.Field>
				</div>

				<Form.Field form={superform} name="timezone">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>Timezone</Form.Label>
							<Select.Root type="single" bind:value={$form.timezone}>
								<Select.Trigger class="h-10 w-full">
									<span class="truncate">
										{PAYROLL_TIMEZONES.find((timezone) => timezone.value === $form.timezone)
											?.label ?? 'Select timezone'}
									</span>
								</Select.Trigger>
								<Select.Content>
									<Select.Group>
										{#each PAYROLL_TIMEZONES as timezone (timezone.value)}
											<Select.Item value={timezone.value} label={timezone.label}>
												{timezone.label}
											</Select.Item>
										{/each}
									</Select.Group>
								</Select.Content>
							</Select.Root>
							<input type="hidden" name={props.name} value={$form.timezone} />
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
					<p class="text-muted-foreground text-xs">
						Used to determine pay period start and end dates for your workspace.
					</p>
				</Form.Field>

				{#if showAnchorFields}
					<div class="grid gap-5 sm:grid-cols-2">
						<Form.Field form={superform} name="weekStartDay">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>Week starts on</Form.Label>
									<Select.Root type="single" bind:value={$form.weekStartDay}>
										<Select.Trigger class="h-10 w-full">
											<span class="truncate">
												{$form.weekStartDay
													? WEEK_START_DAY_LABELS[$form.weekStartDay]
													: 'Select day'}
											</span>
										</Select.Trigger>
										<Select.Content>
											<Select.Group>
												{#each WEEK_START_DAYS as day (day)}
													<Select.Item value={day} label={WEEK_START_DAY_LABELS[day]}>
														{WEEK_START_DAY_LABELS[day]}
													</Select.Item>
												{/each}
											</Select.Group>
										</Select.Content>
									</Select.Root>
									<input type="hidden" name={props.name} value={$form.weekStartDay} />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>

						<Form.Field form={superform} name="periodAnchorDate">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label required>Period anchor date</Form.Label>
									<Input {...props} bind:value={$form.periodAnchorDate} type="date" />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
							<p class="text-muted-foreground text-xs">
								First day of your first pay period. Future periods are counted from this date.
							</p>
						</Form.Field>
					</div>
				{/if}

				<Button type="submit" class="h-10" disabled={submitting}>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Saving settings...
					{:else}
						Save settings
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Deductions</Card.Title>
			<Card.Description>
				Configure SSS, PhilHealth, loans, and other deduction types used when setting up employees.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<Button href="/payroll/settings/deductions" variant="outline" class="h-10">
				Manage deduction types
			</Button>
		</Card.Content>
	</Card.Root>
</div>
