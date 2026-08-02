import {
	ensureWorkspaceMemberIndexes,
	findWorkspaceMemberById,
	removeWorkspaceMember
} from '$lib/server/repositories/workspace-members';
import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';
import {
	canRemoveWorkspaceMember,
	canRemoveWorkspaceMembers
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
