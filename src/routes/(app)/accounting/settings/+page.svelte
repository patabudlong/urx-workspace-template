<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import {
		ACCOUNTING_SETTINGS_SAVED_MESSAGE,
		ACCOUNTING_SETTINGS_SAVE_FAILED_MESSAGE
	} from '$lib/shared/accounting/messages';
	import { accountingSettingsSchema } from '$lib/shared/accounting/schemas';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(accountingSettingsSchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === ACCOUNTING_SETTINGS_SAVED_MESSAGE) {
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
			$formMessage !== ACCOUNTING_SETTINGS_SAVED_MESSAGE
	);
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Accounting"
		title="Company setup"
		description="Configure your legal entity, TIN, and fiscal year. Saving seeds the PH chart of accounts and monthly fiscal periods."
	/>

	{#if !data.settingsConfigured}
		<StatusAlert
			variant="info"
			title="First-time setup"
			description="Complete this form to seed the default PH SME chart of accounts and create fiscal periods for the current year."
		/>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Company profile</Card.Title>
			<Card.Description>Used on reports and future BIR-ready exports.</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Settings saved"
					description="Your chart of accounts and fiscal periods are ready."
					class="mb-6"
				/>
			{:else if formError}
				<StatusAlert
					variant="danger"
					title="Could not save settings"
					description={typeof $formMessage === 'string' &&
					$formMessage === ACCOUNTING_SETTINGS_SAVE_FAILED_MESSAGE
						? ACCOUNTING_SETTINGS_SAVE_FAILED_MESSAGE
						: String($formMessage ?? 'Could not save settings')}
					class="mb-6"
				/>
			{/if}

			<form method="POST" use:enhance class="space-y-6">
				<div class="grid gap-4 md:grid-cols-2">
					<Form.Field form={superform} name="companyName">
						{#snippet children({ constraints })}
							<Form.Control>
								{#snippet children({ props })}
									<Label for="companyName">Registered company name</Label>
									<Input
										{...props}
										{...constraints}
										id="companyName"
										bind:value={$form.companyName}
										autocomplete="organization"
									/>
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						{/snippet}
					</Form.Field>

					<Form.Field form={superform} name="tin">
						{#snippet children({ constraints })}
							<Form.Control>
								{#snippet children({ props })}
									<Label for="tin">TIN (optional)</Label>
									<Input {...props} {...constraints} id="tin" bind:value={$form.tin} />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						{/snippet}
					</Form.Field>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<Form.Field form={superform} name="addressLine1">
						{#snippet children({ constraints })}
							<Form.Control>
								{#snippet children({ props })}
									<Label for="addressLine1">Address line 1</Label>
									<Input
										{...props}
										{...constraints}
										id="addressLine1"
										bind:value={$form.addressLine1}
									/>
								{/snippet}
							</Form.Control>
						{/snippet}
					</Form.Field>

					<Form.Field form={superform} name="addressLine2">
						{#snippet children({ constraints })}
							<Form.Control>
								{#snippet children({ props })}
									<Label for="addressLine2">Address line 2</Label>
									<Input
										{...props}
										{...constraints}
										id="addressLine2"
										bind:value={$form.addressLine2}
									/>
								{/snippet}
							</Form.Control>
						{/snippet}
					</Form.Field>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<Form.Field form={superform} name="city">
						{#snippet children({ constraints })}
							<Form.Control>
								{#snippet children({ props })}
									<Label for="city">City</Label>
									<Input {...props} {...constraints} id="city" bind:value={$form.city} />
								{/snippet}
							</Form.Control>
						{/snippet}
					</Form.Field>

					<Form.Field form={superform} name="province">
						{#snippet children({ constraints })}
							<Form.Control>
								{#snippet children({ props })}
									<Label for="province">Province</Label>
									<Input {...props} {...constraints} id="province" bind:value={$form.province} />
								{/snippet}
							</Form.Control>
						{/snippet}
					</Form.Field>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<Form.Field form={superform} name="fiscalYearStartMonth">
						{#snippet children()}
							<Form.Control>
								{#snippet children({ props })}
									<Label for="fiscalYearStartMonth">Fiscal year starts</Label>
									<Select.Root
										type="single"
										value={String($form.fiscalYearStartMonth)}
										onValueChange={(value) => {
											if (value) {
												$form.fiscalYearStartMonth = Number(value);
											}
										}}
									>
										<Select.Trigger {...props} id="fiscalYearStartMonth" class="w-full">
											{data.fiscalMonths.find((month) => month.value === $form.fiscalYearStartMonth)
												?.label ?? 'Select month'}
										</Select.Trigger>
										<Select.Content>
											{#each data.fiscalMonths as month (month.value)}
												<Select.Item value={String(month.value)}>{month.label}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						{/snippet}
					</Form.Field>

					<div class="space-y-2">
						<Label for="baseCurrency">Base currency</Label>
						<Input id="baseCurrency" value="PHP" disabled />
						<p class="text-muted-foreground text-sm">Phase 1 supports Philippine Peso only.</p>
					</div>
				</div>

				<div class="flex justify-end">
					<Button type="submit" disabled={submitting}>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Saving…
						{:else}
							Save settings
						{/if}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
