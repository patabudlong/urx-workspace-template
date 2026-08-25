<script lang="ts">
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import VerificationCodeInput from '$lib/components/auth/verification-code-input.svelte';
	import PhoneNumberDisplay from '$lib/components/phone-number-display.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import {
		PHONE_VERIFICATION_ALREADY_VERIFIED_MESSAGE,
		PHONE_VERIFICATION_INVALID_MESSAGE,
		PHONE_VERIFICATION_NOT_CONFIGURED_MESSAGE,
		PHONE_VERIFICATION_SENT_MESSAGE,
		PHONE_VERIFIED_MESSAGE
	} from '$lib/shared/account-messages';
	import { isAuthRateLimitMessage } from '$lib/shared/auth-messages';
	import { createVerificationResendCooldown } from '$lib/auth/verification-resend-cooldown.svelte';
	import { verifyPhoneSchema } from '$lib/shared/schemas/account';
	import type { PageData } from '../../../routes/(app)/(settings)/account/$types';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import { invalidateAll } from '$app/navigation';
	import { resetSuperformDialogState, whenDialogCloses } from '$lib/forms/superform-dialog';
	import { untrack } from 'svelte';
	import { superForm, formFieldProxy } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let {
		open = $bindable(false),
		data,
		phoneNumber,
		codeSentOnOpen = $bindable(false)
	}: {
		open?: boolean;
		data: PageData;
		phoneNumber: string | null;
		codeSentOnOpen?: boolean;
	} = $props();

	let verifyingCode = $state(false);
	let resendingCode = $state(false);
	let verifySuccess = $state(false);
	let verifyFormRateLimited = $state(false);
	let resendFormRateLimited = $state(false);
	const resendCooldown = createVerificationResendCooldown({ idleLabel: 'Resend code' });

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
		onUpdated: async () => {
			resendingCode = false;
			verifySuccess = false;
		},
		onError: () => {
			resendingCode = false;
		}
	});

	const {
		enhance: enhanceVerify,
		message: verifyFormMessage,
		errors: verifyErrors,
		reset: resetVerifyForm
	} = verifySuperform;
	const { value: verifyCodeField } = formFieldProxy(verifySuperform, 'code');
	const {
		enhance: enhanceResend,
		message: resendFormMessage,
		errors: resendErrors,
		reset: resetResendForm
	} = resendSuperform;

	const verifyFormError = $derived(
		typeof $verifyFormMessage === 'string' &&
			$verifyFormMessage.length > 0 &&
			$verifyFormMessage !== PHONE_VERIFIED_MESSAGE
			? $verifyFormMessage
			: null
	);

	const verifyRateLimitMessage = $derived(
		isAuthRateLimitMessage($verifyFormMessage) ? $verifyFormMessage : null
	);

	const resendFormError = $derived(
		typeof $resendFormMessage === 'string' &&
			$resendFormMessage.length > 0 &&
			$resendFormMessage !== PHONE_VERIFICATION_SENT_MESSAGE
			? $resendFormMessage
			: null
	);

	const resendRateLimitMessage = $derived(
		isAuthRateLimitMessage($resendFormMessage) ? $resendFormMessage : null
	);

	const resendSent = $derived($resendFormMessage === PHONE_VERIFICATION_SENT_MESSAGE);

	$effect(() => {
		if (resendSent) {
			resendCooldown.start();
		}
	});

	$effect(() => {
		if (resendRateLimitMessage) {
			resendCooldown.start(resendRateLimitMessage.retryAfterSeconds);
		}
	});

	const formBusy = $derived(
		verifyingCode ||
			resendingCode ||
			verifyFormRateLimited ||
			resendFormRateLimited ||
			resendCooldown.active
	);

	$effect(() => {
		if (open && codeSentOnOpen) {
			resendCooldown.start();
			codeSentOnOpen = false;
		}
	});

	function resetDialogState() {
		resetSuperformDialogState({ reset: resetVerifyForm, errors: verifyErrors });
		resetSuperformDialogState({ reset: resetResendForm, errors: resendErrors });
		verifyingCode = false;
		resendingCode = false;
		verifySuccess = false;
		verifyFormRateLimited = false;
		resendFormRateLimited = false;
		resendCooldown.reset();
	}

	function closeDialog() {
		open = false;
	}
</script>

<Dialog.Root
	bind:open
	onOpenChange={(value) => whenDialogCloses(value, resetDialogState)}
>
	<Dialog.Content class="gap-0 overflow-hidden p-0 sm:max-w-md">
		<div class="bg-primary/5 border-primary/10 border-b px-6 pt-8 pb-6 text-center">
			<div
				class="bg-primary/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
			>
				<PhoneIcon class="text-primary size-7" aria-hidden="true" />
			</div>
			<Dialog.Header class="space-y-2 text-center sm:text-center">
				<Dialog.Title class="text-xl">Verify your number</Dialog.Title>
				<Dialog.Description class="text-muted-foreground text-sm leading-relaxed">
					{#if verifySuccess}
						Your mobile number is confirmed for this account.
					{:else}
						Enter the 6-digit code we sent by SMS.
					{/if}
				</Dialog.Description>
			</Dialog.Header>
		</div>

		<div class="space-y-5 px-6 py-6">
			{#if phoneNumber}
				<div
					class="bg-muted/40 flex items-center justify-center rounded-lg border px-4 py-3.5"
				>
					<PhoneNumberDisplay phoneNumber={phoneNumber} class="text-base font-medium" />
				</div>
			{/if}

			{#if verifySuccess}
				<StatusAlert
					variant="success"
					title="Contact number verified"
					description="You're all set. This number can be used for account recovery and notifications."
				/>
				<Button type="button" class="h-10 w-full" onclick={closeDialog}>Done</Button>
			{:else}
				{#if verifyRateLimitMessage}
					<AuthFormMessageAlert
						message={verifyRateLimitMessage}
						bind:limited={verifyFormRateLimited}
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
				{:else if resendRateLimitMessage}
					<AuthFormMessageAlert
						message={resendRateLimitMessage}
						bind:limited={resendFormRateLimited}
					/>
				{:else if resendFormError}
					<StatusAlert
						variant="danger"
						title={resendFormError === PHONE_VERIFICATION_NOT_CONFIGURED_MESSAGE
							? 'SMS not configured'
							: 'Could not send code'}
						description={resendFormError}
					/>
				{:else if resendSent}
					<StatusAlert
						variant="info"
						title="New code sent"
						description="Check SMSPit (http://localhost:2875) in local dev or your phone in production."
					/>
				{/if}

				<form method="POST" action="?/verifyPhoneNumber" use:enhanceVerify class="space-y-5">
					<Form.Field form={verifySuperform} name="code">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label class="sr-only">Verification code</Form.Label>
								<VerificationCodeInput
									{...props}
									name={props.name}
									disabled={verifyingCode}
									bind:value={$verifyCodeField}
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Button
						type="submit"
						class={cn('h-10 w-full', verifyingCode && 'pointer-events-none cursor-wait')}
						disabled={formBusy}
					>
						{#if verifyingCode}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Verifying…
						{:else}
							Verify number
						{/if}
					</Button>
				</form>

				<div class="text-center">
					<p class="text-muted-foreground text-sm">Didn't get a code?</p>
					<form method="POST" action="?/resendPhoneVerification" use:enhanceResend class="mt-2">
						<Button
							type="submit"
							variant="link"
							class="h-auto px-0 text-sm"
							disabled={formBusy}
						>
							{#if resendingCode}
								<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
								Sending…
							{:else}
								{resendCooldown.label}
							{/if}
						</Button>
					</form>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
