<script lang="ts">
	import { createAuthFormOnSubmit } from '$lib/auth/form';
	import { createAuthLoadingState } from '$lib/auth/loading.svelte';
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import FormAlert from '$lib/components/auth/form-alert.svelte';
	import RecaptchaNotice from '$lib/components/auth/recaptcha-notice.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		resendVerificationClientSchema,
		type ResendVerificationInput
	} from '$lib/shared/schemas/auth';
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

	let formStore: SuperForm<ResendVerificationInput>['form'];
	let validateFormFn: SuperForm<ResendVerificationInput>['validateForm'];

	onMount(() => {
		warmRecaptcha(RECAPTCHA_ACTIONS.RESEND_VERIFICATION);
	});

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(resendVerificationClientSchema),
		onSubmit: createAuthFormOnSubmit({
			getFormData: () => {
				const { email } = get(formStore);
				return { email };
			},
			clientSchema: resendVerificationClientSchema,
			getValidateForm: () => validateFormFn,
			recaptchaAction: RECAPTCHA_ACTIONS.RESEND_VERIFICATION,
			onRecaptchaError: (message) => {
				recaptchaError = message;
				warmRecaptcha(RECAPTCHA_ACTIONS.RESEND_VERIFICATION);
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
			warmRecaptcha(RECAPTCHA_ACTIONS.RESEND_VERIFICATION);
		},
		onError: () => {
			authLoading.reset();
			warmRecaptcha(RECAPTCHA_ACTIONS.RESEND_VERIFICATION);
		}
	});
	const { enhance, form, message: formMessage } = superform;

	formStore = form;
	validateFormFn = superform.validateForm;
</script>

<AuthFormPanel
	title="Resend verification email"
	description="Enter the email for your account and we will send you a new 6-digit verification code."
>
	<div class="space-y-6">
		<form method="POST" use:enhance class="space-y-5" novalidate>
			<div class="space-y-5">
				{#if recaptchaError}
					<FormAlert title="Verification failed">{recaptchaError}</FormAlert>
				{/if}

				{#if $formMessage}
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
								bind:value={$form.email}
							/>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<Button
					type="submit"
					class={cn(AUTH_ACTION_BUTTON_CLASS, submitDisabled && 'pointer-events-none cursor-wait')}
					disabled={submitDisabled}
					aria-busy={authLoading.authBusy}
				>
					{#if authLoading.isAuthLoading}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Sending verification code...
					{:else}
						Send verification code
					{/if}
				</Button>
				<RecaptchaNotice />
			</div>
		</form>

		<p class="text-muted-foreground text-center text-sm">
			Remember your password?
			<a href="/login" class={AUTH_INLINE_LINK_CLASS}>Sign in</a>
		</p>
	</div>
</AuthFormPanel>
