<script lang="ts">
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import RecaptchaNotice from '$lib/components/auth/recaptcha-notice.svelte';
	import PasswordInput from '$lib/components/password-input.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { createRecaptchaSubmitHandler } from '$lib/recaptcha/client';
	import { RECAPTCHA_ACTIONS } from '$lib/shared/recaptcha';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';

	let { data } = $props();

	let recaptchaError = $state<string | null>(null);

	const superform = superForm(untrack(() => data.form), {
		async onSubmit(input) {
			recaptchaError = null;
			await createRecaptchaSubmitHandler(RECAPTCHA_ACTIONS.LOGIN, (message) => {
				recaptchaError = message;
			})(input);
		}
	});
	const { enhance, message: formMessage } = superform;
</script>

<AuthFormPanel title="Sign in" description="Use your workspace account to access the dashboard and tools.">
	<div class="space-y-6">
		<form
			method="POST"
			action={`?redirectTo=${encodeURIComponent(data.redirectTo)}`}
			use:enhance
			class="space-y-5"
		>
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

			<div class="space-y-4">
				<Form.Field form={superform} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Email</Form.Label>
							<Input
								{...props}
								type="email"
								autocomplete="email"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="password">
					<Form.Control>
						{#snippet children({ props })}
							<div class="flex items-center justify-between gap-2">
								<Form.Label>Password</Form.Label>
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
								autocomplete="current-password"
							/>
						{/snippet}
					</Form.Control>
					<Form.FieldErrors />
				</Form.Field>
			</div>

			<Button type="submit" class="h-10 w-full">Sign in</Button>
			<RecaptchaNotice />
		</form>

		<div class="flex items-center gap-3">
			<Separator class="flex-1" />
			<span class="text-muted-foreground text-xs font-medium tracking-wide uppercase">or</span>
			<Separator class="flex-1" />
		</div>

		<Button type="button" variant="outline" class="h-10 w-full gap-2">
			<svg class="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
				<path
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
					fill="#4285F4"
				/>
				<path
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					fill="#34A853"
				/>
				<path
					d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					fill="#FBBC05"
				/>
				<path
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					fill="#EA4335"
				/>
			</svg>
			Continue with Google
		</Button>

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
