<script lang="ts">
	import { createAuthFormOnSubmit } from '$lib/auth/form';
	import { createAuthLoadingState } from '$lib/auth/loading.svelte';
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import FormAlert from '$lib/components/auth/form-alert.svelte';
	import RecaptchaNotice from '$lib/components/auth/recaptcha-notice.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import VerificationCodeInput from '$lib/components/auth/verification-code-input.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { verifyEmailClientSchema, type VerifyEmailInput } from '$lib/shared/schemas/auth';
	import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
	import { warmRecaptcha } from '$lib/recaptcha/client';
	import { AUTH_ACTION_BUTTON_CLASS, AUTH_INLINE_LINK_CLASS } from '$lib/auth/ui';
	import { cn } from '$lib/utils.js';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import MailCheckIcon from '@lucide/svelte/icons/mail-check';
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
			<div
				class="flex flex-col items-center gap-6 rounded-xl border border-border/50 bg-muted/30 px-6 py-8 text-center ring-1 ring-foreground/5"
			>
				<div
					class="flex size-28 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
				>
					<CircleCheckIcon class="size-16" aria-hidden="true" />
				</div>
				<p class="text-muted-foreground text-sm leading-relaxed">
					You're all set. Sign in to continue to Urixoft Workspace.
				</p>
			</div>
			<Button href="/login" class={AUTH_ACTION_BUTTON_CLASS}>Sign in</Button>
		{:else}
			{#if data.codeSent}
				<div
					class="flex flex-col items-center gap-6 rounded-xl border border-border/50 bg-muted/30 px-6 py-8 text-center ring-1 ring-foreground/5"
				>
					<div
						class="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full"
					>
						<MailCheckIcon class="size-10" aria-hidden="true" />
					</div>
					<p class="text-muted-foreground text-sm leading-relaxed">
						{data.codeSentMessage}
					</p>
				</div>
			{/if}

			<form method="POST" use:enhance class="space-y-5" novalidate>
				<div class="space-y-5">
					{#if recaptchaError}
						<FormAlert>{recaptchaError}</FormAlert>
					{/if}

					{#if $formMessage && $formMessage !== 'verified'}
						<AuthFormMessageAlert message={$formMessage} bind:limited={formRateLimited} />
					{/if}

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

			<div class="space-y-3 text-center">
				<p class="text-muted-foreground text-sm">Didn't get a code?</p>
				<p class="text-sm">
					<a href={resendHref} class={AUTH_INLINE_LINK_CLASS}>Resend verification email</a>
					<span class="text-muted-foreground px-2" aria-hidden="true">|</span>
					<a href="/verify/resend" class={AUTH_INLINE_LINK_CLASS}>Use a different email</a>
				</p>
			</div>
		{/if}
	</div>
</AuthFormPanel>
