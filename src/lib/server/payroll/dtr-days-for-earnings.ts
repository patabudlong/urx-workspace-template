import { listDtrDaysForWorkspace } from '$lib/server/repositories/dtr-days';
import { loadDtrHolidayContextForWorkspace } from '$lib/server/dtr/holidays';
import {
	mergeUnworkedHolidayCreditsForPayroll,
	type PayrollHolidayContext
} from '$lib/shared/payroll/holiday-earnings';
import type { DtrDayDto } from '$lib/shared/models/dtr-day';

async function loadHolidayContextsForDateRange(input: {
	workspaceId: string;
	startDate: string;
	endDate: string;
}): Promise<Map<number, PayrollHolidayContext | null>> {
	const startYear = Number(input.startDate.slice(0, 4));
	const endYear = Number(input.endDate.slice(0, 4));
	const contexts = new Map<number, PayrollHolidayContext | null>();

	for (let year = startYear; year <= endYear; year += 1) {
		contexts.set(
			year,
			await loadDtrHolidayContextForWorkspace({
				workspaceId: input.workspaceId,
				year
			})
		);
	}

	return contexts;
}

export async function listDtrDaysForPayrollEarnings(input: {
	workspaceId: string;
	employeeId: string;
	startDate: string;
	endDate: string;
}): Promise<DtrDayDto[]> {
	const dtrDays = await listDtrDaysForWorkspace({
		workspaceId: input.workspaceId,
		startDate: input.startDate,
		endDate: input.endDate,
		employeeId: input.employeeId
	});

	const holidayContexts = await loadHolidayContextsForDateRange({
		workspaceId: input.workspaceId,
		startDate: input.startDate,
		endDate: input.endDate
	});

	return mergeUnworkedHolidayCreditsForPayroll({
		workspaceId: input.workspaceId,
		employeeId: input.employeeId,
		periodStart: input.startDate,
		periodEnd: input.endDate,
		dtrDays,
		holidayContexts
	});
}
