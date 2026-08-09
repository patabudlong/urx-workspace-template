import {
	ensureWorkspaceMemberIndexes,
	findWorkspaceMemberById,
	removeWorkspaceMember,
	updateWorkspaceMemberRole
} from '$lib/server/repositories/workspace-members';
import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';
import type { TeamInviteRole } from '$lib/shared/team/invite-roles';
import {
	canRemoveWorkspaceMember,
	canRemoveWorkspaceMembers,
	canUpdateWorkspaceMember
} from '$lib/shared/team/member-management';

export async function removeWorkspaceMemberForWeb(input: {
	workspaceId: string;
	actorRole: string;
	memberId: string;
}): Promise<
	| { ok: true }
	| { ok: false; reason: 'FORBIDDEN' }
	| { ok: false; reason: 'NOT_FOUND' }
	| { ok: false; reason: 'OWNER' }
> {
	if (!canRemoveWorkspaceMembers(input.actorRole)) {
		return { ok: false, reason: 'FORBIDDEN' };
	}

	await ensureWorkspaceMemberIndexes();

	const member = await findWorkspaceMemberById({
		memberId: input.memberId,
		workspaceId: input.workspaceId
	});

	if (!member) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	if (member.role === WORKSPACE_MEMBER_ROLES.OWNER) {
		return { ok: false, reason: 'OWNER' };
	}

	if (!canRemoveWorkspaceMember({
		actorRole: input.actorRole,
		targetRole: member.role
	})) {
		return { ok: false, reason: 'FORBIDDEN' };
	}

	const removed = await removeWorkspaceMember({
		memberId: input.memberId,
		workspaceId: input.workspaceId
	});

	if (!removed) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	return { ok: true };
}

export async function updateWorkspaceMemberRoleForWeb(input: {
	workspaceId: string;
	actorRole: string;
	actorUserId: string;
	memberId: string;
	role: TeamInviteRole;
}): Promise<
	| { ok: true; changed: boolean }
	| { ok: false; reason: 'FORBIDDEN' }
	| { ok: false; reason: 'NOT_FOUND' }
	| { ok: false; reason: 'OWNER' }
	| { ok: false; reason: 'SELF' }
> {
	if (!canRemoveWorkspaceMembers(input.actorRole)) {
		return { ok: false, reason: 'FORBIDDEN' };
	}

	await ensureWorkspaceMemberIndexes();

	const member = await findWorkspaceMemberById({
		memberId: input.memberId,
		workspaceId: input.workspaceId
	});

	if (!member) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	if (member.role === WORKSPACE_MEMBER_ROLES.OWNER) {
		return { ok: false, reason: 'OWNER' };
	}

	if (
		!canUpdateWorkspaceMember({
			actorRole: input.actorRole,
			actorUserId: input.actorUserId,
			targetUserId: member.userId.toString(),
			targetRole: member.role
		})
	) {
		if (input.actorUserId === member.userId.toString()) {
			return { ok: false, reason: 'SELF' };
		}

		return { ok: false, reason: 'FORBIDDEN' };
	}

	if (member.role === input.role) {
		return { ok: true, changed: false };
	}

	const updated = await updateWorkspaceMemberRole({
		memberId: input.memberId,
		workspaceId: input.workspaceId,
		role: input.role
	});

	if (!updated) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	return { ok: true, changed: true };
}
