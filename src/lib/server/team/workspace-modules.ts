import { updateWorkspaceEnabledPackages } from '$lib/server/repositories/workspaces';
import { isWorkspaceOwner } from '$lib/navigation/app-nav';
import { listDeployedWorkspacePackageIds } from '$lib/server/workspace-packages/installed';
import {
	WORKSPACE_PACKAGE_IDS,
	normalizeEnabledPackages,
	type WorkspacePackageId
} from '$lib/shared/workspace-packages';

export function applyWorkspaceModuleDependencies(
	enabledPackages: readonly WorkspacePackageId[],
	deployedPackageIds: readonly WorkspacePackageId[]
): WorkspacePackageId[] {
	const deployed = new Set(deployedPackageIds);
	const selected = new Set(normalizeEnabledPackages(enabledPackages));

	if (
		selected.has(WORKSPACE_PACKAGE_IDS.DTR) &&
		deployed.has(WORKSPACE_PACKAGE_IDS.PAYROLL) &&
		!selected.has(WORKSPACE_PACKAGE_IDS.PAYROLL)
	) {
		selected.add(WORKSPACE_PACKAGE_IDS.PAYROLL);
	}

	return normalizeEnabledPackages([...selected]);
}

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
		enabledPackages: applyWorkspaceModuleDependencies(
			input.enabledPackages,
			await listDeployedWorkspacePackageIds()
		)
	});

	if (!updated) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	return {
		ok: true,
		enabledPackages: normalizeEnabledPackages(updated.enabledPackages)
	};
}
