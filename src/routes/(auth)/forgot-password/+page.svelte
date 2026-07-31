<script lang="ts">
	import { createAuthFormOnSubmit } from '$lib/auth/form';
	import { createAuthLoadingState } from '$lib/auth/loading.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import FormAlert from '$lib/components/auth/form-alert.svelte';
	import RecaptchaNotice from '$lib/components/auth/recaptcha-notice.svelte';
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { FORGOT_PASSWORD_SUCCESS_MESSAGE } from '$lib/shared/auth-messages';
	import {
		forgotPasswordClientSchema,
		type ForgotPasswordInput
	} from '$lib/shared/schemas/auth';
	import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
	import { warmRecaptcha } from '$lib/recaptcha/client';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import MailCheckIcon from '@lucide/svelte/icons/mail-check';
	import { get } from 'svelte/store';
	import { onMount, untrack } from 'svelte';
	import { superForm, type SuperForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let recaptchaError = $state<string | null>(null);
	const authLoading = createAuthLoadingState();

	let formStore: SuperForm<ForgotPasswordInput>['form'];
	let validateFormFn: SuperForm<ForgotPasswordInput>['validateForm'];

	onMount(() => {
		warmRecaptcha(RECAPTCHA_ACTIONS.FORGOT_PASSWORD);
	});

	const superform = superForm(untrack(() => data.form), {
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

	const submitted = $derived($formMessage === FORGOT_PASSWORD_SUCCESS_MESSAGE);
</script>

<AuthFormPanel
	title="Forgot password"
	description="Enter the email for your account and we will send you a reset link."
>
	<div class="space-y-6">
		{#if submitted}
			<div class="flex flex-col items-center gap-6 text-center">
				<div
					class="bg-primary/10 text-primary flex size-20 items-center justify-center rounded-full"
				>
					<MailCheckIcon class="size-10" aria-hidden="true" />
				</div>
				<p class="text-muted-foreground text-sm leading-relaxed">{$formMessage}</p>
				<Button href="/login" class="w-full">Back to sign in</Button>
			</div>
		{:else}
			<form method="POST" use:enhance class="space-y-5" novalidate>
				<div class="space-y-5">
					{#if recaptchaError}
						<FormAlert>{recaptchaError}</FormAlert>
					{/if}

					{#if $formMessage}
						<FormAlert>{$formMessage}</FormAlert>
					{/if}

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
							Sending reset link...
						{:else}
							Send reset link
						{/if}
					</Button>
					<RecaptchaNotice />
				</div>
			</form>

			<p class="text-muted-foreground text-center text-sm">
				Remember your password?
				<a href="/login" class="text-primary font-medium hover:underline">Sign in</a>
			</p>
		{/if}
	</div>
</AuthFormPanel>
