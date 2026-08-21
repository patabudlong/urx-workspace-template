import { getLatestPayrollRunPeriodEnd } from '$lib/server/repositories/payroll-runs';
import { getPayrollSettingsForWorkspace } from '$lib/server/repositories/payroll-settings';
import type { PayrollSettingsDto } from '$lib/shared/models/payroll-settings';
import type { PayrollScheduleInput } from '$lib/shared/payroll/periods';
import { suggestNextPayRunPeriod } from '$lib/shared/payroll/periods';
import {
	createPayrollRunDefaults,
	type CreatePayrollRunInput
} from '$lib/shared/payroll/schemas';

export function toPayrollScheduleInput(settings: PayrollSettingsDto): PayrollScheduleInput {
	return {
		payFrequency: settings.payFrequency,
		timezone: settings.timezone,
		weekStartDay: settings.weekStartDay,
		periodAnchorDate: settings.periodAnchorDate
	};
}

export async function buildSuggestedPayRunDefaults(
	workspaceId: string
): Promise<CreatePayrollRunInput> {
	const [settings, lastPeriodEnd] = await Promise.all([
		getPayrollSettingsForWorkspace(workspaceId),
		getLatestPayrollRunPeriodEnd(workspaceId)
	]);

	const suggestion = suggestNextPayRunPeriod(toPayrollScheduleInput(settings), {
		lastPeriodEnd
	});

	if (!suggestion) {
		return createPayrollRunDefaults;
	}

	return {
		title: suggestion.title,
		periodStart: suggestion.periodStart,
		periodEnd: suggestion.periodEnd
	};
}
