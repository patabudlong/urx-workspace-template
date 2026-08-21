<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { DTR_WEEK_DAYS, DTR_WEEK_DAY_LABELS } from '$lib/shared/dtr/weekdays';
	import {
		DTR_SETTINGS_SAVED_MESSAGE,
		DTR_SETTINGS_SAVE_FAILED_MESSAGE
	} from '$lib/shared/dtr/messages';
	import { dtrSettingsSchema } from '$lib/shared/dtr/schemas';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(dtrSettingsSchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === DTR_SETTINGS_SAVED_MESSAGE) {
				showSuccess = true;
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	const standardWorkHours = $derived(Math.round(($form.standardWorkMinutes / 60) * 100) / 100);

	function toggleRestDay(day: (typeof DTR_WEEK_DAYS)[number]) {
		if ($form.restDays.includes(day)) {
			$form.restDays = $form.restDays.filter((value) => value !== day);
			return;
		}

		$form.restDays = [...$form.restDays, day];
	}

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== DTR_SETTINGS_SAVED_MESSAGE
	);
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="DTR"
		title="Workspace default"
		description="Set rest days, standard work hours, and lunch break for employees without a named schedule."
	/>

	{#if !data.settingsConfigured}
		<StatusAlert
			variant="info"
			title="Using default schedule"
			description="Sunday is set as the default rest day. Save your work schedule below."
		/>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title>Schedule</Card.Title>
			<Card.Description>
				Used when an employee has no named schedule. Rest days appear on the time records calendar.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if showSuccess}
				<StatusAlert
					variant="success"
					title="Work schedule saved"
					description="Time records will use these rest days going forward."
					class="mb-6"
				/>
			{:else if formError}
				<StatusAlert
					variant="danger"
					title="Could not save work schedule"
					description={$formMessage === DTR_SETTINGS_SAVE_FAILED_MESSAGE
						? DTR_SETTINGS_SAVE_FAILED_MESSAGE
						: String($formMessage)}
					class="mb-6"
				/>
			{/if}

			<form method="POST" use:enhance class="space-y-6">
				<Form.Field form={superform} name="restDays">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>Rest days</Form.Label>
							<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
								{#each DTR_WEEK_DAYS as day (day)}
									<label class="border-input flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
										<input
											type="checkbox"
											value={day}
											checked={$form.restDays.includes(day)}
											onchange={() => toggleRestDay(day)}
										/>
										{DTR_WEEK_DAY_LABELS[day]}
									</label>
								{/each}
							</div>
							{#each $form.restDays as day (day)}
								<input type="hidden" name="restDays" value={day} />
							{/each}
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="standardWorkMinutes">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>Standard work hours per day</Form.Label>
							<Input
								{...props}
								type="number"
								min="1"
								max="12"
								step="0.5"
								value={standardWorkHours}
								oninput={(event) => {
									const value = Number((event.currentTarget as HTMLInputElement).value);
									$form.standardWorkMinutes = Number.isFinite(value)
										? Math.round(value * 60)
										: $form.standardWorkMinutes;
								}}
							/>
							<p class="text-muted-foreground text-xs">
								Used later for undertime and overtime calculations. Stored as {$form.standardWorkMinutes}
								minutes.
							</p>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<div class="space-y-4">
					<div>
						<p class="text-sm font-medium">Lunch break</p>
						<p class="text-muted-foreground text-sm">
							Deducted from worked hours when time in and time out span this window.
						</p>
					</div>
					<div class="grid gap-5 sm:grid-cols-2">
						<Form.Field form={superform} name="lunchBreakStart">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Lunch break start</Form.Label>
									<Input {...props} type="time" class="h-10" bind:value={$form.lunchBreakStart} />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>

						<Form.Field form={superform} name="lunchBreakEnd">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Lunch break end</Form.Label>
									<Input {...props} type="time" class="h-10" bind:value={$form.lunchBreakEnd} />
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>
					</div>
				</div>

				<Button type="submit" class="h-10" disabled={submitting}>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Saving schedule...
					{:else}
						Save work schedule
					{/if}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
