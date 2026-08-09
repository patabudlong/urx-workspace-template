import {
	findWorkspaceByName,
	findWorkspaceBySlug,
	ensureWorkspaceIndexes
} from '$lib/server/repositories/workspaces';
import type { WorkspaceAvailabilityResult } from '$lib/shared/schemas/workspace-availability';
import {
	isWorkspaceNameReadyForAvailabilityCheck,
	isWorkspaceSlugReadyForAvailabilityCheck
} from '$lib/shared/schemas/workspace-availability';
import { slugifyWorkspaceName } from '$lib/shared/workspace-slug';

export async function checkWorkspaceAvailability(input: {
	name?: string;
	slug?: string;
}): Promise<WorkspaceAvailabilityResult> {
	await ensureWorkspaceIndexes();

	const result: WorkspaceAvailabilityResult = {};

	if (input.name !== undefined) {
		const trimmed = input.name.trim();

		if (!isWorkspaceNameReadyForAvailabilityCheck(trimmed)) {
			result.name = { available: false };
		} else {
			const existing = await findWorkspaceByName(trimmed);
			result.name = { available: !existing };
		}
	}

	if (input.slug !== undefined) {
		const slug = slugifyWorkspaceName(input.slug);

		if (!isWorkspaceSlugReadyForAvailabilityCheck(input.slug)) {
			result.slug = { available: false };
		} else {
			const existing = await findWorkspaceBySlug(slug);
			result.slug = { available: !existing };
		}
	}

	return result;
}
