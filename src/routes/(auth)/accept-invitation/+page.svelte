<script lang="ts">
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import FormAlert from '$lib/components/auth/form-alert.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { AUTH_ACTION_BUTTON_CLASS } from '$lib/auth/ui';
	import { cn } from '$lib/utils.js';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { acceptInvitationSchema } from '$lib/shared/schemas/accept-invitation';

	let { data } = $props();

	let submitting = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(acceptInvitationSchema),
		onSubmit: () => {
			submitting = true;
		},
		onUpdated: () => {
			submitting = false;
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	const acceptPath = $derived(
		`/accept-invitation?token=${encodeURIComponent($form.token)}`
	);
	const invitedEmail = $derived(data.invitation?.invitedEmail ?? '');
	const loginHref = $derived(
		`/login?redirectTo=${encodeURIComponent(acceptPath)}&email=${encodeURIComponent(invitedEmail)}`
	);
	const signupHref = $derived(
		`/signup?redirectTo=${encodeURIComponent(acceptPath)}&email=${encodeURIComponent(invitedEmail)}`
	);
</script>

<AuthFormPanel
	title="Accept invitation"
	description={data.tokenValid && data.invitation
		? `Join ${data.invitation.workspaceName} as ${data.invitation.roleLabel}.`
		: 'Review your workspace invitation below.'}
>
	{#if !data.tokenValid}
		<FormAlert
			title="Invitation unavailable"
			description="This invitation link is invalid or has expired. Ask your workspace admin to send a new invite."
		/>
		<Button href="/login" class={AUTH_ACTION_BUTTON_CLASS}>Sign in</Button>
	{:else if !data.isAuthenticated}
		<StatusAlert
			variant="info"
			title="Sign in to continue"
			description={`This invitation was sent to ${data.invitation?.invitedEmail}. Sign in or create an account with that email to join ${data.invitation?.workspaceName}.`}
		/>
		<div class="space-y-4">
			<Button href={loginHref} class={AUTH_ACTION_BUTTON_CLASS}>Sign in to accept</Button>

			<div class="flex items-center gap-3">
				<Separator class="flex-1" />
				<span class="text-muted-foreground text-xs font-medium tracking-wide uppercase">or</span>
				<Separator class="flex-1" />
			</div>

			<div
				class="border-primary/20 bg-primary/5 space-y-3 rounded-lg border p-4 text-center"
			>
				<div class="space-y-1">
					<p class="text-foreground text-sm font-semibold">New to Urixoft Workspace?</p>
					<p class="text-muted-foreground text-sm">
						Create an account with {data.invitation?.invitedEmail} to join this workspace.
					</p>
				</div>
				<Button href={signupHref} variant="outline" class={AUTH_ACTION_BUTTON_CLASS}>
					Create an account
				</Button>
			</div>
		</div>
	{:else if data.emailMatches === false}
		<FormAlert
			title="Wrong account"
			description={`You are signed in as a different email. Sign out and sign in with ${data.invitation?.invitedEmail} to accept this invitation.`}
		/>
		<Button href={`/logout?redirectTo=${encodeURIComponent(acceptPath)}`} class={AUTH_ACTION_BUTTON_CLASS}>
			Sign out
		</Button>
	{:else}
		<form method="POST" use:enhance class="space-y-5">
			{#if $formMessage}
				<AuthFormMessageAlert message={$formMessage} />
			{/if}

			<StatusAlert
				variant="info"
				title="You're almost in"
				description={`Accepting will add you to ${data.invitation?.workspaceName} as ${data.invitation?.roleLabel}.`}
			/>

			<input type="hidden" name="token" value={$form.token} />

			<Button
				type="submit"
				class={cn(AUTH_ACTION_BUTTON_CLASS, submitting && 'pointer-events-none cursor-wait')}
				disabled={submitting}
			>
				{#if submitting}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Accepting invitation…
				{:else}
					Accept invitation
				{/if}
			</Button>
		</form>
	{/if}
</AuthFormPanel>
