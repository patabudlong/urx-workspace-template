import { error } from '@sveltejs/kit';
import { jsonError } from '$lib/server/api/response';
import {
	isWorkspacePackageEnabled,
	type WorkspacePackageId
} from '$lib/shared/workspace-packages';
import type { WorkspaceContext } from '$lib/shared/workspace-context';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';

type WorkspaceModuleApiContextResult =
	| {
			ok: true;
			workspace: WorkspaceContext;
			requestId?: string;
	  }
	| {
			ok: false;
			response: Response;
	  };

export function requireWorkspacePackage(
	workspace: WorkspaceContext | null | undefined,
	packageId: WorkspacePackageId
): asserts workspace is WorkspaceContext {
	if (!workspace || !isWorkspacePackageEnabled(workspace.enabledPackages, packageId)) {
		error(404, 'Not found');
	}
}

export async function requireWorkspaceModuleApiContext(input: {
	userId: string | undefined;
	url: URL;
	packageId: WorkspacePackageId;
	requestId?: string;
	requireRole?: (role: string) => boolean;
	forbiddenMessage?: string;
}): Promise<WorkspaceModuleApiContextResult> {
	const { userId, url, packageId, requestId, requireRole, forbiddenMessage } = input;

	if (!userId) {
		return {
			ok: false,
			response: jsonError('UNAUTHORIZED', 'Authentication required', { requestId })
		};
	}

	const workspaces = await listUserWorkspaceContexts(userId);
	const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

	if (!workspace) {
		return {
			ok: false,
			response: jsonError('FORBIDDEN', 'No active workspace', { requestId })
		};
	}

	if (!isWorkspacePackageEnabled(workspace.enabledPackages, packageId)) {
		return {
			ok: false,
			response: jsonError('FORBIDDEN', 'Module not enabled for this workspace', { requestId })
		};
	}

	if (requireRole && !requireRole(workspace.role)) {
		return {
			ok: false,
			response: jsonError('FORBIDDEN', forbiddenMessage ?? 'Access required', { requestId })
		};
	}

	return { ok: true, workspace, requestId };
}
