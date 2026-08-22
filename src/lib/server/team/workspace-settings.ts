import { saveWorkspaceBrandLogo } from '$lib/server/workspace-branding';
import { updateWorkspaceBrandLogoUrl } from '$lib/server/repositories/workspaces';
import { canEditTeamSettings } from '$lib/shared/team/member-management';

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
