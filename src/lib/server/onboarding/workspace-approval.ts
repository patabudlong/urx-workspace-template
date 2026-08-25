import { findUserById } from '$lib/server/repositories/users';
import { approveWorkspaceRequest, rejectWorkspaceRequest } from '$lib/server/repositories/workspaces';
import { createWorkspaceMember } from '$lib/server/repositories/workspace-members';
import { isMailConfigured } from '$lib/server/mail/index';
import { sendWorkspaceApprovedEmail } from '$lib/server/mail/workspace-approved';
import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';
import type { WorkspacePackageId } from '$lib/shared/workspace-packages';
import { recordPlatformSecurityEvent } from '$lib/server/security/record-security-event';
import { SECURITY_EVENT_ACTIONS } from '$lib/shared/models/security-event';

export async function approveWorkspaceOwnerRequest(input: {
	workspaceId: string;
	reviewedByUserId: string;
	origin: string;
	enabledPackages?: WorkspacePackageId[];
}): Promise<{ ok: true } | { ok: false; reason: 'NOT_FOUND' }> {
	const workspace = await approveWorkspaceRequest({
		workspaceId: input.workspaceId,
		reviewedByUserId: input.reviewedByUserId,
		enabledPackages: input.enabledPackages
	});

	if (!workspace) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	await createWorkspaceMember({
		userId: workspace.requestedByUserId.toString(),
		workspaceId: workspace._id.toString(),
		role: WORKSPACE_MEMBER_ROLES.OWNER
	});

	const requester = await findUserById(workspace.requestedByUserId.toString());

	if (requester && (await isMailConfigured())) {
		try {
			await sendWorkspaceApprovedEmail({
				to: requester.email,
				firstName: requester.firstName,
				workspaceName: workspace.name,
				workspaceSlug: workspace.slug,
				origin: input.origin
			});
		} catch (error) {
			console.error('Failed to send workspace approved email', error);
		}
	}

	await recordPlatformSecurityEvent({
		actorUserId: input.reviewedByUserId,
		action: SECURITY_EVENT_ACTIONS.WORKSPACE_APPROVED,
		workspaceId: workspace._id.toString(),
		metadata: {
			detail: `Approved workspace "${workspace.name}".`,
			workspaceName: workspace.name,
			workspaceSlug: workspace.slug
		}
	});

	return { ok: true };
}

export async function rejectWorkspaceOwnerRequest(input: {
	workspaceId: string;
	reviewedByUserId: string;
	rejectionReason?: string;
}): Promise<{ ok: true } | { ok: false; reason: 'NOT_FOUND' }> {
	const workspace = await rejectWorkspaceRequest(input);

	if (!workspace) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	await recordPlatformSecurityEvent({
		actorUserId: input.reviewedByUserId,
		action: SECURITY_EVENT_ACTIONS.WORKSPACE_REJECTED,
		workspaceId: workspace._id.toString(),
		metadata: {
			detail: `Rejected workspace "${workspace.name}".`,
			workspaceName: workspace.name,
			rejectionReason: input.rejectionReason
		}
	});

	return { ok: true };
}
