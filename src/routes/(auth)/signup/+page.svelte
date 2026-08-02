<script lang="ts">
	import { createAuthFormOnSubmit } from '$lib/auth/form';
	import { createAuthLoadingState } from '$lib/auth/loading.svelte';
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import GoogleSignInButton from '$lib/components/auth/google-sign-in-button.svelte';
	import RecaptchaNotice from '$lib/components/auth/recaptcha-notice.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import TermsConsentField from '$lib/components/auth/terms-consent-field.svelte';
	import PasswordInput from '$lib/components/password-input.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { signupClientSchema, type SignupInput } from '$lib/shared/schemas/auth';
	import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
	import { CONSENT_CONTEXTS } from '$lib/shared/models/consent-event';
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
	let redirectRateLimited = $state(false);
	const authLoading = createAuthLoadingState();
	const submitDisabled = $derived(
		authLoading.authBusy || formRateLimited || redirectRateLimited
	);

	let formStore: SuperForm<SignupInput>['form'];
	let validateFormFn: SuperForm<SignupInput>['validateForm'];

	onMount(() => {
		warmRecaptcha(RECAPTCHA_ACTIONS.SIGNUP);
	});

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(signupClientSchema),
		onSubmit: createAuthFormOnSubmit({
			getFormData: () => {
				const { firstName, lastName, email, password, acceptedTerms } = get(formStore);
				return { firstName, lastName, email, password, acceptedTerms };
			},
			clientSchema: signupClientSchema,
			getValidateForm: () => validateFormFn,
			recaptchaAction: RECAPTCHA_ACTIONS.SIGNUP,
			onRecaptchaError: (message) => {
				recaptchaError = message;
				warmRecaptcha(RECAPTCHA_ACTIONS.SIGNUP);
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
			warmRecaptcha(RECAPTCHA_ACTIONS.SIGNUP);
		},
		onError: () => {
			authLoading.reset();
			warmRecaptcha(RECAPTCHA_ACTIONS.SIGNUP);
		}
	});
	const { enhance, form, message: formMessage } = superform;

	formStore = form;
	validateFormFn = superform.validateForm;

	const loginHref = $derived.by(() => {
		const params = new URLSearchParams();

		if (data.redirectTo !== '/') {
			params.set('redirectTo', data.redirectTo);
		}

		const email = $form.email.trim();

		if (email) {
			params.set('email', email);
		}

		const query = params.toString();

		return query ? `/login?${query}` : '/login';
	});
</script>

<AuthFormPanel
	title="Create your account"
	description="Start managing jobs, clients, and your team in one workspace."
>
	<div class="space-y-6">
		<form
			method="POST"
			action={`?redirectTo=${encodeURIComponent(data.redirectTo)}`}
			use:enhance
			class="space-y-5"
			novalidate
		>
			<div class="space-y-5">
				{#if data.googleAuthError}
					<AuthFormMessageAlert
						message={data.googleAuthError}
						retryAfterSeconds={data.rateLimitRetryAfter}
						bind:limited={redirectRateLimited}
					/>
				{/if}

				{#if recaptchaError}
					<AuthFormMessageAlert message={recaptchaError} />
				{/if}

				{#if $formMessage}
					<AuthFormMessageAlert message={$formMessage} bind:limited={formRateLimited} />
				{/if}

				<div class="space-y-4">
					<div class="grid gap-4 sm:grid-cols-2">
						<Form.Field form={superform} name="firstName">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>First name</Form.Label>
									<Input
										{...props}
										type="text"
										autocomplete="given-name"
										disabled={submitDisabled}
										bind:value={$form.firstName}
									/>
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>

						<Form.Field form={superform} name="lastName">
							<Form.Control>
								{#snippet children({ props })}
									<Form.Label>Last name</Form.Label>
									<Input
										{...props}
										type="text"
										autocomplete="family-name"
										disabled={submitDisabled}
										bind:value={$form.lastName}
									/>
								{/snippet}
							</Form.Control>
							<SingleFieldErrors />
						</Form.Field>
					</div>

					<Form.Field form={superform} name="email">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Email</Form.Label>
								<Input
									{...props}
									type="email"
									autocomplete="email"
									disabled={submitDisabled}
									bind:value={$form.email}
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Form.Field form={superform} name="password">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Password</Form.Label>
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
				</div>

				<TermsConsentField {superform} formStore={form} disabled={submitDisabled} />

				<Button
					type="submit"
					class={cn(
						AUTH_ACTION_BUTTON_CLASS,
						(!$form.acceptedTerms || submitDisabled) && 'pointer-events-none',
						authLoading.authBusy && 'cursor-wait'
					)}
					disabled={!$form.acceptedTerms || submitDisabled}
					aria-busy={authLoading.authBusy}
				>
					{#if authLoading.isAuthLoading}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Creating account...
					{:else}
						Create account
					{/if}
				</Button>
				<RecaptchaNotice />
			</div>
		</form>

		<div class="flex items-center gap-3">
			<Separator class="flex-1" />
			<span class="text-muted-foreground text-xs font-medium tracking-wide uppercase">or</span>
			<Separator class="flex-1" />
		</div>

		<GoogleSignInButton
			context={CONSENT_CONTEXTS.SIGNUP}
			redirectTo={data.redirectTo}
			disabled={submitDisabled}
		/>
	</div>

	{#snippet footer()}
		<p class="text-center text-sm">
			Already have an account?
			<a href={loginHref} class={AUTH_INLINE_LINK_CLASS}>Sign in</a>
		</p>
	{/snippet}
</AuthFormPanel>
