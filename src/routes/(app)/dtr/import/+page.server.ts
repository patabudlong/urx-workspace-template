import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	buildDtrNgImportPreview,
	clearDtrNgImportPreviewCookie,
	importDtrNgPreviewRows,
	parseNgTimecardBuffer,
	readDtrNgImportPreviewCookie,
	writeDtrNgImportPreviewCookie
} from '$lib/server/dtr/ng-timecard-import';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageDtr } from '$lib/shared/dtr/access';
import {
	buildSecurityEventRequestContext,
	recordDtrSecurityEventInBackground
} from '$lib/server/security/record-security-event';
import { SECURITY_EVENT_ACTIONS } from '$lib/shared/models/security-event';
import {
	DTR_NG_IMPORT_EMPTY_MESSAGE,
	DTR_NG_IMPORT_FAILED_MESSAGE,
	DTR_NG_IMPORT_FILE_INVALID_MESSAGE,
	DTR_NG_IMPORT_FILE_REQUIRED_MESSAGE,
	DTR_NG_IMPORT_PREVIEW_EXPIRED_MESSAGE,
	DTR_NG_IMPORT_PREVIEW_FAILED_MESSAGE,
	DTR_NG_IMPORT_PREVIEW_READY_MESSAGE,
	DTR_NG_IMPORT_SUCCESS_MESSAGE
} from '$lib/shared/dtr/messages';
import { NG_TIMECARD_MAX_BYTES } from '$lib/shared/dtr/ng-timecard-import';

async function resolveDtrWorkspace(locals: App.Locals, url: URL) {
	if (!locals.user) {
		return null;
	}

	const workspaces = await listUserWorkspaceContexts(locals.user.id);
	const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

	if (!workspace || !canManageDtr(workspace.role)) {
		return null;
	}

	return workspace;
}

function isValidTimecardFile(file: File): boolean {
	const extension = file.name.split('.').pop()?.toLowerCase();
	return extension === 'xls' || extension === 'xlsx';
}

export const load: PageServerLoad = async ({ parent, cookies }) => {
	const { workspace, canManageDtr: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			preview: null
		};
	}

	const preview = readDtrNgImportPreviewCookie(cookies, workspace.workspaceId);

	return {
		preview
	};
};

export const actions: Actions = {
	preview: async ({ request, url, locals, cookies }) => {
		const workspace = await resolveDtrWorkspace(locals, url);

		if (!workspace) {
			return fail(403, { message: 'DTR access required.' });
		}

		const formData = await request.formData();
		const file = formData.get('timecardFile');
		const markAbsentOnEmpty = formData.get('markAbsent') === 'true';

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: DTR_NG_IMPORT_FILE_REQUIRED_MESSAGE });
		}

		if (!isValidTimecardFile(file) || file.size > NG_TIMECARD_MAX_BYTES) {
			return fail(400, { message: DTR_NG_IMPORT_FILE_INVALID_MESSAGE });
		}

		try {
			const buffer = Buffer.from(await file.arrayBuffer());
			const report = parseNgTimecardBuffer(buffer);

			if (report.employees.length === 0) {
				return fail(400, { message: DTR_NG_IMPORT_EMPTY_MESSAGE });
			}

			const preview = await buildDtrNgImportPreview({
				workspaceId: workspace.workspaceId,
				report,
				markAbsentOnEmpty
			});

			if (preview.rows.length === 0) {
				return fail(400, {
					message: DTR_NG_IMPORT_EMPTY_MESSAGE,
					preview,
					warnings: preview.warnings
				});
			}

			writeDtrNgImportPreviewCookie(cookies, preview);

			return {
				success: true,
				message: DTR_NG_IMPORT_PREVIEW_READY_MESSAGE,
				preview
			};
		} catch {
			return fail(500, { message: DTR_NG_IMPORT_PREVIEW_FAILED_MESSAGE });
		}
	},

	import: async (event) => {
		const { url, locals, cookies } = event;
		const workspace = await resolveDtrWorkspace(locals, url);

		if (!workspace) {
			return fail(403, { message: 'DTR access required.' });
		}

		const preview = readDtrNgImportPreviewCookie(cookies, workspace.workspaceId);

		if (!preview || preview.rows.length === 0) {
			return fail(400, { message: DTR_NG_IMPORT_PREVIEW_EXPIRED_MESSAGE });
		}

		try {
			const daysWritten = await importDtrNgPreviewRows({
				workspaceId: workspace.workspaceId,
				rows: preview.rows
			});

			clearDtrNgImportPreviewCookie(cookies);

			if (locals.user) {
				recordDtrSecurityEventInBackground(event, {
					workspaceId: workspace.workspaceId,
					actorUserId: locals.user.id,
					action: SECURITY_EVENT_ACTIONS.DTR_NG_IMPORTED,
					...buildSecurityEventRequestContext(event),
					metadata: {
						detail: `Imported ${daysWritten} day record${daysWritten === 1 ? '' : 's'} from NG timecard.`,
						daysWritten
					}
				});
			}

			return {
				success: true,
				message: DTR_NG_IMPORT_SUCCESS_MESSAGE,
				imported: daysWritten
			};
		} catch {
			return fail(500, { message: DTR_NG_IMPORT_FAILED_MESSAGE });
		}
	},

	clear: async ({ url, locals, cookies }) => {
		const workspace = await resolveDtrWorkspace(locals, url);

		if (!workspace) {
			return fail(403, { message: 'DTR access required.' });
		}

		clearDtrNgImportPreviewCookie(cookies);

		return {
			success: true,
			preview: null
		};
	}
};
