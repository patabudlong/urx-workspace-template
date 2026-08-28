<script lang="ts">
	import { invalidateAll } from '$app/navigation';
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
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let submitting = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(accountingSettingsSchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === ACCOUNTING_SETTINGS_SAVED_MESSAGE) {
				toast.success('Settings saved', {
					description: 'Your chart of accounts and fiscal periods are ready.'
				});
				await invalidateAll();
				return;
			}

			if (
				typeof updatedForm.message === 'string' &&
				updatedForm.message.length > 0 &&
				updatedForm.message !== ACCOUNTING_SETTINGS_SAVED_MESSAGE
			) {
				toast.error('Could not save settings', {
					description:
						updatedForm.message === ACCOUNTING_SETTINGS_SAVE_FAILED_MESSAGE
							? ACCOUNTING_SETTINGS_SAVE_FAILED_MESSAGE
							: updatedForm.message
				});
				return;
			}

			if (!updatedForm.valid) {
				toast.error('Could not save settings', {
					description: 'Check the highlighted fields and try again.'
				});
			}
		},
		onError: () => {
			submitting = false;
			toast.error('Could not save settings', {
				description: ACCOUNTING_SETTINGS_SAVE_FAILED_MESSAGE
			});
		}
	});

	const { enhance, form } = superform;
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
			<form method="POST" use:enhance class="space-y-6">
				<input type="hidden" name="timezone" value={$form.timezone} />
				<input type="hidden" name="baseCurrency" value={$form.baseCurrency} />

				<div class="grid gap-4 md:grid-cols-2">
					<Form.Field form={superform} name="companyName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Registered company name</Form.Label>
								<Input
									{...props}
									bind:value={$form.companyName}
									autocomplete="organization"
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Form.Field form={superform} name="tin">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>TIN (optional)</Form.Label>
								<Input {...props} bind:value={$form.tin} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<Form.Field form={superform} name="addressLine1">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Address line 1</Form.Label>
								<Input {...props} bind:value={$form.addressLine1} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Form.Field form={superform} name="addressLine2">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Address line 2</Form.Label>
								<Input {...props} bind:value={$form.addressLine2} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<Form.Field form={superform} name="city">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>City</Form.Label>
								<Input {...props} bind:value={$form.city} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Form.Field form={superform} name="province">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Province</Form.Label>
								<Input {...props} bind:value={$form.province} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<Form.Field form={superform} name="fiscalYearStartMonth">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Fiscal year starts</Form.Label>
								<Select.Root
									type="single"
									value={String($form.fiscalYearStartMonth)}
									onValueChange={(value) => {
										if (value) {
											$form.fiscalYearStartMonth = Number(value);
										}
									}}
								>
									<Select.Trigger class="h-10 w-full">
										<span class="truncate">
											{data.fiscalMonths.find((month) => month.value === $form.fiscalYearStartMonth)
												?.label ?? 'Select month'}
										</span>
									</Select.Trigger>
									<Select.Content>
										{#each data.fiscalMonths as month (month.value)}
											<Select.Item value={String(month.value)} label={month.label}>
												{month.label}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
								<input type="hidden" name={props.name} value={$form.fiscalYearStartMonth} />
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<div class="space-y-2">
						<Label>Base currency</Label>
						<Input value="PHP" disabled />
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
