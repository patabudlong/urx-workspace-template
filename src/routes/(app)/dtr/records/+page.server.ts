import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { listDtrDaysForWorkspace, upsertDtrDayForWorkspace } from '$lib/server/repositories/dtr-days';
import { getDtrSettingsForWorkspace } from '$lib/server/repositories/dtr-settings';
import { getDtrWorkScheduleForWorkspace } from '$lib/server/repositories/dtr-work-schedules';
import {
	getDtrHolidayCalendarForWorkspace
} from '$lib/server/repositories/dtr-holiday-calendars';
import { listCompletedPayPeriodDatesForWorkspace } from '$lib/server/repositories/payroll-runs';
import {
	getPayrollEmployeeForWorkspace,
	listPayrollEmployeesForWorkspace
} from '$lib/server/repositories/payroll-employees';
import {
	listUserWorkspaceContexts,
	resolveActiveWorkspaceContext
} from '$lib/server/workspace-context';
import { getWorkspaceHostSuffix } from '$lib/server/workspace-host';
import { buildEmployeeMonthCalendar, getMonthDateRange } from '$lib/shared/dtr/calendar';
import { canManageDtr } from '$lib/shared/dtr/access';
import { DTR_DAY_LOCKED_MESSAGE, DTR_DAY_SAVED_MESSAGE, DTR_DAY_SAVE_FAILED_MESSAGE } from '$lib/shared/dtr/messages';
import { isDtrDayLockedError } from '$lib/server/dtr/errors';
import { upsertDtrDaySchema } from '$lib/shared/dtr/schemas';

function currentMonthValue(): string {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	return `${now.getFullYear()}-${month}`;
}

export const load: PageServerLoad = async ({ parent, url }) => {
	const { workspace, canManageDtr: canManage } = await parent();
	const month = url.searchParams.get('month') ?? currentMonthValue();
	const employeeId = url.searchParams.get('employeeId') ?? '';

	const emptyForm = await superValidate(zod4(upsertDtrDaySchema), {
		defaults: {
			employeeId: '',
			date: '',
			status: 'present',
			timeIn: '',
			timeOut: '',
			source: 'manual',
			notes: ''
		}
	});

	if (!workspace || !canManage) {
		return {
			form: emptyForm,
			month,
			employeeId,
			employees: [],
			calendar: [],
			selectedRecord: null,
			settingsConfigured: false
		};
	}

	const [settings, employeesResult] = await Promise.all([
		getDtrSettingsForWorkspace(workspace.workspaceId),
		listPayrollEmployeesForWorkspace({
			workspaceId: workspace.workspaceId,
			page: 1,
			limit: 200
		})
	]);

	const employees = employeesResult.items;
	const selectedEmployeeId = employeeId || employees[0]?.id || '';
	const selectedEmployee = selectedEmployeeId
		? await getPayrollEmployeeForWorkspace({
				workspaceId: workspace.workspaceId,
				employeeId: selectedEmployeeId
			})
		: null;
	const workSchedule = selectedEmployee?.workScheduleId
		? await getDtrWorkScheduleForWorkspace({
				workspaceId: workspace.workspaceId,
				scheduleId: selectedEmployee.workScheduleId
			})
		: null;
	const { start, end } = getMonthDateRange(month);
	const calendarYear = Number(month.slice(0, 4));
	const holidayCalendar = await getDtrHolidayCalendarForWorkspace({
		workspaceId: workspace.workspaceId,
		year: calendarYear
	});
	const records = selectedEmployeeId
		? await listDtrDaysForWorkspace({
				workspaceId: workspace.workspaceId,
				startDate: start,
				endDate: end,
				employeeId: selectedEmployeeId
			})
		: [];

	const lockedDates = await listCompletedPayPeriodDatesForWorkspace({
		workspaceId: workspace.workspaceId,
		startDate: start,
		endDate: end
	});

	const calendar = selectedEmployeeId
		? buildEmployeeMonthCalendar({
				month,
				restDays: settings.restDays,
				workSchedule,
				records,
				holidays: holidayCalendar?.holidays ?? [],
				holidayRates: holidayCalendar?.rates ?? null,
				lockedDates
			})
		: [];

	const selectedDate = url.searchParams.get('date') ?? '';
	const selectedRecord = records.find((record) => record.date === selectedDate) ?? null;
	const selectedDateLocked = selectedDate ? lockedDates.has(selectedDate) : false;
	const form = await superValidate(
		{
			employeeId: selectedEmployeeId,
			date: selectedDate,
			status: selectedRecord?.status ?? 'present',
			timeIn: selectedRecord?.timeIn ?? '',
			timeOut: selectedRecord?.timeOut ?? '',
			source: selectedRecord?.source ?? 'manual',
			notes: selectedRecord?.notes ?? ''
		},
		zod4(upsertDtrDaySchema)
	);

	return {
		form,
		month,
		employeeId: selectedEmployeeId,
		employees,
		calendar,
		selectedDate,
		selectedRecord,
		selectedDateLocked,
		settingsConfigured: settings.configured,
		workScheduleName: selectedEmployee?.workScheduleName ?? null,
		holidayCalendarTitle: holidayCalendar?.title ?? null
	};
};

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await superValidate(request, zod4(upsertDtrDaySchema));

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
			await upsertDtrDayForWorkspace({
				workspaceId: workspace.workspaceId,
				data: form.data
			});
		} catch (error) {
			if (isDtrDayLockedError(error)) {
				return message(form, DTR_DAY_LOCKED_MESSAGE, { status: 409 });
			}

			return message(form, DTR_DAY_SAVE_FAILED_MESSAGE, { status: 500 });
		}

		return message(form, DTR_DAY_SAVED_MESSAGE);
	}
};
