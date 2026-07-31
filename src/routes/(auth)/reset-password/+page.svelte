<script lang="ts">
	import { createAuthFormOnSubmit } from '$lib/auth/form';
	import { createAuthLoadingState } from '$lib/auth/loading.svelte';
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import FormAlert from '$lib/components/auth/form-alert.svelte';
	import RecaptchaNotice from '$lib/components/auth/recaptcha-notice.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PasswordInput from '$lib/components/password-input.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { resetPasswordClientSchema, type ResetPasswordInput } from '$lib/shared/schemas/auth';
	import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
	import { warmRecaptcha } from '$lib/recaptcha/client';
	import { AUTH_ACTION_BUTTON_CLASS, AUTH_INLINE_LINK_CLASS } from '$lib/auth/ui';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { get } from 'svelte/store';
	import { onMount, untrack } from 'svelte';
	import { superForm, type SuperForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let recaptchaError = $state<string | null>(null);
	let formRateLimited = $state(false);
	const authLoading = createAuthLoadingState();
	const submitDisabled = $derived(authLoading.authBusy || formRateLimited);

	let formStore: SuperForm<ResetPasswordInput>['form'];
	let validateFormFn: SuperForm<ResetPasswordInput>['validateForm'];

	onMount(() => {
		warmRecaptcha(RECAPTCHA_ACTIONS.RESET_PASSWORD);
	});

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(resetPasswordClientSchema),
		onSubmit: createAuthFormOnSubmit({
			getFormData: () => {
				const { token, password } = get(formStore);
				return { token, password };
			},
			clientSchema: resetPasswordClientSchema,
			getValidateForm: () => validateFormFn,
			recaptchaAction: RECAPTCHA_ACTIONS.RESET_PASSWORD,
			onRecaptchaError: (message) => {
				recaptchaError = message;
				warmRecaptcha(RECAPTCHA_ACTIONS.RESET_PASSWORD);
			},
			onBeforeSubmit: () => {
				recaptchaError = null;
			},
			onAuthBusyChange: (busy) => {
				authLoading.setAuthBusy(busy);
			},
			onLoadingReset: () => {
				authLoading.reset();
			}
		}),
		onUpdated: () => {
			authLoading.reset();
			warmRecaptcha(RECAPTCHA_ACTIONS.RESET_PASSWORD);
		},
		onError: () => {
			authLoading.reset();
			warmRecaptcha(RECAPTCHA_ACTIONS.RESET_PASSWORD);
		}
	});
	const { enhance, form, message: formMessage } = superform;

	formStore = form;
	validateFormFn = superform.validateForm;
</script>

<AuthFormPanel
	title="Reset password"
	description="Choose a new password for your workspace account."
>
	<div class="space-y-6">
		{#if !data.tokenValid}
			<FormAlert>This reset link is invalid or has expired.</FormAlert>
			<Button href="/forgot-password" class={AUTH_ACTION_BUTTON_CLASS}>Request a new link</Button>
			<p class="text-muted-foreground text-center text-sm">
				<a href="/login" class={AUTH_INLINE_LINK_CLASS}>Back to sign in</a>
			</p>
		{:else}
			<form method="POST" use:enhance class="space-y-5" novalidate>
				<div class="space-y-5">
					{#if recaptchaError}
						<FormAlert>{recaptchaError}</FormAlert>
					{/if}

					{#if $formMessage}
						<AuthFormMessageAlert message={$formMessage} bind:limited={formRateLimited} />
					{/if}

					<input type="hidden" name="token" value={$form.token} />

					<Form.Field form={superform} name="password">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>New password</Form.Label>
								<PasswordInput
									{...props}
									disabled={submitDisabled}
									bind:value={$form.password}
									showStrength
									autocomplete="new-password"
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Button
						type="submit"
						class={cn(
							AUTH_ACTION_BUTTON_CLASS,
							submitDisabled && 'pointer-events-none cursor-wait'
						)}
						disabled={submitDisabled}
						aria-busy={authLoading.authBusy}
					>
						{#if authLoading.isAuthLoading}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Updating password...
						{:else}
							Update password
						{/if}
					</Button>
					<RecaptchaNotice />
				</div>
			</form>

			<p class="text-muted-foreground text-center text-sm">
				<a href="/login" class={AUTH_INLINE_LINK_CLASS}>Back to sign in</a>
			</p>
		{/if}
	</div>
</AuthFormPanel>
