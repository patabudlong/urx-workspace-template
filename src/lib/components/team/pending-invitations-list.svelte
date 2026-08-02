<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		TEAM_INVITATION_CANCEL_FAILED_MESSAGE,
		TEAM_INVITATION_CANCELLED_MESSAGE,
		TEAM_INVITATION_RESEND_FAILED_MESSAGE,
		TEAM_INVITATION_RESENT_MESSAGE
	} from '$lib/shared/team/invitation-messages';
	import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import XIcon from '@lucide/svelte/icons/x';

	export type PendingInvitationItem = {
		id: string;
		email: string;
		role: string;
		roleLabel: string;
		createdAt: string;
		expiresAt: string;
		hasAccount: boolean;
	};

	let { invitations }: { invitations: PendingInvitationItem[] } = $props();

	let cancelingId = $state<string | null>(null);
	let resendingId = $state<string | null>(null);
	let cancelMessage = $state<string | null>(null);
	let cancelError = $state<string | null>(null);
	let resendMessage = $state<string | null>(null);
	let resendError = $state<string | null>(null);

	function formatDateTime(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}

	function createCancelEnhance(invitationId: string): SubmitFunction {
		return () => {
			cancelingId = invitationId;
			cancelMessage = null;
			cancelError = null;

			return async ({ result, update }) => {
				cancelingId = null;

				if (result.type === 'success') {
					cancelMessage = TEAM_INVITATION_CANCELLED_MESSAGE;
					cancelError = null;
					resendMessage = null;
					resendError = null;
					await invalidateAll();
				} else if (result.type === 'failure') {
					const data = result.data as { cancelMessage?: string } | undefined;
					cancelError = data?.cancelMessage ?? TEAM_INVITATION_CANCEL_FAILED_MESSAGE;
					cancelMessage = null;
				}

				await update();
			};
		};
	}

	function createResendEnhance(invitationId: string): SubmitFunction {
		return () => {
			resendingId = invitationId;
			resendMessage = null;
			resendError = null;

			return async ({ result, update }) => {
				resendingId = null;

				if (result.type === 'success') {
					resendMessage = TEAM_INVITATION_RESENT_MESSAGE;
					resendError = null;
					cancelMessage = null;
					cancelError = null;
					await invalidateAll();
				} else if (result.type === 'failure') {
					const data = result.data as { resendMessage?: string } | undefined;
					resendError = data?.resendMessage ?? TEAM_INVITATION_RESEND_FAILED_MESSAGE;
					resendMessage = null;
				}

				await update();
			};
		};
	}
</script>

<div class="space-y-4">
	{#if cancelMessage}
		<StatusAlert variant="success" title="Invitation cancelled" description={cancelMessage} />
	{:else if resendMessage}
		<StatusAlert variant="success" title="Invitation resent" description={resendMessage} />
	{:else if cancelError}
		<StatusAlert variant="danger" title="Could not cancel invitation" description={cancelError} />
	{:else if resendError}
		<StatusAlert variant="danger" title="Could not resend invitation" description={resendError} />
	{/if}

	<div class="overflow-hidden rounded-lg border">
		<table class="w-full text-sm">
			<thead class="bg-muted/40 border-b">
				<tr>
					<th class="text-muted-foreground px-4 py-3 text-left font-medium">Email</th>
					<th class="text-muted-foreground px-4 py-3 text-left font-medium">Role</th>
					<th class="text-muted-foreground px-4 py-3 text-left font-medium">Sent</th>
					<th class="text-muted-foreground px-4 py-3 text-left font-medium">Expires</th>
					<th class="text-muted-foreground px-4 py-3 text-right font-medium">
						<span class="sr-only">Actions</span>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each invitations as invitation (invitation.id)}
					<tr class="border-b last:border-b-0">
						<td class="px-4 py-3">
							<div class="space-y-1">
								<p>{invitation.email}</p>
								{#if invitation.hasAccount}
									<p class="text-muted-foreground text-xs">Has an account — can sign in to accept</p>
								{:else}
									<p class="text-muted-foreground text-xs">New user — will create an account</p>
								{/if}
							</div>
						</td>
						<td class="px-4 py-3">
							{invitation.roleLabel ??
								findTeamInviteRoleOption(invitation.role)?.label ??
								invitation.role}
						</td>
						<td class="text-muted-foreground px-4 py-3">{formatDateTime(invitation.createdAt)}</td>
						<td class="text-muted-foreground px-4 py-3">{formatDateTime(invitation.expiresAt)}</td>
						<td class="px-4 py-3 text-right">
							<div class="inline-flex items-center gap-1">
								<form
									method="POST"
									action="?/resend"
									use:enhance={createResendEnhance(invitation.id)}
									class="inline-flex"
								>
									<input type="hidden" name="invitationId" value={invitation.id} />
									<Button
										type="submit"
										variant="ghost"
										size="sm"
										class="text-muted-foreground h-8 px-2"
										disabled={resendingId === invitation.id || cancelingId === invitation.id}
										aria-label={`Resend invitation for ${invitation.email}`}
									>
										{#if resendingId === invitation.id}
											<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
											Resending…
										{:else}
											<RotateCcwIcon class="size-4" aria-hidden="true" />
											Resend
										{/if}
									</Button>
								</form>
								<form
									method="POST"
									action="?/cancel"
									use:enhance={createCancelEnhance(invitation.id)}
									class="inline-flex"
								>
									<input type="hidden" name="invitationId" value={invitation.id} />
									<Button
										type="submit"
										variant="ghost"
										size="sm"
										class="text-muted-foreground hover:text-destructive h-8 px-2"
										disabled={cancelingId === invitation.id || resendingId === invitation.id}
										aria-label={`Cancel invitation for ${invitation.email}`}
									>
										{#if cancelingId === invitation.id}
											<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
											Cancelling…
										{:else}
											<XIcon class="size-4" aria-hidden="true" />
											Cancel
										{/if}
									</Button>
								</form>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
