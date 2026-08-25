<script lang="ts">
	import AuthFormMessageAlert from '$lib/components/auth/auth-form-message-alert.svelte';
	import AuthFormPanel from '$lib/components/auth/auth-form-panel.svelte';
	import FormAlert from '$lib/components/auth/form-alert.svelte';
	import InvitationAcceptPanel from '$lib/components/team/invitation-accept-panel.svelte';
	import InvitationAccountPathStep from '$lib/components/team/invitation-account-path-step.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import GradientButton from '$lib/components/gradient-button.svelte';
	import { AUTH_ACTION_BUTTON_CLASS } from '$lib/auth/ui';
	import { enhance as formEnhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { acceptInvitationSchema } from '$lib/shared/schemas/accept-invitation';
	import { TEAM_INVITATION_DECLINED_MESSAGE } from '$lib/shared/team/invitation-messages';

	let { data } = $props();

	let submitting = $state(false);
	let declining = $state(false);
	let declined = $state(false);
	let acceptFormRef = $state<HTMLFormElement | null>(null);

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

	const showDeclineFooter = $derived(data.tokenValid && !declined);

	function formatExpiry(value: string | undefined): string | null {
		if (!value) {
			return null;
		}

		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}

	const expiryLabel = $derived(formatExpiry(data.invitation?.expiresAt));

	const declineEnhance: SubmitFunction = () => {
		declining = true;

		return async ({ result, update }) => {
			declining = false;

			if (result.type === 'success') {
				declined = true;
			}

			await update();
		};
	};
</script>

<AuthFormPanel
	title={data.tokenValid && data.invitation && !data.isAuthenticated
		? `Join ${data.invitation.workspaceName}`
		: 'Accept invitation'}
	description={data.tokenValid && data.invitation && !data.isAuthenticated
		? `You were invited as ${data.invitation.roleLabel}. Pick the path that fits you.`
		: data.tokenValid && !data.isAuthenticated
			? 'Review your workspace invitation below.'
			: undefined}
>
	{#if declined}
		<StatusAlert
			variant="plain"
			title="Invitation declined"
			description={TEAM_INVITATION_DECLINED_MESSAGE}
		/>
		<GradientButton href="/login" tone="primary" class={AUTH_ACTION_BUTTON_CLASS}>Sign in</GradientButton>
	{:else if !data.tokenValid}
		<FormAlert
			title="Invitation unavailable"
			description="This invitation link is invalid or has expired. Ask your workspace admin to send a new invite."
		/>
		<GradientButton href="/login" tone="primary" class={AUTH_ACTION_BUTTON_CLASS}>Sign in</GradientButton>
	{:else if !data.isAuthenticated}
		<InvitationAccountPathStep
			{invitedEmail}
			workspaceName={data.invitation?.workspaceName ?? 'this workspace'}
			brandLogoUrl={data.invitation?.brandLogoUrl ?? null}
			roleLabel={data.invitation?.roleLabel ?? 'member'}
			{loginHref}
			{signupHref}
			inviteeHasAccount={data.inviteeHasAccount}
		/>
	{:else}
		<div class="space-y-5">
			{#if data.autoAcceptError}
				<FormAlert title="Could not join workspace" description={data.autoAcceptError} />
			{/if}

			{#if $formMessage}
				<AuthFormMessageAlert message={$formMessage} />
			{/if}

			<form
				bind:this={acceptFormRef}
				method="POST"
				action="?/accept"
				use:enhance
				class="contents"
			>
				<input type="hidden" name="token" value={$form.token} />
			</form>

			<InvitationAcceptPanel
				workspaceName={data.invitation?.workspaceName ?? 'this workspace'}
				brandLogoUrl={data.invitation?.brandLogoUrl ?? null}
				roleLabel={data.invitation?.roleLabel ?? 'member'}
				{invitedEmail}
				{expiryLabel}
				accepting={submitting}
				onAccept={() => acceptFormRef?.requestSubmit()}
			/>
		</div>
	{/if}

	{#snippet footer()}
		{#if showDeclineFooter}
			<form method="POST" action="?/decline" use:formEnhance={declineEnhance}>
				<input type="hidden" name="token" value={$form.token} />
				<p class="text-center text-sm">
					<button
						type="submit"
						class="text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-60"
						disabled={declining || submitting}
					>
						{#if declining}
							Declining…
						{:else}
							Decline invitation
						{/if}
					</button>
				</p>
			</form>
		{/if}
	{/snippet}
</AuthFormPanel>
