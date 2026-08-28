import { listDeployedWorkspacePackageIds } from '$lib/server/workspace-packages/installed';
import { WORKSPACE_PACKAGE_IDS } from '$lib/shared/workspace-packages';

export type CrmProjectHandoffModule = typeof import('$lib/server/project-management/crm-deal-handoff');

export async function loadCrmProjectHandoffModule(): Promise<CrmProjectHandoffModule | null> {
	const deployed = await listDeployedWorkspacePackageIds();

	if (!deployed.includes(WORKSPACE_PACKAGE_IDS.PROJECT_MANAGEMENT)) {
		return null;
	}

	try {
		return await import('$lib/server/project-management/crm-deal-handoff');
	} catch {
		return null;
	}
}

export async function isCrmProjectHandoffAvailable(): Promise<boolean> {
	return (await loadCrmProjectHandoffModule()) !== null;
}
