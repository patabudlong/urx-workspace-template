import { findUsersByIds } from '$lib/server/repositories/users';
import {
	ensureWorkspaceMemberIndexes,
	listWorkspaceMembersByWorkspaceId
} from '$lib/server/repositories/workspace-members';
import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';
import { getWorkspaceMemberRoleLabel } from '$lib/shared/team/member-roles';

export type WorkspaceMemberListItem = {
	id: string;
	userId: string;
	name: string;
	email: string;
	role: string;
	roleLabel: string;
	joinedAt: string;
};

function formatMemberName(input: {
	firstName: string;
	lastName: string;
	email: string;
}): string {
	const name = `${input.firstName} ${input.lastName}`.trim();

	return name || input.email;
}

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
			const name = user
				? formatMemberName({
						firstName: user.firstName,
						lastName: user.lastName,
						email: user.email
					})
				: 'Unknown member';

			return {
				id: membership._id.toString(),
				userId: membership.userId.toString(),
				name,
				email,
				role: membership.role,
				roleLabel: getWorkspaceMemberRoleLabel(membership.role),
				joinedAt: membership.joinedAt.toISOString()
			};
		})
		.sort(compareMembers);
}
