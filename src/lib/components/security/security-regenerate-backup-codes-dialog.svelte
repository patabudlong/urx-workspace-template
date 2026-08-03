<script lang="ts">
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PasswordInput from '$lib/components/password-input.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { isAuthRateLimitMessage } from '$lib/shared/auth-messages';
	import { twoFactorRegenerateBackupCodesSchema } from '$lib/shared/schemas/security';
	import {
		CURRENT_PASSWORD_INVALID_MESSAGE,
		TWO_FACTOR_BACKUP_CODES_REGENERATED_MESSAGE
	} from '$lib/shared/security-messages';
	import type { PageData } from '../../../routes/(app)/(settings)/security/$types';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let {
		open = $bindable(false),
		data,
		onBackupCodes
	}: {
		open?: boolean;
		data: PageData;
		onBackupCodes: (codes: string[]) => void;
	} = $props();

	let submitting = $state(false);
	let formRateLimited = $state(false);

	const superform = superForm(untrack(() => data.regenerateBackupCodesForm), {
		id: 'regenerateBackupCodesForm',
		validators: zod4Client(twoFactorRegenerateBackupCodesSchema),
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

	const { enhance, form, message: formMessage } = superform;

	const formError = $derived(
		$formMessage &&
			$formMessage !== TWO_FACTOR_BACKUP_CODES_REGENERATED_MESSAGE &&
			!isAuthRateLimitMessage($formMessage)
			? $formMessage
			: null
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
		<div class="border-b px-6 pt-8 pb-6 text-center">
			<div
				class="bg-primary/10 mx-auto mb-4 flex size-14 items-center justify-center rounded-full"
			>
				<KeyRoundIcon class="text-primary size-7" aria-hidden="true" />
			</div>
			<Dialog.Header class="space-y-2 text-center sm:text-center">
				<Dialog.Title class="text-xl">Regenerate backup codes</Dialog.Title>
				<Dialog.Description class="text-muted-foreground text-sm leading-relaxed">
					This replaces your existing backup codes. Confirm with your app password.
				</Dialog.Description>
			</Dialog.Header>
		</div>

		<div class="space-y-5 px-6 py-6">
			{#if rateLimitMessage}
				<AuthFormMessageAlert message={rateLimitMessage} bind:limited={formRateLimited} />
			{:else if formError}
				<StatusAlert
					variant="danger"
					title={formError === CURRENT_PASSWORD_INVALID_MESSAGE
						? 'Password is incorrect'
						: 'Could not regenerate codes'}
					description={formError}
				/>
			{/if}

			<form method="POST" action="?/regenerateBackupCodes" use:enhance class="space-y-5">
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

				<Button
					type="submit"
					class="h-10 w-full"
					disabled={submitting || formRateLimited}
					aria-busy={submitting}
				>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Regenerating…
					{:else}
						Regenerate backup codes
					{/if}
				</Button>
			</form>
		</div>
	</Dialog.Content>
</Dialog.Root>
