<script lang="ts">
	import { createAuthFormOnSubmit } from '$lib/auth/form';
	import { createAuthLoadingState } from '$lib/auth/loading.svelte';
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import GoogleSignInButton from '$lib/components/auth/google-sign-in-button.svelte';
	import RecaptchaNotice from '$lib/components/auth/recaptcha-notice.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PasswordInput from '$lib/components/password-input.svelte';
	import GradientButton from '$lib/components/gradient-button.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { loginClientSchema, type LoginInput } from '$lib/shared/schemas/auth';
	import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
	import { CONSENT_CONTEXTS } from '$lib/shared/models/consent-event';
	import { APP_NAME } from '$lib/shared/site-meta';
	import { warmRecaptcha } from '$lib/recaptcha/client';
	import { AUTH_ACTION_BUTTON_CLASS, AUTH_FIELD_CONTROL_CLASS, AUTH_INLINE_LINK_CLASS } from '$lib/auth/ui';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { get } from 'svelte/store';
	import { onMount, untrack } from 'svelte';
	import { superForm, type SuperForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let recaptchaError = $state<string | null>(null);
	let formRateLimited = $state(false);
	let redirectRateLimited = $state(false);
	const authLoading = createAuthLoadingState();
	const submitDisabled = $derived(
		authLoading.authBusy || formRateLimited || redirectRateLimited
	);

	let formStore: SuperForm<LoginInput>['form'];
	let validateFormFn: SuperForm<LoginInput>['validateForm'];

	onMount(() => {
		warmRecaptcha(RECAPTCHA_ACTIONS.LOGIN);
	});

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(loginClientSchema),
		onSubmit: createAuthFormOnSubmit({
			getFormData: () => {
				const { email, password } = get(formStore);
				return { email, password };
			},
			clientSchema: loginClientSchema,
			getValidateForm: () => validateFormFn,
			recaptchaAction: RECAPTCHA_ACTIONS.LOGIN,
			onRecaptchaError: (message) => {
				recaptchaError = message;
				warmRecaptcha(RECAPTCHA_ACTIONS.LOGIN);
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
			warmRecaptcha(RECAPTCHA_ACTIONS.LOGIN);
		},
		onError: () => {
			authLoading.reset();
			warmRecaptcha(RECAPTCHA_ACTIONS.LOGIN);
		}
	});
	const { enhance, form, message: formMessage } = superform;

	formStore = form;
	validateFormFn = superform.validateForm;

	const signupHref = $derived.by(() => {
		const params = new URLSearchParams();

		if (data.redirectTo !== '/') {
			params.set('redirectTo', data.redirectTo);
		}

		const email = (data.lockedEmail ?? $form.email).trim();

		if (email) {
			params.set('email', email);
		}

		const query = params.toString();

		return query ? `/signup?${query}` : '/signup';
	});

	const pageTitle = $derived(
		data.lockedEmail ? 'Sign in to accept' : `Welcome to ${APP_NAME}`
	);
	const pageDescription = $derived(
		data.lockedEmail
			? 'Use the invited email address to sign in and join the workspace.'
			: 'Your workspace dashboard'
	);
</script>

<AuthFormPanel title={pageTitle} description={pageDescription}>
	<div class="space-y-6">
		{#if recaptchaError}
			<AuthFormMessageAlert message={recaptchaError} />
		{:else if $formMessage}
			<AuthFormMessageAlert message={$formMessage} bind:limited={formRateLimited} />
		{:else if data.googleAuthError}
			<AuthFormMessageAlert
				message={data.googleAuthError}
				retryAfterSeconds={data.rateLimitRetryAfter}
				bind:limited={redirectRateLimited}
			/>
		{:else if data.passwordResetSuccess}
			<StatusAlert
				variant="success"
				title="Password updated"
				description="Sign in with your new password."
			/>
		{/if}

		<GoogleSignInButton
			variant="compact"
			context={CONSENT_CONTEXTS.LOGIN}
			redirectTo={data.redirectTo}
			disabled={submitDisabled}
		/>

		<div class="flex items-center gap-3">
			<Separator class="flex-1" />
			<span class="text-muted-foreground text-sm font-medium">or sign in with</span>
			<Separator class="flex-1" />
		</div>

		<form
			method="POST"
			action={`?redirectTo=${encodeURIComponent(data.redirectTo)}`}
			use:enhance
			class="space-y-5"
			novalidate
		>
			<div class="space-y-4">
				<Form.Field form={superform} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>Email</Form.Label>
							<Input
								{...props}
								type="email"
								autocomplete="email"
								disabled={submitDisabled}
								readonly={Boolean(data.lockedEmail)}
								class={cn(AUTH_FIELD_CONTROL_CLASS, data.lockedEmail && 'bg-muted/40')}
								bind:value={$form.email}
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="password">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>Password</Form.Label>
							<PasswordInput
								{...props}
								groupClass={AUTH_FIELD_CONTROL_CLASS}
								disabled={submitDisabled}
								bind:value={$form.password}
								autocomplete="current-password"
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>
			</div>

			<div class="flex items-center justify-end">
				<a href="/forgot-password" class={AUTH_INLINE_LINK_CLASS}>
					Forgot password?
				</a>
			</div>

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
					Signing in...
				{:else}
					Sign in
				{/if}
			</GradientButton>
			<RecaptchaNotice />
		</form>

		<p class="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-sm font-medium">
			New to {APP_NAME}?
			<a href={signupHref} class={AUTH_INLINE_LINK_CLASS}>Create an account</a>
		</p>
	</div>

	{#snippet footer()}
		<p class="text-center text-sm">
			<a href="/verify/resend" class="hover:text-foreground">
				Resend verification email
			</a>
			<span class="text-muted-foreground px-2" aria-hidden="true">|</span>
			<a href="/forgot-password" class="hover:text-foreground">
				Can't sign in?
			</a>
		</p>
	{/snippet}
</AuthFormPanel>
