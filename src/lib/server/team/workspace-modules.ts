import { updateWorkspaceEnabledPackages } from '$lib/server/repositories/workspaces';
import { isWorkspaceOwner } from '$lib/navigation/app-nav';
import {
	normalizeEnabledPackages,
	type WorkspacePackageId
} from '$lib/shared/workspace-packages';

export type UpdateWorkspaceModulesForWebResult =
	| { ok: true; enabledPackages: WorkspacePackageId[] }
	| { ok: false; reason: 'FORBIDDEN' | 'NOT_FOUND' };

export async function updateWorkspaceModulesForWeb(input: {
	workspaceId: string;
	actorRole: string;
	enabledPackages: WorkspacePackageId[];
}): Promise<UpdateWorkspaceModulesForWebResult> {
	if (!isWorkspaceOwner(input.actorRole)) {
		return { ok: false, reason: 'FORBIDDEN' };
	}

	const updated = await updateWorkspaceEnabledPackages({
		workspaceId: input.workspaceId,
		enabledPackages: input.enabledPackages
	});

	if (!updated) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	return {
		ok: true,
		enabledPackages: normalizeEnabledPackages(updated.enabledPackages)
	};
}
