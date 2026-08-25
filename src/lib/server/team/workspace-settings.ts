import {
	findWorkspaceById,
	findWorkspaceByName,
	updateWorkspaceBrandLogoUrl,
	updateWorkspaceName
} from '$lib/server/repositories/workspaces';
import { saveWorkspaceBrandLogo } from '$lib/server/workspace-branding';
import { canEditTeamSettings } from '$lib/shared/team/member-management';

export type UpdateWorkspaceNameForWebResult =
	| { ok: true; name: string }
	| {
			ok: false;
			reason: 'FORBIDDEN' | 'NOT_FOUND' | 'NO_CHANGES' | 'NAME_TAKEN';
	  };

export async function updateWorkspaceNameForWeb(input: {
	workspaceId: string;
	actorRole: string;
	name: string;
}): Promise<UpdateWorkspaceNameForWebResult> {
	if (!canEditTeamSettings(input.actorRole)) {
		return { ok: false, reason: 'FORBIDDEN' };
	}

	const workspace = await findWorkspaceById(input.workspaceId);

	if (!workspace) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	const trimmed = input.name.trim();

	if (workspace.name.localeCompare(trimmed, undefined, { sensitivity: 'accent' }) === 0) {
		return { ok: false, reason: 'NO_CHANGES' };
	}

	const existing = await findWorkspaceByName(trimmed);

	if (existing && existing._id.toString() !== input.workspaceId) {
		return { ok: false, reason: 'NAME_TAKEN' };
	}

	const updated = await updateWorkspaceName({
		workspaceId: input.workspaceId,
		name: trimmed
	});

	if (!updated) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	return { ok: true, name: updated.name };
}

export type UpdateWorkspaceBrandLogoForWebResult =
	| { ok: true; brandLogoUrl: string | null; removed: boolean }
	| {
			ok: false;
			reason:
				| 'FORBIDDEN'
				| 'NOT_FOUND'
				| 'NO_CHANGES'
				| 'INVALID_TYPE'
				| 'FILE_TOO_LARGE'
				| 'INVALID_SLUG'
				| 'STORAGE_NOT_CONFIGURED'
				| 'UPLOAD_FAILED';
	  };

export async function updateWorkspaceBrandLogoForWeb(input: {
	workspaceId: string;
	workspaceSlug: string;
	actorRole: string;
	brandLogo?: File;
	removeLogo?: boolean;
}): Promise<UpdateWorkspaceBrandLogoForWebResult> {
	if (!canEditTeamSettings(input.actorRole)) {
		return { ok: false, reason: 'FORBIDDEN' };
	}

	if (input.removeLogo) {
		const updated = await updateWorkspaceBrandLogoUrl({
			workspaceId: input.workspaceId,
			brandLogoUrl: null
		});

		if (!updated) {
			return { ok: false, reason: 'NOT_FOUND' };
		}

		return { ok: true, brandLogoUrl: null, removed: true };
	}

	if (!input.brandLogo || input.brandLogo.size === 0) {
		return { ok: false, reason: 'NO_CHANGES' };
	}

	const saved = await saveWorkspaceBrandLogo({
		slug: input.workspaceSlug,
		file: input.brandLogo
	});

	if (!saved.ok) {
		return { ok: false, reason: saved.reason };
	}

	const updated = await updateWorkspaceBrandLogoUrl({
		workspaceId: input.workspaceId,
		brandLogoUrl: saved.url
	});

	if (!updated) {
		return { ok: false, reason: 'NOT_FOUND' };
	}

	return { ok: true, brandLogoUrl: updated.brandLogoUrl ?? saved.url, removed: false };
}
