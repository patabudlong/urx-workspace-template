<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import InviteRoleCombobox from '$lib/components/team/invite-role-combobox.svelte';
	import TeamLearnAboutRolesLink from '$lib/components/team/team-learn-about-roles-link.svelte';
	import PendingInvitationsEmpty from '$lib/components/team/pending-invitations-empty.svelte';
	import PendingInvitationsList from '$lib/components/team/pending-invitations-list.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';
	import {
		TEAM_INVITATION_SENT_DESCRIPTION,
		TEAM_INVITATION_SENT_EXISTING_ACCOUNT_DESCRIPTION,
		TEAM_INVITATION_SENT_EXISTING_ACCOUNT_MESSAGE,
		TEAM_INVITATION_SENT_MESSAGE,
		TEAM_INVITATION_SEND_FAILED_MESSAGE,
		TEAM_PENDING_INVITATIONS_DESCRIPTION
	} from '$lib/shared/team/invitation-messages';
	import { teamInvitationSchema } from '$lib/shared/schemas/team-invitation';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import MailIcon from '@lucide/svelte/icons/mail';
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	let { data } = $props();

	let submitting = $state(false);
	let showSuccess = $state(false);
	let emailInputRef = $state<HTMLInputElement | null>(null);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(teamInvitationSchema),
		resetForm: false,
		onSubmit: () => {
			submitting = true;
			showSuccess = false;
		},
		onUpdated: async ({ form: updatedForm }) => {
			submitting = false;

			if (
				updatedForm.message === TEAM_INVITATION_SENT_MESSAGE ||
				updatedForm.message === TEAM_INVITATION_SENT_EXISTING_ACCOUNT_MESSAGE
			) {
				showSuccess = true;
				form.update(($current) => {
					$current.email = '';
					return $current;
				});
				await invalidateAll();
			}
		},
		onError: () => {
			submitting = false;
		}
	});

	const { enhance, form, message: formMessage } = superform;

	const invitationSentDescription = $derived(
		$formMessage === TEAM_INVITATION_SENT_EXISTING_ACCOUNT_MESSAGE
			? TEAM_INVITATION_SENT_EXISTING_ACCOUNT_DESCRIPTION
			: TEAM_INVITATION_SENT_DESCRIPTION
	);

	const selectedRoleDescription = $derived(
		findTeamInviteRoleOption($form.role)?.description ??
			'Choose the access level for this teammate.'
	);

	const formError = $derived(
		typeof $formMessage === 'string' &&
			$formMessage.length > 0 &&
			$formMessage !== TEAM_INVITATION_SENT_MESSAGE &&
			$formMessage !== TEAM_INVITATION_SENT_EXISTING_ACCOUNT_MESSAGE
			? $formMessage
			: null
	);

	function inviteAnother() {
		showSuccess = false;
		$form.email = '';
		emailInputRef?.focus();
	}
</script>

<div class="flex w-full min-w-0 flex-col gap-8">
	<PageHeader
		eyebrow="Team"
		title="Invitations"
		description="Invite teammates by email. They must accept the invitation before they appear under Members."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Invite teammate</Card.Title>
			<Card.Description>
				Send an email invitation. Recipients sign in or create an account with the invited email to accept.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/send" use:enhance class="max-w-xl space-y-5">
				{#if showSuccess}
					<StatusAlert
						variant="success"
						title="Invitation sent"
						description={invitationSentDescription}
					/>
					<Button type="button" variant="outline" class="h-10" onclick={inviteAnother}>
						Invite another
					</Button>
				{:else if formError}
					<StatusAlert
						variant="danger"
						title={formError === TEAM_INVITATION_SEND_FAILED_MESSAGE
							? 'Invitation failed'
							: 'Could not send invitation'}
						description={formError}
					/>
				{/if}

				<Form.Field form={superform} name="email">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>Email</Form.Label>
							<InputGroup.Root class="h-10">
								<InputGroup.Addon align="inline-start" class="text-muted-foreground">
									<MailIcon class="size-4" aria-hidden="true" />
								</InputGroup.Addon>
								<InputGroup.Input
									{...props}
									bind:ref={emailInputRef}
									type="email"
									autocomplete="off"
									class="h-10"
									disabled={submitting}
									bind:value={$form.email}
								/>
							</InputGroup.Root>
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<Form.Field form={superform} name="role">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label required>Role</Form.Label>
							<div class="flex items-center justify-between gap-2">
								<p class="text-muted-foreground text-xs leading-relaxed">
									{selectedRoleDescription}
								</p>
								<TeamLearnAboutRolesLink class="shrink-0" />
							</div>
							<InviteRoleCombobox
								id={props.id}
								bind:value={$form.role}
								disabled={submitting}
								aria-invalid={props['aria-invalid']}
							/>
							<input type="hidden" name={props.name} value={$form.role} />
						{/snippet}
					</Form.Control>
					<SingleFieldErrors />
				</Form.Field>

				<div class="pt-1">
					<Button type="submit" disabled={submitting} class="h-10 px-4">
						{#if submitting}
							<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
							Sending invitation…
						{:else}
							Send invitation
						{/if}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root class="overflow-visible">
		<Card.Header>
			<Card.Title>Pending invitations</Card.Title>
			<Card.Description>{TEAM_PENDING_INVITATIONS_DESCRIPTION}</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.pendingInvitations.length > 0}
				<PendingInvitationsList invitations={data.pendingInvitations} />
			{:else}
				<PendingInvitationsEmpty />
			{/if}
		</Card.Content>
	</Card.Root>
</div>
