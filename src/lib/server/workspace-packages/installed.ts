import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
	normalizeEnabledPackages,
	WORKSPACE_PACKAGE_CATALOG,
	type WorkspacePackageId,
	type WorkspacePackageMeta
} from '$lib/shared/workspace-packages';

type PackageManifest = {
	id?: string;
};

const packagesDir = path.join(process.cwd(), '.urx-packages');

let deployedPackageIdsPromise: Promise<WorkspacePackageId[]> | null = null;

async function readDeployedPackageIds(): Promise<WorkspacePackageId[]> {
	try {
		const entries = await readdir(packagesDir, { withFileTypes: true });
		const ids: string[] = [];

		for (const entry of entries) {
			if (!entry.isFile() || !entry.name.endsWith('.json')) {
				continue;
			}

			const raw = await readFile(path.join(packagesDir, entry.name), 'utf8');
			const manifest = JSON.parse(raw) as PackageManifest;

			if (typeof manifest.id === 'string' && manifest.id.trim()) {
				ids.push(manifest.id.trim());
			}
		}

		return normalizeEnabledPackages(ids);
	} catch {
		return [];
	}
}

export async function listDeployedWorkspacePackageIds(): Promise<WorkspacePackageId[]> {
	if (!deployedPackageIdsPromise) {
		deployedPackageIdsPromise = readDeployedPackageIds().catch((error) => {
			deployedPackageIdsPromise = null;
			throw error;
		});
	}

	return deployedPackageIdsPromise;
}

export async function listDeployableWorkspacePackages(): Promise<WorkspacePackageMeta[]> {
	const deployedIds = await listDeployedWorkspacePackageIds();

	return WORKSPACE_PACKAGE_CATALOG.filter((entry) => deployedIds.includes(entry.id));
}

export function filterEnabledPackagesForDeployment(
	enabledPackages: readonly string[],
	deployedPackageIds: readonly WorkspacePackageId[]
): WorkspacePackageId[] {
	const deployed = new Set(deployedPackageIds);

	return normalizeEnabledPackages(enabledPackages).filter((packageId) => deployed.has(packageId));
}
