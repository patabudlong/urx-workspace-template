import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getDtrSettingsForWorkspace } from '$lib/server/repositories/dtr-settings';
import { getDtrWorkScheduleForWorkspace } from '$lib/server/repositories/dtr-work-schedules';
import { getDtrHolidayCalendarForWorkspace } from '$lib/server/repositories/dtr-holiday-calendars';
import { listCompletedPayPeriodDatesForWorkspace } from '$lib/server/repositories/payroll-runs';
import { listDtrDaysForWorkspace } from '$lib/server/repositories/dtr-days';
import { findPayrollEmployeeForWorkspaceUser } from '$lib/server/repositories/payroll-employees';
import { buildEmployeeMonthCalendar, getMonthDateRange } from '$lib/shared/dtr/calendar';
import { getTodayDtrDate, resolveDtrPunchState } from '$lib/shared/dtr/punch';

function currentMonthValue(): string {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	return `${now.getFullYear()}-${month}`;
}

export const load: PageServerLoad = async ({ parent, locals, url }) => {
	const { workspace, canManageDtr, hasLinkedPayrollEmployee } = await parent();

	if (!workspace) {
		error(403, 'DTR access required');
	}

	if (!locals.user?.id) {
		error(401, 'Sign in required');
	}

	const employee = await findPayrollEmployeeForWorkspaceUser({
		workspaceId: workspace.workspaceId,
		userId: locals.user.id,
		email: locals.user.email
	});

	if (!employee) {
		return {
			needsEmployeeLink: !canManageDtr,
			employee: null,
			month: url.searchParams.get('month') ?? currentMonthValue(),
			selectedDate: url.searchParams.get('date') ?? getTodayDtrDate(),
			calendar: [],
			recordsByDate: {},
			todayRecord: null,
			selectedRecord: null,
			punchState: resolveDtrPunchState(null),
			isTodayLocked: false
		};
	}

	const month = url.searchParams.get('month') ?? currentMonthValue();
	const selectedDate = url.searchParams.get('date') ?? getTodayDtrDate();
	const today = getTodayDtrDate();

	const { start, end } = getMonthDateRange(month);

	const [settings, workSchedule, holidayCalendar, lockedDates] = await Promise.all([
		getDtrSettingsForWorkspace(workspace.workspaceId),
		employee.workScheduleId
			? getDtrWorkScheduleForWorkspace({
					workspaceId: workspace.workspaceId,
					scheduleId: employee.workScheduleId
				})
			: Promise.resolve(null),
		getDtrHolidayCalendarForWorkspace({
			workspaceId: workspace.workspaceId,
			year: Number(month.slice(0, 4))
		}),
		listCompletedPayPeriodDatesForWorkspace({
			workspaceId: workspace.workspaceId,
			startDate: start,
			endDate: end
		})
	]);

	const records = await listDtrDaysForWorkspace({
		workspaceId: workspace.workspaceId,
		startDate: start,
		endDate: end,
		employeeId: employee.id
	});

	const recordsByDate = Object.fromEntries(records.map((record) => [record.date, record]));
	const todayRecord = recordsByDate[today] ?? null;
	const selectedRecord = recordsByDate[selectedDate] ?? null;
	const lockedDateSet = new Set(lockedDates);

	const calendar = buildEmployeeMonthCalendar({
		month,
		restDays: settings.restDays,
		workSchedule,
		standardWorkMinutes: settings.standardWorkMinutes,
		records,
		holidays: holidayCalendar?.holidays ?? [],
		holidayRates: holidayCalendar?.rates ?? null,
		lockedDates: lockedDateSet
	});

	return {
		needsEmployeeLink: false,
		employee,
		month,
		selectedDate,
		calendar,
		recordsByDate,
		todayRecord,
		selectedRecord,
		punchState: resolveDtrPunchState(todayRecord),
		isTodayLocked:
			Boolean(todayRecord?.lockedByRunId) || lockedDateSet.has(today)
	};
};
