import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import {
	createDefaultHolidayCalendarInput,
	getDtrHolidayCalendarForWorkspace,
	listDtrHolidayCalendarsForWorkspace,
	upsertDtrHolidayCalendarForWorkspace
} from '$lib/server/repositories/dtr-holiday-calendars';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { canManageDtr } from '$lib/shared/dtr/access';
import {
	DTR_HOLIDAY_CALENDAR_SAVED_MESSAGE,
	DTR_HOLIDAY_CALENDAR_SAVE_FAILED_MESSAGE
} from '$lib/shared/dtr/messages';
import { dtrHolidayCalendarSchema } from '$lib/shared/dtr/schemas';
import { sanitizeHolidayCalendarInput } from '$lib/shared/dtr/holidays';

function currentYear(): number {
	return new Date().getFullYear();
}

export const load: PageServerLoad = async ({ parent, url }) => {
	const { workspace, canManageDtr: canManage } = await parent();
	const year = Number(url.searchParams.get('year') ?? currentYear());

	if (!workspace || !canManage) {
		return {
			year,
			calendars: [],
			form: await superValidate(zod4(dtrHolidayCalendarSchema), {
				defaults: createDefaultHolidayCalendarInput(year)
			})
		};
	}

	const [calendars, calendar] = await Promise.all([
		listDtrHolidayCalendarsForWorkspace(workspace.workspaceId),
		getDtrHolidayCalendarForWorkspace({
			workspaceId: workspace.workspaceId,
			year
		})
	]);

	const defaults = calendar
		? {
				year: calendar.year,
				title: calendar.title,
				regularHoliday: calendar.rates.regularHoliday,
				specialNonWorkingDay: calendar.rates.specialNonWorkingDay,
				specialWorkingDay: calendar.rates.specialWorkingDay,
				holidays: calendar.holidays
			}
		: createDefaultHolidayCalendarInput(year);

	const form = await superValidate(defaults, zod4(dtrHolidayCalendarSchema));

	return {
		year,
		calendars,
		form
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const initialForm = await superValidate(request, zod4(dtrHolidayCalendarSchema));
		const form = initialForm.valid
			? initialForm
			: await superValidate(
					sanitizeHolidayCalendarInput(initialForm.data),
					zod4(dtrHolidayCalendarSchema)
				);

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
				message: 'Check the calendar title, pay percentages, and holiday dates.'
			});
		}

		try {
			await upsertDtrHolidayCalendarForWorkspace({
				workspaceId: workspace.workspaceId,
				data: form.data
			});

			return message(form, DTR_HOLIDAY_CALENDAR_SAVED_MESSAGE);
		} catch {
			return message(form, DTR_HOLIDAY_CALENDAR_SAVE_FAILED_MESSAGE, { status: 500 });
		}
	}
};
