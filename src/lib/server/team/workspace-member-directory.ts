import { findUsersByIds } from '$lib/server/repositories/users';
import { resolveUserPresenceStatus } from '$lib/server/presence';
import {
	ensureWorkspaceMemberIndexes,
	listWorkspaceMembersByWorkspaceId
} from '$lib/server/repositories/workspace-members';
import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';
import { getWorkspaceMemberRoleLabel } from '$lib/shared/team/member-roles';
import { buildUserDisplay } from '$lib/shared/user-display';
import type { PresenceStatus } from '$lib/shared/presence';

export type WorkspaceMemberListItem = {
	id: string;
	userId: string;
	name: string;
	email: string;
	avatarUrl: string | null;
	initials: string;
	role: string;
	roleLabel: string;
	presenceStatus: PresenceStatus;
	joinedAt: string;
};


function compareMembers(a: WorkspaceMemberListItem, b: WorkspaceMemberListItem): number {
	if (a.role === WORKSPACE_MEMBER_ROLES.OWNER) {
		return -1;
	}

	if (b.role === WORKSPACE_MEMBER_ROLES.OWNER) {
		return 1;
	}

	return a.name.localeCompare(b.name);
}

export async function listWorkspaceMembersForDisplay(
	workspaceId: string
): Promise<WorkspaceMemberListItem[]> {
	await ensureWorkspaceMemberIndexes();

	const memberships = await listWorkspaceMembersByWorkspaceId(workspaceId);

	if (memberships.length === 0) {
		return [];
	}

	const users = await findUsersByIds(memberships.map((membership) => membership.userId.toString()));
	const usersById = new Map(users.map((user) => [user._id.toString(), user]));

	return memberships
		.map((membership) => {
			const user = usersById.get(membership.userId.toString());
			const email = user?.email ?? 'Unknown member';
			const display = user
				? buildUserDisplay({
						email: user.email,
						firstName: user.firstName,
						lastName: user.lastName,
						avatarUrl: user.avatarUrl,
						presenceStatus: resolveUserPresenceStatus(user)
					})
				: null;
			const name = display?.fullName ?? 'Unknown member';

			return {
				id: membership._id.toString(),
				userId: membership.userId.toString(),
				name,
				email,
				avatarUrl: display?.avatarUrl ?? null,
				initials: display?.initials ?? '?',
				role: membership.role,
				roleLabel: getWorkspaceMemberRoleLabel(membership.role),
				presenceStatus: display?.presenceStatus ?? 'offline',
				joinedAt: membership.joinedAt.toISOString()
			};
		})
		.sort(compareMembers);
}
