<script lang="ts">
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import VerificationCodeInput from '$lib/components/auth/verification-code-input.svelte';
	import PasswordInput from '$lib/components/password-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { isAuthRateLimitMessage } from '$lib/shared/auth-messages';
	import {
		twoFactorDisableWithCodeSchema,
		twoFactorDisableWithPasswordSchema
	} from '$lib/shared/schemas/security';
	import {
		CURRENT_PASSWORD_INVALID_MESSAGE,
		TWO_FACTOR_DISABLE_GOOGLE_DESCRIPTION,
		TWO_FACTOR_DISABLE_PASSWORD_DESCRIPTION,
		TWO_FACTOR_DISABLED_MESSAGE,
		TWO_FACTOR_INVALID_CODE_MESSAGE
	} from '$lib/shared/security-messages';
	import type { PageData } from '../../../routes/(app)/(settings)/security/two-factor/$types';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import ShieldOffIcon from '@lucide/svelte/icons/shield-off';
	import { invalidateAll } from '$app/navigation';
	import { resetSuperformDialogState, whenDialogCloses } from '$lib/forms/superform-dialog';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let {
		open = $bindable(false),
		data
	}: {
		open?: boolean;
		data: PageData;
	} = $props();

	let submitting = $state(false);
	let formRateLimited = $state(false);
	let useBackupCode = $state(false);

	const requiresPassword = $derived(data.security.hasAppPassword);
	const totpEnabled = $derived(data.security.twoFactor.totpEnabled);
	const hasBackupCodes = $derived(data.security.twoFactor.hasBackupCodes);
	const canChooseVerificationMethod = $derived(
		!requiresPassword && totpEnabled && hasBackupCodes
	);
	const description = $derived(
		requiresPassword
			? TWO_FACTOR_DISABLE_PASSWORD_DESCRIPTION
			: useBackupCode
				? 'Enter one of your backup codes to confirm. Your account will only use Google sign-in.'
				: canChooseVerificationMethod
					? 'Choose how to confirm, then disable two-factor authentication.'
					: TWO_FACTOR_DISABLE_GOOGLE_DESCRIPTION
	);

	const superform = superForm(untrack(() => data.disableTwoFactorForm), {
		id: 'disableTwoFactorForm',
		validators: (() =>
			zod4Client(
				requiresPassword
					? twoFactorDisableWithPasswordSchema
					: twoFactorDisableWithCodeSchema
			))(),
		validationMethod: 'submit-only',
		onSubmit: () => {
			submitting = true;
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === TWO_FACTOR_DISABLED_MESSAGE) {
				await invalidateAll();
				open = false;
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage, errors, reset } = superform;

	const formError = $derived(
		$formMessage &&
			$formMessage !== TWO_FACTOR_DISABLED_MESSAGE &&
			!isAuthRateLimitMessage($formMessage)
			? $formMessage
			: null
	);
	const rateLimitMessage = $derived(
		isAuthRateLimitMessage($formMessage) ? $formMessage : null
	);

	function resetDialogState() {
		resetSuperformDialogState({ reset, errors });
		submitting = false;
		formRateLimited = false;
		useBackupCode = false;
	}

	function selectVerificationMode(mode: 'totp' | 'backup') {
		const nextUseBackupCode = mode === 'backup';

		if (nextUseBackupCode === useBackupCode) {
			return;
		}

		useBackupCode = nextUseBackupCode;
		$form.code = '';
	}

	$effect(() => {
		if (requiresPassword) {
			$form.method = undefined;
			return;
		}

		$form.method = useBackupCode ? 'backup' : totpEnabled ? 'totp' : 'backup';
	});
</script>

<Dialog.Root
	bind:open
	onOpenChange={(value) => whenDialogCloses(value, resetDialogState)}
>
	<Dialog.Content
		class="gap-0 overflow-hidden p-0 sm:max-w-md"
		onOpenAutoFocus={(event) => event.preventDefault()}
	>
		<div class="bg-destructive/5 border-destructive/10 border-b px-6 pt-8 pb-6 text-center">
			<div
				class="bg-destructive/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
			>
				<ShieldOffIcon class="text-destructive size-7" aria-hidden="true" />
			</div>
			<Dialog.Header class="space-y-2 text-center sm:text-center">
				<Dialog.Title class="text-xl">Disable two-factor authentication</Dialog.Title>
				<Dialog.Description class="text-muted-foreground text-sm leading-relaxed">
					{description}
				</Dialog.Description>
			</Dialog.Header>
		</div>

		<div class="space-y-5 px-6 py-6">
			{#if rateLimitMessage}
				<AuthFormMessageAlert message={rateLimitMessage} bind:limited={formRateLimited} />
			{:else if formError}
				<StatusAlert
					variant="danger"
					title={
						formError === CURRENT_PASSWORD_INVALID_MESSAGE
							? 'Password is incorrect'
							: formError === TWO_FACTOR_INVALID_CODE_MESSAGE
								? 'Verification failed'
								: 'Could not disable 2FA'
					}
					description={formError}
				/>
			{/if}

			<form method="POST" action="?/disableTwoFactor" use:enhance class="space-y-5">
				{#if !requiresPassword}
					<input type="hidden" name="method" value={$form.method ?? ''} />
				{/if}

				{#if canChooseVerificationMethod}
					<div class="space-y-2">
						<Label>Confirm with</Label>
						<div class="flex gap-2">
							<Button
								type="button"
								variant={!useBackupCode ? 'default' : 'outline'}
								class="h-10 flex-1"
								disabled={submitting || formRateLimited}
								onclick={() => selectVerificationMode('totp')}
							>
								Authenticator app
							</Button>
							<Button
								type="button"
								variant={useBackupCode ? 'default' : 'outline'}
								class="h-10 flex-1"
								disabled={submitting || formRateLimited}
								onclick={() => selectVerificationMode('backup')}
							>
								Backup code
							</Button>
						</div>
					</div>
				{/if}

				{#if requiresPassword}
					<Form.Field form={superform} name="password">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>App password</Form.Label>
								<PasswordInput
									{...props}
									disabled={submitting || formRateLimited}
									bind:value={$form.password}
									autocomplete="current-password"
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>
				{:else if useBackupCode}
					<Form.Field form={superform} name="code">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Backup code</Form.Label>
								<Input
									{...props}
									disabled={submitting || formRateLimited}
									bind:value={$form.code}
									autocomplete="one-time-code"
									class="font-mono uppercase"
								/>
							{/snippet}
						</Form.Control>
						<Form.Description>Enter a code in the format XXXX-XXXX.</Form.Description>
						<SingleFieldErrors />
					</Form.Field>
				{:else}
					<Form.Field form={superform} name="code">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Authenticator code</Form.Label>
								<VerificationCodeInput
									{...props}
									disabled={submitting || formRateLimited}
									bind:value={$form.code}
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>
				{/if}

				<Button
					type="submit"
					variant="destructive"
					class="h-10 w-full"
					disabled={submitting || formRateLimited}
					aria-busy={submitting}
				>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Disabling…
					{:else}
						Disable two-factor authentication
					{/if}
				</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
