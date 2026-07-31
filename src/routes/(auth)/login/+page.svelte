<script lang="ts">
	import { createAuthFormOnSubmit } from '$lib/auth/form';
	import { createAuthLoadingState } from '$lib/auth/loading.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import FormAlert from '$lib/components/auth/form-alert.svelte';
	import GoogleSignInButton from '$lib/components/auth/google-sign-in-button.svelte';
	import RecaptchaNotice from '$lib/components/auth/recaptcha-notice.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PasswordInput from '$lib/components/password-input.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { loginClientSchema, type LoginInput } from '$lib/shared/schemas/auth';
	import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
	import { CONSENT_CONTEXTS } from '$lib/shared/models/consent-event';
	import { warmRecaptcha } from '$lib/recaptcha/client';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { get } from 'svelte/store';
	import { onMount, untrack } from 'svelte';
	import { superForm, type SuperForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let recaptchaError = $state<string | null>(null);
	const authLoading = createAuthLoadingState();

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
</script>

<AuthFormPanel title="Sign in" description="Use your workspace account to access the dashboard and tools.">
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
					<FormAlert>{data.googleAuthError}</FormAlert>
				{/if}

				{#if recaptchaError}
					<FormAlert>{recaptchaError}</FormAlert>
				{/if}

				{#if $formMessage}
					<FormAlert>{$formMessage}</FormAlert>
				{/if}

				<div class="space-y-4">
					<Form.Field form={superform} name="email">
						<Form.Control>
							{#snippet children({ props })}
								<Form.Label required>Email</Form.Label>
								<Input
									{...props}
									type="email"
									autocomplete="email"
									disabled={authLoading.authBusy}
									bind:value={$form.email}
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>

					<Form.Field form={superform} name="password">
						<Form.Control>
							{#snippet children({ props })}
								<div class="flex items-center justify-between gap-2">
									<Form.Label required>Password</Form.Label>
									<a
										href="/forgot-password"
										tabindex="-1"
										class="text-primary text-sm hover:underline"
									>
										Forgot password?
									</a>
								</div>
								<PasswordInput
									{...props}
									disabled={authLoading.authBusy}
									bind:value={$form.password}
									autocomplete="current-password"
								/>
							{/snippet}
						</Form.Control>
						<SingleFieldErrors />
					</Form.Field>
				</div>

				<Button
					type="submit"
					class={cn(
						'h-10 w-full',
						authLoading.authBusy && 'pointer-events-none cursor-wait'
					)}
					disabled={authLoading.authBusy}
					aria-busy={authLoading.authBusy}
				>
					{#if authLoading.isAuthLoading}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Signing in...
					{:else}
						Sign in
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
			context={CONSENT_CONTEXTS.LOGIN}
			redirectTo={data.redirectTo}
			disabled={authLoading.authBusy}
		/>

		<p class="text-muted-foreground text-center text-sm">
			Don't have an account?
			<a href="/signup" class="text-primary font-medium hover:underline">Sign up</a>
		</p>
	</div>

	{#snippet footer()}
		<p class="text-center text-sm">
			<a href="/verify/resend" class="hover:text-foreground hover:underline">
				Resend verification email
			</a>
			<span class="text-muted-foreground px-2" aria-hidden="true">|</span>
			<a href="/forgot-password" class="hover:text-foreground hover:underline">
				Can't sign in?
			</a>
		</p>
	{/snippet}
</AuthFormPanel>
