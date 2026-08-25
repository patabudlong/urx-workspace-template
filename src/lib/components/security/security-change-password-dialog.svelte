<script lang="ts">
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PasswordInput from '$lib/components/password-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { isAuthRateLimitMessage } from '$lib/shared/auth-messages';
	import { changePasswordSchema } from '$lib/shared/schemas/security';
	import {
		CURRENT_PASSWORD_INVALID_MESSAGE,
		PASSWORD_CHANGE_FAILED_MESSAGE,
		PASSWORD_CHANGED_MESSAGE
	} from '$lib/shared/security-messages';
	import type { PageData } from '../../../routes/(app)/(settings)/security/password/$types';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
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

	const superform = superForm(untrack(() => data.changePasswordForm), {
		id: 'changePasswordForm',
		validators: zod4Client(changePasswordSchema),
		validationMethod: 'submit-only',
		autoFocusOnError: false,
		scrollToError: 'off',
		resetForm: true,
		onSubmit: () => {
			submitting = true;
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (updatedForm.message === PASSWORD_CHANGED_MESSAGE) {
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
			$formMessage !== PASSWORD_CHANGED_MESSAGE &&
			!isAuthRateLimitMessage($formMessage)
			? typeof $formMessage === 'string'
				? $formMessage
				: null
			: null
	);

	const rateLimitMessage = $derived(
		isAuthRateLimitMessage($formMessage) ? $formMessage : null
	);

	const errorTitle = $derived(
		formError === CURRENT_PASSWORD_INVALID_MESSAGE
			? 'Current password is incorrect'
			: formError === PASSWORD_CHANGE_FAILED_MESSAGE
				? 'Password update failed'
				: 'Could not update password'
	);

	function resetDialogState() {
		resetSuperformDialogState({ reset, errors });
		submitting = false;
		formRateLimited = false;
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
				<KeyRoundIcon class="text-primary size-7" aria-hidden="true" />
			</div>
			<Dialog.Header class="space-y-2 text-center sm:text-center">
				<Dialog.Title class="text-xl">Change password</Dialog.Title>
				<Dialog.Description class="text-muted-foreground text-sm leading-relaxed">
					Enter your current password, then choose a new one that meets the requirements below.
				</Dialog.Description>
			</Dialog.Header>
		</div>

		<div class="space-y-5 px-6 py-6">
			{#if rateLimitMessage}
				<AuthFormMessageAlert message={rateLimitMessage} bind:limited={formRateLimited} />
			{:else if formError}
				<StatusAlert variant="danger" title={errorTitle} description={formError} />
			{/if}

			<form method="POST" action="?/changePassword" use:enhance class="space-y-5">
				<Form.Field form={superform} name="currentPassword">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>Current password</Form.Label>
							<PasswordInput
								{...props}
								disabled={submitting || formRateLimited}
								bind:value={$form.currentPassword}
								autocomplete="current-password"
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="newPassword">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>New password</Form.Label>
							<PasswordInput
								{...props}
								disabled={submitting || formRateLimited}
								bind:value={$form.newPassword}
								showStrength
								showReuseHint
								autocomplete="new-password"
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<Button
					type="submit"
					class="h-10 w-full"
					disabled={submitting || formRateLimited}
					aria-busy={submitting}
				>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Updating password…
					{:else}
						Update password
					{/if}
				</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
