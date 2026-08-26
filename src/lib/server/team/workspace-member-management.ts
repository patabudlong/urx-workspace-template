import {
	ensureWorkspaceMemberIndexes,
	findWorkspaceMemberById,
	removeWorkspaceMember,
	updateWorkspaceMemberRole
} from '$lib/server/repositories/workspace-members';
import { findUserById } from '$lib/server/repositories/users';
import type { SecurityEventRequestContext } from '$lib/server/security/record-security-event';
import { recordWorkspaceSecurityEvent } from '$lib/server/security/record-security-event';
import {
	notifyTeamMemberRemoved,
	notifyTeamMemberRoleChanged
} from '$lib/server/notifications/record-notification';
import { findWorkspaceById } from '$lib/server/repositories/workspaces';
import { SECURITY_EVENT_ACTIONS } from '$lib/shared/models/security-event';
import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';
import type { TeamInviteRole } from '$lib/shared/team/invite-roles';
import { findTeamInviteRoleOption } from '$lib/shared/team/invite-roles';
import {
	canRemoveWorkspaceMember,
	canRemoveWorkspaceMembers,
	canUpdateWorkspaceMember
} from '$lib/shared/team/member-management';

export async function removeWorkspaceMemberForWeb(input: {
	workspaceId: string;
	actorRole: string;
	actorUserId: string;
	memberId: string;
	security?: SecurityEventRequestContext;
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

	const targetUser = await findUserById(member.userId.toString());

	await recordWorkspaceSecurityEvent({
		workspaceId: input.workspaceId,
		actorUserId: input.actorUserId,
		action: SECURITY_EVENT_ACTIONS.MEMBER_REMOVED,
		targetUserId: member.userId.toString(),
		ipAddress: input.security?.ipAddress,
		userAgent: input.security?.userAgent,
		metadata: {
			detail: targetUser
				? `Removed ${targetUser.firstName} ${targetUser.lastName} (${targetUser.email}) from the workspace.`
				: 'A workspace member was removed.',
			previousRole: member.role
		}
	});

	const workspace = await findWorkspaceById(input.workspaceId);

	await notifyTeamMemberRemoved({
		recipientUserId: member.userId.toString(),
		workspaceId: input.workspaceId,
		workspaceName: workspace?.name ?? 'the workspace'
	});

	return { ok: true };
}

export async function updateWorkspaceMemberRoleForWeb(input: {
	workspaceId: string;
	actorRole: string;
	actorUserId: string;
	memberId: string;
	role: TeamInviteRole;
	security?: SecurityEventRequestContext;
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

	const targetUser = await findUserById(member.userId.toString());
	const roleLabel = findTeamInviteRoleOption(input.role)?.label ?? input.role;
	const previousRoleLabel = findTeamInviteRoleOption(member.role)?.label ?? member.role;

	await recordWorkspaceSecurityEvent({
		workspaceId: input.workspaceId,
		actorUserId: input.actorUserId,
		action: SECURITY_EVENT_ACTIONS.MEMBER_ROLE_CHANGED,
		targetUserId: member.userId.toString(),
		ipAddress: input.security?.ipAddress,
		userAgent: input.security?.userAgent,
		metadata: {
			detail: targetUser
				? `Changed ${targetUser.firstName} ${targetUser.lastName}'s role from ${previousRoleLabel} to ${roleLabel}.`
				: `Changed a member role from ${previousRoleLabel} to ${roleLabel}.`,
			previousRole: member.role,
			newRole: input.role
		}
	});

	await notifyTeamMemberRoleChanged({
		recipientUserId: member.userId.toString(),
		workspaceId: input.workspaceId,
		previousRoleLabel,
		newRoleLabel: roleLabel
	});

	return { ok: true, changed: true };
}
