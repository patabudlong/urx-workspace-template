<script lang="ts">
	import { actionProgress } from '$lib/action-progress.svelte';
	import { createAuthFormOnSubmit } from '$lib/auth/form';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import GoogleSignInButton from '$lib/components/auth/google-sign-in-button.svelte';
	import RecaptchaNotice from '$lib/components/auth/recaptcha-notice.svelte';
	import TermsConsentField from '$lib/components/auth/terms-consent-field.svelte';
	import PasswordInput from '$lib/components/password-input.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { signupSchema, type SignupInput } from '$lib/shared/schemas/auth';
	import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
	import { CONSENT_CONTEXTS } from '$lib/shared/models/consent-event';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { untrack } from 'svelte';
	import { superForm, type SuperForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let recaptchaError = $state<string | null>(null);
	let termsRequiredMessage = $state<string | null>(null);

	let validateFormFn: SuperForm<SignupInput>['validateForm'];

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(signupSchema),
		onSubmit: createAuthFormOnSubmit({
			getValidateForm: () => validateFormFn,
			recaptchaAction: RECAPTCHA_ACTIONS.SIGNUP,
			onRecaptchaError: (message) => {
				recaptchaError = message;
			},
			onBeforeSubmit: () => {
				recaptchaError = null;
			}
		})
	});
	const { enhance, form, message: formMessage, delayed } = superform;

	validateFormFn = superform.validateForm;

	$effect(() => {
		if ($form.acceptedTerms) {
			termsRequiredMessage = null;
		}
	});

	$effect(() => {
		if (!$delayed) {
			return;
		}

		actionProgress.start();

		return () => {
			actionProgress.stop();
		};
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
			<fieldset class="space-y-5" disabled={$delayed}>
				{#if recaptchaError}
				<div
					class="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 px-3 py-2 text-sm"
					role="alert"
				>
					{recaptchaError}
				</div>
			{/if}

			{#if $formMessage}
				<div
					class="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 px-3 py-2 text-sm"
					role="alert"
				>
					{$formMessage}
				</div>
			{/if}

			{#if termsRequiredMessage}
				<div
					class="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 px-3 py-2 text-sm"
					role="alert"
				>
					{termsRequiredMessage}
				</div>
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
									bind:value={$form.firstName}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
					</Form.Field>

					<Form.Field form={superform} name="lastName">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label>Last name</Form.Label>
								<Input
									{...props}
									type="text"
									autocomplete="family-name"
									bind:value={$form.lastName}
								/>
							{/snippet}
						</Form.Control>
						<Form.FieldErrors />
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
								bind:value={$form.email}
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="password">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Password</Form.Label>
							<PasswordInput
								{...props}
								bind:value={$form.password}
								showStrength
								autocomplete="new-password"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<TermsConsentField {superform} formStore={form} email={$form.email} />

			<Button
				type="submit"
				class="h-10 w-full"
				disabled={!$form.acceptedTerms || $delayed}
			>
				{#if $delayed}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Creating account...
				{:else}
					Create account
				{/if}
			</Button>
			<RecaptchaNotice />
			</fieldset>
		</form>

		<div class="flex items-center gap-3">
			<Separator class="flex-1" />
			<span class="text-muted-foreground text-xs font-medium tracking-wide uppercase">or</span>
			<Separator class="flex-1" />
		</div>

		<GoogleSignInButton
			context={CONSENT_CONTEXTS.SIGNUP}
			email={$form.email}
			requireTerms
			termsAccepted={$form.acceptedTerms}
			disabled={$delayed}
			onTermsRequired={() => {
				termsRequiredMessage =
					'Please agree to the Terms of Service and Privacy Notice before continuing with Google.';
			}}
		/>

		<p class="text-muted-foreground text-center text-sm">
			Already have an account?
			<a href="/login" class="text-primary font-medium hover:underline">Sign in</a>
		</p>
	</div>
</AuthFormPanel>
