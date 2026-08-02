<script lang="ts">
	import StatusAlert from '$lib/components/status-alert.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		TEAM_INVITATION_CANCEL_FAILED_MESSAGE,
		TEAM_INVITATION_CANCELLED_MESSAGE
	} from '$lib/shared/team/invitation-messages';
	import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import XIcon from '@lucide/svelte/icons/x';

	export type PendingInvitationItem = {
		id: string;
		email: string;
		role: string;
		roleLabel: string;
		createdAt: string;
	};

	let { invitations }: { invitations: PendingInvitationItem[] } = $props();

	let cancelingId = $state<string | null>(null);
	let cancelMessage = $state<string | null>(null);
	let cancelError = $state<string | null>(null);

	function formatSentAt(value: string): string {
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
</script>

<div class="space-y-4">
	{#if cancelMessage}
		<StatusAlert variant="success" title="Invitation cancelled" description={cancelMessage} />
	{:else if cancelError}
		<StatusAlert variant="danger" title="Could not cancel invitation" description={cancelError} />
	{/if}

	<div class="overflow-hidden rounded-lg border">
		<table class="w-full text-sm">
			<thead class="bg-muted/40 border-b">
				<tr>
					<th class="text-muted-foreground px-4 py-3 text-left font-medium">Email</th>
					<th class="text-muted-foreground px-4 py-3 text-left font-medium">Role</th>
					<th class="text-muted-foreground px-4 py-3 text-left font-medium">Sent</th>
					<th class="text-muted-foreground px-4 py-3 text-right font-medium">
						<span class="sr-only">Actions</span>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each invitations as invitation (invitation.id)}
					<tr class="border-b last:border-b-0">
						<td class="px-4 py-3">{invitation.email}</td>
						<td class="px-4 py-3">
							{invitation.roleLabel ??
								findTeamInviteRoleOption(invitation.role)?.label ??
								invitation.role}
						</td>
						<td class="text-muted-foreground px-4 py-3">{formatSentAt(invitation.createdAt)}</td>
						<td class="px-4 py-3 text-right">
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
									disabled={cancelingId === invitation.id}
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
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
