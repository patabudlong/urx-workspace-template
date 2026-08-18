import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	getWorkSchedulesFormDefaults,
	listDtrWorkSchedulesForWorkspace,
	replaceDtrWorkSchedulesForWorkspace
} from '$lib/server/repositories/dtr-work-schedules';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageDtr } from '$lib/shared/dtr/access';
import {
	DTR_WORK_SCHEDULES_SAVED_MESSAGE,
	DTR_WORK_SCHEDULES_SAVE_FAILED_MESSAGE
} from '$lib/shared/dtr/messages';
import { dtrWorkSchedulesSchema } from '$lib/shared/dtr/schemas';

export const load: PageServerLoad = async ({ parent }) => {
	const { workspace, canManageDtr: canManage } = await parent();

	if (!workspace || !canManage) {
		return {
			form: await superValidate(zod4(dtrWorkSchedulesSchema), {
				defaults: { schedules: [] }
			})
		};
	}

	const schedules = await listDtrWorkSchedulesForWorkspace(workspace.workspaceId);
	const form = await superValidate(
		getWorkSchedulesFormDefaults(schedules),
		zod4(dtrWorkSchedulesSchema)
	);

	return {
		form
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(dtrWorkSchedulesSchema));

		if (!locals.user) {
			return fail(401, { form });
		}

		const workspaces = await listUserWorkspaceContexts(locals.user.id);
		const workspace = resolveActiveWorkspaceContext(workspaces, url, getWorkspaceHostSuffix());

		if (!workspace || !canManageDtr(workspace.role)) {
			return fail(403, { form, message: 'DTR access required.' });
		}

		if (!form.valid) {
			return fail(400, {
				form,
				message: 'Check each schedule name, work day times, and lunch break fields.'
			});
		}

		try {
			const savedSchedules = await replaceDtrWorkSchedulesForWorkspace({
				workspaceId: workspace.workspaceId,
				schedules: form.data.schedules
			});
			const refreshedForm = await superValidate(
				getWorkSchedulesFormDefaults(savedSchedules),
				zod4(dtrWorkSchedulesSchema)
			);

			return message(refreshedForm, DTR_WORK_SCHEDULES_SAVED_MESSAGE);
		} catch {
			return message(form, DTR_WORK_SCHEDULES_SAVE_FAILED_MESSAGE, { status: 500 });
		}
	}
};
