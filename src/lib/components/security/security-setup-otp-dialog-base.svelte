<script lang="ts">
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import VerificationCodeInput from '$lib/components/auth/verification-code-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { isAuthRateLimitMessage, type AuthRateLimitMessage } from '$lib/shared/auth-messages';
	import {
		TWO_FACTOR_CODE_SENT_MESSAGE,
		TWO_FACTOR_INVALID_CODE_MESSAGE,
		TWO_FACTOR_SEND_FAILED_MESSAGE
	} from '$lib/shared/security-messages';
	import { createVerificationResendCooldown } from '$lib/auth/verification-resend-cooldown.svelte';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import { browser } from '$app/environment';
	import { deserialize } from '$app/forms';
	import { resetSuperformDialogState, whenDialogCloses } from '$lib/forms/superform-dialog';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { Writable } from 'svelte/store';

	type OtpConfirmForm = { code: string };

	let {
		open = $bindable(false),
		submitting = $bindable(false),
		method,
		confirmAction,
		sendAction,
		codeSent = $bindable(false),
		superform,
		codeField
	}: {
		open?: boolean;
		submitting?: boolean;
		method: 'sms' | 'email';
		confirmAction: string;
		sendAction: string;
		codeSent?: boolean;
		superform: SuperForm<OtpConfirmForm>;
		codeField: Writable<string>;
	} = $props();

	let sendingCode = $state(false);
	let sendError = $state<string | null>(null);
	let sendRateLimitMessage = $state<AuthRateLimitMessage | null>(null);
	let sendRateLimited = $state(false);
	let formRateLimited = $state(false);
	let codeInput = $state<{ focus: () => void; typeDigit: (digit: string) => void } | null>(null);
	const resendCooldown = createVerificationResendCooldown({ idleLabel: 'Resend code' });

	const { enhance, message: formMessage, errors, reset } = (() => superform)();

	const formError = $derived(
		$formMessage && !isAuthRateLimitMessage($formMessage) ? $formMessage : null
	);
	const rateLimitMessage = $derived(
		isAuthRateLimitMessage($formMessage) ? $formMessage : null
	);

	const codeInputReady = $derived(codeSent && !submitting && !formRateLimited && !sendRateLimited);

	const requestCodeLabel = $derived.by(() => {
		if (sendingCode) {
			return 'Sending…';
		}

		if (!codeSent) {
			return method === 'sms' ? 'Send code to my phone' : 'Send code to my email';
		}

		return resendCooldown.label;
	});

	async function sendCode() {
		if (!browser) {
			return;
		}

		sendingCode = true;
		sendError = null;
		sendRateLimitMessage = null;

		try {
			const response = await fetch(sendAction, {
				method: 'POST',
				body: new FormData(),
				headers: { accept: 'application/json' }
			});
			const result = deserialize(await response.text());

			if (result.type !== 'success') {
				const error = result.type === 'failure' ? result.data?.error : null;

				if (isAuthRateLimitMessage(error)) {
					sendRateLimitMessage = error;
					resendCooldown.start(error.retryAfterSeconds);
					return;
				}

				sendError =
					typeof error === 'string' ? error : TWO_FACTOR_SEND_FAILED_MESSAGE;
				return;
			}

			codeSent = true;
			resendCooldown.start();
		} catch {
			sendError = TWO_FACTOR_SEND_FAILED_MESSAGE;
		} finally {
			sendingCode = false;
		}
	}

	$effect(() => {
		if (!browser || !open || !codeInputReady) {
			return;
		}

		requestAnimationFrame(() => {
			codeInput?.focus();
		});
	});

	function resetDialogState() {
		resetSuperformDialogState({ reset, errors });
		submitting = false;
		formRateLimited = false;
		sendRateLimited = false;
		sendRateLimitMessage = null;
		resendCooldown.reset();
		codeSent = false;
		sendError = null;
	}

	function handleOpenAutoFocus(event: Event) {
		event.preventDefault();

		if (!codeInputReady) {
			return;
		}

		requestAnimationFrame(() => {
			codeInput?.focus();
		});
	}

	$effect(() => {
		if (!browser || !open || !codeInputReady) {
			return;
		}

		function onWindowKeyDown(event: KeyboardEvent) {
			if (event.metaKey || event.ctrlKey || event.altKey || event.defaultPrevented) {
				return;
			}

			if (!/^\d$/.test(event.key)) {
				return;
			}

			const active = document.activeElement;

			if (
				active instanceof HTMLInputElement &&
				active.hasAttribute('data-verification-code-input')
			) {
				return;
			}

			event.preventDefault();
			codeInput?.typeDigit(event.key);
		}

		window.addEventListener('keydown', onWindowKeyDown);
		return () => window.removeEventListener('keydown', onWindowKeyDown);
	});
</script>

<Dialog.Root
	bind:open
	onOpenChange={(value) => whenDialogCloses(value, resetDialogState)}
>
	<Dialog.Content
		class="gap-0 overflow-hidden p-0 sm:max-w-md"
		onOpenAutoFocus={handleOpenAutoFocus}
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
					{#if codeSent}
						Enter the 6-digit code we sent to your {method === 'sms' ? 'phone' : 'email'}.
					{:else}
						We'll send a 6-digit code to your {method === 'sms' ? 'phone' : 'email'} when you're
						ready.
					{/if}
				</Dialog.Description>
			</Dialog.Header>
		</div>

		<div class="space-y-5 px-6 py-6">
			{#if sendRateLimitMessage}
				<AuthFormMessageAlert
					message={sendRateLimitMessage}
					bind:limited={sendRateLimited}
				/>
			{:else if sendError}
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

			{#if !codeSent}
				<Button
					type="button"
					class="h-10 w-full"
					disabled={sendingCode || sendRateLimited || resendCooldown.active}
					onclick={sendCode}
				>
					{#if sendingCode}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					{/if}
					{requestCodeLabel}
				</Button>
			{:else}
				<form method="POST" action={confirmAction} use:enhance class="space-y-5">
					<Form.Field form={superform} name="code">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required class="sr-only">Verification code</Form.Label>
								<VerificationCodeInput
									bind:this={codeInput}
									id={props.id}
									name={props.name}
									bind:value={$codeField}
									disabled={!codeInputReady}
									autofocus={open && codeInputReady}
									aria-invalid={$errors.code?.length ? 'true' : undefined}
									aria-describedby={props['aria-describedby']}
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
							disabled={sendingCode || sendRateLimited || resendCooldown.active}
							onclick={sendCode}
						>
							{#if sendingCode}
								<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							{/if}
							{requestCodeLabel}
						</Button>
						<Button
							type="submit"
							class="h-10 flex-1"
							disabled={!codeInputReady}
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
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
