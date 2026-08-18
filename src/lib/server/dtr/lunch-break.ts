import { getDtrSettingsForWorkspace } from '$lib/server/repositories/dtr-settings';
import { getDtrWorkScheduleForWorkspace } from '$lib/server/repositories/dtr-work-schedules';
import { getPayrollEmployeeForWorkspace } from '$lib/server/repositories/payroll-employees';
import { isRestDay } from '$lib/shared/dtr/weekdays';
import { isWorkScheduleRestDay } from '$lib/shared/dtr/work-schedule';
import type { DtrLunchBreakWindow } from '$lib/shared/dtr/calendar';

export async function resolveLunchBreakForEmployeeDay(input: {
	workspaceId: string;
	employeeId: string;
	date: string;
}): Promise<DtrLunchBreakWindow | null> {
	const employee = await getPayrollEmployeeForWorkspace({
		workspaceId: input.workspaceId,
		employeeId: input.employeeId
	});

	if (!employee) {
		return null;
	}

	if (employee.workScheduleId) {
		const schedule = await getDtrWorkScheduleForWorkspace({
			workspaceId: input.workspaceId,
			scheduleId: employee.workScheduleId
		});

		if (!schedule || isWorkScheduleRestDay(schedule, input.date)) {
			return null;
		}

		return schedule.lunchBreak;
	}

	const settings = await getDtrSettingsForWorkspace(input.workspaceId);

	if (isRestDay(input.date, settings.restDays)) {
		return null;
	}

	return settings.lunchBreak;
}
