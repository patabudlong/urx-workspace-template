import { approveWorkspaceRequest, rejectWorkspaceRequest } from '$lib/server/repositories/workspaces';
import { createWorkspaceMember } from '$lib/server/repositories/workspace-members';
import { WORKSPACE_MEMBER_ROLES } from '$lib/shared/models/workspace-member';

export async function approveWorkspaceOwnerRequest(input: {
	workspaceId: string;
	reviewedByUserId: string;
}): Promise<{ ok: true } | { ok: false; reason: 'NOT_FOUND' }> {
	const workspace = await approveWorkspaceRequest(input);

	if (!workspace) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	await createWorkspaceMember({
		userId: workspace.requestedByUserId.toString(),
		workspaceId: workspace._id.toString(),
		role: WORKSPACE_MEMBER_ROLES.OWNER
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

	return { ok: true };
}
