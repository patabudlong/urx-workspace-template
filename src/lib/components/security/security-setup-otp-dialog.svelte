<script lang="ts">
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import VerificationCodeInput from '$lib/components/auth/verification-code-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { isAuthRateLimitMessage } from '$lib/shared/auth-messages';
	import { twoFactorSetupOtpConfirmSchema } from '$lib/shared/schemas/security';
	import {
		TWO_FACTOR_CODE_SENT_MESSAGE,
		TWO_FACTOR_INVALID_CODE_MESSAGE,
		TWO_FACTOR_SEND_FAILED_MESSAGE
	} from '$lib/shared/security-messages';
	import type { PageData } from '../../../routes/(app)/(settings)/security/$types';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import { invalidateAll } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import { resetSuperformDialogState, whenDialogCloses } from '$lib/forms/superform-dialog';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let {
		open = $bindable(false),
		data,
		method,
		codeSent = $bindable(false),
		onBackupCodes
	}: {
		open?: boolean;
		data: PageData;
		method: 'sms' | 'email';
		codeSent?: boolean;
		onBackupCodes: (codes: string[]) => void;
	} = $props();

	let submitting = $state(false);
	let sendingCode = $state(false);
	let sendError = $state<string | null>(null);
	let formRateLimited = $state(false);

	const confirmFormId = method === 'sms' ? 'confirmSmsForm' : 'confirmEmailForm';
	const confirmAction = method === 'sms' ? '?/confirmSmsSetup' : '?/confirmEmailSetup';
	const sendAction = method === 'sms' ? '?/sendSmsSetupCode' : '?/sendEmailSetupCode';

	const superform = superForm(
		untrack(() => (method === 'sms' ? data.confirmSmsForm : data.confirmEmailForm)),
		{
			id: confirmFormId,
			validators: zod4Client(twoFactorSetupOtpConfirmSchema),
			validationMethod: 'submit-only',
			onSubmit: () => {
				submitting = true;
			},
			onResult: async ({ result }) => {
				submitting = false;

				if (result.type === 'success' && result.data?.backupCodes?.length) {
					onBackupCodes(result.data.backupCodes as string[]);
				}

				if (result.type === 'success') {
					await invalidateAll();
					open = false;
				}
			},
			onError: () => {
				submitting = false;
			}
		}
	);

	const { enhance, form, message: formMessage, errors, reset } = superform;

	const formError = $derived(
		$formMessage && !isAuthRateLimitMessage($formMessage) ? $formMessage : null
	);
	const rateLimitMessage = $derived(
		isAuthRateLimitMessage($formMessage) ? $formMessage : null
	);

	async function sendCode() {
		sendingCode = true;
		sendError = null;

		try {
			const response = await fetch(sendAction, {
				method: 'POST',
				body: new FormData(),
				headers: { accept: 'application/json' }
			});
			const result = deserialize(await response.text());

			if (result.type !== 'success') {
				const failureMessage =
					result.type === 'failure' &&
					result.data &&
					typeof result.data.error === 'string'
						? result.data.error
						: TWO_FACTOR_SEND_FAILED_MESSAGE;
				sendError = failureMessage;
				return;
			}

			codeSent = true;
		} catch {
			sendError = TWO_FACTOR_SEND_FAILED_MESSAGE;
		} finally {
			sendingCode = false;
		}
	}

	$effect(() => {
		if (open && !codeSent) {
			sendCode();
		}
	});

	function resetDialogState() {
		resetSuperformDialogState({ reset, errors });
		submitting = false;
		formRateLimited = false;
		codeSent = false;
		sendError = null;
	}
</script>

<Dialog.Root
	bind:open
	onOpenChange={(value) => whenDialogCloses(value, resetDialogState)}
>
	<Dialog.Content
		class="gap-0 overflow-hidden p-0 sm:max-w-md"
		onOpenAutoFocus={(event) => event.preventDefault()}
	>
		<div class="bg-primary/5 border-primary/10 border-b px-6 pt-8 pb-6 text-center">
			<div
				class="bg-primary/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
			>
				{#if method === 'sms'}
					<PhoneIcon class="text-primary size-7" aria-hidden="true" />
				{:else}
					<MailIcon class="text-primary size-7" aria-hidden="true" />
				{/if}
			</div>
			<Dialog.Header class="space-y-2 text-center sm:text-center">
				<Dialog.Title class="text-xl">
					{method === 'sms' ? 'SMS verification' : 'Email verification'}
				</Dialog.Title>
				<Dialog.Description class="text-muted-foreground text-sm leading-relaxed">
					Enter the 6-digit code we send to your {method === 'sms' ? 'phone' : 'email'}.
				</Dialog.Description>
			</Dialog.Header>
		</div>

		<div class="space-y-5 px-6 py-6">
			{#if sendError}
				<StatusAlert variant="danger" title="Could not send code" description={sendError} />
			{:else if codeSent}
				<StatusAlert
					variant="info"
					title={method === 'sms' ? 'Check your phone' : 'Check your email'}
					description={TWO_FACTOR_CODE_SENT_MESSAGE}
				/>
			{/if}

			{#if rateLimitMessage}
				<AuthFormMessageAlert message={rateLimitMessage} bind:limited={formRateLimited} />
			{:else if formError}
				<StatusAlert
					variant="danger"
					title="Verification failed"
					description={formError === TWO_FACTOR_INVALID_CODE_MESSAGE
						? TWO_FACTOR_INVALID_CODE_MESSAGE
						: formError}
				/>
			{/if}

			<form method="POST" action={confirmAction} use:enhance class="space-y-5">
				<Form.Field form={superform} name="code">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required class="sr-only">Verification code</Form.Label>
							<VerificationCodeInput
								{...props}
								bind:value={$form.code}
								disabled={submitting || formRateLimited || !codeSent}
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<div class="flex gap-2">
					<Button
						type="button"
						variant="outline"
						class="h-10"
						disabled={sendingCode}
						onclick={sendCode}
					>
						{#if sendingCode}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						{/if}
						Resend code
					</Button>
					<Button
						type="submit"
						class="h-10 flex-1"
						disabled={submitting || formRateLimited || !codeSent}
						aria-busy={submitting}
					>
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Verifying…
						{:else}
							Enable {method === 'sms' ? 'SMS' : 'email'}
						{/if}
					</Button>
				</div>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
