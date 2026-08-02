<script lang="ts">
	import SingleFieldErrors from '$lib/components/auth/single-field-errors.svelte';
	import PageHeader from '$lib/components/dashboard/page-header.svelte';
	import InviteRoleCombobox from '$lib/components/team/invite-role-combobox.svelte';
	import PendingInvitationsEmpty from '$lib/components/team/pending-invitations-empty.svelte';
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';
	import { teamInvitationSchema } from '$lib/shared/schemas/team-invitation';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import MailIcon from '@lucide/svelte/icons/mail';
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';

	const INVITATION_SENT_MESSAGE = 'They will receive an email with instructions to join this workspace.';

	let { data } = $props();

	let submitting = $state(false);

	const superform = superForm(untrack(() => data.form), {
		validators: zod4Client(teamInvitationSchema),
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

	const selectedRoleDescription = $derived(
		findTeamInviteRoleOption($form.role)?.description ??
			'Choose the access level for this teammate.'
	);

	const invitationSent = $derived(
		typeof $formMessage === 'string' && $formMessage === 'Invitation sent.'
	);
</script>

<div class="flex w-full flex-col gap-8">
	<PageHeader
		eyebrow="Team"
		title="Invitations"
		description="Invite teammates by email and track pending workspace invitations."
	/>

	<Card.Root>
		<Card.Header>
			<Card.Title>Invite teammate</Card.Title>
			<Card.Description>Send an email invitation to join this workspace.</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" use:enhance class="max-w-xl space-y-5">
				{#if invitationSent}
					<StatusAlert
						variant="success"
						title="Invitation sent"
						description={INVITATION_SENT_MESSAGE}
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
							<p class="text-muted-foreground text-xs leading-relaxed">
								{selectedRoleDescription}
							</p>
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

	<Card.Root>
		<Card.Header>
			<Card.Title>Pending invitations</Card.Title>
			<Card.Description>Track invitations that have not been accepted yet.</Card.Description>
		</Card.Header>
		<Card.Content>
			<PendingInvitationsEmpty />
		</Card.Content>
	</Card.Root>
</div>
