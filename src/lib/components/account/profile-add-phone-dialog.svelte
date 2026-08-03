<script lang="ts">
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PhoneCountryInput from '$lib/components/onboarding/phone-country-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import {
		PHONE_ALREADY_IN_USE_MESSAGE,
		PHONE_UPDATED_MESSAGE,
		PHONE_UPDATE_FAILED_MESSAGE
	} from '$lib/shared/account-messages';
	import { isAuthRateLimitMessage } from '$lib/shared/auth-messages';
	import { updatePhoneNumberSchema } from '$lib/shared/schemas/account';
	import type { PageData } from '../../../routes/(app)/(settings)/account/$types';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let {
		open = $bindable(false),
		data,
		mode = 'add',
		onSaved
	}: {
		open?: boolean;
		data: PageData;
		mode?: 'add' | 'change';
		onSaved?: () => void;
	} = $props();

	let savingPhone = $state(false);
	let phoneFormRateLimited = $state(false);

	const phoneSuperform = superForm(untrack(() => data.phoneForm), {
		id: 'phoneForm',
		validators: zod4Client(updatePhoneNumberSchema),
		resetForm: false,
		onSubmit: () => {
			savingPhone = true;
		},
		onUpdated: async ({ form: updatedForm }) => {
			savingPhone = false;

			if (updatedForm.message === PHONE_UPDATED_MESSAGE) {
				await invalidateAll();
				open = false;
				onSaved?.();
			}
		},
		onError: () => {
			savingPhone = false;
		}
	});

	const {
		enhance: enhancePhone,
		form: phoneForm,
		message: phoneFormMessage
	} = phoneSuperform;

	const phoneFormError = $derived(
		$phoneFormMessage &&
			$phoneFormMessage !== PHONE_UPDATED_MESSAGE &&
			!isAuthRateLimitMessage($phoneFormMessage)
			? typeof $phoneFormMessage === 'string'
				? $phoneFormMessage
				: null
			: null
	);

	const phoneRateLimitMessage = $derived(
		isAuthRateLimitMessage($phoneFormMessage) ? $phoneFormMessage : null
	);

	const dialogTitle = $derived(mode === 'add' ? 'Add contact number' : 'Change contact number');
	const dialogDescription = $derived(
		mode === 'add'
			? 'Enter your mobile number for account recovery and notifications.'
			: 'Update your mobile number. Verification is required after any change.'
	);
	const submitLabel = $derived(mode === 'add' ? 'Add contact number' : 'Save contact number');
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="gap-0 overflow-hidden p-0 sm:max-w-md">
		<div class="bg-primary/5 border-primary/10 border-b px-6 pt-8 pb-6 text-center">
			<div
				class="bg-primary/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
			>
				<PhoneIcon class="text-primary size-7" aria-hidden="true" />
			</div>
			<Dialog.Header class="space-y-2 text-center sm:text-center">
				<Dialog.Title class="text-xl">{dialogTitle}</Dialog.Title>
				<Dialog.Description class="text-muted-foreground text-sm leading-relaxed">
					{dialogDescription}
				</Dialog.Description>
			</Dialog.Header>
		</div>

		<div class="space-y-5 px-6 py-6">
			{#if phoneRateLimitMessage}
				<AuthFormMessageAlert
					message={phoneRateLimitMessage}
					bind:limited={phoneFormRateLimited}
				/>
			{:else if phoneFormError}
				<StatusAlert
					variant="danger"
					title={phoneFormError === PHONE_ALREADY_IN_USE_MESSAGE
						? 'Number already in use'
						: 'Could not save contact number'}
					description={phoneFormError}
				/>
			{/if}

			<form method="POST" action="?/updatePhoneNumber" use:enhancePhone class="space-y-5">
				<Form.Field form={phoneSuperform} name="phoneNumber">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Mobile number</Form.Label>
							<PhoneCountryInput
								id={props.id}
								name={props.name}
								aria-invalid={props['aria-invalid']}
								aria-describedby={props['aria-describedby']}
								disabled={savingPhone}
								bind:value={$phoneForm.phoneNumber}
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<p class="text-muted-foreground text-xs leading-relaxed">
					Choose your country and enter your mobile number. Local dev SMS appears in SMSPit at
					http://localhost:2875 when SMS_PROVIDER=smspitt.
				</p>

				<Button type="submit" class="h-10 w-full" disabled={savingPhone || phoneFormRateLimited}>
					{#if savingPhone}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Saving…
					{:else}
						{submitLabel}
					{/if}
				</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
