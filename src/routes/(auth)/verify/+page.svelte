<script lang="ts">
	import { createAuthFormOnSubmit } from '$lib/auth/form';
	import { createAuthLoadingState } from '$lib/auth/loading.svelte';
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import RecaptchaNotice from '$lib/components/auth/recaptcha-notice.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import VerificationCodeInput from '$lib/components/auth/verification-code-input.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { verifyEmailClientSchema, type VerifyEmailInput } from '$lib/shared/schemas/auth';
	import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
	import { warmRecaptcha } from '$lib/recaptcha/client';
	import { AUTH_ACTION_BUTTON_CLASS } from '$lib/auth/ui';
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

	let formStore: SuperForm<VerifyEmailInput>['form'];
	let validateFormFn: SuperForm<VerifyEmailInput>['validateForm'];

	onMount(() => {
		warmRecaptcha(RECAPTCHA_ACTIONS.VERIFY_EMAIL);
	});

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(verifyEmailClientSchema),
		onSubmit: createAuthFormOnSubmit({
			getFormData: () => {
				const { email, code } = get(formStore);
				return { email, code };
			},
			clientSchema: verifyEmailClientSchema,
			getValidateForm: () => validateFormFn,
			recaptchaAction: RECAPTCHA_ACTIONS.VERIFY_EMAIL,
			onRecaptchaError: (message) => {
				recaptchaError = message;
				warmRecaptcha(RECAPTCHA_ACTIONS.VERIFY_EMAIL);
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
			warmRecaptcha(RECAPTCHA_ACTIONS.VERIFY_EMAIL);
		},
		onResult: () => {
			authLoading.reset();
		},
		onError: () => {
			authLoading.reset();
			warmRecaptcha(RECAPTCHA_ACTIONS.VERIFY_EMAIL);
		}
	});
	const { enhance, form, message: formMessage, errors } = superform;

	formStore = form;
	validateFormFn = superform.validateForm;

	const verified = $derived(typeof $formMessage === 'string' && $formMessage === 'verified');

	const resendHref = $derived(
		`/verify/resend?email=${encodeURIComponent(data.prefilledEmail)}`
	);
</script>

<AuthFormPanel
	title={verified ? 'Email verified' : 'Verify your email'}
	description={verified
		? 'Your email address has been confirmed. You can sign in to your workspace.'
		: 'Enter the 6-digit code from your email.'}
>
	<div class="space-y-6">
		{#if verified}
			<StatusAlert
				variant="success"
				title="You're all set"
				description="Sign in to continue to Urixoft Workspace."
			/>
			<Button href="/login" class={AUTH_ACTION_BUTTON_CLASS}>Sign in</Button>
		{:else}
			{#if recaptchaError}
				<AuthFormMessageAlert message={recaptchaError} />
			{:else if $formMessage && $formMessage !== 'verified'}
				<AuthFormMessageAlert message={$formMessage} bind:limited={formRateLimited} />
			{:else if data.codeSent}
				<StatusAlert
					variant="info"
					title="Check your email"
					description={data.codeSentMessage}
				/>
			{/if}

			<form method="POST" use:enhance class="space-y-5" novalidate>
				<div class="space-y-5">
					<input type="hidden" name="email" bind:value={$form.email} />

					<Form.Field form={superform} name="code">
						<Form.Control>
							{#snippet children({ props })}
								<input type="hidden" name={props.name} bind:value={$form.code} />
								<Form.Label required class="sr-only">Verification code</Form.Label>
								<VerificationCodeInput
									id={props.id}
									bind:value={$form.code}
									disabled={submitDisabled}
									aria-invalid={$errors.code?.length ? 'true' : undefined}
									aria-describedby={props['aria-describedby']}
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
							Verifying...
						{:else}
							Verify email
						{/if}
					</Button>
					<RecaptchaNotice />
				</div>
			</form>
		{/if}
	</div>

	{#snippet footer()}
		{#if !verified}
			<div class="space-y-3 text-center">
				<p class="text-sm">Didn't get a code?</p>
				<p class="text-sm">
					<a href={resendHref} class="hover:text-foreground hover:underline">
						Resend verification email
					</a>
					<span class="px-2" aria-hidden="true">|</span>
					<a href="/verify/resend" class="hover:text-foreground hover:underline">
						Use a different email
					</a>
				</p>
			</div>
		{/if}
	{/snippet}
</AuthFormPanel>
