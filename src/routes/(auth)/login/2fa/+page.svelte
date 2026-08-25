<script lang="ts">
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import VerificationCodeInput from '$lib/components/auth/verification-code-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import GradientButton from '$lib/components/gradient-button.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { AUTH_ACTION_BUTTON_CLASS } from '$lib/auth/ui';
	import { cn } from '$lib/utils.js';
	import { twoFactorLoginChallengeSchema } from '$lib/shared/schemas/security';
	import {
		INVALID_VERIFICATION_CODE_MESSAGE,
		isAuthRateLimitMessage
	} from '$lib/shared/auth-messages';
	import {
		TWO_FACTOR_CODE_SENT_MESSAGE
	} from '$lib/shared/security-messages';
	import { TWO_FACTOR_METHODS } from '$lib/shared/models/two-factor';
	import { TRUSTED_DEVICE_TTL_DAYS } from '$lib/shared/models/two-factor';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { deserialize } from '$app/forms';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let sendingCode = $state(false);
	let codeSendSuccess = $state(false);
	let formRateLimited = $state(false);
	let useBackupCode = $state(false);

	const superform = superForm(untrack(() => data.form), {
		id: 'twoFactorLoginForm',
		validators: zod4Client(twoFactorLoginChallengeSchema),
		validationMethod: 'submit-only',
		onSubmit: () => {
			submitting = true;
		},
		onUpdated: () => {
			submitting = false;
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage, errors } = superform;

	const sendCodeMessage = $derived(
		codeSendSuccess || $formMessage === TWO_FACTOR_CODE_SENT_MESSAGE ? TWO_FACTOR_CODE_SENT_MESSAGE : null
	);

	const formError = $derived(
		$formMessage &&
			$formMessage !== TWO_FACTOR_CODE_SENT_MESSAGE &&
			!isAuthRateLimitMessage($formMessage)
			? $formMessage
			: null
	);

	const rateLimitMessage = $derived(
		isAuthRateLimitMessage($formMessage) ? $formMessage : null
	);

	const selectedMethod = $derived(
		useBackupCode ? TWO_FACTOR_METHODS.BACKUP : $form.method
	);

	const canSendSms = $derived(data.methods.includes(TWO_FACTOR_METHODS.SMS));
	const canSendEmail = $derived(data.methods.includes(TWO_FACTOR_METHODS.EMAIL));
	const canUseTotp = $derived(data.methods.includes(TWO_FACTOR_METHODS.TOTP));

	$effect(() => {
		$form.method = selectedMethod;
	});

	function methodLabel(method: string): string {
		switch (method) {
			case TWO_FACTOR_METHODS.TOTP:
				return 'Authenticator app';
			case TWO_FACTOR_METHODS.SMS:
				return 'SMS';
			case TWO_FACTOR_METHODS.EMAIL:
				return 'Email';
			case TWO_FACTOR_METHODS.BACKUP:
				return 'Backup code';
			default:
				return method;
		}
	}
</script>

<AuthFormPanel
	title="Two-factor authentication"
	description="Enter a verification code to finish signing in."
>
	<div class="space-y-6">
		{#if rateLimitMessage}
			<AuthFormMessageAlert message={rateLimitMessage} bind:limited={formRateLimited} />
		{:else if sendCodeMessage}
			<StatusAlert
				variant="info"
				title="Check your {selectedMethod === TWO_FACTOR_METHODS.SMS ? 'phone' : 'email'}"
				description={TWO_FACTOR_CODE_SENT_MESSAGE}
			/>
		{:else if formError}
			<StatusAlert
				variant="danger"
				title="Verification failed"
				description={formError === INVALID_VERIFICATION_CODE_MESSAGE
					? INVALID_VERIFICATION_CODE_MESSAGE
					: formError}
			/>
		{/if}

		{#if !useBackupCode && (canUseTotp || canSendSms || canSendEmail)}
			<div class="space-y-2">
				<Label>Verification method</Label>
				<div class="flex flex-wrap gap-2">
					{#if canUseTotp}
						<Button
							type="button"
							variant={$form.method === TWO_FACTOR_METHODS.TOTP ? 'default' : 'outline'}
							class="h-10"
							onclick={() => {
								useBackupCode = false;
								$form.method = TWO_FACTOR_METHODS.TOTP;
							}}
						>
							Authenticator app
						</Button>
					{/if}
					{#if canSendSms}
						<Button
							type="button"
							variant={$form.method === TWO_FACTOR_METHODS.SMS ? 'default' : 'outline'}
							class="h-10"
							onclick={() => {
								useBackupCode = false;
								$form.method = TWO_FACTOR_METHODS.SMS;
							}}
						>
							SMS
						</Button>
					{/if}
					{#if canSendEmail}
						<Button
							type="button"
							variant={$form.method === TWO_FACTOR_METHODS.EMAIL ? 'default' : 'outline'}
							class="h-10"
							onclick={() => {
								useBackupCode = false;
								$form.method = TWO_FACTOR_METHODS.EMAIL;
							}}
						>
							Email
						</Button>
					{/if}
				</div>
			</div>
		{/if}

		{#if !useBackupCode && ($form.method === TWO_FACTOR_METHODS.SMS || $form.method === TWO_FACTOR_METHODS.EMAIL)}
			<Button
				type="button"
				variant="outline"
				class={cn(
					'h-10 w-full',
					$form.method === TWO_FACTOR_METHODS.EMAIL &&
						'border-primary bg-primary/5 text-primary ring-primary/20 ring-2 hover:bg-primary/10 hover:text-primary'
				)}
				disabled={sendingCode || submitting || formRateLimited}
				onclick={async () => {
					sendingCode = true;
					codeSendSuccess = false;
					try {
						const response = await fetch('?/sendCode', {
							method: 'POST',
							headers: { accept: 'application/json' },
							body: new URLSearchParams({ method: $form.method })
						});
						const result = deserialize(await response.text());
						if (result.type === 'success') {
							codeSendSuccess = true;
						}
					} finally {
						sendingCode = false;
					}
				}}
			>
				{#if sendingCode}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Sending code…
				{:else}
					Send code via {methodLabel($form.method)}
				{/if}
			</Button>
		{/if}

		<form method="POST" action="?/verify" use:enhance class="space-y-5">
			<input type="hidden" name="method" value={selectedMethod} />

			{#if useBackupCode}
				<Form.Field form={superform} name="code">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>Backup code</Form.Label>
							<input
								{...props}
								class="border-input bg-background h-10 w-full rounded-lg border px-3 text-sm"
								bind:value={$form.code}
								autocomplete="one-time-code"
								disabled={submitting || formRateLimited}
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>
			{:else if $form.method === TWO_FACTOR_METHODS.TOTP}
				<Form.Field form={superform} name="code">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required class="sr-only">Verification code</Form.Label>
							<VerificationCodeInput
								id={props.id}
								name={props.name}
								bind:value={$form.code}
								disabled={submitting || formRateLimited}
								aria-invalid={$errors.code?.length ? 'true' : undefined}
								aria-describedby={props['aria-describedby']}
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>
			{:else}
				<Form.Field form={superform} name="code">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required class="sr-only">Verification code</Form.Label>
								<VerificationCodeInput
									id={props.id}
									name={props.name}
									bind:value={$form.code}
									disabled={submitting || formRateLimited}
									aria-invalid={$errors.code?.length ? 'true' : undefined}
									aria-describedby={props['aria-describedby']}
								/>
							{/snippet}
						</Form.Control>
					<SingleFieldErrors />
				</Form.Field>
			{/if}

			<div class="flex items-center justify-between gap-4 rounded-lg border p-4">
				<div class="space-y-1">
					<p class="text-sm font-medium">Remember this device</p>
					<p class="text-muted-foreground text-sm">
						Skip two-factor authentication on this device for {TRUSTED_DEVICE_TTL_DAYS} days.
					</p>
				</div>
				<Switch
					checked={$form.rememberDevice ?? false}
					onCheckedChange={(checked) => {
						$form.rememberDevice = checked;
					}}
					disabled={submitting || formRateLimited}
					aria-label="Remember this device for 30 days"
				/>
			</div>

			<GradientButton
				type="submit"
				tone="primary"
				class={AUTH_ACTION_BUTTON_CLASS}
				disabled={submitting || formRateLimited}
				aria-busy={submitting}
			>
				{#if submitting}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Verifying…
				{:else}
					<ShieldCheckIcon class="size-4" aria-hidden="true" />
					Verify and sign in
				{/if}
			</GradientButton>
		</form>

		<p class="text-muted-foreground text-center text-sm">
			{#if useBackupCode}
				<button
					type="button"
					class="text-primary font-medium"
					onclick={() => {
						useBackupCode = false;
						$form.method = data.methods[0] ?? TWO_FACTOR_METHODS.TOTP;
					}}
				>
					Use authenticator or SMS instead
				</button>
			{:else}
				<button
					type="button"
					class="text-primary font-medium"
					onclick={() => {
						useBackupCode = true;
						$form.code = '';
					}}
				>
					Use a backup code
				</button>
			{/if}
		</p>
	</div>
</AuthFormPanel>
