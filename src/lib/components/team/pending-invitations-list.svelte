<script lang="ts">
	import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';

	export type PendingInvitationItem = {
		id: string;
		email: string;
		role: string;
		roleLabel: string;
		createdAt: string;
	};

	let { invitations }: { invitations: PendingInvitationItem[] } = $props();

	function formatSentAt(value: string): string {
		return new Intl.DateTimeFormat(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}
</script>

<div class="overflow-hidden rounded-lg border">
	<table class="w-full text-sm">
		<thead class="bg-muted/40 border-b">
			<tr>
				<th class="text-muted-foreground px-4 py-3 text-left font-medium">Email</th>
				<th class="text-muted-foreground px-4 py-3 text-left font-medium">Role</th>
				<th class="text-muted-foreground px-4 py-3 text-left font-medium">Sent</th>
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
				</tr>
			{/each}
		</tbody>
	</table>
</div>
