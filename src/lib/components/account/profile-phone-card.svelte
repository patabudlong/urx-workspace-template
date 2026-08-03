<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import VerificationCodeInput from '$lib/components/auth/verification-code-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		PHONE_ALREADY_IN_USE_MESSAGE,
		PHONE_NUMBER_REQUIRED_MESSAGE,
		PHONE_UPDATED_MESSAGE,
		PHONE_UPDATE_FAILED_MESSAGE,
		PHONE_VERIFICATION_ALREADY_VERIFIED_MESSAGE,
		PHONE_VERIFICATION_INVALID_MESSAGE,
		PHONE_VERIFICATION_NOT_CONFIGURED_MESSAGE,
		PHONE_VERIFICATION_SEND_FAILED_MESSAGE,
		PHONE_VERIFICATION_SENT_MESSAGE,
		PHONE_VERIFICATION_THROTTLED_MESSAGE,
		PHONE_VERIFIED_MESSAGE
	} from '$lib/shared/account-messages';
	import type { PageData } from '../../../routes/(app)/(settings)/account/$types';
	import {
		updatePhoneNumberSchema,
		verifyPhoneSchema,
		type UserProfile
	} from '$lib/shared/schemas/account';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data, profile }: { data: PageData; profile: UserProfile } = $props();

	let savingPhone = $state(false);
	let resendingCode = $state(false);
	let verifyingCode = $state(false);
	let phoneSaveSuccess = $state(false);
	let verifySuccess = $state(false);

	const phoneSuperform = superForm(untrack(() => data.phoneForm), {
		id: 'phoneForm',
		validators: zod4Client(updatePhoneNumberSchema),
		resetForm: false,
		onSubmit: () => {
			savingPhone = true;
			phoneSaveSuccess = false;
		},
		onUpdated: async ({ form: updatedForm }) => {
			savingPhone = false;

			if (updatedForm.message === PHONE_UPDATED_MESSAGE) {
				phoneSaveSuccess = true;
				verifySuccess = false;
				await invalidateAll();
			}
		},
		onError: () => {
			savingPhone = false;
		}
	});

	const verifySuperform = superForm(untrack(() => data.verifyPhoneForm), {
		id: 'verifyPhoneForm',
		validators: zod4Client(verifyPhoneSchema),
		resetForm: true,
		onSubmit: () => {
			verifySuccess = false;
			verifyingCode = true;
		},
		onUpdated: async ({ form: updatedForm }) => {
			verifyingCode = false;

			if (updatedForm.message === PHONE_VERIFIED_MESSAGE) {
				verifySuccess = true;
				phoneSaveSuccess = false;
				await invalidateAll();
			}
		},
		onError: () => {
			verifyingCode = false;
		}
	});

	const resendSuperform = superForm(untrack(() => data.resendPhoneForm), {
		id: 'resendPhoneForm',
		resetForm: false,
		onSubmit: () => {
			resendingCode = true;
		},
		onUpdated: async ({ form: updatedForm }) => {
			resendingCode = false;

			if (updatedForm.message === PHONE_VERIFICATION_SENT_MESSAGE) {
				verifySuccess = false;
			}
		},
		onError: () => {
			resendingCode = false;
		}
	});

	const {
		enhance: enhancePhone,
		form: phoneForm,
		message: phoneFormMessage
	} = phoneSuperform;
	const {
		enhance: enhanceVerify,
		form: verifyForm,
		message: verifyFormMessage
	} = verifySuperform;
	const { enhance: enhanceResend, message: resendFormMessage } = resendSuperform;

	const phoneFormError = $derived(
		typeof $phoneFormMessage === 'string' &&
			$phoneFormMessage.length > 0 &&
			$phoneFormMessage !== PHONE_UPDATED_MESSAGE
			? $phoneFormMessage
			: null
	);

	const verifyFormError = $derived(
		typeof $verifyFormMessage === 'string' &&
			$verifyFormMessage.length > 0 &&
			$verifyFormMessage !== PHONE_VERIFIED_MESSAGE
			? $verifyFormMessage
			: null
	);

	const resendFormError = $derived(
		typeof $resendFormMessage === 'string' &&
			$resendFormMessage.length > 0 &&
			$resendFormMessage !== PHONE_VERIFICATION_SENT_MESSAGE
			? $resendFormMessage
			: null
	);

	const needsVerification = $derived(Boolean(profile.phoneNumber) && !profile.phoneVerified);
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Contact number</Card.Title>
		<Card.Description>
			Add a mobile number for account recovery and notifications. Verification is required.
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-6">
		<form method="POST" action="?/updatePhoneNumber" use:enhancePhone class="max-w-xl space-y-5">
			{#if phoneSaveSuccess}
				<StatusAlert
					variant="success"
					title="Contact number saved"
					description={needsVerification
						? 'We sent a verification code by SMS. Enter it below to confirm your number.'
						: 'Your contact number has been updated.'}
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

			<Form.Field form={phoneSuperform} name="phoneNumber">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Mobile number</Form.Label>
						<Input
							{...props}
							type="tel"
							autocomplete="tel"
							disabled={savingPhone}
							bind:value={$phoneForm.phoneNumber}
						/>
					{/snippet}
				</Form.Control>
				<SingleFieldErrors />
			</Form.Field>

			<p class="text-muted-foreground text-xs leading-relaxed">
				Use international format with country code (e.g. +639171234567). Local dev SMS appears in
				SMSPit at http://localhost:2875 when SMS_PROVIDER=smspitt.
			</p>

			<Button type="submit" class="h-10" disabled={savingPhone}>
				{#if savingPhone}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Saving…
				{:else}
					Save contact number
				{/if}
			</Button>
		</form>

		{#if needsVerification}
			<div class="border-border max-w-xl space-y-5 border-t pt-6">
				<div class="space-y-1">
					<h4 class="text-sm font-semibold">Verify your number</h4>
					<p class="text-muted-foreground text-sm">
						Enter the 6-digit code sent to {profile.phoneNumber}.
					</p>
				</div>

				{#if verifySuccess}
					<StatusAlert
						variant="success"
						title="Contact number verified"
						description="Your mobile number is confirmed for this account."
					/>
				{:else if verifyFormError}
					<StatusAlert
						variant="danger"
						title={verifyFormError === PHONE_VERIFICATION_INVALID_MESSAGE
							? 'Invalid verification code'
							: verifyFormError === PHONE_VERIFICATION_ALREADY_VERIFIED_MESSAGE
								? 'Already verified'
								: 'Verification failed'}
						description={verifyFormError}
					/>
				{:else if resendFormError}
					<StatusAlert
						variant="danger"
						title={resendFormError === PHONE_VERIFICATION_THROTTLED_MESSAGE
							? 'Too many attempts'
							: resendFormError === PHONE_VERIFICATION_NOT_CONFIGURED_MESSAGE
								? 'SMS not configured'
								: 'Could not send code'}
						description={resendFormError}
					/>
				{:else if $resendFormMessage === PHONE_VERIFICATION_SENT_MESSAGE}
					<StatusAlert
						variant="info"
						title="Verification code sent"
						description="Check SMSPit (http://localhost:2875) in local dev or your phone in production."
					/>
				{/if}

				<form method="POST" action="?/verifyPhoneNumber" use:enhanceVerify class="space-y-5">
					<Form.Field form={verifySuperform} name="code">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Verification code</Form.Label>
								<VerificationCodeInput
									{...props}
									disabled={verifyingCode}
									bind:value={$verifyForm.code}
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Button type="submit" class="h-10" disabled={verifyingCode}>
						{#if verifyingCode}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Verifying…
						{:else}
							Verify number
						{/if}
					</Button>
				</form>

				<form method="POST" action="?/resendPhoneVerification" use:enhanceResend>
					<Button
						type="submit"
						variant="outline"
						class="h-10"
						disabled={resendingCode || verifyingCode}
					>
						{#if resendingCode}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Sending…
						{:else}
							Resend code
						{/if}
					</Button>
				</form>
			</div>
		{:else if profile.phoneNumber && profile.phoneVerified}
			<StatusAlert
				variant="success"
				title="Contact number verified"
				description="{profile.phoneNumber} is confirmed for this account."
			/>
		{/if}
	</Card.Content>
</Card.Root>
