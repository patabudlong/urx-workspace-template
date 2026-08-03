<script lang="ts">
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import VerificationCodeInput from '$lib/components/auth/verification-code-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { isAuthRateLimitMessage } from '$lib/shared/auth-messages';
	import { twoFactorSetupTotpConfirmSchema } from '$lib/shared/schemas/security';
	import { TWO_FACTOR_INVALID_CODE_MESSAGE } from '$lib/shared/security-messages';
	import type { PageData } from '../../../routes/(app)/(settings)/security/$types';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import SmartphoneIcon from '@lucide/svelte/icons/smartphone';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let {
		open = $bindable(false),
		data,
		totpSetup,
		onBackupCodes
	}: {
		open?: boolean;
		data: PageData;
		totpSetup: { qrDataUrl: string; manualKey: string } | null;
		onBackupCodes: (codes: string[]) => void;
	} = $props();

	let submitting = $state(false);
	let formRateLimited = $state(false);

	const superform = superForm(untrack(() => data.confirmTotpForm), {
		id: 'confirmTotpForm',
		validators: zod4Client(twoFactorSetupTotpConfirmSchema),
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
	});

	const { enhance, form, message: formMessage, errors } = superform;

	const formError = $derived(
		$formMessage && !isAuthRateLimitMessage($formMessage) ? $formMessage : null
	);
	const rateLimitMessage = $derived(
		isAuthRateLimitMessage($formMessage) ? $formMessage : null
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="gap-0 overflow-hidden p-0 sm:max-w-md"
		onOpenAutoFocus={(event) => event.preventDefault()}
	>
		<div class="bg-primary/5 border-primary/10 border-b px-6 pt-8 pb-6 text-center">
			<div
				class="bg-primary/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
			>
				<SmartphoneIcon class="text-primary size-7" aria-hidden="true" />
			</div>
			<Dialog.Header class="space-y-2 text-center sm:text-center">
				<Dialog.Title class="text-xl">Authenticator app</Dialog.Title>
				<Dialog.Description class="text-muted-foreground text-sm leading-relaxed">
					Scan the QR code with Google Authenticator or another TOTP app, then enter the 6-digit
					code.
				</Dialog.Description>
			</Dialog.Header>
		</div>

		<div class="space-y-5 px-6 py-6">
			{#if totpSetup}
				<div class="flex flex-col items-center gap-4">
					<img
						src={totpSetup.qrDataUrl}
						alt="QR code for authenticator setup"
						class="rounded-lg border bg-white p-2"
						width="200"
						height="200"
					/>
					<div class="w-full space-y-1 text-center">
						<p class="text-muted-foreground text-xs">Manual entry key</p>
						<p class="font-mono text-sm break-all">{totpSetup.manualKey}</p>
					</div>
				</div>
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

			<form method="POST" action="?/confirmTotpSetup" use:enhance class="space-y-5">
				<Form.Field form={superform} name="code">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required class="sr-only">Verification code</Form.Label>
							<VerificationCodeInput
								{...props}
								bind:value={$form.code}
								disabled={submitting || formRateLimited || !totpSetup}
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<Button
					type="submit"
					class="h-10 w-full"
					disabled={submitting || formRateLimited || !totpSetup}
					aria-busy={submitting}
				>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Verifying…
					{:else}
						Enable authenticator app
					{/if}
				</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
