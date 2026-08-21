import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { getDtrSettingsForWorkspace, upsertDtrSettingsForWorkspace } from '$lib/server/repositories/dtr-settings';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageDtr } from '$lib/shared/dtr/access';
import {
	DTR_SETTINGS_SAVED_MESSAGE,
	DTR_SETTINGS_SAVE_FAILED_MESSAGE
} from '$lib/shared/dtr/messages';
import { dtrSettingsDefaults, dtrSettingsSchema } from '$lib/shared/dtr/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageDtr: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(dtrSettingsSchema), { defaults: dtrSettingsDefaults }),
			settingsConfigured: false
		};
	}

	const settings = await getDtrSettingsForWorkspace(workspace.workspaceId);
	const form = await superValidate(
		{
			restDays: settings.restDays,
			standardWorkMinutes: settings.standardWorkMinutes,
			lunchBreakStart: settings.lunchBreak?.startTime ?? '',
			lunchBreakEnd: settings.lunchBreak?.endTime ?? ''
		},
		zod4(dtrSettingsSchema)
	);

	return {
		form,
		settingsConfigured: settings.configured
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(dtrSettingsSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageDtr(workspace.role)) {
			return fail(403, { form, message: 'DTR access required.' });
		}

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await upsertDtrSettingsForWorkspace({
				workspaceId: workspace.workspaceId,
				data: form.data
			});
		} catch {
			return message(form, DTR_SETTINGS_SAVE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, DTR_SETTINGS_SAVED_MESSAGE);
	}
};
