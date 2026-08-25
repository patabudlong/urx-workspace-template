<script lang="ts">
	import { createAuthFormOnSubmit } from '$lib/auth/form';
	import { createAuthLoadingState } from '$lib/auth/loading.svelte';
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import RecaptchaNotice from '$lib/components/auth/recaptcha-notice.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import GradientButton from '$lib/components/gradient-button.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from '$lib/shared/auth-messages';
	import {
		forgotPasswordClientSchema,
		type ForgotPasswordInput
	} from '$lib/shared/schemas/auth';
	import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
	import { warmRecaptcha } from '$lib/recaptcha/client';
	import { AUTH_ACTION_BUTTON_CLASS, AUTH_FIELD_CONTROL_CLASS } from '$lib/auth/ui';
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

	let formStore: SuperForm<ForgotPasswordInput>['form'];
	let validateFormFn: SuperForm<ForgotPasswordInput>['validateForm'];

	onMount(() => {
		warmRecaptcha(RECAPTCHA_ACTIONS.FORGOT_PASSWORD);
	});

	const superform = superForm(untrack(() => data.form), {
		resetForm: false,
		validators: zod4Client(forgotPasswordClientSchema),
		onSubmit: createAuthFormOnSubmit({
			getFormData: () => {
				const { email } = get(formStore);
				return { email };
			},
			clientSchema: forgotPasswordClientSchema,
			getValidateForm: () => validateFormFn,
			recaptchaAction: RECAPTCHA_ACTIONS.FORGOT_PASSWORD,
			onRecaptchaError: (message) => {
				recaptchaError = message;
				warmRecaptcha(RECAPTCHA_ACTIONS.FORGOT_PASSWORD);
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
			warmRecaptcha(RECAPTCHA_ACTIONS.FORGOT_PASSWORD);
		},
		onError: () => {
			authLoading.reset();
			warmRecaptcha(RECAPTCHA_ACTIONS.FORGOT_PASSWORD);
		}
	});
	const { enhance, form, message: formMessage } = superform;

	formStore = form;
	validateFormFn = superform.validateForm;

	const submitted = $derived(
		typeof $formMessage === 'string' && $formMessage === FORGOT_PASSWORD_SUCCESS_MESSAGE
	);
</script>

<AuthFormPanel
	title="Forgot password"
	description="Enter the email for your account and we will send you a reset link."
>
	<div class="space-y-6">
		{#if submitted}
			<AuthFormMessageAlert message={$formMessage} />
		{:else}
			<form method="POST" use:enhance class="space-y-5" novalidate>
				<div class="space-y-5">
					{#if recaptchaError}
						<AuthFormMessageAlert message={recaptchaError} />
					{:else if $formMessage}
						<AuthFormMessageAlert message={$formMessage} bind:limited={formRateLimited} />
					{/if}

					<Form.Field form={superform} name="email">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Email</Form.Label>
								<Input
									{...props}
									type="email"
									autocomplete="email"
									disabled={submitDisabled}
									class={AUTH_FIELD_CONTROL_CLASS}
									bind:value={$form.email}
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<GradientButton
						type="submit"
						tone="primary"
						class={cn(
							AUTH_ACTION_BUTTON_CLASS,
							submitDisabled && 'pointer-events-none cursor-wait'
						)}
						disabled={submitDisabled}
						aria-busy={authLoading.authBusy}
					>
						{#if authLoading.isAuthLoading}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Sending reset link...
						{:else}
							Send reset link
						{/if}
					</GradientButton>
					<RecaptchaNotice />
				</div>
			</form>
		{/if}
	</div>

	{#snippet footer()}
		{#if submitted}
			<p class="text-center text-sm">
				<a href="/login" class="hover:text-foreground">Back to sign in</a>
				<span class="text-muted-foreground px-2" aria-hidden="true">|</span>
				<a href="/verify/resend" class="hover:text-foreground">
					Resend verification email
				</a>
			</p>
		{:else}
			<p class="text-center text-sm">
				Remember your password?
				<a href="/login" class="hover:text-foreground">Sign in</a>
			</p>
		{/if}
	{/snippet}
</AuthFormPanel>
